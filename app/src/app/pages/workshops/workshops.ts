import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Workshop {
  seq: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-workshops',
  imports: [RouterLink],
  templateUrl: './workshops.html',
  styleUrl: './workshops.scss',
})
export class Workshops {
  readonly eyebrow = 'Workshop';
  readonly heading = 'Workshop series';
  readonly exploreCta = 'Explore';
  readonly disclaimer = 'Any resemblance to actual companies or persons is purely coincidental.';

  readonly scenarioLines: string[] = [
    'A Spanish e-commerce company is expanding into France. Its pipeline produces two tables: <code>fct_orders</code> and <code>dim_customers</code>. The KPI across all three workshops is the same: average order amount per customer, top 5 for Spain.',
    'The workshops are independent — pick whichever gap in your practice matters most.',
  ];

  readonly workshops: Workshop[] = [
    {
      seq: '1 of 3',
      title: 'Minimizing data movement',
      description:
        'Build a mental model for distributed computing from simple optimization techniques, ' +
        'using animated walkthroughs and SQL challenges.',
      route: '/lab/distributed-computing',
    },
    {
      seq: '2 of 3',
      title: 'The test that always passes',
      description:
        "Refactor a pytest suite in six steps, from a test that reads a committed database file to one that doesn't need to know where the database lives.",
      route: '/lab/unit-testing',
    },
    {
      seq: ' of 3',
      title: 'When good queries go wrong',
      description:
        'Write a query, see it work, then watch it silently break on the next batch. A hands-on look at schema drift and how data contracts catch it early.',
      route: '/lab/data-contracts',
    },
  ];
}
