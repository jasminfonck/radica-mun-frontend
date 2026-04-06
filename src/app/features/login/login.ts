import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: false
})
export class LoginComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  cargando = false;
  error = '';
  ocultarPassword = true;
  nombreEntidad = 'Municipio de Ejemplo';
  anio = new Date().getFullYear();
  decoItems = Array(18).fill(0);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private adminService: AdminService,
  ) {
    this.form = this.fb.group({
      email:    ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.adminService.getEntidad().subscribe({
      next: entidad => {
        if (entidad.nombre) this.nombreEntidad = entidad.nombre;
      },
    });
  }

  /** Sincroniza valores auto-completados por el navegador con el FormGroup.
   *  El browser rellena el DOM sin disparar eventos de Angular, por eso el
   *  formulario queda inválido hasta que el usuario interactúa. */
  ngAfterViewInit(): void {
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[formControlName]');
      let sync = false;
      inputs.forEach(input => {
        const name = input.getAttribute('formControlName');
        if (name && input.value && !this.form.get(name)?.value) {
          this.form.get(name)?.setValue(input.value, { emitEvent: false });
          sync = true;
        }
      });
      if (sync) this.form.updateValueAndValidity();
    }, 400);
  }

  ingresar(): void {
    if (this.form.invalid) return;

    this.cargando = true;
    this.error = '';

    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (err) => {
        this.error = err.error?.detail || 'No se pudo iniciar sesión. Verifique sus datos.';
        this.cargando = false;
      }
    });
  }
}
