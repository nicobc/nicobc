import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircle, faMoon } from '@fortawesome/free-solid-svg-icons';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [FaIconComponent],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  theme = inject(ThemeService);
  sun = faCircle;
  moon = faMoon;
}
