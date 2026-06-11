import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RecepcionService, RecepcionOut, AdjuntoOut, BitacoraEvento, ESTADOS_RECEPCION } from '../../../../core/services/recepcion.service';
import {
  RemitenteService, RemitenteResumen, RemitenteOut, MetadatosOut,
  PlazoRespuestaResumen,
} from '../../../../core/services/remitente.service';
import { AdminService, DependenciaOut, TipoReqOut } from '../../../../core/services/admin.service';
import { RadicadoService, RadicadoOut } from '../../../../core/services/radicado.service';
import { GeoService, DepartamentoOut, MunicipioOut } from '../../../../core/services/geo.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-detalle-recepcion',
  templateUrl: './detalle-recepcion.html',
  styleUrls: ['./detalle-recepcion.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleRecepcionComponent implements OnInit {
  recepcion?: RecepcionOut;
  estados = ESTADOS_RECEPCION;
  cargando = true;

  // ── Remitente ──────────────────────────────────────────────────────────────
  metadatos?: MetadatosOut | null;
  remitentesEncontrados: RemitenteResumen[] = [];
  duplicadosAviso: RemitenteResumen[] = [];
  remitenteSeleccionado?: RemitenteResumen;
  remitenteCompleto?: RemitenteOut;
  modoFormRemitente: 'ninguno' | 'nuevo' | 'edicion' = 'ninguno';
  guardandoRemitente = false;
  guardandoMetadatos = false;
  exito = false;

  tiposRequerimiento: TipoReqOut[] = [];
  plazosRespuesta:    PlazoRespuestaResumen[] = [];

  // ── Geo ────────────────────────────────────────────────────────────────────
  departamentos: DepartamentoOut[] = [];
  municipiosFiltrados: MunicipioOut[] = [];

  // ── Bitácora ───────────────────────────────────────────────────────────────
  bitacora: BitacoraEvento[] = [];
  cargandoBitacora = false;

  // ── Radicado ───────────────────────────────────────────────────────────────
  radicado?: RadicadoOut | null;
  dependencias: DependenciaOut[] = [];
  formRadicado!: FormGroup;
  radicando = false;
  exitoRadicado = false;

  formRemitente!: FormGroup;
  formMetadatos!: FormGroup;
  busquedaCtrl!: FormControl;

  readonly TIPOS_ID = ['CC', 'CE', 'NIT', 'PP', 'Otro'];
  readonly TIPOS_SOPORTE = [
    { value: 'fisico',  label: 'Físico' },
    { value: 'digital', label: 'Digital' },
    { value: 'mixto',   label: 'Mixto' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private recepcionService: RecepcionService,
    private remitenteService: RemitenteService,
    private adminService: AdminService,
    private radicadoService: RadicadoService,
    private geoService: GeoService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this._buildForms();

    forkJoin({
      recepcion:    this.recepcionService.obtener(id).pipe(catchError(() => of(null))),
      metadatos:    this.remitenteService.obtenerMetadatos(id).pipe(catchError(() => of(null))),
      tipos:        this.adminService.getTipos().pipe(catchError(() => of([]))),
      plazos:       this.adminService.getPlazos().pipe(catchError(() => of([]))),
      deps:         this.adminService.getDependencias(true).pipe(catchError(() => of([]))),
      radicado:     this.radicadoService.obtenerPorRecepcion(id).pipe(catchError(() => of(null))),
      departamentos: this.geoService.getDepartamentos().pipe(catchError(() => of([]))),
    }).subscribe(({ recepcion, metadatos, tipos, plazos, deps, radicado, departamentos }) => {
      if (!recepcion) { this.router.navigate(['/recepcion']); return; }
      this.recepcion          = recepcion;
      this.metadatos          = metadatos;
      this.tiposRequerimiento = tipos as TipoReqOut[];
      this.plazosRespuesta    = plazos as PlazoRespuestaResumen[];
      this.dependencias       = deps;
      this.radicado           = radicado;
      this.departamentos      = departamentos as DepartamentoOut[];
      this.cargando           = false;
      this.cdr.markForCheck();
    });
  }

  private _buildForms(): void {
    this.busquedaCtrl = this.fb.control('');

    this.busquedaCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((q: string) => {
      if (q && q.length >= 2) {
        this.remitenteService.buscar(q).subscribe(r => { this.remitentesEncontrados = r; });
      } else {
        this.remitentesEncontrados = [];
      }
    });

    this.formRemitente = this.fb.group({
      tipo_persona:          ['natural', Validators.required],
      nombres:               [''],
      apellidos:             [''],
      razon_social:          [''],
      nit:                   [''],
      digito_verificacion:   [''],
      tipo_identificacion:   ['CC', Validators.required],
      numero_identificacion: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
      email:                 ['', Validators.email],
      telefono:              ['', Validators.pattern(/^[0-9+\s()\-]{7,20}$/)],
      direccion:             [''],
      departamento:          [''],
      municipio:             [''],
    });

    // Actualizar validadores de nombre/razón social según tipo persona
    this.formRemitente.get('tipo_persona')!.valueChanges.subscribe((tipo: string) => {
      const nombres     = this.formRemitente.get('nombres')!;
      const razonSocial = this.formRemitente.get('razon_social')!;
      const numId       = this.formRemitente.get('numero_identificacion')!;
      const tipoId      = this.formRemitente.get('tipo_identificacion')!;
      if (tipo === 'juridico') {
        nombres.clearValidators();
        razonSocial.setValidators(Validators.required);
        tipoId.setValue('NIT', { emitEvent: false });
        numId.setValidators([Validators.required, Validators.pattern(/^\d{7,15}$/)]);
      } else {
        nombres.setValidators(Validators.required);
        razonSocial.clearValidators();
        tipoId.setValue('CC', { emitEvent: false });
        numId.setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(20)]);
      }
      nombres.updateValueAndValidity({ emitEvent: false });
      razonSocial.updateValueAndValidity({ emitEvent: false });
      numId.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });

    // Ajustar validador según tipo identificación
    this.formRemitente.get('tipo_identificacion')!.valueChanges.subscribe((tipo: string) => {
      const numId  = this.formRemitente.get('numero_identificacion')!;
      const dvCtrl = this.formRemitente.get('digito_verificacion')!;
      if (tipo === 'CC') {
        numId.setValidators([Validators.required, Validators.pattern(/^\d{5,10}$/)]);
        dvCtrl.clearValidators(); dvCtrl.setValue('', { emitEvent: false });
      } else if (tipo === 'NIT') {
        numId.setValidators([Validators.required, Validators.pattern(/^\d{7,15}$/)]);
        dvCtrl.setValidators([Validators.required, Validators.pattern(/^\d$/)]);
      } else if (tipo === 'CE') {
        numId.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,15}$/)]);
        dvCtrl.clearValidators(); dvCtrl.setValue('', { emitEvent: false });
      } else {
        numId.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(20)]);
        dvCtrl.clearValidators(); dvCtrl.setValue('', { emitEvent: false });
      }
      numId.updateValueAndValidity({ emitEvent: false });
      dvCtrl.updateValueAndValidity({ emitEvent: false });
    });

    this.formRadicado = this.fb.group({
      dependencia_id: [null, Validators.required],
      observaciones:  [''],
    });

    this.formMetadatos = this.fb.group({
      asunto:                ['', Validators.required],
      tipo_soporte:          ['fisico', Validators.required],
      numero_anexos:         [0],
      tipo_requerimiento_id: [null, Validators.required],
      plazo_respuesta_id:    [null, Validators.required],
      observaciones:         [''],
      numero_referencia:     [''],
      fecha_documento:       [''],
    });

    this.formMetadatos.disable();

    // Auto-fill plazo al seleccionar tipo de requerimiento
    this.formMetadatos.get('tipo_requerimiento_id')!.valueChanges.subscribe((id: number | null) => {
      const plazoCtrl = this.formMetadatos.get('plazo_respuesta_id')!;
      const tipo = this.tiposRequerimiento.find(t => t.id === id);
      if (tipo?.plazo_respuesta_id) {
        plazoCtrl.setValue(tipo.plazo_respuesta_id, { emitEvent: false });
        plazoCtrl.disable({ emitEvent: false });
      } else {
        plazoCtrl.enable({ emitEvent: false });
      }
    });
  }

  // ── Helpers teclado ────────────────────────────────────────────────────────
  soloLetras(event: KeyboardEvent): boolean {
    const char = event.key;
    return /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-'.]$/.test(char);
  }

  soloNumerosTel(event: KeyboardEvent): boolean {
    return /^[0-9+\s()\-]$/.test(event.key);
  }

  // ── Estado ─────────────────────────────────────────────────────────────────
  readonly ESTADOS_REQUIEREN_OBS = new Set(['incompleto', 'no_competente']);
  estadoPendiente: string | null = null;
  obsEstadoPendiente = '';

  iniciarCambioEstado(estado: string): void {
    if (this.recepcion?.estado === estado) return;
    if (this.ESTADOS_REQUIEREN_OBS.has(estado)) {
      this.estadoPendiente = estado;
      this.obsEstadoPendiente = '';
    } else {
      this._ejecutarCambioEstado(estado, '');
    }
  }

  confirmarCambioEstado(): void {
    if (!this.estadoPendiente || !this.obsEstadoPendiente.trim()) return;
    this._ejecutarCambioEstado(this.estadoPendiente, this.obsEstadoPendiente.trim());
  }

  cancelarCambioEstado(): void {
    this.estadoPendiente = null;
    this.obsEstadoPendiente = '';
  }

  private _ejecutarCambioEstado(estado: string, observaciones: string): void {
    if (!this.recepcion) return;
    const payload: any = { estado };
    if (observaciones) payload.observaciones = observaciones;
    this.recepcionService.actualizar(this.recepcion.id, payload).subscribe(r => {
      this.recepcion = r;
      this.estadoPendiente = null;
      this.obsEstadoPendiente = '';
      this.cdr.markForCheck();
    });
  }

  get esIncompetente(): boolean {
    return this.recepcion?.estado === 'no_competente';
  }

  get esCompetente(): boolean {
    return this.recepcion?.estado === 'competente';
  }

  get esCanaleEmail(): boolean {
    return this.recepcion?.canal?.tipo === 'email';
  }

  // ── Adjuntos ───────────────────────────────────────────────────────────────
  descargarAdjuntoDirecto(adj: AdjuntoOut): void {
    if (!this.recepcion) return;
    this.recepcionService.descargarAdjunto(this.recepcion.id, adj.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = adj.nombre_original;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  verAdjunto(adj: AdjuntoOut): void {
    if (!this.recepcion) return;
    this.recepcionService.descargarAdjunto(this.recepcion.id, adj.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    });
  }

  subirAdjunto(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.recepcion) return;
    const archivo = input.files[0];
    this.recepcionService.subirAdjunto(this.recepcion.id, archivo).subscribe(adjunto => {
      this.recepcion!.adjuntos.push(adjunto);
      this.cdr.markForCheck();
    });
  }

  formatoTamano(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ── Geo ────────────────────────────────────────────────────────────────────
  onDepartamentoChange(nombre: string): void {
    this.municipiosFiltrados = [];
    this.formRemitente.get('municipio')?.setValue('');
    if (!nombre) return;
    this.geoService.getMunicipiosPorNombreDep(nombre).subscribe(ms => {
      this.municipiosFiltrados = ms;
      this.cdr.markForCheck();
    });
  }

  cargarMunicipiosDeDepartamento(nombre: string): void {
    if (!nombre) return;
    this.geoService.getMunicipiosPorNombreDep(nombre).subscribe(ms => {
      this.municipiosFiltrados = ms;
      this.cdr.markForCheck();
    });
  }

  // ── Bitácora ───────────────────────────────────────────────────────────────
  cargarBitacora(): void {
    if (!this.recepcion || this.bitacora.length > 0) return;
    this.cargandoBitacora = true;
    this.recepcionService.getBitacora(this.recepcion.id).subscribe({
      next: eventos => {
        this.bitacora = eventos;
        this.cargandoBitacora = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoBitacora = false; this.cdr.markForCheck(); }
    });
  }

  private readonly _etiquetas: Record<string, string> = {
    crear_recepcion:    'Recepción creada',
    cambio_estado_recepcion: 'Cambio de estado',
    subir_adjunto:      'Adjunto subido',
    eliminar_adjunto:   'Adjunto eliminado',
    registrar_metadatos: 'Metadatos registrados',
    editar_metadatos:   'Metadatos actualizados',
    generar_radicado:   'Radicado generado',
  };

  private readonly _iconos: Record<string, string> = {
    crear_recepcion:    'inbox',
    cambio_estado_recepcion: 'swap_horiz',
    subir_adjunto:      'attach_file',
    eliminar_adjunto:   'delete',
    registrar_metadatos: 'description',
    editar_metadatos:   'edit',
    generar_radicado:   'assignment_turned_in',
  };

  private readonly _clases: Record<string, string> = {
    crear_recepcion:    'acc-verde',
    cambio_estado_recepcion: 'acc-azul',
    subir_adjunto:      'acc-naranja',
    eliminar_adjunto:   'acc-rojo',
    registrar_metadatos: 'acc-teal',
    editar_metadatos:   'acc-teal',
    generar_radicado:   'acc-morado',
  };

  etiquetaAccion(accion: string): string {
    return this._etiquetas[accion] ?? accion;
  }

  iconoAccion(accion: string): string {
    return this._iconos[accion] ?? 'circle';
  }

  claseAccion(accion: string): string {
    return this._clases[accion] ?? 'acc-gris';
  }

  // ── Remitente ──────────────────────────────────────────────────────────────
  seleccionarRemitente(r: RemitenteResumen): void {
    this.remitenteSeleccionado = r;
    this.remitenteCompleto = undefined;
    this.remitentesEncontrados = [];
    this.busquedaCtrl.setValue(r.nombre_completo, { emitEvent: false });
    this.modoFormRemitente = 'ninguno';
    this.formMetadatos.enable();
    this.remitenteService.obtener(r.id).subscribe(full => {
      this.remitenteCompleto = full;
      this.cdr.markForCheck();
    });
  }

  limpiarRemitente(): void {
    this.remitenteSeleccionado = undefined;
    this.remitenteCompleto = undefined;
    this.busquedaCtrl.setValue('', { emitEvent: false });
    this.remitentesEncontrados = [];
    this.formMetadatos.disable();
  }

  iniciarNuevoRemitente(): void {
    this.modoFormRemitente = 'nuevo';
    this.remitenteSeleccionado = undefined;
    this.remitenteCompleto = undefined;
    this.duplicadosAviso = [];
    this.municipiosFiltrados = [];
    this.formMetadatos.disable();
    this.formRemitente.reset({ tipo_persona: 'natural', tipo_identificacion: 'CC', numero_anexos: 0 });
    if (this.recepcion?.email_remitente) {
      this.formRemitente.patchValue({ email: this.recepcion.email_remitente });
    }
  }

  verificarDuplicados(): void {
    const { numero_identificacion, email } = this.formRemitente.value;
    if (!numero_identificacion && !email) return;
    this.remitenteService.verificarDuplicados(numero_identificacion, email).subscribe(dupes => {
      this.duplicadosAviso = dupes;
      this.cdr.markForCheck();
    });
  }

  guardarRemitente(): void {
    this.formRemitente.markAllAsTouched();
    if (this.formRemitente.invalid) return;
    if (this.duplicadosAviso.length > 0) return;
    this.guardandoRemitente = true;
    this.remitenteService.crear(this.formRemitente.value).subscribe({
      next: r => {
        this.remitenteSeleccionado = r;
        this.remitenteCompleto = r;
        this.modoFormRemitente = 'ninguno';
        this.guardandoRemitente = false;
        this.duplicadosAviso = [];
        this.formMetadatos.enable();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoRemitente = false;
        if (err.status === 409) {
          this.verificarDuplicados();
        }
        this.cdr.markForCheck();
      }
    });
  }

  puedeEditarRemitente(): boolean {
    return this.auth.tieneRol('administrador', 'operador');
  }

  irAEditarRemitente(): void {
    if (this.remitenteSeleccionado) {
      this.router.navigate(['/remitentes', this.remitenteSeleccionado.id, 'editar']);
    }
  }

  guardarMetadatos(): void {
    this.formMetadatos.markAllAsTouched();
    if (this.formMetadatos.invalid || !this.remitenteSeleccionado || !this.recepcion) return;
    this.guardandoMetadatos = true;

    const raw = this.formMetadatos.getRawValue();
    const payload = {
      remitente_id:          this.remitenteSeleccionado.id,
      asunto:                raw.asunto,
      tipo_soporte:          raw.tipo_soporte,
      numero_anexos:         Number(raw.numero_anexos) || 0,
      tipo_requerimiento_id: raw.tipo_requerimiento_id || null,
      plazo_respuesta_id:    raw.plazo_respuesta_id    || null,
      observaciones:         raw.observaciones         || null,
      numero_referencia:     raw.numero_referencia     || null,
      fecha_documento:       raw.fecha_documento       || null,
    };

    this.remitenteService.guardarMetadatos(this.recepcion.id, payload).subscribe({
      next: m => {
        this.metadatos = m;
        this.guardandoMetadatos = false;
        this.exito = true;
        this.cdr.markForCheck();
        setTimeout(() => { this.exito = false; this.cdr.markForCheck(); }, 3000);
      },
      error: () => { this.guardandoMetadatos = false; this.cdr.markForCheck(); }
    });
  }

  get completitudMetadatos(): { completo: boolean; faltantes: string[] } {
    const v = this.formMetadatos.value;
    const faltantes: string[] = [];
    if (!v.asunto?.trim())           faltantes.push('Asunto');
    if (!v.tipo_soporte)             faltantes.push('Tipo de soporte');
    if (!v.tipo_requerimiento_id)    faltantes.push('Tipo de requerimiento');
    if (!v.plazo_respuesta_id)       faltantes.push('Plazo de respuesta');
    if (!this.remitenteSeleccionado) faltantes.push('Remitente');
    return { completo: faltantes.length === 0, faltantes };
  }

  // ── Radicado ───────────────────────────────────────────────────────────────
  radicar(): void {
    if (this.formRadicado.invalid || !this.recepcion) return;
    this.radicando = true;

    const payload = {
      recepcion_id:   this.recepcion.id,
      dependencia_id: this.formRadicado.value.dependencia_id,
      observaciones:  this.formRadicado.value.observaciones || undefined,
    };

    this.radicadoService.crear(payload).subscribe({
      next: r => {
        this.radicado = r;
        this.radicando = false;
        this.exitoRadicado = true;
        this.cdr.markForCheck();
      },
      error: () => { this.radicando = false; this.cdr.markForCheck(); }
    });
  }

  descargarConstancia(): void {
    if (!this.radicado) return;
    this.radicadoService.descargarConstancia(this.radicado.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `constancia-${this.radicado!.numero_radicado}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  editarMetadatos(): void {
    if (!this.metadatos) return;
    const rem = this.metadatos.remitente as any;
    this.remitenteSeleccionado = rem;
    this.remitenteCompleto = undefined;
    this.busquedaCtrl.setValue(rem.nombre_completo, { emitEvent: false });
    this.remitenteService.obtener(rem.id).subscribe(full => {
      this.remitenteCompleto = full;
      this.cdr.markForCheck();
    });
    if (rem.departamento) {
      this.cargarMunicipiosDeDepartamento(rem.departamento);
    }
    this.formMetadatos.enable();
    this.formMetadatos.patchValue({
      asunto:                this.metadatos.asunto,
      tipo_soporte:          this.metadatos.tipo_soporte,
      numero_anexos:         this.metadatos.numero_anexos,
      tipo_requerimiento_id: this.metadatos.tipo_requerimiento?.id ?? null,
      plazo_respuesta_id:    this.metadatos.plazo_respuesta?.id ?? null,
      observaciones:         this.metadatos.observaciones ?? '',
      numero_referencia:     this.metadatos.numero_referencia ?? '',
      fecha_documento:       this.metadatos.fecha_documento ? this.metadatos.fecha_documento.slice(0, 10) : '',
    });
    this.metadatos = null;
  }
}
