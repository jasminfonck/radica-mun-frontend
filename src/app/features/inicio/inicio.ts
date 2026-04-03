import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioToken } from '../../core/auth/auth.models';
import { ConsultaService, EstadisticasOut } from '../../core/services/consulta.service';

@Component({
  selector: 'app-inicio',
  standalone: false,
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss'],
})
export class InicioComponent implements OnInit {
  usuario: UsuarioToken | null;
  stats?: EstadisticasOut;
  cargando = true;
  saludo = '';
  hoy = new Date();

  readonly accesos = [
    { label: 'Registrar recepción',  icon: 'add_box',        ruta: '/recepcion/nueva',    color: '#1a237e', roles: ['administrador','operador'] },
    { label: 'Bandeja de recepción', icon: 'inbox',           ruta: '/recepcion',          color: '#283593', roles: ['administrador','operador'] },
    { label: 'Bandeja de radicados', icon: 'assignment',      ruta: '/radicado',           color: '#00695c', roles: ['administrador','operador'] },
    { label: 'Búsqueda avanzada',    icon: 'manage_search',   ruta: '/consulta/busqueda',  color: '#4a148c', roles: ['administrador','operador','consultor'] },
    { label: 'Estadísticas',         icon: 'bar_chart',       ruta: '/consulta',           color: '#bf360c', roles: ['administrador','operador','consultor'] },
    { label: 'Configuración',        icon: 'settings',        ruta: '/admin',              color: '#37474f', roles: ['administrador'] },
  ];

  constructor(private auth: AuthService, private consulta: ConsultaService) {
    this.usuario = this.auth.getUsuario();
  }

  ngOnInit(): void {
    const hora = new Date().getHours();
    if (hora < 12)      this.saludo = 'Buenos días';
    else if (hora < 18) this.saludo = 'Buenas tardes';
    else                this.saludo = 'Buenas noches';

    this.consulta.estadisticas().subscribe({
      next:  s  => { this.stats = s; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  accesoVisible(roles: string[]): boolean {
    return this.auth.tieneRol(...roles);
  }
}
