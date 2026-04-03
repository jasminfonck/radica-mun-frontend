import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  standalone: false
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
  busquedaCtrl!: import('@angular/forms').FormControl;

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
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.recepcionService.obtener(id).subscribe({
      next: r  => { this.recepcion = r; this.cargando = false; },
      error: () => this.router.navigate(['/recepcion'])
    });

    this.remitenteService.obtenerMetadatos(id).subscribe(m => { this.metadatos = m; });

    this.adminService.getTipos().subscribe(t => { this.tiposRequerimiento = t as any; });
    this.adminService.getPlazos().subscribe(p => { this.plazosRespuesta = p as any; });
    this.adminService.getDependencias(true).subscribe(d => { this.dependencias = d; });
    this.radicadoService.obtenerPorRecepcion(id).subscribe(r => { this.radicado = r; });

    this._buildForms();
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
      email:                 [''],
      telefono:              [''],
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
  }

  // ── Estado ─────────────────────────────────────────────────────────────────
  cambiarEstado(estado: string): void {
    if (!this.recepcion) return;
    this.recepcionService.actualizar(this.recepcion.id, { estado } as any).subscribe(r => {
      this.recepcion = r;
    });
  }

  // ── Adjuntos ───────────────────────────────────────────────────────────────
  eliminarAdjunto(adjuntoId: number): void {
    if (!this.recepcion) return;
    this.recepcionService.eliminarAdjunto(this.recepcion.id, adjuntoId).subscribe(() => {
      this.recepcion!.adjuntos = this.recepcion!.adjuntos.filter(a => a.id !== adjuntoId);
    });
  }

  subirAdjunto(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.recepcion) return;
    const archivo = input.files[0];
    this.recepcionService.subirAdjunto(this.recepcion.id, archivo).subscribe(adjunto => {
      this.recepcion!.adjuntos.push(adjunto);
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
  }

  iniciarNuevoRemitente(): void {
    this.modoFormRemitente = 'nuevo';
    this.remitenteSeleccionado = undefined;
    this.duplicadosAviso = [];
    this.formRemitente.reset({ tipo_persona: 'natural', tipo_identificacion: 'CC', numero_anexos: 0 });
  }

  verificarDuplicados(): void {
    const { numero_identificacion, email } = this.formRemitente.value;
    if (!numero_identificacion && !email) return;
    this.remitenteService.verificarDuplicados(numero_identificacion, email).subscribe(dupes => {
      this.duplicadosAviso = dupes;
    });
  }

  guardarRemitente(): void {
    if (this.formRemitente.invalid) return;
    this.guardandoRemitente = true;
    this.remitenteService.crear(this.formRemitente.value).subscribe({
      next: r => {
        this.remitenteSeleccionado = r;
        this.modoFormRemitente = 'ninguno';
        this.guardandoRemitente = false;
        this.duplicadosAviso = [];
      },
      error: () => { this.guardandoRemitente = false; }
    });
  }

  guardarMetadatos(): void {
    if (this.formMetadatos.invalid || !this.remitenteSeleccionado || !this.recepcion) return;
    this.guardandoMetadatos = true;

    const payload = {
      ...this.formMetadatos.value,
      remitente_id: this.remitenteSeleccionado.id,
    };

    this.remitenteService.guardarMetadatos(this.recepcion.id, payload).subscribe({
      next: m => {
        this.metadatos = m;
        this.guardandoMetadatos = false;
        this.exito = true;
        setTimeout(() => { this.exito = false; }, 3000);
      },
      error: () => { this.guardandoMetadatos = false; }
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
      },
      error: () => { this.radicando = false; }
    });
  }

  urlConstancia(): string {
    return this.radicado ? this.radicadoService.urlDescargaConstancia(this.radicado.id) : '';
  }

  editarMetadatos(): void {
    if (!this.metadatos) return;
    this.remitenteSeleccionado = this.metadatos.remitente;
    this.busquedaCtrl.setValue(this.metadatos.remitente.nombre_completo, { emitEvent: false });
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
