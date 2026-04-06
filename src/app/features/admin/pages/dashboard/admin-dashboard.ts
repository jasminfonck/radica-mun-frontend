import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../../core/services/admin.service';

interface PasoConfig {
  label: string;
  descripcion: string;
  ruta: string;
  icono: string;
  completado: boolean;
  expandido: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss'],
  standalone: false,
})
export class AdminDashboardComponent implements OnInit {
  sistemaListo = false;
  cargando = true;

  pasos: PasoConfig[] = [
    { label: 'Datos de la entidad',       descripcion: 'Nombre, NIT, municipio y contacto',                           ruta: '/admin/entidad',       icono: 'account_balance', completado: false, expandido: true },
    { label: 'Dependencias',              descripcion: 'Áreas que recibirán documentos radicados',                     ruta: '/admin/dependencias',  icono: 'account_tree',    completado: false, expandido: true },
    { label: 'Canales de recepción',      descripcion: 'Ventanilla, formulario web, correo',                           ruta: '/admin/canales',       icono: 'input',           completado: false, expandido: true },
    { label: 'Catálogos administrativos', descripcion: 'Tipos de requerimiento y plazos',                              ruta: '/admin/catalogos',     icono: 'list_alt',        completado: false, expandido: true },
    { label: 'Configuración del sistema', descripcion: 'Prefijo de radicado, almacenamiento y política de privacidad', ruta: '/admin/configuracion', icono: 'settings',        completado: false, expandido: true },
  ];

  accesosRapidos = [
    { label: 'Usuarios',      icono: 'people',         ruta: '/admin/usuarios' },
    { label: 'Dependencias',  icono: 'account_tree',   ruta: '/admin/dependencias' },
    { label: 'Catálogos',     icono: 'list_alt',       ruta: '/admin/catalogos' },
    { label: 'Configuración', icono: 'settings',       ruta: '/admin/configuracion' },
    { label: 'Auditoría',     icono: 'manage_history', ruta: '/admin/auditoria' },
  ];

  constructor(
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin({
      estado:       this.adminService.getEstadoSistema(),
      entidad:      this.adminService.getEntidad(),
      dependencias: this.adminService.getDependencias(),
      canales:      this.adminService.getCanales(),
      tipos:        this.adminService.getTipos(),
      config:       this.adminService.getConfiguracion(),
    }).subscribe({
      next: ({ estado, entidad, dependencias, canales, tipos, config }) => {
        this.sistemaListo        = estado.sistema_listo;
        this.pasos[0].completado = entidad.configurada;
        this.pasos[1].completado = dependencias.some(x => x.activa);
        this.pasos[2].completado = canales.some(x => x.activo);
        this.pasos[3].completado = tipos.some(x => x.activo);
        this.pasos[4].completado = !!config.prefijo_radicado && config.politica_privacidad_activa;

        // Pasos completados arrancan colapsados
        this.pasos.forEach(p => { p.expandido = !p.completado; });

        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
  }

  get progreso(): number {
    return Math.round((this.pasos.filter(p => p.completado).length / this.pasos.length) * 100);
  }

  /** Click en el card → siempre navega a la sección */
  clickPaso(paso: PasoConfig): void {
    this.router.navigate([paso.ruta]);
  }

  /** Click en el chevron → solo colapsa/expande, sin navegar */
  togglePaso(event: Event, paso: PasoConfig): void {
    event.stopPropagation();
    paso.expandido = !paso.expandido;
    this.cdr.markForCheck();
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }
}
