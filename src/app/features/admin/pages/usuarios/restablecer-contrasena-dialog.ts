import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminService, UsuarioOut, nombreCompleto } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-restablecer-contrasena-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Restablecer contraseña</h2>
    <mat-dialog-content>
      <p class="texto-usuario">Usuario: <strong>{{ nombre }}</strong> ({{ data.usuario.email }})</p>
      <form [formGroup]="form" class="form-dialogo">
        <mat-form-field appearance="outline" class="campo-ancho">
          <mat-label>Nueva contraseña *</mat-label>
          <input matInput formControlName="nueva_contrasena" type="password">
          <mat-error *ngIf="form.get('nueva_contrasena')?.hasError('required')">Obligatorio</mat-error>
          <mat-error *ngIf="form.get('nueva_contrasena')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
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
        {{ guardando ? 'Guardando...' : 'Restablecer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-dialogo { display:flex; flex-direction:column; gap:4px; padding-top:8px; min-width:320px; }
    .campo-ancho { width:100%; }
    .texto-usuario { margin-top:0; color:rgba(0,0,0,.6); }
  `]
})
export class RestablecerContrasenaDialogComponent implements OnInit {
  form!: FormGroup;
  guardando = false;
  errorGuardado = '';
  nombre = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    public dialogRef: MatDialogRef<RestablecerContrasenaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: UsuarioOut }
  ) {}

  ngOnInit(): void {
    this.nombre = nombreCompleto(this.data.usuario);
    this.form = this.fb.group({
      nueva_contrasena: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.errorGuardado = '';
    this.adminService.restablecerContrasena(this.data.usuario.id, this.form.value).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: any) => {
        this.guardando = false;
        this.errorGuardado = err?.error?.detail || 'Error al restablecer la contraseña.';
      }
    });
  }
}
