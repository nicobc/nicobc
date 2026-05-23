import {
  Component,
  computed,
  EventEmitter,
  input,
  OnChanges,
  Output,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { ChallengeHandle } from '../../labs/challenge-controller';
import { SqlEditor } from '../../labs/components/sql-editor/sql-editor';
import { DataMovementViz, VizMode, VizScenario } from '../../labs/components/data-movement-viz/data-movement-viz';
import { SubstepProgression, Substeps } from '../../labs/components/substep-progression/substep-progression';
import { QueryOutput, QueryFeedback } from '../../labs/components/query-output/query-output';
import { QueryResult } from '../../labs/db/duckdb';

const UNLOCK_MODE: Partial<Record<VizScenario, VizMode>> = {
  'column-pruning': 'pruned',
  'predicate-pushdown': 'pushed',
  'dag-race': 'dag-race-done',
};

export type FeedbackMap = Record<'not-optimized' | 'correct', string>;

export interface WorkshopStepConfig {
  vizScenario?: VizScenario;
  isFirstStep: boolean;
  isFinalStep: boolean;
  paragraphs: string[];
  controller: ChallengeHandle;
  sql: WritableSignal<string>;
  queryResult: WritableSignal<QueryResult | null>;
  queryError: WritableSignal<string | null>;
  startingSql: string;
  solutionSql: string;
  intro: string;
  feedback: FeedbackMap;
  execute: () => Promise<void>;
  validate: () => Promise<void>;
}

@Component({
  selector: 'app-workshop-step',
  imports: [DataMovementViz, SqlEditor, SubstepProgression, QueryOutput],
  templateUrl: './workshop-step.html',
  styleUrl: './workshop-step.scss',
})
export class WorkshopStep implements OnChanges {
  readonly config = input.required<WorkshopStepConfig>();
  @Output() readonly advance = new EventEmitter<void>();
  @Output() readonly retreat = new EventEmitter<void>();
  @Output() readonly scrollToStep = new EventEmitter<void>();

  @ViewChild(DataMovementViz) private readonly viz?: DataMovementViz;
  @ViewChild(SqlEditor) private readonly sqlEditorRef?: SqlEditor;

  readonly seenUnlockMode = signal(false);

  private readonly challengeCorrect = computed(() => this.config().controller.state() === 'correct');

  // New array on every config change → triggers SubstepProgression.ngOnChanges → resets activeIndex.
  readonly substeps = computed<Substeps>(() => {
    this.config();
    return [
      { kind: 'gated' as const, done: this.seenUnlockMode },
      { kind: 'free' as const },
      { kind: 'gated' as const, done: this.challengeCorrect },
    ];
  });

  readonly copySubstepIndex = computed(() => (this.config().vizScenario ? 1 : 0));
  readonly challengeSubstepIndex = computed(() => this.substeps().length - 1);

  readonly runLabel = 'Run';
  readonly revealLabel = 'Reveal';
  readonly submitLabel = 'Submit';
  readonly submittingLabel = 'Submitting…';
  readonly replayLabel = 'Replay';

  get feedback(): QueryFeedback {
    const state = this.config().controller.state();
    if (state === 'unanswered') return { kind: 'none' };
    if (state === 'wrong-sql') {
      const error = this.config().queryError();
      return error ? { kind: 'trace', error } : { kind: 'none' };
    }
    if (state === 'unsafe-sql') return { kind: 'message', html: 'Only SELECT queries are allowed here.' };
    if (state === 'wrong-output') return { kind: 'message', html: 'The query ran, but the output does not match.' };
    const html = this.config().feedback[state as keyof FeedbackMap];
    return state === 'correct' ? { kind: 'correct', html } : { kind: 'message', html };
  }

  ngOnChanges(): void {
    this.seenUnlockMode.set(this.config().controller.state() === 'correct');
  }

  replay(): void {
    this.viz?.replay();
  }

  onModeChange(mode: VizMode): void {
    const unlockMode = this.config().vizScenario ? UNLOCK_MODE[this.config().vizScenario!] : undefined;
    if (mode === unlockMode) this.seenUnlockMode.set(true);
  }

  onExitBack(): void {
    this.retreat.emit();
  }

  onChallengeInput(value: string): void {
    this.config().sql.set(value);
  }

  async runChallenge(): Promise<void> {
    await this.config().controller.check(this.config().execute);
  }

  async submitChallenge(): Promise<void> {
    await this.config().controller.check(this.config().validate);
  }

  revealSolution(): void {
    this.sqlEditorRef?.setValue(this.config().solutionSql);
    this.config().sql.set(this.config().solutionSql);
  }

  restartChallenge(): void {
    this.config().controller.restart();
    this.config().sql.set(this.config().startingSql);
    this.config().queryResult.set(null);
    this.config().queryError.set(null);
    this.sqlEditorRef?.setValue(this.config().startingSql);
  }

  onTerminalAction(): void {
    this.advance.emit();
  }
}
