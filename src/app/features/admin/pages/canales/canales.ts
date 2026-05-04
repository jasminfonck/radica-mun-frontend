import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-canales',
  templateUrl: './canales.html',
  standalone: false
})
export class CanalesComponent implements OnInit {
  canales: CanalOut[] = [];
  cargando = true;
  error = false;
  guardando: Record<number, boolean> = {};

  iconos: Record<string, string> = {
    presencial: 'storefront',
    digital:    'language',
    email:      'email',
  };

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.adminService.getCanales().subscribe({
      next: c => {
        this.canales = c;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.cargando = false;
        this.error = true;
        this.cdr.markForCheck();
        this.toast.error(err?.error?.detail || 'No se pudieron cargar los canales. Verifique que la migración esté aplicada.');
      },
    });
  }

  toggleCanal(canal: CanalOut): void {
    const nuevoActivo = !canal.activo;
    if (canal.tipo === 'digital' && nuevoActivo && !canal.acuse_configurado) {
      this.toast.advertencia('Debe confirmar el mecanismo de acuse de recibo automático antes de activar el formulario web.');
      return;
    }
    this.guardando[canal.id] = true;
    this.adminService.actualizarCanal(canal.id, { activo: nuevoActivo }).subscribe({
      next: c => {
        const idx = this.canales.findIndex(x => x.id === c.id);
        if (idx >= 0) this.canales[idx] = c;
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err?.error?.detail || 'No se pudo actualizar el canal.');
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleAcuse(canal: CanalOut): void {
    const nuevoAcuse = !canal.acuse_configurado;
    this.guardando[canal.id] = true;
    this.adminService.actualizarCanal(canal.id, { activo: canal.activo, acuse_configurado: nuevoAcuse }).subscribe({
      next: c => {
        const idx = this.canales.findIndex(x => x.id === c.id);
        if (idx >= 0) this.canales[idx] = c;
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
        if (nuevoAcuse) {
          this.toast.exito('Acuse de recibo configurado. Ya puede activar el canal.');
        }
      },
      error: err => {
        this.toast.error(err?.error?.detail || 'No se pudo actualizar el canal.');
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
    });
  }
}
