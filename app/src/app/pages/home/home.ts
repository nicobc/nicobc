import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Cta {
  label: string;
  route: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly tagline = 'Nicolas — data engineer.';
  readonly sub = 'I build platforms, teach teams, and occasionally ship things like this.';
  readonly ctas: Cta[] = [
    { label: 'Lab →', route: '/lab' },
    { label: 'About →', route: '/about' },
  ];
}
