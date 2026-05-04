import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService, DependenciaOut, UsuarioOut, nombreCompleto } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-dependencias',
  templateUrl: './dependencias.html',
  standalone: false
})
export class DependenciasComponent implements OnInit {
  dependencias: DependenciaOut[] = [];
  usuarios: UsuarioOut[] = [];
  columnas = ['nombre', 'codigo', 'responsable', 'estado', 'acciones'];
  form!: FormGroup;
  editando: DependenciaOut | null = null;
  mostrarForm = false;
  readonly nombreCompleto = nombreCompleto;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    forkJoin({
      dependencias: this.adminService.getDependencias(),
      usuarios: this.adminService.getUsuarios(),
    }).subscribe({
      next: ({ dependencias, usuarios }) => {
        this.dependencias = dependencias;
        this.usuarios = usuarios.filter(u => u.activo);
        this.cdr.markForCheck();
      },
    });
  }

  inicializarForm(dep?: DependenciaOut): void {
    this.form = this.fb.group({
      nombre:      [dep?.nombre      || '', Validators.required],
      codigo:      [dep?.codigo      || ''],
      responsable: [dep?.responsable || null, Validators.required],
      email:       [dep?.email       || '', Validators.email],
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
    obs.subscribe(() => { this.cancelar(); this.cargar(); });
  }

  toggleActiva(dep: DependenciaOut): void {
    this.adminService.actualizarDependencia(dep.id, { activa: !dep.activa })
      .subscribe(() => this.cargar());
  }
}
