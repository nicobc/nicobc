import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FaIconComponent, ThemeToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly brandPrefix = 'N';
  readonly brandSuffix = 'C';

  readonly socialLinks = [
    { label: 'GitHub', href: 'https://github.com/nicobc', icon: faGithub },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/nicobc', icon: faLinkedin },
  ];
}
