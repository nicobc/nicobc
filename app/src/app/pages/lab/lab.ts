import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface LabProject {
  slug: string;
  category: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-lab',
  imports: [RouterLink],
  templateUrl: './lab.html',
  styleUrl: './lab.scss',
})
export class Lab {
  readonly exploreCta = 'Explore';

  readonly projects: LabProject[] = [
    {
      slug: 'workshops',
      category: 'Workshop',
      title: 'Data pipeline fundamentals',
      description: 'Interactive workshops on pipeline performance, testability, and data quality.',
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
