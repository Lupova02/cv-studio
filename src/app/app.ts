import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Wurzelkomponente der App; zeigt über den Router entweder den Editor oder die Druckseite. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
