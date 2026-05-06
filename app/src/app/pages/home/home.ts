import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ServiceCard {
  slug: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly services: ServiceCard[] = [
    {
      slug: 'data-platform',
      title: 'Data Platform',
      description: 'Placeholder description.',
    },
    {
      slug: 'analytics',
      title: 'Analytics',
      description: 'Placeholder description.',
    },
    {
      slug: 'ml-ops',
      title: 'MLOps',
      description: 'Placeholder description.',
    },
  ];
}
