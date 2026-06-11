import { Component, input } from '@angular/core';
import { QueryResult } from '../../db/duckdb';

export type QueryFeedback =
  | { kind: 'none' }
  | { kind: 'trace'; error: string }
  | { kind: 'message'; html: string }
  | { kind: 'correct'; html: string };

@Component({
  selector: 'app-query-output',
  templateUrl: './query-output.html',
  styleUrl: './query-output.scss',
})
export class QueryOutput {
  readonly feedback = input<QueryFeedback>({ kind: 'none' });
  readonly result = input<QueryResult | null>(null);

  get feedbackValue(): QueryFeedback {
    return this.feedback();
  }
}
