import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-cambiar-contrasena-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Cambiar contraseña</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-dialogo">
        <mat-form-field appearance="outline" class="campo-ancho">
          <mat-label>Contraseña actual *</mat-label>
          <input matInput formControlName="contrasena_actual" type="password">
          <mat-error *ngIf="form.get('contrasena_actual')?.hasError('required')">Obligatorio</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="campo-ancho">
          <mat-label>Nueva contraseña *</mat-label>
          <input matInput formControlName="nueva_contrasena" type="password">
          <mat-error *ngIf="form.get('nueva_contrasena')?.hasError('required')">Obligatorio</mat-error>
          <mat-error *ngIf="form.get('nueva_contrasena')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="campo-ancho">
          <mat-label>Confirmar nueva contraseña *</mat-label>
          <input matInput formControlName="confirmar_contrasena" type="password">
          <mat-error *ngIf="form.get('confirmar_contrasena')?.hasError('required')">Obligatorio</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <div *ngIf="errorGuardado"
         style="margin:0 24px 8px; padding:10px 14px; border-radius:6px;
                background:#ffebee; border-left:3px solid #c62828;
                font-size:13px; color:#b71c1c; display:flex; align-items:center; gap:8px;">
      <mat-icon style="font-size:16px;width:16px;height:16px">error</mat-icon>
      {{ errorGuardado }}
    </div>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="form.invalid || guardando">
        {{ guardando ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-dialogo { display:flex; flex-direction:column; gap:4px; padding-top:8px; min-width:320px; }
    .campo-ancho { width:100%; }
  `]
})
export class CambiarContrasenaDialogComponent implements OnInit {
  form!: FormGroup;
  guardando = false;
  errorGuardado = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    public dialogRef: MatDialogRef<CambiarContrasenaDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      contrasena_actual:    ['', Validators.required],
      nueva_contrasena:     ['', [Validators.required, Validators.minLength(8)]],
      confirmar_contrasena: ['', Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    if (this.form.value.nueva_contrasena !== this.form.value.confirmar_contrasena) {
      this.errorGuardado = 'Las contraseñas no coinciden.';
      return;
    }
    this.guardando = true;
    this.errorGuardado = '';
    this.adminService.cambiarContrasenaPropia(this.form.value).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: any) => {
        this.guardando = false;
        this.errorGuardado = err?.error?.detail || 'Error al cambiar la contraseña.';
      }
    });
  }
}
