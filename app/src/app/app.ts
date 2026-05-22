import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { IntroOverlay } from './intro-overlay/intro-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, IntroOverlay],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  showIntro = signal(!sessionStorage.getItem('intro-shown'));
  contentReady = signal(!!sessionStorage.getItem('intro-shown'));

  onIntroDone(): void {
    sessionStorage.setItem('intro-shown', '1');
    this.showIntro.set(false);
    setTimeout(() => this.contentReady.set(true), 200);
  }
}
