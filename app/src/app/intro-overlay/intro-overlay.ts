import { Component, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-intro-overlay',
  imports: [],
  template: `
    <div class="overlay" [class.hidden]="hiding()">
      <span class="text">{{ displayed() }}<span class="cursor">|</span></span>
    </div>
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 1;
      transition: opacity 0.4s ease;
    }
    .overlay.hidden {
      opacity: 0;
    }
    .text {
      font-size: clamp(2.5rem, 7vw, 5rem);
      font-weight: 300;
      letter-spacing: 0.05em;
      color: var(--fg);
    }
    .cursor {
      animation: blink 0.7s step-end infinite;
      margin-left: 2px;
    }
    @keyframes blink {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }
  `,
})
export class IntroOverlay implements OnInit {
  readonly done = output<void>();

  displayed = signal('');
  hiding = signal(false);

  private readonly fullText = 'Welcome';
  private readonly charDelay = 90;
  private readonly pauseAfter = 400;
  private readonly fadeDuration = 400;

  ngOnInit(): void {
    let i = 0;
    const interval = setInterval(() => {
      this.displayed.set(this.fullText.slice(0, ++i));
      if (i === this.fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          this.hiding.set(true);
          setTimeout(() => this.done.emit(), this.fadeDuration);
        }, this.pauseAfter);
      }
    }, this.charDelay);
  }
}
