import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminService, DirectorioListadoOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-ruta-picker-dialog',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Examinar carpetas del servidor</h2>
    <mat-dialog-content>

      <div *ngIf="listado" class="ruta-actual">
        <mat-icon>folder_open</mat-icon>
        <span>{{ listado.ruta_actual || 'Unidades disponibles' }}</span>
      </div>

      <div *ngIf="error" class="error-picker">
        <mat-icon>error_outline</mat-icon> {{ error }}
        <button mat-button type="button" *ngIf="!listado" (click)="navegar()">Ir a la raíz</button>
      </div>

      <mat-progress-bar *ngIf="cargando" mode="indeterminate"></mat-progress-bar>

      <div *ngIf="listado && !cargando" class="acciones-nav">
        <button mat-stroked-button type="button" [disabled]="!listado.ruta_padre" (click)="subirNivel()">
          <mat-icon>arrow_upward</mat-icon> Subir un nivel
        </button>
        <button mat-stroked-button type="button" *ngIf="listado.ruta_actual" (click)="mostrarCrear = !mostrarCrear">
          <mat-icon>create_new_folder</mat-icon> Nueva carpeta
        </button>
      </div>

      <div *ngIf="mostrarCrear" class="crear-carpeta">
        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Nombre de la carpeta</mat-label>
          <input matInput [(ngModel)]="nombreNuevaCarpeta" (keyup.enter)="crearCarpeta()">
        </mat-form-field>
        <button mat-flat-button color="primary" type="button" [disabled]="!nombreNuevaCarpeta" (click)="crearCarpeta()">
          Crear
        </button>
      </div>

      <mat-list *ngIf="listado && !cargando">
        <mat-list-item *ngFor="let d of listado.subdirectorios" (click)="navegar(d.ruta)" class="item-carpeta">
          <mat-icon matListItemIcon>folder</mat-icon>
          <span matListItemTitle>{{ d.nombre }}</span>
        </mat-list-item>
        <mat-list-item *ngIf="listado.subdirectorios.length === 0">
          <span matListItemTitle style="color:var(--texto-suave)">Sin subcarpetas</span>
        </mat-list-item>
      </mat-list>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="!listado?.ruta_actual || !listado?.puede_escribir"
              [matTooltip]="listado && listado.ruta_actual && !listado.puede_escribir ? 'El backend no tiene permiso de escritura sobre esta carpeta' : ''"
              (click)="seleccionar()">
        Seleccionar esta carpeta
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .ruta-actual { display:flex; align-items:center; gap:8px; font-weight:600; margin-bottom:12px; word-break:break-all; }
    .error-picker { display:flex; align-items:center; gap:8px; color:#c62828; margin-bottom:12px; font-size:13px; }
    .acciones-nav { display:flex; gap:8px; margin-bottom:12px; }
    .crear-carpeta { display:flex; gap:8px; align-items:flex-start; margin-bottom:12px; }
    .item-carpeta { cursor:pointer; }
    mat-list { max-height:320px; overflow-y:auto; }
  `]
})
export class RutaPickerDialogComponent implements OnInit {
  listado: DirectorioListadoOut | null = null;
  cargando = false;
  error = '';
  mostrarCrear = false;
  nombreNuevaCarpeta = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<RutaPickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rutaInicial?: string },
  ) {}

  ngOnInit(): void {
    this._navegar(this.data.rutaInicial, /* esCargaInicial */ true);
  }

  navegar(ruta?: string): void {
    this._navegar(ruta, false);
  }

  private _navegar(ruta: string | undefined, esCargaInicial: boolean): void {
    this.cargando = true;
    this.error = '';
    this.mostrarCrear = false;
    this.cdr.markForCheck();
    this.adminService.listarDirectorios(ruta).subscribe({
      next: r => {
        this.listado = r;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        // La ruta guardada (ej. un valor antiguo que ya no existe en este
        // entorno) puede no ser válida — en ese caso se reintenta desde la
        // raíz en vez de dejar el diálogo sin ninguna carpeta navegable.
        if (esCargaInicial && ruta) {
          this._navegar(undefined, false);
          return;
        }
        this.cargando = false;
        this.error = err?.error?.detail || 'No se pudo listar el directorio.';
        this.cdr.markForCheck();
      },
    });
  }

  subirNivel(): void {
    if (this.listado?.ruta_padre) this.navegar(this.listado.ruta_padre);
  }

  crearCarpeta(): void {
    if (!this.nombreNuevaCarpeta || !this.listado?.ruta_actual) return;
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();
    this.adminService.crearDirectorio(this.listado.ruta_actual, this.nombreNuevaCarpeta).subscribe({
      next: r => {
        this.listado = r;
        this.cargando = false;
        this.mostrarCrear = false;
        this.nombreNuevaCarpeta = '';
        this.cdr.markForCheck();
      },
      error: err => {
        this.cargando = false;
        this.error = err?.error?.detail || 'No se pudo crear la carpeta.';
        this.cdr.markForCheck();
      },
    });
  }

  seleccionar(): void {
    if (this.listado?.ruta_actual) this.dialogRef.close(this.listado.ruta_actual);
  }
}
