import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
    private router: Router,
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

    // Cascada: al cambiar departamento manualmente, limpiar y recargar municipios
    this.form.get('departamento')!.valueChanges.subscribe((depNombre: string) => {
      const dep = this.departamentos.find(d => d.nombre === depNombre);
      this.municipios = [];
      this.form.get('municipio')!.setValue('', { emitEvent: false });
      if (dep) {
        this.geoService.getMunicipios(dep.id).subscribe(muns => {
          this.municipios = muns;
          this.cdr.markForCheck();
        });
      }
      this.cdr.markForCheck();
    });

    // Cargar departamentos y datos guardados: primero los municipios del dep guardado,
    // luego parchear sin emitir eventos para que el select encuentre sus opciones
    forkJoin({
      deps:    this.geoService.getDepartamentos(),
      entidad: this.adminService.getEntidad(),
    }).subscribe({
      next: ({ deps, entidad }) => {
        this.departamentos = deps;
        const dep = deps.find(d => d.nombre === entidad.departamento);

        const aplicarPatch = (muns: MunicipioOut[]) => {
          this.municipios = muns;
          this.form.patchValue(entidad, { emitEvent: false });
          this.form.markAsPristine();
          this.cdr.markForCheck();
        };

        if (dep) {
          this.geoService.getMunicipios(dep.id).subscribe(aplicarPatch);
        } else {
          aplicarPatch([]);
        }
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
        this.cdr.markForCheck();
        this.router.navigate(['/admin']);
      },
      error: () => { this.guardando = false; this.cdr.markForCheck(); },
    });
  }
}
