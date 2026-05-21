import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownItem } from '../shared/dropdown/dropdown';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface NavLink {
  label: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, FaIconComponent, Dropdown, ThemeToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly bars = faBars;
  readonly xmark = faXmark;
  isOpen = false;

  readonly navLinks: NavLink[] = [
    { label: 'About', route: '/about' },
    { label: 'Labs', route: '/lab' },
  ];

  readonly mobileItems: DropdownItem[] = [{ label: 'Home', route: '/home' }, ...this.navLinks];

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }
}
