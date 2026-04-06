import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, DependenciaOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-dependencias',
  templateUrl: './dependencias.html',
  standalone: false
})
export class DependenciasComponent implements OnInit {
  dependencias: DependenciaOut[] = [];
  columnas = ['nombre', 'codigo', 'responsable', 'estado', 'acciones'];
  form!: FormGroup;
  editando: DependenciaOut | null = null;
  mostrarForm = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.cargar();
  }

  inicializarForm(dep?: DependenciaOut): void {
    this.form = this.fb.group({
      nombre:      [dep?.nombre      || '', Validators.required],
      codigo:      [dep?.codigo      || ''],
      responsable: [dep?.responsable || ''],
      email:       [dep?.email       || ''],
    });
  }

  cargar(): void {
    this.adminService.getDependencias().subscribe({
      next: d => { this.dependencias = d; this.cdr.markForCheck(); },
    });
  }

  editar(dep: DependenciaOut): void {
    this.editando = dep;
    this.inicializarForm(dep);
    this.mostrarForm = true;
  }

  nuevo(): void { this.editando = null; this.inicializarForm(); this.mostrarForm = true; }

  cancelar(): void { this.mostrarForm = false; this.editando = null; }

  guardar(): void {
    if (this.form.invalid) return;
    const obs = this.editando
      ? this.adminService.actualizarDependencia(this.editando.id, this.form.value)
      : this.adminService.crearDependencia(this.form.value);
    // cancelar() ANTES de cargar() para evitar NG0100
    obs.subscribe(() => { this.cancelar(); this.cargar(); });
  }

  toggleActiva(dep: DependenciaOut): void {
    this.adminService.actualizarDependencia(dep.id, { activa: !dep.activa })
      .subscribe(() => this.cargar());
  }
}
