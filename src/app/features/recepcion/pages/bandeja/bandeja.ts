import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, OnInit, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import {
  RecepcionService, RecepcionOut, RecepcionFiltros, ESTADOS_RECEPCION,
} from '../../../../core/services/recepcion.service';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-bandeja',
  templateUrl: './bandeja.html',
  styleUrls: ['./bandeja.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandejaComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<RecepcionOut>([]);
  canales: CanalOut[] = [];
  estados = ESTADOS_RECEPCION;
  columnas = ['id', 'canal', 'asunto', 'estado', 'fecha', 'adjuntos', 'acciones'];
  filtrosForm!: FormGroup;
  busquedaCtrl = new FormControl('');
  cargando = true;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private recepcionService: RecepcionService,
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      canal_id:    [null],
      estado:      [null],
      fecha_desde: [null],
      fecha_hasta: [null],
    });

    // Filtro por asunto (cliente)
    this.dataSource.filterPredicate = (rec: RecepcionOut, filtro: string) => {
      const texto = filtro.trim().toLowerCase();
      return (rec.asunto_provisional ?? '').toLowerCase().includes(texto);
    };

    this.busquedaCtrl.valueChanges.subscribe(val => {
      this.dataSource.filter = (val ?? '').trim().toLowerCase();
    });

    forkJoin({
      canales:     this.adminService.getCanales().pipe(catchError(() => of([]))),
      recepciones: this.recepcionService.listar({}).pipe(catchError(() => of([]))),
    }).subscribe(({ canales, recepciones }) => {
      this.canales          = (canales as CanalOut[]).filter(x => x.activo);
      this.dataSource.data  = recepciones as RecepcionOut[];
      this.cargando         = false;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    // Comparador personalizado para columnas anidadas
    this.dataSource.sortingDataAccessor = (item: RecepcionOut, col: string) => {
      switch (col) {
        case 'canal':  return item.canal?.nombre ?? '';
        case 'asunto': return item.asunto_provisional ?? '';
        case 'fecha':  return item.created_at;
        case 'adjuntos': return item.adjuntos?.length ?? 0;
        default: return (item as any)[col] ?? '';
      }
    };
  }

  cargar(): void {
    this.cargando = true;
    const raw = this.filtrosForm.value;
    const filtros: RecepcionFiltros = {};
    if (raw.canal_id)    filtros.canal_id    = raw.canal_id;
    if (raw.estado)      filtros.estado      = raw.estado;
    if (raw.fecha_desde) filtros.fecha_desde = raw.fecha_desde;
    if (raw.fecha_hasta) filtros.fecha_hasta = raw.fecha_hasta;

    this.recepcionService.listar(filtros).subscribe({
      next: r => {
        this.dataSource.data = r;
        this.cargando        = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.busquedaCtrl.setValue('');
    this.cargar();
  }

  verDetalle(id: number): void { this.router.navigate(['/recepcion', id]); }
  nueva(): void               { this.router.navigate(['/recepcion/nueva']); }
}
