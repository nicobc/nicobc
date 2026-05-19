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
import { DataMovementViz, VizMode, VizScenario } from '../../labs/components/data-movement-viz/data-movement-viz';

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
  startingSql: string;
  solutionSql: string;
  schema: string;
  intro: string;
  feedback: Record<string, string>;
  validate: () => Promise<void>;
}

@Component({
  selector: 'app-workshop-step',
  imports: [DataMovementViz, ChallengeModal],
  templateUrl: './workshop-step.html',
  styleUrl: './workshop-step.scss',
})
export class WorkshopStep implements OnChanges {
  @Input({ required: true }) config!: WorkshopStepConfig;
  @Output() readonly advance = new EventEmitter<void>();
  @Output() readonly scrollToStep = new EventEmitter<void>();

  @ViewChild(DataMovementViz) private readonly viz?: DataMovementViz;
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

  get feedbackMessage(): string | null {
    const state = this.config.controller.state();
    if (state === 'unanswered') return null;
    const key = state === 'correct' ? (this.config.controller.solutionRevealed() ? 'revealed' : 'correct') : state;
    return this.config.feedback[key] ?? null;
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
    this.config.controller.open();
  }

  closeChallenge(): void {
    this.config.controller.close();
    this.challengeTrigger?.nativeElement.focus();
  }

  onChallengeInput(event: Event): void {
    this.config.sql.set((event.target as HTMLTextAreaElement).value);
  }

  async submitChallenge(): Promise<void> {
    await this.config.controller.check(this.config.validate);
  }

  revealSolution(): void {
    this.config.sql.set(this.config.solutionSql);
    this.config.controller.reveal();
  }

  onTerminalAction(): void {
    this.config.controller.close();
    this.advance.emit();
  }
}
