import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer',
  imports: [FaIconComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly year = new Date().getFullYear();
  readonly copyrightName = 'Nicolas Contreras';

  readonly socialLinks = [
    { label: 'GitHub', href: 'https://github.com/nicobc', icon: faGithub },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/nicobc', icon: faLinkedin },
  ];
}
