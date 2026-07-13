import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  AdminService, DependenciaNodo, SerieNodo, SubserieCCDOut, UsuarioOut, nombreCompleto,
} from '../../../../core/services/admin.service';
import { CcdImportDialogComponent } from './ccd-import-dialog';

type FormTipo = 'seccion' | 'subseccion' | 'serie' | 'subserie';

interface FormContexto {
  padreId?: number;
  padreLabel?: string;
  dependenciaId?: number;
  serieId?: number;
}

@Component({
  selector: 'app-dependencias',
  templateUrl: './dependencias.html',
  standalone: false,
})
export class DependenciasComponent implements OnInit {
  arbol: DependenciaNodo[] = [];
  usuarios: UsuarioOut[] = [];
  cargando = false;

  formTipo: FormTipo | null = null;
  formContexto: FormContexto = {};
  editandoObj: any = null;
  form!: FormGroup;
  errorForm = '';

  readonly nombreCompleto = nombreCompleto;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.adminService.getUsuarios().subscribe({
      next: (us) => { this.usuarios = us.filter(u => u.activo); },
    });
  }

  cargar(): void {
    this.cargando = true;
    this.adminService.getCCDArbol().subscribe({
      next: (a) => { this.arbol = a; this.cargando = false; this.cdr.markForCheck(); },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
  }

  // ── Formulario ───────────────────────────────────────────────────────────

  abrirForm(tipo: FormTipo, contexto: FormContexto = {}, obj?: any): void {
    this.formTipo = tipo;
    this.formContexto = contexto;
    this.editandoObj = obj || null;
    this.errorForm = '';

    if (tipo === 'seccion' || tipo === 'subseccion') {
      this.form = this.fb.group({
        nombre:      [obj?.nombre      || '', [Validators.required, Validators.minLength(2)]],
        codigo:      [obj?.codigo      || '', [Validators.required, Validators.pattern(/^[A-Z0-9][A-Z0-9\-\.\/]{0,29}$/)]],
        responsable: [obj?.responsable || null],
        email:       [obj?.email       || '', Validators.email],
      });
    } else {
      this.form = this.fb.group({
        nombre:      [obj?.nombre      || '', [Validators.required, Validators.minLength(2)]],
        codigo:      [obj?.codigo      || '', Validators.pattern(/^[A-Z0-9][A-Z0-9\-\.\/]{0,29}$/)],
        descripcion: [obj?.descripcion || ''],
      });
    }
  }

  cancelar(): void {
    this.formTipo = null;
    this.editandoObj = null;
    this.errorForm = '';
  }

  codigoMayusculas(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart ?? input.value.length;
    input.value = input.value.toUpperCase();
    this.form.get('codigo')?.setValue(input.value, { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }

  get tituloForm(): string {
    const verb = this.editandoObj ? 'Editar' : 'Nueva';
    const tipos: Record<FormTipo, string> = {
      seccion: 'sección',
      subseccion: `subsección${this.formContexto.padreLabel ? ' de ' + this.formContexto.padreLabel : ''}`,
      serie: `serie${this.formContexto.padreLabel ? ' en ' + this.formContexto.padreLabel : ''}`,
      subserie: `subserie${this.formContexto.padreLabel ? ' de ' + this.formContexto.padreLabel : ''}`,
    };
    return `${verb} ${tipos[this.formTipo!]}`;
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.errorForm = '';
    const val = this.form.value;
    let obs: any;

    if (this.formTipo === 'seccion') {
      const data = { ...val, nivel: 'seccion', padre_id: null };
      obs = this.editandoObj
        ? this.adminService.actualizarDependencia(this.editandoObj.id, data)
        : this.adminService.crearDependencia(data);
    } else if (this.formTipo === 'subseccion') {
      const data = { ...val, nivel: 'subseccion', padre_id: this.editandoObj?.padre_id ?? this.formContexto.padreId };
      obs = this.editandoObj
        ? this.adminService.actualizarDependencia(this.editandoObj.id, data)
        : this.adminService.crearDependencia(data);
    } else if (this.formTipo === 'serie') {
      const depId = this.editandoObj?.dependencia_id ?? this.formContexto.dependenciaId;
      obs = this.editandoObj
        ? this.adminService.actualizarSerie(this.editandoObj.id, { ...val, dependencia_id: depId })
        : this.adminService.crearSerie({ ...val, dependencia_id: depId });
    } else {
      const serieId = this.editandoObj?.serie_id ?? this.formContexto.serieId;
      obs = this.editandoObj
        ? this.adminService.actualizarSubserie(this.editandoObj.id, { ...val, serie_id: serieId })
        : this.adminService.crearSubserie({ ...val, serie_id: serieId });
    }

    obs.subscribe({
      next: () => { this.cancelar(); this.cargar(); },
      error: (err: any) => {
        this.errorForm = err.error?.detail || 'Error al guardar';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Acciones de árbol ────────────────────────────────────────────────────

  toggleDependencia(dep: DependenciaNodo): void {
    this.adminService.actualizarDependencia(dep.id, { activa: !dep.activa })
      .subscribe(() => this.cargar());
  }

  toggleSerie(serie: SerieNodo): void {
    this.adminService.toggleSerie(serie.id, !serie.activa)
      .subscribe(() => this.cargar());
  }

  toggleSubserie(ss: SubserieCCDOut): void {
    this.adminService.toggleSubserie(ss.id, !ss.activa)
      .subscribe(() => this.cargar());
  }

  // ── Importación ──────────────────────────────────────────────────────────

  abrirImport(): void {
    const ref = this.dialog.open(CcdImportDialogComponent, { width: '860px', disableClose: true });
    ref.afterClosed().subscribe((importado) => {
      if (importado) this.cargar();
    });
  }

  descargarPlantilla(): void {
    this.adminService.descargarPlantillaCCD().subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_ccd.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
