import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AdminService, CanalOut, BuzonCorreoOut, BuzonCorreoCreate, BuzonCorreoUpdate,
} from '../../../../core/services/admin.service';
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

  // Buzón de correo
  buzon: BuzonCorreoOut | null = null;
  cargandoBuzon = false;
  mostrarFormBuzon = false;
  mostrarPassword = false;
  guardandoBuzon = false;
  probandoConexion = false;
  activandoBuzon = false;
  buzonForm!: FormGroup;

  iconos: Record<string, string> = {
    presencial: 'storefront',
    digital:    'language',
    email:      'email',
  };

  estadoIcono: Record<string, string> = {
    ok:         'check_circle',
    error:      'error',
    sin_probar: 'help_outline',
  };

  estadoColor: Record<string, string> = {
    ok:         '#2e7d32',
    error:      '#b71c1c',
    sin_probar: '#757575',
  };

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this._inicializarForm();
    this.adminService.getCanales().subscribe({
      next: c => {
        this.canales = c;
        this.cargando = false;
        this.cdr.markForCheck();
        const canalEmail = c.find(x => x.tipo === 'email');
        if (canalEmail) this._cargarBuzon(canalEmail.id);
      },
      error: err => {
        this.cargando = false;
        this.error = true;
        this.cdr.markForCheck();
        this.toast.error(err?.error?.detail || 'No se pudieron cargar los canales.');
      },
    });
  }

  private _inicializarForm(): void {
    this.buzonForm = this.fb.group({
      proveedor:             ['gmail', Validators.required],
      correo:                ['', [Validators.required, Validators.email]],
      password_app:          ['', [Validators.required, Validators.minLength(8)]],
      intervalo_minutos:     [5, [Validators.required, Validators.min(1), Validators.max(60)]],
      max_adjuntos:          [5, [Validators.required, Validators.min(1), Validators.max(20)]],
      max_tamano_adjunto_mb: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
    });
  }

  private _cargarBuzon(canalId: number): void {
    this.cargandoBuzon = true;
    this.adminService.getBuzon().subscribe({
      next: b => {
        this.buzon = b;
        this.cargandoBuzon = false;
        if (b) this._rellenarForm(b);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoBuzon = false;
        this.cdr.markForCheck();
      },
    });
  }

  private _rellenarForm(b: BuzonCorreoOut): void {
    this.buzonForm.patchValue({
      proveedor:             b.proveedor,
      correo:                b.correo,
      intervalo_minutos:     b.intervalo_minutos,
      max_adjuntos:          b.max_adjuntos,
      max_tamano_adjunto_mb: b.max_tamano_adjunto_mb,
    });
    // password_app no se pre-rellena por seguridad
    this.buzonForm.get('password_app')!.clearValidators();
    this.buzonForm.get('password_app')!.updateValueAndValidity();
  }

  get canalEmail(): CanalOut | undefined {
    return this.canales.find(c => c.tipo === 'email');
  }

  // ── Canales ─────────────────────────────────────────────────────────────

  toggleCanal(canal: CanalOut): void {
    const nuevoActivo = !canal.activo;
    if (canal.tipo === 'digital' && nuevoActivo && !canal.acuse_configurado) {
      this.toast.advertencia('Debe confirmar el mecanismo de acuse de recibo automático antes de activar el formulario web.');
      return;
    }
    if (canal.tipo === 'email' && nuevoActivo && (!this.buzon || this.buzon.estado_conexion !== 'ok')) {
      this.toast.advertencia('Configure y pruebe el buzón de correo antes de activar este canal.');
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
        if (nuevoAcuse) this.toast.exito('Acuse de recibo configurado. Ya puede activar el canal.');
      },
      error: err => {
        this.toast.error(err?.error?.detail || 'No se pudo actualizar el canal.');
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Buzón de correo ──────────────────────────────────────────────────────

  abrirFormBuzon(): void {
    this.mostrarFormBuzon = true;
    if (!this.buzon) {
      this.buzonForm.get('password_app')!.setValidators([Validators.required, Validators.minLength(8)]);
      this.buzonForm.get('password_app')!.updateValueAndValidity();
    }
  }

  cancelarFormBuzon(): void {
    this.mostrarFormBuzon = false;
    if (this.buzon) this._rellenarForm(this.buzon);
    else this.buzonForm.reset({ proveedor: 'gmail', intervalo_minutos: 5, max_adjuntos: 5, max_tamano_adjunto_mb: 10 });
  }

  guardarBuzon(): void {
    if (this.buzonForm.invalid) {
      this.buzonForm.markAllAsTouched();
      return;
    }
    const v = this.buzonForm.value;
    this.guardandoBuzon = true;

    if (this.buzon) {
      const update: BuzonCorreoUpdate = {
        intervalo_minutos:     v.intervalo_minutos,
        max_adjuntos:          v.max_adjuntos,
        max_tamano_adjunto_mb: v.max_tamano_adjunto_mb,
      };
      if (v.password_app) update.password_app = v.password_app;

      this.adminService.actualizarBuzon(this.buzon.id, update).subscribe({
        next: b => {
          this.buzon = b;
          this.guardandoBuzon = false;
          this.mostrarFormBuzon = false;
          this.toast.exito('Buzón actualizado correctamente.');
          this.cdr.markForCheck();
        },
        error: err => {
          this.guardandoBuzon = false;
          this.toast.error(err?.error?.detail || 'Error al actualizar el buzón.');
          this.cdr.markForCheck();
        },
      });
    } else {
      const canal = this.canalEmail;
      if (!canal) return;
      const create: BuzonCorreoCreate = {
        canal_id:              canal.id,
        proveedor:             v.proveedor,
        correo:                v.correo,
        password_app:          v.password_app,
        intervalo_minutos:     v.intervalo_minutos,
        max_adjuntos:          v.max_adjuntos,
        max_tamano_adjunto_mb: v.max_tamano_adjunto_mb,
      };
      this.adminService.crearBuzon(create).subscribe({
        next: b => {
          this.buzon = b;
          this.guardandoBuzon = false;
          this.mostrarFormBuzon = false;
          this.toast.exito('Buzón configurado. Pruebe la conexión antes de activarlo.');
          this.cdr.markForCheck();
        },
        error: err => {
          this.guardandoBuzon = false;
          this.toast.error(err?.error?.detail || 'Error al configurar el buzón.');
          this.cdr.markForCheck();
        },
      });
    }
  }

  probarConexion(): void {
    if (!this.buzon) return;
    this.probandoConexion = true;
    this.adminService.probarBuzon(this.buzon.id).subscribe({
      next: r => {
        this.probandoConexion = false;
        if (r.ok) {
          this.buzon!.estado_conexion = 'ok';
          this.buzon!.ultimo_error = undefined;
          this.toast.exito(r.mensaje);
        } else {
          this.buzon!.estado_conexion = 'error';
          this.buzon!.ultimo_error = r.mensaje;
          this.toast.error(`Error de conexión: ${r.mensaje}`);
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.probandoConexion = false;
        this.toast.error(err?.error?.detail || 'No se pudo probar la conexión.');
        this.cdr.markForCheck();
      },
    });
  }

  toggleBuzonActivo(): void {
    if (!this.buzon) return;
    const nuevoActivo = !this.buzon.activo;
    this.activandoBuzon = true;
    this.adminService.activarBuzon(this.buzon.id, nuevoActivo).subscribe({
      next: b => {
        this.buzon = b;
        this.activandoBuzon = false;
        this.toast.exito(nuevoActivo ? 'Polling de correo activado.' : 'Polling de correo desactivado.');
        this.cdr.markForCheck();
      },
      error: err => {
        this.activandoBuzon = false;
        this.toast.error(err?.error?.detail || 'No se pudo cambiar el estado del buzón.');
        this.cdr.markForCheck();
      },
    });
  }
}
