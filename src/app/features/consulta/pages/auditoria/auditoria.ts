import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ConsultaService, LogAuditoriaOut } from '../../../../core/services/consulta.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.html',
  styleUrls: ['./auditoria.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaComponent implements OnInit {
  logs: LogAuditoriaOut[] = [];
  cargando = true;
  filtros!: FormGroup;

  total = 0;
  pageIndex = 0;
  pageSize = 20;

  readonly ACCIONES = [
    { value: '',                           label: 'Todas' },
    // Radicado
    { value: 'crear_radicado',             label: 'Crear radicado' },
    { value: 'anular_radicado',            label: 'Anular radicado' },
    // Recepción
    { value: 'cambio_estado_recepcion',    label: 'Cambio de estado (recepción)' },
    { value: 'formulario_publico',         label: 'Formulario web ciudadano' },
    { value: 'envio_acuse_email',          label: 'Acuse por email' },
    // Remitente y metadatos
    { value: 'crear_remitente',            label: 'Crear remitente' },
    { value: 'actualizar_remitente',       label: 'Actualizar remitente' },
    { value: 'crear_metadatos',            label: 'Crear metadatos' },
    { value: 'actualizar_metadatos',       label: 'Actualizar metadatos' },
    // Administración
    { value: 'crear_usuario',              label: 'Crear usuario' },
    { value: 'actualizar_usuario',         label: 'Actualizar usuario' },
    { value: 'actualizar_entidad',         label: 'Actualizar entidad' },
    { value: 'crear_dependencia',          label: 'Crear dependencia' },
    { value: 'actualizar_dependencia',     label: 'Actualizar dependencia' },
    { value: 'actualizar_canal',           label: 'Actualizar canal' },
    { value: 'crear_tipo_requerimiento',   label: 'Crear tipo requerimiento' },
    { value: 'actualizar_tipo_requerimiento', label: 'Actualizar tipo requerimiento' },
    { value: 'actualizar_configuracion',   label: 'Actualizar configuración' },
  ];

  columnas = ['fecha', 'usuario', 'accion', 'entidad', 'descripcion', 'ip'];

  constructor(
    private fb: FormBuilder,
    private consulta: ConsultaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      accion:      [''],
      fecha_desde: [''],
      fecha_hasta: [''],
    });
    this.cargar();
  }

  private _buscarPagina(): void {
    this.cargando = true;
    const f = this.filtros.value;
    const filtros: any = { page: this.pageIndex + 1, page_size: this.pageSize };
    if (f.accion)      filtros.accion      = f.accion;
    if (f.fecha_desde) filtros.fecha_desde = f.fecha_desde;
    if (f.fecha_hasta) filtros.fecha_hasta = f.fecha_hasta;

    this.consulta.logAuditoria(filtros).subscribe({
      next:  r  => { this.logs = r.items; this.total = r.total; this.cargando = false; this.cdr.markForCheck(); },
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
    this.filtros.reset({ accion: '' });
    this.cargar();
  }
}
