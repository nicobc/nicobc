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
};

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
  feedback: Record<string, string>;
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

  readonly checkLabel = 'Check';
  readonly checkingLabel = 'Checking…';
  readonly revealSolutionLabel = 'Reveal solution';
  readonly backToAnimationLabel = 'Back to animation';
  readonly replayLabel = 'Replay';
  readonly testUnderstandingLabel = 'Test your understanding';
  readonly nextLabel = 'Next';

  get terminalLabel(): string {
    return this.config.isFinalStep ? 'Done' : 'Next';
  }

  readonly wrongOutputMessage = 'The query ran, but the output does not match.';

  get feedbackMessage(): string | null {
    const state = this.config.controller.state();
    if (state === 'unanswered') return null;
    if (state === 'wrong-output') return this.wrongOutputMessage;
    const key = state === 'correct' ? (this.config.controller.solutionRevealed() ? 'revealed' : 'correct') : state;
    return this.config.feedback[key] ?? null;
  }

  get showQueryError(): boolean {
    return this.config.controller.state() === 'wrong-sql' && !!this.config.queryError();
  }

  get feedbackClass(): string {
    const state = this.config.controller.state();
    if (state === 'correct') {
      return this.config.controller.solutionRevealed()
        ? 'feedback-block feedback-block--reveal'
        : 'feedback-block feedback-block--success';
    }
    return 'feedback-block feedback-block--error';
  }

  ngOnChanges(): void {
    this.phase.set(this.config.vizScenario ? 'viz' : 'copy');
    this.seenUnlockMode.set(false);
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

  async submitChallenge(): Promise<void> {
    await this.config.controller.check(this.config.validate);
  }

  revealSolution(): void {
    this.sqlEditorRef?.setValue(this.config.solutionSql);
    this.config.sql.set(this.config.solutionSql);
    this.config.controller.reveal();
  }

  onTerminalAction(): void {
    this.config.controller.close();
    this.advance.emit();
  }
}
