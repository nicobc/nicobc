import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { ChallengeHandle } from '../../labs/challenge-controller';
import { ChallengeModal } from '../../labs/components/challenge-modal/challenge-modal';
import { SqlEditor } from '../../labs/components/sql-editor/sql-editor';
import { DataMovementViz, VizMode, VizScenario } from '../../labs/components/data-movement-viz/data-movement-viz';
import { QueryResult } from '../../labs/db/duckdb';

const UNLOCK_MODE: Partial<Record<VizScenario, VizMode>> = {
  'column-pruning': 'pruned',
  'predicate-pushdown': 'pushed',
  'dag-race': 'dag-race-done',
};

export type FeedbackMap = Record<'not-optimized' | 'correct', string>;

type FeedbackDisplay = { kind: 'none' } | { kind: 'trace'; error: string } | { kind: 'message'; html: string };

export interface WorkshopStepConfig {
  vizScenario?: VizScenario;
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
  imports: [DataMovementViz, ChallengeModal, SqlEditor],
  templateUrl: './workshop-step.html',
  styleUrl: './workshop-step.scss',
})
export class WorkshopStep implements OnChanges {
  @Input({ required: true }) config!: WorkshopStepConfig;
  @Output() readonly advance = new EventEmitter<void>();
  @Output() readonly scrollToStep = new EventEmitter<void>();

  @ViewChild(DataMovementViz) private readonly viz?: DataMovementViz;
  @ViewChild(SqlEditor) private readonly sqlEditorRef?: SqlEditor;
  @ViewChild('challengeTrigger') private readonly challengeTrigger?: ElementRef<HTMLButtonElement>;

  readonly phase = signal<'viz' | 'copy'>('viz');
  readonly seenUnlockMode = signal(false);

  readonly runLabel = 'Run';
  readonly revealLabel = 'Reveal';
  readonly submitLabel = 'Submit';
  readonly submittingLabel = 'Submitting…';
  readonly backToAnimationLabel = 'Back to animation';
  readonly replayLabel = 'Replay';
  readonly testUnderstandingLabel = 'Test your understanding';
  readonly continueLabel = 'Continue →';

  get terminalLabel(): string {
    return this.config.isFinalStep ? 'Done' : 'Next';
  }

  get feedback(): FeedbackDisplay {
    const state = this.config.controller.state();
    if (state === 'unanswered') return { kind: 'none' };
    if (state === 'wrong-sql') {
      const error = this.config.queryError();
      return error ? { kind: 'trace', error } : { kind: 'none' };
    }
    if (state === 'unsafe-sql') return { kind: 'message', html: 'Only SELECT queries are allowed here.' };
    if (state === 'wrong-output') return { kind: 'message', html: 'The query ran, but the output does not match.' };
    return { kind: 'message', html: this.config.feedback[state as keyof FeedbackMap] };
  }

  get feedbackClass(): string {
    return this.config.controller.state() === 'correct'
      ? 'feedback-block feedback-block--success'
      : 'feedback-block feedback-block--error';
  }

  ngOnChanges(): void {
    const cleared = this.config.controller.state() === 'correct';
    this.phase.set(cleared || !this.config.vizScenario ? 'copy' : 'viz');
    this.seenUnlockMode.set(cleared);
  }

  replay(): void {
    this.viz?.replay();
  }

  onModeChange(mode: VizMode): void {
    const unlockMode = this.config.vizScenario ? UNLOCK_MODE[this.config.vizScenario] : undefined;
    if (mode === unlockMode) this.seenUnlockMode.set(true);
  }

  advanceVizPhase(): void {
    this.phase.set('copy');
    this.scrollToStep.emit();
  }

  returnToViz(): void {
    this.phase.set('viz');
    this.scrollToStep.emit();
  }

  openChallenge(): void {
    this.config.sql.set(this.config.startingSql);
    this.config.queryResult.set(null);
    this.config.queryError.set(null);
    this.config.controller.open();
  }

  closeChallenge(): void {
    this.config.controller.close();
    this.challengeTrigger?.nativeElement.focus();
  }

  onChallengeInput(value: string): void {
    this.config.sql.set(value);
  }

  async runChallenge(): Promise<void> {
    await this.config.controller.check(this.config.execute);
  }

  async submitChallenge(): Promise<void> {
    await this.config.controller.check(this.config.validate);
  }

  revealSolution(): void {
    this.sqlEditorRef?.setValue(this.config.solutionSql);
    this.config.sql.set(this.config.solutionSql);
  }

  restartChallenge(): void {
    this.config.controller.restart();
    this.config.sql.set(this.config.startingSql);
    this.config.queryResult.set(null);
    this.config.queryError.set(null);
    this.sqlEditorRef?.setValue(this.config.startingSql);
  }

  onTerminalAction(): void {
    this.config.controller.close();
    this.advance.emit();
  }
}
