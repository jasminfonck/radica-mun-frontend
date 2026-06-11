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
  errorForm = '';
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
      codigo:      [dep?.codigo      || '', [Validators.required, Validators.pattern(/^[A-Z0-9][A-Z0-9\-]{1,19}$/)]],
      responsable: [dep?.responsable || null, Validators.required],
      email:       [dep?.email       || '', Validators.email],
    });
  }

  codigoMayusculas(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart ?? input.value.length;
    input.value = input.value.toUpperCase();
    this.form.get('codigo')?.setValue(input.value, { emitEvent: false });
    input.setSelectionRange(pos, pos);
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

  cancelar(): void { this.mostrarForm = false; this.editando = null; this.errorForm = ''; }

  guardar(): void {
    if (this.form.invalid) return;
    this.errorForm = '';
    const obs = this.editando
      ? this.adminService.actualizarDependencia(this.editando.id, this.form.value)
      : this.adminService.crearDependencia(this.form.value);
    obs.subscribe({
      next: () => { this.cancelar(); this.cargar(); },
      error: (err) => {
        this.errorForm = err.error?.detail || 'Error al guardar la dependencia';
        this.cdr.markForCheck();
      },
    });
  }

  toggleActiva(dep: DependenciaOut): void {
    this.adminService.actualizarDependencia(dep.id, { activa: !dep.activa })
      .subscribe(() => this.cargar());
  }
}
