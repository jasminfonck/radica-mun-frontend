import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UsuarioToken } from '../auth/auth.models';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
  standalone: false
})
export class LayoutComponent {
  usuario: UsuarioToken | null;
  sidebarAbierto = true;

  menu = [
    { label: 'Inicio',       icon: 'home',        ruta: '/inicio',     roles: ['administrador', 'operador', 'consultor'] },
    { label: 'Recepción',    icon: 'inbox',        ruta: '/recepcion',  roles: ['administrador', 'operador'] },
    { label: 'Radicación',   icon: 'assignment',   ruta: '/radicado',   roles: ['administrador', 'operador'] },
    { label: 'Consulta',     icon: 'search',       ruta: '/consulta',   roles: ['administrador', 'operador', 'consultor'] },
    { label: 'Configuración',icon: 'settings',     ruta: '/admin',      roles: ['administrador'] },
  ];

  constructor(private auth: AuthService, private router: Router) {
    this.usuario = this.auth.getUsuario();
  }

  menuVisible(roles: string[]): boolean {
    return this.auth.tieneRol(...roles);
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
