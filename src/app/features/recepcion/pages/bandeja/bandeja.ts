import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RecepcionService, RecepcionOut, RecepcionFiltros, ESTADOS_RECEPCION } from '../../../../core/services/recepcion.service';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-bandeja',
  templateUrl: './bandeja.html',
  styleUrls: ['./bandeja.scss'],
  standalone: false
})
export class BandejaComponent implements OnInit {
  recepciones: RecepcionOut[] = [];
  canales: CanalOut[] = [];
  estados = ESTADOS_RECEPCION;
  columnas = ['id', 'canal', 'asunto', 'estado', 'fecha', 'adjuntos', 'acciones'];
  filtrosForm!: FormGroup;
  cargando = false;

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
    this.adminService.getCanales().subscribe(c => this.canales = c.filter(x => x.activo));
    this.cargar();
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
      next: r  => { this.recepciones = r; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.cargar();
  }

  verDetalle(id: number): void { this.router.navigate(['/recepcion', id]); }
  nueva(): void               { this.router.navigate(['/recepcion/nueva']); }

  colorEstado(estado: string): string {
    const colores: Record<string, string> = {
      recibido:    '#1a237e',
      en_revision: '#e65100',
      pendiente:   '#f57f17',
      incompleto:  '#b71c1c',
      incompetente:'#4a148c',
    };
    return colores[estado] || '#555';
  }
}
