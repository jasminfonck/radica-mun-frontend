import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConsultaService, ResultadoBusqueda } from '../../../../core/services/consulta.service';
import { AdminService, DependenciaOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-busqueda-avanzada',
  templateUrl: './busqueda-avanzada.html',
  standalone: false
})
export class BusquedaAvanzadaComponent implements OnInit {
  resultados: ResultadoBusqueda[] = [];
  dependencias: DependenciaOut[] = [];
  buscando = false;
  buscado  = false;

  filtros!: FormGroup;
  columnas = ['numero_radicado', 'asunto', 'remitente', 'dependencia', 'fecha_radicacion', 'estado', 'acciones'];

  readonly ESTADOS = [
    { value: '',         label: 'Todos' },
    { value: 'vigente',  label: 'Vigente' },
    { value: 'anulado',  label: 'Anulado' },
  ];

  constructor(
    private fb: FormBuilder,
    private consulta: ConsultaService,
    private admin: AdminService,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      q:               [''],
      numero_radicado: [''],
      dependencia_id:  [null],
      estado_radicado: [''],
      fecha_desde:     [''],
      fecha_hasta:     [''],
    });
    this.admin.getDependencias(false).subscribe(d => { this.dependencias = d; });
  }

  buscar(): void {
    this.buscando = true;
    this.buscado  = false;
    const f = this.filtros.value;
    const filtros: any = {};
    if (f.q)               filtros.q               = f.q;
    if (f.numero_radicado) filtros.numero_radicado  = f.numero_radicado;
    if (f.dependencia_id)  filtros.dependencia_id   = f.dependencia_id;
    if (f.estado_radicado) filtros.estado_radicado  = f.estado_radicado;
    if (f.fecha_desde)     filtros.fecha_desde      = f.fecha_desde;
    if (f.fecha_hasta)     filtros.fecha_hasta       = f.fecha_hasta;

    this.consulta.buscar(filtros).subscribe({
      next:  r  => { this.resultados = r; this.buscando = false; this.buscado = true; },
      error: () => { this.buscando = false; this.buscado = true; },
    });
  }

  limpiar(): void {
    this.filtros.reset({ estado_radicado: '' });
    this.resultados = [];
    this.buscado = false;
  }
}
