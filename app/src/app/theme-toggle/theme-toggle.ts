import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircle, faMoon } from '@fortawesome/free-solid-svg-icons';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [FaIconComponent],
  template: `
    <div class="theme-toggle">
      <fa-icon [icon]="sun" />
      <button
        class="track"
        [class.dark]="theme.theme() === 'dark'"
        (click)="theme.toggle()"
        aria-label="Toggle theme"
      >
        <span class="knob"></span>
      </button>
      <fa-icon [icon]="moon" />
    </div>
  `,
  styles: `
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    fa-icon {
      font-size: 0.8rem;
      opacity: 0.5;
    }
    .track {
      width: 34px;
      height: 18px;
      border-radius: 9px;
      background: rgba(128, 128, 128, 0.3);
      border: none;
      position: relative;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s ease;
    }
    .track:hover {
      background: rgba(128, 128, 128, 0.5);
      opacity: 1;
    }
    .knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.2s ease;
    }
    .track.dark .knob {
      transform: translateX(16px);
    }
  `,
})
export class ThemeToggle {
  theme = inject(ThemeService);
  sun = faCircle;
  moon = faMoon;
}
