import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';

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
    private snack: MatSnackBar,
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
        const msg = err?.error?.detail || 'No se pudieron cargar los canales. Verifique que la migración de base de datos esté aplicada.';
        this.snack.open(msg, 'Cerrar', { duration: 8000 });
      },
    });
  }

  toggleCanal(canal: CanalOut): void {
    const nuevoActivo = !canal.activo;
    if (canal.tipo === 'digital' && nuevoActivo && !canal.acuse_configurado) {
      this.snack.open(
        'Debe confirmar el mecanismo de acuse de recibo automático antes de activar el formulario web.',
        'Entendido', { duration: 6000 }
      );
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
        const msg = err?.error?.detail || 'No se pudo actualizar el canal.';
        this.snack.open(msg, 'Cerrar', { duration: 6000 });
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
          this.snack.open('Acuse de recibo configurado. Ya puede activar el canal.', 'OK', { duration: 4000 });
        }
      },
      error: err => {
        const msg = err?.error?.detail || 'No se pudo actualizar el canal.';
        this.snack.open(msg, 'Cerrar', { duration: 6000 });
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
    });
  }
}
