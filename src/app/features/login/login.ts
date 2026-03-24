import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: false
})
export class LoginComponent {
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
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', Validators.required],
      password: ['', Validators.required]
    });
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
