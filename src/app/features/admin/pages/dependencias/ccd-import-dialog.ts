import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AdminService, FilaCCDOut, ImportarValidarOut, ImportarConfirmarOut,
} from '../../../../core/services/admin.service';

@Component({
  selector: 'app-ccd-import-dialog',
  templateUrl: './ccd-import-dialog.html',
  standalone: false,
})
export class CcdImportDialogComponent {
  paso: 1 | 2 | 3 = 1;
  cargando = false;
  archivoNombre = '';
  preview: ImportarValidarOut | null = null;
  resultado: ImportarConfirmarOut | null = null;
  errorMsg = '';

  // Drag & drop state
  sobreZona = false;

  constructor(
    private dialogRef: MatDialogRef<CcdImportDialogComponent>,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  onDragOver(e: DragEvent): void { e.preventDefault(); this.sobreZona = true; }
  onDragLeave(): void { this.sobreZona = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.sobreZona = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.procesarArchivo(file);
  }

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.procesarArchivo(file);
  }

  procesarArchivo(file: File): void {
    if (!file.name.endsWith('.xlsx')) {
      this.errorMsg = 'Solo se aceptan archivos .xlsx';
      return;
    }
    this.errorMsg = '';
    this.archivoNombre = file.name;
    this.cargando = true;
    this.adminService.validarImportacionCCD(file).subscribe({
      next: (res) => {
        this.preview = res;
        this.paso = 2;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al procesar el archivo';
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  confirmar(): void {
    if (!this.preview?.puede_importar) return;
    this.cargando = true;
    const filasOk = this.preview.filas.filter(f => f.estado !== 'error');
    this.adminService.confirmarImportacionCCD(filasOk).subscribe({
      next: (res) => {
        this.resultado = res;
        this.paso = 3;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al importar';
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.paso === 3);
  }

  trackFila(_: number, f: FilaCCDOut): number { return f.fila; }

  get totalImportar(): number {
    return this.preview?.filas.filter(f => f.estado !== 'error').length ?? 0;
  }

  resumenResultado(): string {
    if (!this.resultado) return '';
    const r = this.resultado;
    const parts: string[] = [];
    if (r.secciones_creadas)    parts.push(`${r.secciones_creadas} secciones creadas`);
    if (r.secciones_actualizadas) parts.push(`${r.secciones_actualizadas} secciones actualizadas`);
    if (r.subsecciones_creadas) parts.push(`${r.subsecciones_creadas} subsecciones creadas`);
    if (r.subsecciones_actualizadas) parts.push(`${r.subsecciones_actualizadas} subsecciones actualizadas`);
    if (r.series_creadas)       parts.push(`${r.series_creadas} series creadas`);
    if (r.series_actualizadas)  parts.push(`${r.series_actualizadas} series actualizadas`);
    if (r.subseries_creadas)    parts.push(`${r.subseries_creadas} subseries creadas`);
    if (r.subseries_actualizadas) parts.push(`${r.subseries_actualizadas} subseries actualizadas`);
    return parts.join(' · ');
  }
}
