import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface DropdownItem {
  label: string;
  icon?: IconDefinition;
  iconOnly?: boolean;
  route?: string;
  href?: string;
}

@Component({
  selector: 'app-dropdown',
  imports: [RouterLink, RouterLinkActive, FaIconComponent],
  templateUrl: './dropdown.html',
  styles: `
    .dropdown-menu {
      display: flex;
      flex-direction: column;
      position: fixed;
      top: var(--nav-height);
      left: 0;
      background: var(--bg);
      border: 1px solid var(--separator);
      border-radius: 6px;
      padding: 0.5rem 0;
      min-width: 160px;
      z-index: 1001;
    }
    .dropdown-menu a {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 1.25rem;
      font-size: 0.95rem;
      white-space: nowrap;
    }
    .dropdown-menu a.icon-only {
      font-size: 1.4rem;
    }
  `,
})
export class Dropdown {
  items = input<DropdownItem[]>([]);
}
