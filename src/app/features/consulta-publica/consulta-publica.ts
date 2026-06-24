import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RadicadoService, RadicadoPublicoOut } from '../../core/services/radicado.service';
import { RecepcionService, InfoPublica } from '../../core/services/recepcion.service';

@Component({
  selector: 'app-consulta-publica',
  templateUrl: './consulta-publica.html',
  styleUrls: ['./consulta-publica.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaPublicaComponent implements OnInit {
  info: InfoPublica | null = null;
  form!: FormGroup;
  buscando = false;
  resultado: RadicadoPublicoOut | null = null;
  error = '';

  constructor(
    private fb: FormBuilder,
    private radicadoService: RadicadoService,
    private recepcionService: RecepcionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.recepcionService.getInfoPublica().subscribe({
      next: info => {
        this.info = info;
        document.documentElement.style.setProperty('--color-primario', info.color_primario);
        this.cdr.markForCheck();
      },
    });
  }

  consultar(): void {
    if (this.form.invalid || this.buscando) return;
    this.buscando = true;
    this.resultado = null;
    this.error = '';

    const numero: string = this.form.value.numero.trim().toUpperCase();

    this.radicadoService.consultarPublico(numero).subscribe({
      next: r => {
        this.resultado = r;
        this.buscando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = err.status === 404
          ? 'No se encontró ningún radicado con ese número. Verifique e intente de nuevo.'
          : 'Ocurrió un error al consultar. Intente más tarde.';
        this.buscando = false;
        this.cdr.markForCheck();
      },
    });
  }

  descargar(): void {
    if (!this.resultado) return;
    this.radicadoService.descargarConstanciaPublica(this.resultado.numero_radicado).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `constancia-${this.resultado!.numero_radicado}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  nueva(): void {
    this.resultado = null;
    this.error = '';
    this.form.reset();
  }
}
