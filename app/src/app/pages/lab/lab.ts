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
      slug: 'bcn-map',
      category: 'Data · Visualisation',
      title: 'Barcelona Rental Map',
      description: 'Rental price dynamics across Barcelona\'s 73 neighborhoods. Track the post-COVID surge that reshaped the city\'s housing market.',
      route: '/lab/bcn-map',
    },
    {
      slug: 'data-contracts',
      category: 'Data Engineering · Contracts',
      title: 'When good queries go wrong',
      description: 'Write a query, see it work, then watch it silently break on the next batch. A hands-on look at schema drift and how data contracts catch it early.',
      route: '/lab/data-contracts',
    },
    {
      slug: 'distributed-computing',
      category: 'Data Engineering · Distributed',
      title: 'What the optimizer won\'t fix',
      description: 'The optimizer reduces blast radius. It does not eliminate it. Animated diagrams that put distributed execution patterns in front of you before you need to read an execution plan.',
      route: '/lab/distributed-computing',
    },
  ];
}
