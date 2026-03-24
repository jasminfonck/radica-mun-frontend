import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-entidad',
  templateUrl: './entidad.html',
  standalone: false
})
export class EntidadComponent implements OnInit {
  form!: FormGroup;
  guardando = false;
  guardado = false;

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre:               ['', Validators.required],
      nit:                  [''],
      municipio:            [''],
      departamento:         [''],
      direccion:            [''],
      telefono:             [''],
      email_institucional:  [''],
    });
    this.adminService.getEntidad().subscribe(e => this.form.patchValue(e));
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.adminService.actualizarEntidad(this.form.value).subscribe({
      next: () => { this.guardando = false; this.guardado = true; setTimeout(() => this.guardado = false, 3000); },
      error: () => { this.guardando = false; }
    });
  }
}
