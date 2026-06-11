import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminService, DependenciaOut, CanalOut } from '../../../../core/services/admin.service';
import { ConsultaService, ResultadoBusqueda, FiltrosBusqueda } from '../../../../core/services/consulta.service';

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

  porDependencia: ResumenItem[] = [];
  porCanal:       ResumenItem[] = [];

  readonly columnas = ['numero_radicado', 'fecha_radicacion', 'remitente', 'asunto', 'canal', 'dependencia', 'estado'];

  readonly ESTADOS = [
    { value: '',        label: 'Todos los estados' },
    { value: 'vigente', label: 'Vigente'            },
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

  generar(): void {
    this.generando = true;
    const v = this.filtros.value;
    const filtros: FiltrosBusqueda = {};
    if (v.fecha_desde)     filtros.fecha_desde     = v.fecha_desde;
    if (v.fecha_hasta)     filtros.fecha_hasta     = v.fecha_hasta;
    if (v.dependencia_id)  filtros.dependencia_id  = v.dependencia_id;
    if (v.canal_id)        filtros.canal_id        = v.canal_id;
    if (v.estado_radicado) filtros.estado_radicado = v.estado_radicado;

    this.consulta.buscar(filtros).subscribe({
      next: r => {
        this.resultados = r;
        this._calcularResumen();
        this.generando = false;
        this.generado  = true;
        this.cdr.markForCheck();
      },
      error: () => { this.generando = false; this.cdr.markForCheck(); },
    });
  }

  exportar(): void {
    const v = this.filtros.value;
    const filtros: FiltrosBusqueda = {};
    if (v.fecha_desde)     filtros.fecha_desde     = v.fecha_desde;
    if (v.fecha_hasta)     filtros.fecha_hasta     = v.fecha_hasta;
    if (v.dependencia_id)  filtros.dependencia_id  = v.dependencia_id;
    if (v.canal_id)        filtros.canal_id        = v.canal_id;
    if (v.estado_radicado) filtros.estado_radicado = v.estado_radicado;
    this.consulta.exportarCsv(filtros);
  }

  imprimir(): void {
    window.print();
  }

  limpiar(): void {
    this.filtros.reset({ fecha_desde: '', fecha_hasta: '', dependencia_id: null, canal_id: null, estado_radicado: '' });
    this.resultados    = [];
    this.generado      = false;
    this.porDependencia = [];
    this.porCanal       = [];
    this.cdr.markForCheck();
  }

  maxTotal(items: ResumenItem[]): number {
    return Math.max(...items.map(i => i.total), 1);
  }

  barWidth(total: number, max: number): string {
    return `${Math.round((total / max) * 100)}%`;
  }

  private _calcularResumen(): void {
    const agrupar = (key: keyof ResultadoBusqueda): ResumenItem[] => {
      const map = new Map<string, number>();
      for (const r of this.resultados) {
        const k = String(r[key] || '—');
        map.set(k, (map.get(k) || 0) + 1);
      }
      return Array.from(map.entries())
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total);
    };
    this.porCanal       = agrupar('canal');
    this.porDependencia = agrupar('dependencia');
  }
}
