import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  readonly intro = 'Happy to start a conversation.';
  readonly linkedInIntro = 'Drop me a message on ';
}
