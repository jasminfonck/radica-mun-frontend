import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { GeoService, DepartamentoOut, MunicipioOut } from '../../../../core/services/geo.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-entidad',
  templateUrl: './entidad.html',
  standalone: false
})
export class EntidadComponent implements OnInit {
  form!: FormGroup;
  guardando = false;
  guardado  = false;

  departamentos: DepartamentoOut[] = [];
  municipios: MunicipioOut[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private geoService: GeoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre:              ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      nit:                 ['', Validators.pattern(/^\d{6,15}(-\d)?$/)],
      departamento:        ['', Validators.required],
      municipio:           ['', Validators.required],
      direccion:           ['', Validators.maxLength(200)],
      telefono:            ['', [Validators.pattern(/^[0-9\s\+\-]{7,15}$/)]],
      email_institucional: ['', Validators.email],
    });

    // Cascada: al cambiar departamento, cargar municipios del backend
    this.form.get('departamento')!.valueChanges.subscribe((depNombre: string) => {
      const dep = this.departamentos.find(d => d.nombre === depNombre);
      this.municipios = [];
      this.form.get('municipio')!.setValue('');
      if (dep) {
        this.geoService.getMunicipios(dep.id).subscribe(muns => {
          this.municipios = muns;
          this.cdr.markForCheck();
        });
      }
      this.cdr.markForCheck();
    });

    // Cargar departamentos y datos guardados en paralelo
    forkJoin({
      deps:    this.geoService.getDepartamentos(),
      entidad: this.adminService.getEntidad(),
    }).subscribe({
      next: ({ deps, entidad }) => {
        this.departamentos = deps;

        // Parchear el formulario; el valueChanges del departamento
        // disparará la carga de municipios automáticamente
        this.form.patchValue(entidad);
        this.cdr.markForCheck();
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    // Guardar nombre de departamento y municipio (strings) en BD para compatibilidad
    const payload = {
      ...this.form.value,
    };

    this.adminService.actualizarEntidad(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.guardado  = true;
        this.cdr.markForCheck();
        setTimeout(() => { this.guardado = false; this.cdr.markForCheck(); }, 3000);
      },
      error: () => { this.guardando = false; this.cdr.markForCheck(); },
    });
  }
}
