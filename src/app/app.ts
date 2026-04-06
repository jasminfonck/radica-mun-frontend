import { Component, signal } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  // Inyectar ThemeService aquí garantiza que el constructor del servicio
  // corre antes de cualquier componente hijo, aplicando el color guardado
  // desde localStorage antes del primer render (incluido el login).
  constructor(_theme: ThemeService) {}
}
