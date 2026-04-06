import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, RespaldoOut } from '../../../../core/services/admin.service';
import { ThemeService } from '../../../../core/services/theme.service';

export interface GrupoColor {
  nombre: string;
  colores: { hex: string; nombre: string }[];
}

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.html',
  standalone: false
})
export class ConfiguracionComponent implements OnInit {
  form!: FormGroup;
  guardando         = false;
  guardado          = false;
  ejemploRadicado   = '';
  paletaAbierta     = false;
  descargandoBackup = false;

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
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      prefijo_radicado:           ['', [Validators.required, Validators.maxLength(10)]],
      ruta_almacenamiento:        [''],
      color_primario:             ['', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      politica_privacidad_activa: [false],
      politica_privacidad_texto:  [''],
    });

    this.adminService.getConfiguracion().subscribe({
      next: c => {
        this.form.patchValue(c);
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

  esColorSeleccionado(hex: string): boolean {
    return this.form.get('color_primario')?.value?.toLowerCase() === hex.toLowerCase();
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.adminService.actualizarConfiguracion(this.form.value).subscribe({
      next: () => {
        this.guardando = false;
        this.guardado  = true;
        this.cdr.markForCheck();
        setTimeout(() => { this.guardado = false; this.cdr.markForCheck(); }, 3000);
      },
      error: err => {
        this.guardando = false;
        this.cdr.markForCheck();
        this.snack.open(err?.error?.detail || 'Error al guardar.', 'Cerrar', { duration: 5000 });
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
        this.snack.open('Respaldo descargado correctamente.', 'OK', { duration: 4000 });
      },
      error: () => {
        this.descargandoBackup = false;
        this.cdr.markForCheck();
        this.snack.open('No se pudo generar el respaldo.', 'Cerrar', { duration: 5000 });
      },
    });
  }
}
