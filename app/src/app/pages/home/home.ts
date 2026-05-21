import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Project {
  slug: string;
  category: string;
  title: string;
  description: string;
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
  readonly exploreCta = 'Explore';

  readonly projects: Project[] = [
    {
      slug: 'workshops',
      category: 'Workshop',
      title: 'Data pipeline fundamentals',
      description:
        'Guided workshops on production pipeline patterns, combining interactive walkthroughs and hands-on challenges.',
      route: '/lab/workshops',
    },
    {
      slug: 'bcn-map',
      category: 'Project',
      title: 'Barcelona Rental Map',
      description:
        "Rental price dynamics across Barcelona's 73 neighborhoods. Track the post-COVID surge that reshaped the city's housing market.",
      route: '/lab/bcn-map',
    },
  ];
}
