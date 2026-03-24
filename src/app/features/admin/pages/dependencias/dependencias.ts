import { Component, OnInit } from '@angular/core';
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

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

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

  cargar(): void { this.adminService.getDependencias().subscribe(d => this.dependencias = d); }

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
    obs.subscribe(() => { this.cargar(); this.cancelar(); });
  }

  toggleActiva(dep: DependenciaOut): void {
    this.adminService.actualizarDependencia(dep.id, { activa: !dep.activa })
      .subscribe(() => this.cargar());
  }
}
