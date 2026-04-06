import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminService, BitacoraOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.html',
  standalone: false
})
export class AuditoriaComponent implements OnInit {
  registros: BitacoraOut[] = [];
  cargando = true;
  columnas = ['created_at', 'usuario_nombre', 'accion', 'entidad', 'detalle'];

  readonly ACCION_LABEL: Record<string, string> = {
    crear_usuario:                 'Crear usuario',
    actualizar_usuario:            'Actualizar usuario',
    actualizar_entidad:            'Actualizar entidad',
    crear_dependencia:             'Crear dependencia',
    actualizar_dependencia:        'Actualizar dependencia',
    actualizar_canal:              'Actualizar canal',
    crear_tipo_requerimiento:      'Crear tipo requerimiento',
    actualizar_tipo_requerimiento: 'Actualizar tipo requerimiento',
    crear_plazo_respuesta:         'Crear plazo respuesta',
    actualizar_plazo_respuesta:    'Actualizar plazo respuesta',
    actualizar_configuracion:      'Actualizar configuración',
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.adminService.getAuditoria(500).subscribe({
      next:  r => { this.registros = r; this.cargando = false; this.cdr.markForCheck(); },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
  }

  etiquetaAccion(accion: string): string {
    return this.ACCION_LABEL[accion] ?? accion;
  }

  detalleResumido(detalle?: string): string {
    if (!detalle) return '—';
    try {
      const obj = JSON.parse(detalle);
      if (obj.nuevo) {
        return Object.entries(obj.nuevo).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      return detalle.slice(0, 80);
    } catch {
      return detalle.slice(0, 80);
    }
  }
}
