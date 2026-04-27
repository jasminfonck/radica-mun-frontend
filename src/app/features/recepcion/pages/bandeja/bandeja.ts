import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecepcionService, RecepcionOut, RecepcionFiltros, ESTADOS_RECEPCION } from '../../../../core/services/recepcion.service';
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
  estados = ESTADOS_RECEPCION;
  columnas = ['id', 'canal', 'asunto', 'estado', 'fecha', 'adjuntos', 'acciones'];
  filtrosForm!: FormGroup;
  cargando = true;

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

    forkJoin({
      canales:     this.adminService.getCanales().pipe(catchError(() => of([]))),
      recepciones: this.recepcionService.listar({}).pipe(catchError(() => of([]))),
    }).subscribe(({ canales, recepciones }) => {
      this.canales     = (canales as CanalOut[]).filter(x => x.activo);
      this.recepciones = recepciones as RecepcionOut[];
      this.cargando    = false;
      this.cdr.markForCheck();
    });
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
      next:  r  => { this.recepciones = r; this.cargando = false; this.cdr.markForCheck(); },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.cargar();
  }

  verDetalle(id: number): void { this.router.navigate(['/recepcion', id]); }
  nueva(): void               { this.router.navigate(['/recepcion/nueva']); }
}
