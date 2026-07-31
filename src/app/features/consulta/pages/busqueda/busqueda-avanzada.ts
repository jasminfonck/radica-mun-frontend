import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import {
  ConsultaService, ResultadoBusqueda, FiltrosBusqueda, FormatoExportacion,
  ResultadoRecepcion, FiltrosRecepciones,
} from '../../../../core/services/consulta.service';
import { AdminService, DependenciaOut, CanalOut, TipoReqOut } from '../../../../core/services/admin.service';
import { ESTADOS_RECEPCION_FILTRO } from '../../../../core/services/recepcion.service';

@Component({
  selector: 'app-busqueda-avanzada',
  templateUrl: './busqueda-avanzada.html',
  styleUrls: ['./busqueda-avanzada.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusquedaAvanzadaComponent implements OnInit {
  resultados: ResultadoBusqueda[] = [];
  dependencias: DependenciaOut[] = [];
  canales: CanalOut[] = [];
  tiposRequerimiento: TipoReqOut[] = [];
  buscando  = false;
  buscado   = false;
  exportando = false;

  total = 0;
  pageIndex = 0;
  readonly pageSize = 20;

  filtros!: FormGroup;
  columnas = ['numero_radicado', 'asunto', 'remitente', 'canal', 'dependencia', 'fecha_radicacion', 'estado', 'acciones'];

  readonly ESTADOS = [
    { value: '',         label: 'Todos' },
    { value: 'radicado', label: 'Radicado' },
    { value: 'anulado',  label: 'Anulado' },
  ];

  readonly TIPOS_SOPORTE = [
    { value: '',        label: 'Todos' },
    { value: 'fisico',  label: 'Físico' },
    { value: 'digital', label: 'Digital' },
    { value: 'mixto',   label: 'Mixto' },
  ];

  readonly TIPOS_PERSONA = [
    { value: '',         label: 'Todos' },
    { value: 'natural',  label: 'Persona natural' },
    { value: 'juridico', label: 'Persona jurídica' },
  ];

  // ── Recepciones ──────────────────────────────────────────────────────────
  readonly ESTADOS_RECEPCION = ESTADOS_RECEPCION_FILTRO;
  filtrosRecepciones!: FormGroup;
  resultadosRecepciones: ResultadoRecepcion[] = [];
  buscandoRecepciones = false;
  buscadoRecepciones  = false;
  totalRecepciones = 0;
  pageIndexRecepciones = 0;
  columnasRecepciones = ['numero_seguimiento', 'asunto', 'remitente', 'canal', 'fecha_creacion', 'estado', 'acciones'];

  constructor(
    private fb: FormBuilder,
    private consulta: ConsultaService,
    private admin: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      q:               [''],
      numero_radicado: [''],
      canal_id:        [null],
      dependencia_id:  [null],
      estado_radicado: [''],
      fecha_desde:     [''],
      fecha_hasta:     [''],
      tipo_requerimiento_id: [null],
      tipo_soporte:          [''],
      tipo_persona:          [''],
    });
    this.admin.getDependencias(false).subscribe(d => { this.dependencias = d; this.cdr.markForCheck(); });
    this.admin.getCanales().subscribe(c => { this.canales = c.filter(x => x.activo); this.cdr.markForCheck(); });
    this.admin.getTipos(true).subscribe(t => { this.tiposRequerimiento = t; this.cdr.markForCheck(); });

    this.filtrosRecepciones = this.fb.group({
      q:           [''],
      canal_id:    [null],
      estado:      [''],
      fecha_desde: [''],
      fecha_hasta: [''],
    });
  }

  private buildFiltros(): FiltrosBusqueda {
    const f = this.filtros.value;
    const filtros: FiltrosBusqueda = {};
    if (f.q)               filtros.q               = f.q;
    if (f.numero_radicado) filtros.numero_radicado  = f.numero_radicado;
    if (f.canal_id)        filtros.canal_id         = f.canal_id;
    if (f.dependencia_id)  filtros.dependencia_id   = f.dependencia_id;
    if (f.estado_radicado) filtros.estado_radicado  = f.estado_radicado;
    if (f.fecha_desde)     filtros.fecha_desde      = f.fecha_desde;
    if (f.fecha_hasta)     filtros.fecha_hasta      = f.fecha_hasta;
    if (f.tipo_requerimiento_id) filtros.tipo_requerimiento_id = f.tipo_requerimiento_id;
    if (f.tipo_soporte)          filtros.tipo_soporte          = f.tipo_soporte;
    if (f.tipo_persona)          filtros.tipo_persona          = f.tipo_persona;
    return filtros;
  }

  buscar(): void {
    this.pageIndex = 0;
    this._buscarPagina();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this._buscarPagina();
  }

  private _buscarPagina(): void {
    this.buscando = true;
    this.buscado  = false;
    const filtros = { ...this.buildFiltros(), page: this.pageIndex + 1, page_size: this.pageSize };
    this.consulta.buscar(filtros).subscribe({
      next: r => {
        this.resultados = r.items;
        this.total = r.total;
        this.buscando = false;
        this.buscado = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscando = false;
        this.buscado = true;
        this.cdr.markForCheck();
      },
    });
  }

  exportar(formato: FormatoExportacion): void {
    this.consulta.exportar(this.buildFiltros(), formato);
  }

  limpiar(): void {
    this.filtros.reset({ estado_radicado: '', tipo_soporte: '', tipo_persona: '' });
    this.resultados = [];
    this.total = 0;
    this.pageIndex = 0;
    this.buscado = false;
  }

  // ── Recepciones ──────────────────────────────────────────────────────────
  private _buildFiltrosRecepciones(): FiltrosRecepciones {
    const f = this.filtrosRecepciones.value;
    const filtros: FiltrosRecepciones = {};
    if (f.q)            filtros.q           = f.q;
    if (f.canal_id)     filtros.canal_id    = f.canal_id;
    if (f.estado)       filtros.estado      = f.estado;
    if (f.fecha_desde)  filtros.fecha_desde = f.fecha_desde;
    if (f.fecha_hasta)  filtros.fecha_hasta = f.fecha_hasta;
    return filtros;
  }

  buscarRecepciones(): void {
    this.pageIndexRecepciones = 0;
    this._buscarPaginaRecepciones();
  }

  onPageChangeRecepciones(event: PageEvent): void {
    this.pageIndexRecepciones = event.pageIndex;
    this._buscarPaginaRecepciones();
  }

  private _buscarPaginaRecepciones(): void {
    this.buscandoRecepciones = true;
    this.buscadoRecepciones  = false;
    const filtros = { ...this._buildFiltrosRecepciones(), page: this.pageIndexRecepciones + 1, page_size: this.pageSize };
    this.consulta.buscarRecepciones(filtros).subscribe({
      next: r => {
        this.resultadosRecepciones = r.items;
        this.totalRecepciones = r.total;
        this.buscandoRecepciones = false;
        this.buscadoRecepciones  = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscandoRecepciones = false;
        this.buscadoRecepciones  = true;
        this.cdr.markForCheck();
      },
    });
  }

  exportarRecepciones(formato: FormatoExportacion): void {
    this.consulta.exportarRecepciones(this._buildFiltrosRecepciones(), formato);
  }

  limpiarRecepciones(): void {
    this.filtrosRecepciones.reset({ estado: '' });
    this.resultadosRecepciones = [];
    this.totalRecepciones = 0;
    this.pageIndexRecepciones = 0;
    this.buscadoRecepciones = false;
  }
}
