import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownItem } from '../shared/dropdown/dropdown';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, FaIconComponent, Dropdown, ThemeToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  bars = faBars;
  xmark = faXmark;
  isOpen = false;

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  mobileItems: DropdownItem[] = [
    { label: 'Home', route: '/home' },
    { label: 'About', route: '/about' },
    { label: 'Blog', route: '/blog' },
    { label: 'Lab', route: '/bcn-map' },
    { label: 'Contact', route: '/contact' },
  ];
}
