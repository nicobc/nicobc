import { Component, AfterViewInit, ElementRef, HostListener, Input, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-challenge-modal',
  imports: [],
  templateUrl: './challenge-modal.html',
  styleUrl: './challenge-modal.scss',
})
export class ChallengeModal implements AfterViewInit {
  @Input() showClose = true;
  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    const first = this.panel?.nativeElement.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
    );
    first?.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panel?.nativeElement;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]')
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
