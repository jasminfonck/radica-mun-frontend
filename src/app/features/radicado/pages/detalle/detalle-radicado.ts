import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RadicadoService, RadicadoOut } from '../../../../core/services/radicado.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-detalle-radicado',
  templateUrl: './detalle-radicado.html',
  styleUrls: ['./detalle-radicado.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.esAdmin = this.auth.tieneRol('administrador');

    this.formAnular = this.fb.group({
      observaciones: ['', Validators.required],
    });

    this.radicadoService.obtener(id).subscribe({
      next:  r  => { this.radicado = r; this.cargando = false; this.cdr.markForCheck(); },
      error: () => this.router.navigate(['/radicado']),
    });
  }

  descargarConstancia(): void {
    if (!this.radicado) return;
    this.radicadoService.descargarConstancia(this.radicado.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `constancia-${this.radicado!.numero_radicado}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  regenerarPdf(): void {
    if (!this.radicado) return;
    this.radicadoService.regenerarPdf(this.radicado.id).subscribe(r => {
      this.radicado = r;
      this.cdr.markForCheck();
    });
  }

  anular(): void {
    if (this.formAnular.invalid || !this.radicado) return;
    this.anulando = true;
    this.radicadoService.anular(this.radicado.id, this.formAnular.value.observaciones).subscribe({
      next:  r  => { this.radicado = r; this.anulando = false; this.modoAnular = false; this.cdr.markForCheck(); },
      error: () => { this.anulando = false; this.cdr.markForCheck(); },
    });
  }
}
