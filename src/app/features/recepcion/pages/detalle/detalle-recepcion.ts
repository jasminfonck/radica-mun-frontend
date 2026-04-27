import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RecepcionService, RecepcionOut, ESTADOS_RECEPCION } from '../../../../core/services/recepcion.service';
import {
  RemitenteService, RemitenteResumen, MetadatosOut,
  TipoRequerimientoResumen, PlazoRespuestaResumen,
} from '../../../../core/services/remitente.service';
import { AdminService, DependenciaOut } from '../../../../core/services/admin.service';
import { RadicadoService, RadicadoOut } from '../../../../core/services/radicado.service';

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
  modoFormRemitente: 'ninguno' | 'nuevo' | 'edicion' = 'ninguno';
  guardandoRemitente = false;
  guardandoMetadatos = false;
  exito = false;

  tiposRequerimiento: TipoRequerimientoResumen[] = [];
  plazosRespuesta:    PlazoRespuestaResumen[]    = [];

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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this._buildForms();

    forkJoin({
      recepcion: this.recepcionService.obtener(id).pipe(catchError(() => of(null))),
      metadatos: this.remitenteService.obtenerMetadatos(id).pipe(catchError(() => of(null))),
      tipos:     this.adminService.getTipos().pipe(catchError(() => of([]))),
      plazos:    this.adminService.getPlazos().pipe(catchError(() => of([]))),
      deps:      this.adminService.getDependencias(true).pipe(catchError(() => of([]))),
      radicado:  this.radicadoService.obtenerPorRecepcion(id).pipe(catchError(() => of(null))),
    }).subscribe(({ recepcion, metadatos, tipos, plazos, deps, radicado }) => {
      if (!recepcion) { this.router.navigate(['/recepcion']); return; }
      this.recepcion          = recepcion;
      this.metadatos          = metadatos;
      this.tiposRequerimiento = tipos as any;
      this.plazosRespuesta    = plazos as any;
      this.dependencias       = deps;
      this.radicado           = radicado;
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
      tipo_identificacion:   ['CC'],
      numero_identificacion: [''],
      email:                 ['', Validators.email],
      telefono:              ['', Validators.pattern(/^[0-9+\s()\-]{7,20}$/)],
      direccion:             [''],
      municipio:             [''],
    });

    this.formRadicado = this.fb.group({
      dependencia_id: [null, Validators.required],
      observaciones:  [''],
    });

    this.formMetadatos = this.fb.group({
      asunto:                ['', Validators.required],
      tipo_soporte:          ['fisico', Validators.required],
      numero_anexos:         [0],
      tipo_requerimiento_id: [null],
      plazo_respuesta_id:    [null],
      observaciones:         [''],
      numero_referencia:     [''],
      fecha_documento:       [''],
    });

    this.formMetadatos.disable();
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
  cambiarEstado(estado: string): void {
    if (!this.recepcion) return;
    this.recepcionService.actualizar(this.recepcion.id, { estado } as any).subscribe(r => {
      this.recepcion = r;
      this.cdr.markForCheck();
    });
  }

  // ── Adjuntos ───────────────────────────────────────────────────────────────
  eliminarAdjunto(adjuntoId: number): void {
    if (!this.recepcion) return;
    this.recepcionService.eliminarAdjunto(this.recepcion.id, adjuntoId).subscribe(() => {
      this.recepcion!.adjuntos = this.recepcion!.adjuntos.filter(a => a.id !== adjuntoId);
      this.cdr.markForCheck();
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

  // ── Remitente ──────────────────────────────────────────────────────────────
  seleccionarRemitente(r: RemitenteResumen): void {
    this.remitenteSeleccionado = r;
    this.remitentesEncontrados = [];
    this.busquedaCtrl.setValue(r.nombre_completo, { emitEvent: false });
    this.modoFormRemitente = 'ninguno';
    this.formMetadatos.enable();
  }

  limpiarRemitente(): void {
    this.remitenteSeleccionado = undefined;
    this.busquedaCtrl.setValue('', { emitEvent: false });
    this.remitentesEncontrados = [];
    this.formMetadatos.disable();
  }

  iniciarNuevoRemitente(): void {
    this.modoFormRemitente = 'nuevo';
    this.remitenteSeleccionado = undefined;
    this.duplicadosAviso = [];
    this.formMetadatos.disable();
    this.formRemitente.reset({ tipo_persona: 'natural', tipo_identificacion: 'CC', numero_anexos: 0 });
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
    this.guardandoRemitente = true;
    this.remitenteService.crear(this.formRemitente.value).subscribe({
      next: r => {
        this.remitenteSeleccionado = r;
        this.modoFormRemitente = 'ninguno';
        this.guardandoRemitente = false;
        this.duplicadosAviso = [];
        this.formMetadatos.enable();
        this.cdr.markForCheck();
      },
      error: () => { this.guardandoRemitente = false; this.cdr.markForCheck(); }
    });
  }

  guardarMetadatos(): void {
    this.formMetadatos.markAllAsTouched();
    if (this.formMetadatos.invalid || !this.remitenteSeleccionado || !this.recepcion) return;
    this.guardandoMetadatos = true;

    const raw = this.formMetadatos.value;
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
    this.remitenteSeleccionado = this.metadatos.remitente;
    this.busquedaCtrl.setValue(this.metadatos.remitente.nombre_completo, { emitEvent: false });
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
