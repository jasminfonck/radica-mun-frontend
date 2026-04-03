import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RadicadoService, RadicadoResumen, FiltrosRadicado } from '../../../../core/services/radicado.service';
import { AdminService, DependenciaOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-bandeja-radicados',
  templateUrl: './bandeja-radicados.html',
  standalone: false
})
export class BandejaRadicadosComponent implements OnInit {
  radicados: RadicadoResumen[] = [];
  dependencias: DependenciaOut[] = [];
  cargando = true;

  filtros!: FormGroup;
  columnas = ['numero_radicado', 'recepcion_id', 'dependencia', 'fecha_radicacion', 'estado', 'acciones'];

  readonly ESTADOS = [
    { value: '',         label: 'Todos' },
    { value: 'vigente',  label: 'Vigente' },
    { value: 'anulado',  label: 'Anulado' },
  ];

  constructor(
    private fb: FormBuilder,
    private radicadoService: RadicadoService,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      dependencia_id: [null],
      estado:         [''],
      fecha_desde:    [''],
      fecha_hasta:    [''],
    });

    this.adminService.getDependencias(false).subscribe(d => { this.dependencias = d; });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    const f = this.filtros.value;
    const filtros: FiltrosRadicado = {};
    if (f.dependencia_id) filtros.dependencia_id = f.dependencia_id;
    if (f.estado)         filtros.estado         = f.estado;
    if (f.fecha_desde)    filtros.fecha_desde     = f.fecha_desde;
    if (f.fecha_hasta)    filtros.fecha_hasta     = f.fecha_hasta;

    this.radicadoService.listar(filtros).subscribe({
      next:  r  => { this.radicados = r; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  limpiar(): void {
    this.filtros.reset({ estado: '' });
    this.cargar();
  }
}
