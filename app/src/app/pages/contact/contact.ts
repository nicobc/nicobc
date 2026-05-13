import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  readonly intro = "I'm open to data engineering conversations — technical or otherwise.";
  readonly linkedInIntro = 'Drop me a message on ';
}
