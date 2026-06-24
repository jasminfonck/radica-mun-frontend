import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  // Referencias para gestión de foco tras cambios dinámicos (SC 2.4.3)
  @ViewChild('confirmacionCard') private confirmacionCard?: ElementRef<HTMLElement>;
  @ViewChild('errorEnvioRef')   private errorEnvioRef?: ElementRef<HTMLElement>;

  info: InfoPublica | null = null;
  form!: FormGroup;
  cargando = true;
  enviando = false;
  confirmacion: FormularioPublicoOut | null = null;
  errorCarga = '';
  errorEnvio = '';

  archivosAdjuntos: File[] = [];
  maxAdjuntos   = 5;
  maxMbAdjunto  = 10;
  tiposPermitidos: string[] = [];

  private static readonly MIME_LABEL: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'text/plain': 'TXT',
    'application/rtf': 'RTF',
    'application/zip': 'ZIP',
  };

  private static readonly MIME_EXT: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'application/rtf': ['.rtf'],
    'application/zip': ['.zip'],
  };

  get formatosLegibles(): string {
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const mime of this.tiposPermitidos) {
      const label = FormularioPublicoComponent.MIME_LABEL[mime] ?? mime;
      if (!seen.has(label)) { seen.add(label); labels.push(label); }
    }
    return labels.length ? labels.join(', ') : 'todos los formatos';
  }

  get acceptAttr(): string {
    const exts: string[] = [];
    for (const mime of this.tiposPermitidos) {
      (FormularioPublicoComponent.MIME_EXT[mime] ?? []).forEach(e => exts.push(e));
    }
    return exts.length ? exts.join(',') : '*';
  }

  readonly tiposIdentificacionNatural = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'PP', label: 'Pasaporte' },
  ];

  readonly tiposIdentificacionJuridico = [
    { value: 'NIT',  label: 'NIT' },
  ];

  get tiposIdentificacionActuales() {
    return this.esJuridico ? this.tiposIdentificacionJuridico : this.tiposIdentificacionNatural;
  }

  constructor(
    private fb: FormBuilder,
    private recepcionService: RecepcionService,
    private cdr: ChangeDetectorRef,
  ) {}

  private _validadoresNumId(tipo: string): any[] {
    if (tipo === 'CC')  return [Validators.required, Validators.pattern(/^\d{5,10}$/)];
    if (tipo === 'NIT') return [Validators.required, Validators.pattern(/^\d{7,15}$/)];
    if (tipo === 'CE')  return [Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,15}$/)];
    if (tipo === 'PP')  return [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,20}$/)];
    return [Validators.required, Validators.minLength(3), Validators.maxLength(20)];
  }

  /** Solo dígitos — para CC y NIT */
  soloDigitos(event: KeyboardEvent): boolean {
    return /^\d$/.test(event.key);
  }

  /** Dígitos y letras — para CE y Pasaporte */
  soloAlfanumerico(event: KeyboardEvent): boolean {
    return /^[A-Za-z0-9]$/.test(event.key);
  }

  /** Restricción de teclado según tipo de identificación activo */
  restriccionNumId(event: KeyboardEvent): boolean {
    const tipo = this.form.get('tipo_identificacion')?.value;
    return (tipo === 'CC' || tipo === 'NIT') ? /^\d$/.test(event.key) : /^[A-Za-z0-9]$/.test(event.key);
  }

  get maxlengthNumId(): number {
    const tipo = this.form.get('tipo_identificacion')?.value;
    if (tipo === 'CC')  return 10;
    if (tipo === 'NIT') return 15;
    if (tipo === 'CE')  return 15;
    if (tipo === 'PP')  return 20;
    return 20;
  }

  soloDigitosTel(event: KeyboardEvent): boolean {
    return /^\d$/.test(event.key);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo_persona:          ['natural'],
      nombres:               ['', Validators.required],
      apellidos:             [''],
      razon_social:          [''],
      tipo_identificacion:   ['CC'],
      numero_identificacion: ['', this._validadoresNumId('CC')],
      digito_verificacion:   [''],
      email:                 ['', [Validators.required, Validators.email]],
      telefono:              ['', [Validators.pattern(/^\d{7,10}$/)]],
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
        this.form.get('tipo_identificacion')!.setValue('NIT');
      } else {
        nombres.setValidators(Validators.required);
        razonSocial.clearValidators();
        this.form.get('tipo_identificacion')!.setValue('CC');
      }
      nombres.updateValueAndValidity();
      razonSocial.updateValueAndValidity();
      this.cdr.markForCheck();
    });

    this.form.get('tipo_identificacion')!.valueChanges.subscribe(tipo => {
      const numId  = this.form.get('numero_identificacion')!;
      const digitoV = this.form.get('digito_verificacion')!;
      numId.setValue('', { emitEvent: false });
      numId.setValidators(this._validadoresNumId(tipo));
      numId.updateValueAndValidity();
      if (tipo === 'NIT') {
        digitoV.setValidators([Validators.required, Validators.pattern(/^\d$/)]);
      } else {
        digitoV.clearValidators();
        digitoV.setValue('', { emitEvent: false });
      }
      digitoV.updateValueAndValidity();
      this.cdr.markForCheck();
    });

    this.recepcionService.getInfoPublica().subscribe({
      next: info => {
        this.info = info;
        this.maxAdjuntos  = info.max_adjuntos   ?? 5;
        this.maxMbAdjunto = info.max_tamano_adjunto_mb ?? 10;
        this.tiposPermitidos = info.tipos_archivo_permitidos ?? [];
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
      if (this.archivosAdjuntos.length >= this.maxAdjuntos) break;
      if (archivo.size > this.maxMbAdjunto * 1024 * 1024) {
        this.errorEnvio = `El archivo "${archivo.name}" supera el límite de ${this.maxMbAdjunto} MB.`;
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
        // Mueve el foco a la confirmación para que lectores de pantalla la anuncien (SC 2.4.3)
        setTimeout(() => this.confirmacionCard?.nativeElement.focus());
      },
      error: err => {
        this.errorEnvio = err.error?.detail
          || 'Ocurrió un error al enviar su solicitud. Intente más tarde.';
        this.enviando = false;
        this.cdr.markForCheck();
        // Mueve el foco al error para que sea anunciado inmediatamente (SC 2.4.3)
        setTimeout(() => this.errorEnvioRef?.nativeElement.focus());
      },
    });
  }
}
