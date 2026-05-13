import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  readonly hook = 'Engineering is the discipline<br>of making intent machine-legible.';
  readonly paragraphs = [
    "I wrote my first lines of code over a decade ago, crunching numbers for an economics degree. This led to a career in data engineering. Today I build data platforms, and I've found that the hardest problems are rarely technical: KISS and YAGNI apply as much to architecture as to code.",
    "Quality at scale requires maintenance, in systems and in the teams that build them. I was teaching before I was an engineer, and the reasons have only grown since. Team quality sets a ceiling on everything you ship — and teaching is also how I learn. Both are, at their core, the same problem: making intent precise enough to be acted on.",
  ];
  readonly closingParaBefore = 'With machines, that precision is non-negotiable, but intent is invariably underspecified. Engineering is the work of clarifying and translating intent in the face of constraints. Implementation is where that translation is decided. Questions are where it starts. If you have one, ';
}
