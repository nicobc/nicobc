import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faStar } from '@fortawesome/free-solid-svg-icons';
import { SchemaPanel } from '../../labs/components/schema-panel/schema-panel';

interface Workshop {
  seq: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-workshops',
  imports: [RouterLink, FaIconComponent, SchemaPanel],
  templateUrl: './workshops.html',
  styleUrl: './workshops.scss',
})
export class Workshops {
  readonly schemaOpen = signal(false);
  readonly dbIcon = faDatabase;
  readonly starIcon = faStar;

  readonly scenarioLines = [
    'Each workshop starts from the same scenario: compute the top 5 Spanish customers of an e-commerce platform, by total order amount.',
  ];

  readonly eyebrow = 'Workshop';
  readonly heading = 'Data pipeline fundamentals';
  readonly exploreCta = 'Explore';
  readonly disclaimer = 'Any resemblance to actual companies or persons is purely coincidental.';

  readonly scenario3Pre = 'The data model is ';
  readonly scenario3Available = 'available';
  readonly scenario3Post = ' throughout.';

  readonly schemaIconPulse = signal(false);

  highlightSchema(): void {
    if (this.schemaIconPulse()) return;
    this.schemaIconPulse.set(true);
    setTimeout(() => this.schemaIconPulse.set(false), 1200);
  }

  readonly workshops: Workshop[] = [
    {
      seq: '1 of 2',
      title: 'Minimizing data movement',
      description:
        'Build a mental model for distributed computing from simple optimization techniques, ' +
        'using animated walkthroughs and SQL challenges.',
      route: '/lab/distributed-computing',
    },
    {
      seq: '2 of 2',
      title: 'Catching schema drift',
      description:
        'See a valid query silently return wrong results when upstream data changes, and learn how data contracts catch the problem at the pipeline boundary.',
      route: '/lab/data-contracts',
    },
  ];
}
