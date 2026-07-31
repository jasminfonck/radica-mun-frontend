import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  AdminService, CanalOut, BuzonCorreoOut, BuzonCorreoCreate, BuzonCorreoUpdate,
  ConfiguracionOut, EntidadOut, TestSmtpOut,
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
  configuracion: ConfiguracionOut | null = null;
  entidad: EntidadOut | null = null;
  mostrarFormBuzon = false;
  mostrarSecret = false;
  guardandoBuzon = false;
  probandoConexion = false;
  activandoBuzon = false;
  iniciandoOAuth = false;
  buzonForm!: FormGroup;

  // SMTP saliente
  smtpForm!: FormGroup;
  guardandoSmtp         = false;
  probandoSmtp          = false;
  mostrarSmtpPass       = false;
  emailPrueba           = '';
  smtpActivo            = false;
  smtpPasswordConfigurado = false;
  proveedorSmtp         = 'otro';

  readonly SMTP_PROVEEDORES = [
    { value: 'gmail',   label: 'Gmail (smtp.gmail.com)',                      host: 'smtp.gmail.com',      port: 587 },
    { value: 'outlook', label: 'Outlook / Microsoft 365 (smtp.office365.com)', host: 'smtp.office365.com', port: 587 },
    { value: 'otro',    label: 'Otro servidor (configurar manualmente)',       host: '',                    port: 587 },
  ];

  iconos: Record<string, string> = {
    ventanilla: 'storefront',
    formulario: 'language',
    correo:     'email',
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
        const canalEmail = c.find(x => x.tipo === 'correo');
        if (canalEmail) this._cargarBuzon(canalEmail.id);
      },
      error: err => {
        this.cargando = false;
        this.error = true;
        this.cdr.markForCheck();
        this.toast.error(err?.error?.detail || 'No se pudieron cargar los canales.');
      },
    });
    this.adminService.getConfiguracion().subscribe({
      next: c => {
        this.configuracion = c;
        this.smtpForm.patchValue({
          smtp_host:               c.smtp_host || '',
          smtp_port:               c.smtp_port || 587,
          smtp_user:               c.smtp_user || '',
          smtp_from_fuente:        c.smtp_from_fuente || 'personalizado',
          smtp_from_personalizado: c.smtp_from_personalizado || '',
        });
        this.smtpActivo             = c.smtp_activo;
        this.smtpPasswordConfigurado = c.smtp_password_configurado;
        if (c.smtp_password_configurado) {
          this.smtpForm.get('smtp_password')!.clearValidators();
          this.smtpForm.get('smtp_password')!.updateValueAndValidity();
        }
        const host = c.smtp_host || '';
        if (host.includes('gmail')) this.proveedorSmtp = 'gmail';
        else if (host.includes('office365') || host.includes('outlook')) this.proveedorSmtp = 'outlook';
        else if (host) this.proveedorSmtp = 'otro';
        this.cdr.markForCheck();
      },
    });
    this.adminService.getEntidad().subscribe({ next: e => { this.entidad = e; this.cdr.markForCheck(); } });
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

    this.smtpForm = this.fb.group({
      smtp_host:               [''],
      smtp_port:               [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtp_user:               ['', Validators.email],
      smtp_password:           [''],
      smtp_from_fuente:        ['personalizado', Validators.required],
      smtp_from_personalizado: [''],
    });

    this.smtpForm.get('smtp_from_fuente')!.valueChanges.subscribe(() => this._actualizarValidadoresSmtp());
  }

  private _actualizarValidadoresSmtp(): void {
    const smtpRequired = !this.usandoGraph;
    const host = this.smtpForm.get('smtp_host')!;
    const user = this.smtpForm.get('smtp_user')!;
    if (smtpRequired) {
      host.setValidators([Validators.required]);
      user.setValidators([Validators.required, Validators.email]);
    } else {
      host.clearValidators();
      user.setValidators([Validators.email]);
    }
    host.updateValueAndValidity();
    user.updateValueAndValidity();
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
    return this.canales.find(c => c.tipo === 'correo');
  }

  get usandoGraph(): boolean {
    return this.fuenteActual === 'buzon_oficial' && this.buzon?.metodo_conexion === 'graph';
  }

  get acuseFromEmail(): string {
    const fuente = this.configuracion?.smtp_from_fuente;
    if (fuente === 'buzon_oficial') return this.buzon?.correo || '(buzón no configurado)';
    if (fuente === 'email_entidad') return this.entidad?.email_institucional || '(entidad sin correo)';
    if (this.configuracion?.smtp_host) {
      return this.configuracion.smtp_from_personalizado || this.configuracion.smtp_user || '(personalizado)';
    }
    return 'Correo saliente no configurado';
  }

  get acuseSmtpActivo(): boolean {
    return !!this.configuracion?.smtp_activo;
  }

  get proveedorActual(): string {
    return this.buzonForm.get('proveedor')?.value ?? 'gmail';
  }

  get tipoCuentaActual(): string {
    return this.buzonForm.get('tipo_cuenta')?.value ?? 'personal';
  }

  // ── Canales ──────────────────────────────────────────────────────────────

  toggleCanal(canal: CanalOut, event: MatSlideToggleChange): void {
    const nuevoActivo = !canal.activo;
    if (canal.tipo === 'correo' && nuevoActivo && (!this.buzon || this.buzon.estado_conexion !== 'ok')) {
      event.source.checked = canal.activo; // el toggle ya cambió visualmente al hacer clic; revertirlo
      this.toast.advertencia('Configure y pruebe el buzón de correo antes de activar este canal.');
      this.cdr.markForCheck();
      return;
    }
    this.guardando[canal.id] = true;
    this.adminService.actualizarCanal(canal.id, { activo: nuevoActivo }).subscribe({
      next: c => {
        const idx = this.canales.findIndex(x => x.id === c.id);
        if (idx >= 0) this.canales[idx] = c;
        if (c.tipo === 'correo' && this.buzon) {
          this.buzon.activo = c.activo;
        }
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
      error: err => {
        event.source.checked = canal.activo; // la llamada falló, revertir el toggle a su valor real
        this.toast.error(err?.error?.detail || 'No se pudo actualizar el canal.');
        this.guardando[canal.id] = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleAcuse(canal: CanalOut, event: MatSlideToggleChange): void {
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
        event.source.checked = canal.acuse_configurado;
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

  // ── SMTP saliente ─────────────────────────────────────────────────────────

  get fuenteActual(): string { return this.smtpForm.get('smtp_from_fuente')?.value || 'personalizado'; }

  seleccionarProveedorSmtp(valor: string): void {
    this.proveedorSmtp = valor;
    const p = this.SMTP_PROVEEDORES.find(x => x.value === valor);
    if (p?.host) this.smtpForm.patchValue({ smtp_host: p.host, smtp_port: p.port });
  }

  guardarSmtp(): void {
    if (this.smtpForm.invalid) { this.smtpForm.markAllAsTouched(); return; }
    this.guardandoSmtp = true;
    const v = this.smtpForm.value;
    const payload: any = {
      smtp_from_fuente:        v.smtp_from_fuente,
      smtp_from_personalizado: v.smtp_from_personalizado || null,
    };
    if (!this.usandoGraph) {
      payload['smtp_host'] = v.smtp_host;
      payload['smtp_port'] = v.smtp_port;
      payload['smtp_user'] = v.smtp_user;
    }
    if (v.smtp_password) payload['smtp_password'] = v.smtp_password;
    this.adminService.actualizarConfiguracion(payload).subscribe({
      next: c => {
        this.guardandoSmtp = false;
        this.configuracion = c;
        this.smtpActivo             = c.smtp_activo;
        this.smtpPasswordConfigurado = c.smtp_password_configurado;
        this.smtpForm.get('smtp_password')!.setValue('');
        this.smtpForm.get('smtp_password')!.clearValidators();
        this.smtpForm.get('smtp_password')!.updateValueAndValidity();
        this.toast.exito('Configuración SMTP guardada. Pruebe el envío para verificar.');
        this.cdr.markForCheck();
      },
      error: err => {
        this.guardandoSmtp = false;
        this.toast.error(err?.error?.detail || 'Error al guardar la configuración SMTP.');
        this.cdr.markForCheck();
      },
    });
  }

  probarSmtp(): void {
    if (!this.emailPrueba) { this.toast.advertencia('Ingrese un correo de destino para la prueba.'); return; }
    this.probandoSmtp = true;
    this.adminService.testSmtp(this.emailPrueba).subscribe({
      next: (r: TestSmtpOut) => {
        this.probandoSmtp = false;
        this.smtpActivo = r.ok;
        if (r.ok) this.toast.exito(r.mensaje); else this.toast.error(r.mensaje);
        this.cdr.markForCheck();
      },
      error: err => {
        this.probandoSmtp = false;
        this.toast.error(err?.error?.detail || 'Error al probar el SMTP.');
        this.cdr.markForCheck();
      },
    });
  }
}
