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

  buzon: BuzonCorreoOut | null = null;
  cargandoBuzon = false;
  mostrarFormBuzon = false;
  mostrarSecret = false;
  guardandoBuzon = false;
  probandoConexion = false;
  activandoBuzon = false;
  iniciandoOAuth = false;
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
    this.buzonForm.get('tipo_cuenta')!.valueChanges.subscribe(() => this._actualizarValidadorTenant());
    this.buzonForm.get('proveedor')!.valueChanges.subscribe(() => this._actualizarValidadorTenant());

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
      tipo_cuenta:           ['personal', Validators.required],
      correo:                ['', [Validators.required, Validators.email]],
      oauth_client_id:       ['', Validators.required],
      oauth_client_secret:   ['', Validators.required],
      oauth_tenant_id:       [''],
      intervalo_minutos:     [5,  [Validators.required, Validators.min(1), Validators.max(60)]],
    });
  }

  private _actualizarValidadorTenant(): void {
    const proveedor  = this.buzonForm.get('proveedor')!.value;
    const tipoCuenta = this.buzonForm.get('tipo_cuenta')!.value;
    const tenant     = this.buzonForm.get('oauth_tenant_id')!;
    if (proveedor === 'outlook' && tipoCuenta === 'empresarial') {
      tenant.setValidators([Validators.required]);
    } else {
      tenant.clearValidators();
    }
    tenant.updateValueAndValidity();
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
      tipo_cuenta:           b.tipo_cuenta,
      correo:            b.correo,
      intervalo_minutos: b.intervalo_minutos,
    });
    // Client ID se muestra; secret no por seguridad
    if (b.oauth_client_id) {
      this.buzonForm.get('oauth_client_id')!.setValue(b.oauth_client_id);
    }
    // Secret opcional en edición
    this.buzonForm.get('oauth_client_secret')!.clearValidators();
    this.buzonForm.get('oauth_client_secret')!.updateValueAndValidity();
    this._actualizarValidadorTenant();
  }

  get canalEmail(): CanalOut | undefined {
    return this.canales.find(c => c.tipo === 'email');
  }

  get proveedorActual(): string {
    return this.buzonForm.get('proveedor')?.value ?? 'gmail';
  }

  get tipoCuentaActual(): string {
    return this.buzonForm.get('tipo_cuenta')?.value ?? 'personal';
  }

  // ── Canales ──────────────────────────────────────────────────────────────

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
        if (c.tipo === 'email' && this.buzon) {
          this.buzon.activo = c.activo;
        }
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

  // ── Buzón ─────────────────────────────────────────────────────────────────

  abrirFormBuzon(): void {
    this.mostrarFormBuzon = true;
    if (!this.buzon) {
      this.buzonForm.get('oauth_client_secret')!.setValidators([Validators.required]);
      this.buzonForm.get('oauth_client_secret')!.updateValueAndValidity();
    }
  }

  cancelarFormBuzon(): void {
    this.mostrarFormBuzon = false;
    if (this.buzon) {
      this._rellenarForm(this.buzon);
    } else {
      this.buzonForm.reset({ proveedor: 'gmail', tipo_cuenta: 'personal', intervalo_minutos: 5 });
    }
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
        proveedor:         v.proveedor,
        tipo_cuenta:       v.tipo_cuenta,
        correo:            v.correo,
        intervalo_minutos: v.intervalo_minutos,
      };
      if (v.oauth_client_id)     update.oauth_client_id     = v.oauth_client_id;
      if (v.oauth_client_secret) update.oauth_client_secret = v.oauth_client_secret;
      if (v.oauth_tenant_id)     update.oauth_tenant_id     = v.oauth_tenant_id;

      this.adminService.actualizarBuzon(this.buzon.id, update).subscribe({
        next: b => {
          this.buzon = b;
          this.guardandoBuzon = false;
          this.mostrarFormBuzon = false;
          this.toast.exito('Buzón actualizado. Si cambió credenciales, vuelva a autorizar OAuth2.');
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
        canal_id:            canal.id,
        proveedor:           v.proveedor,
        tipo_cuenta:         v.tipo_cuenta,
        correo:              v.correo,
        oauth_client_id:     v.oauth_client_id,
        oauth_client_secret: v.oauth_client_secret,
        intervalo_minutos:   v.intervalo_minutos,
      };
      if (v.oauth_tenant_id) create.oauth_tenant_id = v.oauth_tenant_id;

      this.adminService.crearBuzon(create).subscribe({
        next: b => {
          this.buzon = b;
          this.guardandoBuzon = false;
          this.mostrarFormBuzon = false;
          this.toast.exito('Buzón configurado. Haga clic en "Autorizar OAuth2" para completar la conexión.');
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

  iniciarOAuth(): void {
    if (!this.buzon) return;
    this.iniciandoOAuth = true;
    this.adminService.iniciarOAuthBuzon(this.buzon.id).subscribe({
      next: r => {
        this.iniciandoOAuth = false;
        window.open(r.url, '_blank', 'width=600,height=700,noopener,noreferrer');
        this.toast.advertencia('Autoriza en la ventana que se abrió. Cuando termine, prueba la conexión.');
        this.cdr.markForCheck();
      },
      error: err => {
        this.iniciandoOAuth = false;
        this.toast.error(err?.error?.detail || 'No se pudo iniciar la autorización.');
        this.cdr.markForCheck();
      },
    });
  }
}
