import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UsuarioToken } from '../auth/auth.models';
import { AdminService } from '../services/admin.service';
import { ThemeService } from '../services/theme.service';

interface MenuItem {
  label: string;
  icon: string;
  ruta: string;
  roles: string[];
  requiereConfig: boolean;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
  standalone: false
})
export class LayoutComponent implements OnInit {
  usuario: UsuarioToken | null;
  sidebarAbierto = true;
  sistemaListo   = false;
  nombreEntidad  = '';

  menu: MenuItem[] = [
    { label: 'Inicio',          icon: 'home',       ruta: '/inicio',    roles: ['administrador','operador','consultor'], requiereConfig: true  },
    { label: 'Recepción',       icon: 'inbox',       ruta: '/recepcion', roles: ['administrador','operador'],            requiereConfig: true  },
    { label: 'Radicación',      icon: 'assignment',  ruta: '/radicado',  roles: ['administrador','operador'],            requiereConfig: true  },
    { label: 'Consulta',        icon: 'search',      ruta: '/consulta',  roles: ['administrador','operador','consultor'],requiereConfig: true  },
    { label: 'Administración',  icon: 'settings',    ruta: '/admin',     roles: ['administrador'],                      requiereConfig: false },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private adminService: AdminService,
    private themeService: ThemeService,
    private snack: MatSnackBar,
  ) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit(): void {
    forkJoin({
      entidad: this.adminService.getEntidad(),
      estado:  this.adminService.getEstadoSistema(),
      config:  this.adminService.getConfiguracion(),
    }).subscribe({
      next: ({ entidad, estado, config }) => {
        this.nombreEntidad = entidad.nombre || 'Sistema de Radicación';
        this.sistemaListo  = estado.sistema_listo;
        if (config.color_primario) {
          this.themeService.aplicarColor(config.color_primario);
        }
      },
    });
  }

  menuVisible(item: MenuItem): boolean {
    return this.auth.tieneRol(...item.roles);
  }

  bloqueado(item: MenuItem): boolean {
    return item.requiereConfig && !this.sistemaListo;
  }

  navegarA(item: MenuItem): void {
    if (this.bloqueado(item)) {
      this.snack.open(
        'Complete la configuración del sistema primero.',
        'Ir a Administración',
        { duration: 6000, panelClass: 'snack-advertencia' }
      ).onAction().subscribe(() => this.router.navigate(['/admin']));
      return;
    }
    this.router.navigate([item.ruta]);
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
