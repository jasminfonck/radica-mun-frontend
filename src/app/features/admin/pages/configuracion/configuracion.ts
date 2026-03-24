import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.html',
  standalone: false
})
export class ConfiguracionComponent implements OnInit {
  form!: FormGroup;
  guardando = false;
  guardado = false;
  ejemploRadicado = '';

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      prefijo_radicado:    ['', [Validators.required, Validators.maxLength(10)]],
      ruta_almacenamiento: [''],
      color_primario:      ['', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
    });
    this.adminService.getConfiguracion().subscribe(c => {
      this.form.patchValue(c);
      this.actualizarEjemplo();
    });
    this.form.get('prefijo_radicado')?.valueChanges.subscribe(() => this.actualizarEjemplo());
  }

  actualizarEjemplo(): void {
    const prefijo = this.form.get('prefijo_radicado')?.value || 'RAD';
    const anio = new Date().getFullYear();
    this.ejemploRadicado = `${prefijo}-${anio}-000001`;
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.adminService.actualizarConfiguracion(this.form.value).subscribe({
      next: () => { this.guardando = false; this.guardado = true; setTimeout(() => this.guardado = false, 3000); },
      error: () => { this.guardando = false; }
    });
  }
}
