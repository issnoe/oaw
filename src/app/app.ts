import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbar } from "../layout/app-navbar/app-navbar";
import { Footer } from "../layout/footer/footer";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oaw');
}
