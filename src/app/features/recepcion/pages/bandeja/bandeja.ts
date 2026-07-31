import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  RecepcionService, RecepcionOut, RecepcionFiltros, ESTADOS_RECEPCION_FILTRO,
} from '../../../../core/services/recepcion.service';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-bandeja',
  templateUrl: './bandeja.html',
  styleUrls: ['./bandeja.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandejaComponent implements OnInit {
  recepciones: RecepcionOut[] = [];
  canales: CanalOut[] = [];
  estados = ESTADOS_RECEPCION_FILTRO;
  columnas = ['id', 'canal', 'asunto', 'estado', 'fecha', 'adjuntos', 'acciones'];
  filtrosForm!: FormGroup;
  cargando = true;

  total = 0;
  pageIndex = 0;
  pageSize = 20;

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
      texto:       [''],
    });

    this.adminService.getCanales().pipe(catchError(() => of([]))).subscribe(canales => {
      this.canales = (canales as CanalOut[]).filter(x => x.activo);
      this.cdr.markForCheck();
    });
    this._buscarPagina();
  }

  private _buscarPagina(): void {
    this.cargando = true;
    const raw = this.filtrosForm.value;
    const filtros: RecepcionFiltros = { page: this.pageIndex + 1, page_size: this.pageSize };
    if (raw.canal_id)    filtros.canal_id    = raw.canal_id;
    if (raw.estado)      filtros.estado      = raw.estado;
    if (raw.fecha_desde) filtros.fecha_desde = raw.fecha_desde;
    if (raw.fecha_hasta) filtros.fecha_hasta = raw.fecha_hasta;
    if (raw.texto)       filtros.texto       = raw.texto;

    this.recepcionService.listar(filtros).subscribe({
      next: r => {
        this.recepciones = r.items;
        this.total        = r.total;
        this.cargando      = false;
        this.cdr.markForCheck();
      },
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

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.cargar();
  }

  verDetalle(id: number): void { this.router.navigate(['/recepcion', id]); }
  nueva(): void               { this.router.navigate(['/recepcion/nueva']); }
}
