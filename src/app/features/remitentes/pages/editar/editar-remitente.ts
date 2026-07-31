import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RemitenteService, RemitenteOut } from '../../../../core/services/remitente.service';
import { GeoService, DepartamentoOut, MunicipioOut } from '../../../../core/services/geo.service';

@Component({
  selector: 'app-editar-remitente',
  templateUrl: './editar-remitente.html',
  styleUrls: ['./editar-remitente.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarRemitenteComponent implements OnInit {
  remitente?: RemitenteOut;
  form!: FormGroup;
  cargando = true;
  guardando = false;

  departamentos: DepartamentoOut[] = [];
  municipiosFiltrados: MunicipioOut[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private remitenteService: RemitenteService,
    private geoService: GeoService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.geoService.getDepartamentos().subscribe(deps => {
      this.departamentos = deps;
      this.cdr.markForCheck();
    });

    this.remitenteService.obtener(id).subscribe({
      next: r => {
        this.remitente = r;
        this._buildForm(r);
        if (r.departamento) {
          this.geoService.getMunicipiosPorNombreDep(r.departamento).subscribe(ms => {
            this.municipiosFiltrados = ms;
            this.cdr.markForCheck();
          });
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.snack.open('No se encontró el remitente', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/remitentes']);
      },
    });
  }

  private _buildForm(r: RemitenteOut): void {
    this.form = this.fb.group({
      nombres:             [r.nombres    ?? ''],
      apellidos:           [r.apellidos  ?? ''],
      razon_social:        [r.razon_social ?? ''],
      nit:                 [r.nit         ?? ''],
      digito_verificacion: [r.digito_verificacion ?? ''],
      email:               [r.email      ?? '', Validators.email],
      telefono:            [r.telefono   ?? '', Validators.pattern(/^[0-9+\s()\-]{7,20}$/)],
      direccion:           [r.direccion  ?? ''],
      departamento:        [r.departamento ?? ''],
      municipio:           [r.municipio  ?? ''],
      activo:              [r.activo],
    });
  }

  onDepartamentoChange(nombre: string): void {
    this.municipiosFiltrados = [];
    this.form.get('municipio')?.setValue('');
    if (!nombre) return;
    this.geoService.getMunicipiosPorNombreDep(nombre).subscribe(ms => {
      this.municipiosFiltrados = ms;
      this.cdr.markForCheck();
    });
  }

  guardar(): void {
    if (!this.form || !this.remitente) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.guardando = true;
    const payload = this.form.getRawValue();

    this.remitenteService.actualizar(this.remitente.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.snack.open('Datos actualizados correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/remitentes']);
      },
      error: () => {
        this.guardando = false;
        this.snack.open('Error al guardar los cambios', 'Cerrar', { duration: 4000 });
        this.cdr.markForCheck();
      },
    });
  }

  volver(): void {
    this.router.navigate(['/remitentes']);
  }

  soloLetras(event: KeyboardEvent): boolean {
    return /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-'.]$/.test(event.key);
  }

  soloNumeros(event: KeyboardEvent): boolean {
    return /^[0-9]$/.test(event.key);
  }

  soloNumerosTel(event: KeyboardEvent): boolean {
    return /^[0-9+\s()\-]$/.test(event.key);
  }
}
