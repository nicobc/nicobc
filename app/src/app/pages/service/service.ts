import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-service',
  imports: [],
  template: `
    <h1>{{ slug() }}</h1>
    <p>Coming soon.</p>
  `,
  styles: `
    :host {
      display: block;
    }
    h1 {
      font-weight: 700;
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      opacity: 0.5;
      font-weight: 300;
    }
  `,
})
export class ServicePage {
  private route = inject(ActivatedRoute);
  slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')));
}
