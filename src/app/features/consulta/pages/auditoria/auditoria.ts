import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConsultaService, LogAuditoriaOut } from '../../../../core/services/consulta.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.html',
  styleUrls: ['./auditoria.scss'],
  standalone: false
})
export class AuditoriaComponent implements OnInit {
  logs: LogAuditoriaOut[] = [];
  cargando = true;
  filtros!: FormGroup;

  readonly ACCIONES = [
    { value: '',                label: 'Todas' },
    { value: 'crear_radicado',  label: 'Crear radicado' },
    { value: 'anular_radicado', label: 'Anular radicado' },
  ];

  columnas = ['fecha', 'usuario', 'accion', 'entidad', 'descripcion', 'ip'];

  constructor(
    private fb: FormBuilder,
    private consulta: ConsultaService,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      accion:      [''],
      fecha_desde: [''],
      fecha_hasta: [''],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    const f = this.filtros.value;
    const filtros: any = {};
    if (f.accion)      filtros.accion      = f.accion;
    if (f.fecha_desde) filtros.fecha_desde = f.fecha_desde;
    if (f.fecha_hasta) filtros.fecha_hasta = f.fecha_hasta;

    this.consulta.logAuditoria(filtros).subscribe({
      next:  l  => { this.logs = l; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  limpiar(): void {
    this.filtros.reset({ accion: '' });
    this.cargar();
  }
}
