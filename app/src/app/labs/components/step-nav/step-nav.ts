import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-step-nav',
  templateUrl: './step-nav.html',
  styleUrl: './step-nav.scss',
})
export class StepNav {
  @Input({ required: true }) step!: number;
  @Input({ required: true }) totalSteps!: number;
  @Input() canAdvance = false;
  @Input() label?: string;
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly forward = new EventEmitter<void>();
}
