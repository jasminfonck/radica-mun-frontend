import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  RecepcionService,
  InfoPublica,
  FormularioPublicoOut,
} from '../../core/services/recepcion.service';

@Component({
  selector: 'app-formulario-publico',
  templateUrl: './formulario-publico.html',
  styleUrls: ['./formulario-publico.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioPublicoComponent implements OnInit {
  info: InfoPublica | null = null;
  form!: FormGroup;
  cargando = true;
  enviando = false;
  confirmacion: FormularioPublicoOut | null = null;
  errorCarga = '';
  errorEnvio = '';

  archivosAdjuntos: File[] = [];
  readonly MAX_ADJUNTOS   = 5;
  readonly MAX_MB_ADJUNTO = 10;

  readonly tiposIdentificacion = [
    { value: 'CC',   label: 'Cédula de ciudadanía' },
    { value: 'CE',   label: 'Cédula de extranjería' },
    { value: 'NIT',  label: 'NIT' },
    { value: 'PP',   label: 'Pasaporte' },
    { value: 'otro', label: 'Otro documento' },
  ];

  constructor(
    private fb: FormBuilder,
    private recepcionService: RecepcionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo_persona:          ['natural'],
      nombres:               ['', Validators.required],
      apellidos:             [''],
      razon_social:          [''],
      tipo_identificacion:   ['CC'],
      numero_identificacion: ['', Validators.required],
      email:                 ['', [Validators.required, Validators.email]],
      telefono:              [''],
      asunto:                ['', [Validators.required, Validators.maxLength(300)]],
      tipo_requerimiento_id: [null],
      observaciones:         ['', Validators.maxLength(1000)],
      acepta_politica:       [false],
    });

    this.form.get('tipo_persona')!.valueChanges.subscribe(tipo => {
      const nombres     = this.form.get('nombres')!;
      const razonSocial = this.form.get('razon_social')!;
      if (tipo === 'juridico') {
        nombres.clearValidators();
        razonSocial.setValidators(Validators.required);
      } else {
        nombres.setValidators(Validators.required);
        razonSocial.clearValidators();
      }
      nombres.updateValueAndValidity();
      razonSocial.updateValueAndValidity();
      this.cdr.markForCheck();
    });

    this.recepcionService.getInfoPublica().subscribe({
      next: info => {
        this.info = info;
        this.cargando = false;
        if (info.politica_privacidad_activa) {
          this.form.get('acepta_politica')!.setValidators(Validators.requiredTrue);
          this.form.get('acepta_politica')!.updateValueAndValidity();
        }
        document.documentElement.style.setProperty('--color-primario', info.color_primario);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.errorCarga = 'No se pudo cargar la información. Intente más tarde.';
        this.cdr.markForCheck();
      },
    });
  }

  get esJuridico(): boolean {
    return this.form.get('tipo_persona')?.value === 'juridico';
  }

  agregarArchivos(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    if (!input.files) return;
    const nuevos = Array.from(input.files);
    for (const archivo of nuevos) {
      if (this.archivosAdjuntos.length >= this.MAX_ADJUNTOS) break;
      if (archivo.size > this.MAX_MB_ADJUNTO * 1024 * 1024) {
        this.errorEnvio = `El archivo "${archivo.name}" supera el límite de ${this.MAX_MB_ADJUNTO} MB.`;
        this.cdr.markForCheck();
        continue;
      }
      if (!this.archivosAdjuntos.some(f => f.name === archivo.name && f.size === archivo.size)) {
        this.archivosAdjuntos.push(archivo);
      }
    }
    input.value = '';
    this.cdr.markForCheck();
  }

  quitarArchivo(index: number): void {
    this.archivosAdjuntos.splice(index, 1);
    this.cdr.markForCheck();
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  enviar(): void {
    if (this.form.invalid || this.enviando) return;
    this.enviando = true;
    this.errorEnvio = '';

    this.recepcionService.crearPublico(this.form.value, this.archivosAdjuntos).subscribe({
      next: result => {
        this.confirmacion = result;
        this.archivosAdjuntos = [];
        this.enviando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.errorEnvio = err.error?.detail
          || 'Ocurrió un error al enviar su solicitud. Intente más tarde.';
        this.enviando = false;
        this.cdr.markForCheck();
      },
    });
  }
}
