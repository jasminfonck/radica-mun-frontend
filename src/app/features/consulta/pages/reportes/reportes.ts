import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { AdminService, DependenciaOut, CanalOut } from '../../../../core/services/admin.service';
import {
  ConsultaService, ResultadoBusqueda, FiltrosBusqueda, FormatoExportacion,
  ItemConteo,
} from '../../../../core/services/consulta.service';

interface ResumenItem { label: string; total: number; }

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesComponent implements OnInit {
  filtros!: FormGroup;
  dependencias: DependenciaOut[] = [];
  canales: CanalOut[] = [];

  resultados: ResultadoBusqueda[] = [];
  generando  = false;
  generado   = false;
  total = 0;
  pageIndex = 0;
  readonly pageSize = 20;

  porDependencia: ResumenItem[] = [];
  porCanal:       ResumenItem[] = [];
  porTipoRequerimiento: ResumenItem[] = [];

  // Remitentes frecuentes — reutiliza los mismos filtros del formulario
  remitentesFrecuentes: ItemConteo[] = [];
  cargandoRemitentes = false;
  generadoRemitentes = false;

  readonly columnas = ['numero_radicado', 'fecha_radicacion', 'remitente', 'asunto', 'canal', 'dependencia', 'estado'];

  readonly ESTADOS = [
    { value: '',        label: 'Todos los estados' },
    { value: 'radicado', label: 'Radicado'           },
    { value: 'anulado', label: 'Anulado'            },
  ];

  constructor(
    private fb: FormBuilder,
    private admin: AdminService,
    private consulta: ConsultaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      fecha_desde:     [''],
      fecha_hasta:     [''],
      dependencia_id:  [null],
      canal_id:        [null],
      estado_radicado: [''],
    });

    this.admin.getDependencias(true).subscribe(d => { this.dependencias = d; this.cdr.markForCheck(); });
    this.admin.getCanales().subscribe(c  => { this.canales = c.filter(x => x.activo); this.cdr.markForCheck(); });
  }

  private _buildFiltros(): FiltrosBusqueda {
    const v = this.filtros.value;
    const filtros: FiltrosBusqueda = {};
    if (v.fecha_desde)     filtros.fecha_desde     = v.fecha_desde;
    if (v.fecha_hasta)     filtros.fecha_hasta     = v.fecha_hasta;
    if (v.dependencia_id)  filtros.dependencia_id  = v.dependencia_id;
    if (v.canal_id)        filtros.canal_id        = v.canal_id;
    if (v.estado_radicado) filtros.estado_radicado = v.estado_radicado;
    return filtros;
  }

  // ── Radicados (tabla paginada + agrupado por canal/dependencia/tipo) ───────
  generar(): void {
    this.pageIndex = 0;
    this._buscarPagina();

    // El agrupado (por canal/dependencia/tipo) se calcula en el backend sobre
    // el total de registros que cumplen los filtros, no sobre una página —
    // no depende de la paginación de la tabla y no queda incompleto aunque
    // haya miles de resultados.
    this.consulta.reporteAgrupado(this._buildFiltros()).subscribe({
      next: r => {
        this.porCanal             = r.por_canal;
        this.porDependencia       = r.por_dependencia;
        this.porTipoRequerimiento = r.por_tipo_requerimiento;
        this.cdr.markForCheck();
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this._buscarPagina();
  }

  private _buscarPagina(): void {
    this.generando = true;
    const filtrosListado = { ...this._buildFiltros(), page: this.pageIndex + 1, page_size: this.pageSize };

    this.consulta.buscar(filtrosListado).subscribe({
      next: r => {
        this.resultados = r.items;
        this.total      = r.total;
        this.generando  = false;
        this.generado   = true;
        this.cdr.markForCheck();
      },
      error: () => { this.generando = false; this.cdr.markForCheck(); },
    });
  }

  exportar(formato: FormatoExportacion): void {
    this.consulta.exportar(this._buildFiltros(), formato);
  }

  imprimir(): void {
    window.print();
  }

  limpiar(): void {
    this.filtros.reset({ fecha_desde: '', fecha_hasta: '', dependencia_id: null, canal_id: null, estado_radicado: '' });
    this.resultados    = [];
    this.generado      = false;
    this.total      = 0;
    this.pageIndex  = 0;
    this.porDependencia = [];
    this.porCanal       = [];
    this.porTipoRequerimiento = [];
    this.remitentesFrecuentes = [];
    this.generadoRemitentes   = false;
    this.cdr.markForCheck();
  }

  maxTotal(items: ResumenItem[]): number {
    return Math.max(...items.map(i => i.total), 1);
  }

  barWidth(total: number, max: number): string {
    return `${Math.round((total / max) * 100)}%`;
  }

  // ── Remitentes frecuentes ───────────────────────────────────────────────────
  generarRemitentesFrecuentes(): void {
    this.cargandoRemitentes = true;
    this.consulta.reporteRemitentesFrecuentes(this._buildFiltros()).subscribe({
      next: items => {
        this.remitentesFrecuentes = items;
        this.cargandoRemitentes   = false;
        this.generadoRemitentes   = true;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoRemitentes = false; this.cdr.markForCheck(); },
    });
  }
}
