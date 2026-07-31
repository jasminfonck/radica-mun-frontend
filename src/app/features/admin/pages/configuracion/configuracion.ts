import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AdminService, RespaldoOut } from '../../../../core/services/admin.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RutaPickerDialogComponent } from './ruta-picker-dialog';

export interface GrupoColor {
  nombre: string;
  colores: { hex: string; nombre: string }[];
}

export interface TipoArchivo {
  mimes: string[];
  label: string;
  ext: string;
}

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss'],
  standalone: false
})
export class ConfiguracionComponent implements OnInit {
  form!: FormGroup;
  guardando         = false;
  guardado          = false;
  ejemploRadicado   = '';
  paletaAbierta     = false;
  descargandoBackup = false;
  descargandoBackupBd = false;

  smbPasswordConfigurado = false;
  probandoSmb = false;
  // Ambas secciones parten colapsadas si ya tienen algo guardado (para no
  // mostrar el formulario completo de entrada), y expandidas si están vacías
  // (para invitar a completarlas). El usuario puede alternar libremente.
  mostrarDetalleAlmacenamiento = true;
  mostrarDetallePolitica       = true;
  // Tipo de almacenamiento tal como está GUARDADO en el servidor — distinto
  // del valor en vivo del formulario (`almacenamiento_tipo` del form), que
  // cambia apenas se toca el radio button, antes de guardar. "Probar
  // conexión" prueba lo que el backend tiene guardado, no lo que se ve en
  // pantalla, así que su estado debe reflejar esto último, no el form.
  tipoGuardado: 'local' | 'smb' = 'local';

  tiposSeleccionados = new Set<string>();

  readonly TIPOS_ARCHIVO: TipoArchivo[] = [
    { mimes: ['application/pdf'],                                                                                                                       label: 'PDF',          ext: '.pdf'         },
    { mimes: ['image/jpeg'],                                                                                                                            label: 'JPEG',         ext: '.jpg'         },
    { mimes: ['image/png'],                                                                                                                             label: 'PNG',          ext: '.png'         },
    { mimes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],                                         label: 'Word',         ext: '.doc / .docx' },
    { mimes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],                                         label: 'Excel',        ext: '.xls / .xlsx' },
    { mimes: ['text/plain'],                                                                                                                            label: 'Texto (.txt)', ext: '.txt'         },
    { mimes: ['application/rtf'],                                                                                                                       label: 'RTF',          ext: '.rtf'         },
  ];

  readonly PALETA: GrupoColor[] = [
    {
      nombre: 'Azules institucionales',
      colores: [
        { hex: '#0d1b5e', nombre: 'Azul noche' },
        { hex: '#1a237e', nombre: 'Azul institucional' },
        { hex: '#283593', nombre: 'Azul índigo' },
        { hex: '#303f9f', nombre: 'Índigo medio' },
        { hex: '#1565c0', nombre: 'Azul oscuro' },
        { hex: '#0d47a1', nombre: 'Azul marino' },
        { hex: '#0277bd', nombre: 'Azul cielo' },
        { hex: '#01579b', nombre: 'Azul acero' },
      ],
    },
    {
      nombre: 'Verdes gobierno',
      colores: [
        { hex: '#1b5e20', nombre: 'Verde bosque' },
        { hex: '#2e7d32', nombre: 'Verde oscuro' },
        { hex: '#388e3c', nombre: 'Verde medio' },
        { hex: '#00695c', nombre: 'Verde azulado' },
        { hex: '#004d40', nombre: 'Verde pizarra' },
        { hex: '#33691e', nombre: 'Verde oliva' },
        { hex: '#558b2f', nombre: 'Verde lima' },
        { hex: '#00796b', nombre: 'Verde teal' },
      ],
    },
    {
      nombre: 'Grises y neutros',
      colores: [
        { hex: '#212121', nombre: 'Negro suave' },
        { hex: '#263238', nombre: 'Gris pizarra' },
        { hex: '#37474f', nombre: 'Gris azulado' },
        { hex: '#455a64', nombre: 'Gris acero' },
        { hex: '#546e7a', nombre: 'Gris claro' },
        { hex: '#4e342e', nombre: 'Café institucional' },
        { hex: '#3e2723', nombre: 'Marrón oscuro' },
        { hex: '#5d4037', nombre: 'Marrón medio' },
      ],
    },
    {
      nombre: 'Rojos y vinotinto',
      colores: [
        { hex: '#b71c1c', nombre: 'Rojo oscuro' },
        { hex: '#880e4f', nombre: 'Rosa oscuro' },
        { hex: '#c62828', nombre: 'Rojo medio' },
        { hex: '#6a1b4d', nombre: 'Vinotinto' },
        { hex: '#ad1457', nombre: 'Fucsia' },
        { hex: '#7b1fa2', nombre: 'Morado' },
        { hex: '#4a148c', nombre: 'Púrpura oscuro' },
        { hex: '#6a1b9a', nombre: 'Violeta' },
      ],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
    private dialog: MatDialog,
  ) {}


  ngOnInit(): void {
    this.form = this.fb.group({
      prefijo_radicado:           ['', [Validators.required, Validators.maxLength(10)]],
      ruta_almacenamiento:        [''],
      color_primario:             ['', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      politica_privacidad_activa: [false],
      politica_privacidad_texto:  [''],
      max_adjuntos:               [5,  [Validators.required, Validators.min(1), Validators.max(20)]],
      max_tamano_adjunto_mb:      [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      // Almacenamiento compartido en red (alternativa a la carpeta local)
      almacenamiento_tipo:    ['local'],
      smb_servidor:            [''],
      smb_puerto:              [445],
      smb_carpeta_compartida: [''],
      smb_subcarpeta:          [''],
      smb_usuario:              [''],
      smb_password:             [''],
      smb_dominio:              [''],
    });

    this.adminService.getConfiguracion().subscribe({
      next: c => {
        this.form.patchValue(c);
        this.tiposSeleccionados = new Set(
          (c.tipos_archivo_permitidos || '').split(',').map(t => t.trim()).filter(Boolean)
        );
        this.smbPasswordConfigurado = c.smb_password_configurado;
        this.tipoGuardado = c.almacenamiento_tipo;
        const yaConfigurado = c.almacenamiento_tipo === 'smb' ? !!c.smb_servidor : !!c.ruta_almacenamiento;
        this.mostrarDetalleAlmacenamiento = !yaConfigurado;
        this.mostrarDetallePolitica = !c.politica_privacidad_texto;
        this.actualizarEjemplo();
        this.cdr.markForCheck();
      },
    });

    this.form.get('prefijo_radicado')?.valueChanges
      .subscribe(() => this.actualizarEjemplo());
  }

  actualizarEjemplo(): void {
    const prefijo = this.form.get('prefijo_radicado')?.value || 'RAD';
    this.ejemploRadicado = `${prefijo}-${new Date().getFullYear()}-000001`;
  }

  seleccionarColor(hex: string): void {
    this.form.get('color_primario')?.setValue(hex);
    this.paletaAbierta = false;
    // Vista previa inmediata del color en toda la aplicación
    this.themeService.aplicarColor(hex);
    this.cdr.markForCheck();
  }

  colorActual(): string { return this.form.get('color_primario')?.value || '#cccccc'; }

  examinarRuta(): void {
    const actual = this.form.get('ruta_almacenamiento')?.value || undefined;
    this.dialog.open(RutaPickerDialogComponent, { width: '560px', data: { rutaInicial: actual } })
      .afterClosed().subscribe((ruta?: string) => {
        if (ruta) {
          this.form.get('ruta_almacenamiento')?.setValue(ruta);
          this.cdr.markForCheck();
        }
      });
  }

  seleccionarAlmacenamiento(tipo: 'local' | 'smb'): void {
    this.form.get('almacenamiento_tipo')?.setValue(tipo);
    this.mostrarDetalleAlmacenamiento = true;
    this.cdr.markForCheck();
  }

  esColorSeleccionado(hex: string): boolean {
    return this.form.get('color_primario')?.value?.toLowerCase() === hex.toLowerCase();
  }

  tipoActivo(tipo: TipoArchivo): boolean {
    return tipo.mimes.some(m => this.tiposSeleccionados.has(m));
  }

  toggleTipo(tipo: TipoArchivo): void {
    if (this.tipoActivo(tipo)) {
      tipo.mimes.forEach(m => this.tiposSeleccionados.delete(m));
    } else {
      tipo.mimes.forEach(m => this.tiposSeleccionados.add(m));
    }
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.guardado   = false;
    const payload = {
      ...this.form.value,
      tipos_archivo_permitidos: Array.from(this.tiposSeleccionados).join(','),
    };
    this.adminService.actualizarConfiguracion(payload).subscribe({
      next: c => {
        this.guardando = false;
        this.guardado  = true;
        this.smbPasswordConfigurado = c.smb_password_configurado;
        this.tipoGuardado = c.almacenamiento_tipo;
        this.form.get('smb_password')?.setValue('');
        this.cdr.markForCheck();
        this.toast.exito('Configuración guardada correctamente.');
        // La confirmación en pantalla no debe quedar indefinidamente si el
        // usuario sigue editando otros campos sin volver a guardar.
        setTimeout(() => { this.guardado = false; this.cdr.markForCheck(); }, 4000);
      },
      error: err => {
        this.guardando = false;
        this.cdr.markForCheck();
        this.toast.error(err?.error?.detail || 'Error al guardar la configuración.');
      },
    });
  }

  probarSmbConexion(): void {
    this.probandoSmb = true;
    this.adminService.probarSmb().subscribe({
      next: r => {
        this.probandoSmb = false;
        this.cdr.markForCheck();
        if (r.ok) this.toast.exito(r.mensaje);
        else      this.toast.error(r.mensaje);
      },
      error: err => {
        this.probandoSmb = false;
        this.cdr.markForCheck();
        this.toast.error(err?.error?.detail || 'No se pudo probar la conexión SMB.');
      },
    });
  }

  descargarRespaldo(): void {
    this.descargandoBackup = true;
    this.adminService.getRespaldo().subscribe({
      next: (data: RespaldoOut) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `respaldo_radica_mun_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoBackup = false;
        this.cdr.markForCheck();
        this.toast.exito('Respaldo descargado correctamente.');
      },
      error: () => {
        this.descargandoBackup = false;
        this.cdr.markForCheck();
        this.toast.error('No se pudo generar el respaldo de configuración.');
      },
    });
  }

  descargarRespaldoBaseDatos(): void {
    this.descargandoBackupBd = true;
    this.adminService.getRespaldoBaseDatos().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `respaldo_bd_radica_mun_${new Date().toISOString().slice(0, 10)}.sql`;
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoBackupBd = false;
        this.cdr.markForCheck();
        this.toast.exito('Respaldo de base de datos descargado correctamente.');
      },
      error: err => {
        this.descargandoBackupBd = false;
        this.cdr.markForCheck();
        this.toast.error(err?.error?.detail || 'No se pudo generar el respaldo de la base de datos.');
      },
    });
  }

}
