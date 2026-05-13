import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer',
  imports: [FaIconComponent],
  template: `
    <footer>
      <div class="footer-social">
        @for (link of socialLinks; track link.label) {
          <a [href]="link.href" target="_blank" rel="noopener noreferrer" [attr.aria-label]="link.label">
            <fa-icon [icon]="link.icon" />
          </a>
        }
      </div>
      <span class="footer-copy">&copy; {{ year }} {{ copyrightName }}</span>
    </footer>
  `,
  styles: `
    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--nav-height);
      padding: 0 3rem;
      border-top: 1px solid var(--border-faint);
      background: var(--bg);
    }
    .footer-social {
      display: flex;
      gap: 1.5rem;
      font-size: 1.4rem;
    }
    .footer-copy {
      font-size: 0.8rem;
      opacity: 0.35;
    }
  `,
})
export class Footer {
  readonly year = new Date().getFullYear();
  readonly copyrightName = 'Nicolas Contreras';

  readonly socialLinks = [
    { label: 'GitHub', href: 'https://github.com/nicobc', icon: faGithub },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/nicobc', icon: faLinkedin },
  ];
}
