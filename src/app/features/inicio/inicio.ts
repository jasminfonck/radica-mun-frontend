import { Component } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioToken } from '../../core/auth/auth.models';

@Component({
  selector: 'app-inicio',
  standalone: false,
  template: `
    <h2>Bienvenido, {{ usuario?.nombre }}</h2>
    <p>Seleccione una opción del menú para comenzar.</p>
  `
})
export class InicioComponent {
  usuario: UsuarioToken | null;

  constructor(private auth: AuthService) {
    this.usuario = this.auth.getUsuario();
  }
}
