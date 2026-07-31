import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { RadicadoService, RadicadoResumen, FiltrosRadicado } from '../../../../core/services/radicado.service';
import { AdminService, DependenciaOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-bandeja-radicados',
  templateUrl: './bandeja-radicados.html',
  styleUrls: ['./bandeja-radicados.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandejaRadicadosComponent implements OnInit {
  radicados: RadicadoResumen[] = [];
  dependencias: DependenciaOut[] = [];
  cargando = true;

  total = 0;
  pageIndex = 0;
  pageSize = 20;

  filtros!: FormGroup;
  columnas = ['numero_radicado', 'recepcion_id', 'dependencia', 'fecha_radicacion', 'estado', 'acciones'];

  readonly ESTADOS = [
    { value: '',         label: 'Todos'    },
    { value: 'radicado', label: 'Radicado' },
    { value: 'anulado',  label: 'Anulado'  },
  ];

  constructor(
    private fb: FormBuilder,
    private radicadoService: RadicadoService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      numero:         [''],
      dependencia_id: [null],
      estado:         [''],
      fecha_desde:    [''],
      fecha_hasta:    [''],
    });

    this.adminService.getDependencias(false).pipe(catchError(() => of([]))).subscribe(dependencias => {
      this.dependencias = dependencias as DependenciaOut[];
      this.cdr.markForCheck();
    });
    this._buscarPagina();
  }

  private _buscarPagina(): void {
    this.cargando = true;
    const f = this.filtros.value;
    const filtros: FiltrosRadicado = { page: this.pageIndex + 1, page_size: this.pageSize };
    if (f.numero)          filtros.numero          = f.numero;
    if (f.dependencia_id) filtros.dependencia_id = f.dependencia_id;
    if (f.estado)         filtros.estado         = f.estado;
    if (f.fecha_desde)    filtros.fecha_desde     = f.fecha_desde;
    if (f.fecha_hasta)    filtros.fecha_hasta     = f.fecha_hasta;

    this.radicadoService.listar(filtros).subscribe({
      next:  r  => { this.radicados = r.items; this.total = r.total; this.cargando = false; this.cdr.markForCheck(); },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
  }

  cargar(): void {
    this.pageIndex = 0;
    this._buscarPagina();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this._buscarPagina();
  }

  limpiar(): void {
    this.filtros.reset({ numero: '', estado: '' });
    this.cargar();
  }
}
