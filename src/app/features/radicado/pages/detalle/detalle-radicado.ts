import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RadicadoService, RadicadoOut } from '../../../../core/services/radicado.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-detalle-radicado',
  templateUrl: './detalle-radicado.html',
  standalone: false
})
export class DetalleRadicadoComponent implements OnInit {
  radicado?: RadicadoOut;
  cargando = true;
  modoAnular = false;
  anulando = false;
  esAdmin = false;

  formAnular!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private radicadoService: RadicadoService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.esAdmin = this.auth.tieneRol('administrador');

    this.formAnular = this.fb.group({
      observaciones: ['', Validators.required],
    });

    this.radicadoService.obtener(id).subscribe({
      next:  r  => { this.radicado = r; this.cargando = false; },
      error: () => this.router.navigate(['/radicado']),
    });
  }

  urlConstancia(): string {
    return this.radicado ? this.radicadoService.urlDescargaConstancia(this.radicado.id) : '';
  }

  regenerarPdf(): void {
    if (!this.radicado) return;
    this.radicadoService.regenerarPdf(this.radicado.id).subscribe(r => { this.radicado = r; });
  }

  anular(): void {
    if (this.formAnular.invalid || !this.radicado) return;
    this.anulando = true;
    this.radicadoService.anular(this.radicado.id, this.formAnular.value.observaciones).subscribe({
      next:  r  => { this.radicado = r; this.anulando = false; this.modoAnular = false; },
      error: () => { this.anulando = false; },
    });
  }
}
