import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';

interface PasoConfig {
  label: string;
  descripcion: string;
  ruta: string;
  icono: string;
  completado: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  sistemaListo = false;
  pasos: PasoConfig[] = [
    { label: 'Datos de la entidad',      descripcion: 'Nombre, NIT, municipio y contacto',       ruta: '/admin/entidad',      icono: 'account_balance', completado: false },
    { label: 'Dependencias',             descripcion: 'Áreas que recibirán documentos radicados', ruta: '/admin/dependencias', icono: 'account_tree',    completado: false },
    { label: 'Canales de recepción',     descripcion: 'Ventanilla, formulario web, correo',       ruta: '/admin/canales',      icono: 'input',           completado: false },
    { label: 'Catálogos administrativos',descripcion: 'Tipos de requerimiento y plazos',          ruta: '/admin/catalogos',    icono: 'list_alt',        completado: false },
    { label: 'Configuración de radicado',descripcion: 'Prefijo, secuencia y almacenamiento',      ruta: '/admin/configuracion',icono: 'settings',        completado: false },
  ];

  accesosRapidos = [
    { label: 'Usuarios',      icono: 'people',      ruta: '/admin/usuarios' },
    { label: 'Dependencias',  icono: 'account_tree', ruta: '/admin/dependencias' },
    { label: 'Catálogos',     icono: 'list_alt',    ruta: '/admin/catalogos' },
    { label: 'Configuración', icono: 'settings',    ruta: '/admin/configuracion' },
  ];

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.adminService.getEstadoSistema().subscribe(r => this.sistemaListo = r.sistema_listo);
    this.adminService.getEntidad().subscribe(e => this.pasos[0].completado = e.configurada);
    this.adminService.getDependencias().subscribe(d => this.pasos[1].completado = d.some(x => x.activa));
    this.adminService.getCanales().subscribe(c => this.pasos[2].completado = c.some(x => x.activo));
    this.adminService.getTipos().subscribe(t => {
      const plazosOk = false;
      this.pasos[3].completado = t.some(x => x.activo);
    });
    this.adminService.getConfiguracion().subscribe(c => this.pasos[4].completado = !!c.prefijo_radicado);
  }

  get progreso(): number {
    return Math.round((this.pasos.filter(p => p.completado).length / this.pasos.length) * 100);
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }
}
