import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminService, UsuarioOut, Rol } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-usuario-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>{{ data.usuario ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-dialogo">
        <div class="fila-nombres">
          <mat-form-field appearance="outline" class="campo-nombre">
            <mat-label>Nombre(s) *</mat-label>
            <input matInput formControlName="nombre">
            <mat-error *ngIf="form.get('nombre')?.hasError('required')">Obligatorio</mat-error>
            <mat-error *ngIf="form.get('nombre')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="campo-nombre">
            <mat-label>Apellido(s)</mat-label>
            <input matInput formControlName="apellido">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="campo-ancho">
          <mat-label>Correo electrónico *</mat-label>
          <input matInput formControlName="email" type="email" inputmode="email">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Obligatorio</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Ingrese un correo electrónico válido</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="campo-ancho" *ngIf="!data.usuario">
          <mat-label>Contraseña inicial *</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-error>Mínimo 6 caracteres</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="campo-ancho">
          <mat-label>Rol *</mat-label>
          <mat-select formControlName="rol_id">
            <mat-option *ngFor="let rol of data.roles" [value]="rol.id">{{ rol.nombre }}</mat-option>
          </mat-select>
          <mat-error>Obligatorio</mat-error>
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
    .form-dialogo { display:flex; flex-direction:column; gap:4px; padding-top:8px; }
    .campo-ancho { width:100%; }
    .fila-nombres { display:flex; gap:12px; }
    .campo-nombre { flex:1; }
  `]
})
export class UsuarioDialogComponent implements OnInit {
  form!: FormGroup;
  guardando = false;
  errorGuardado = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    public dialogRef: MatDialogRef<UsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario?: UsuarioOut; roles: Rol[] }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre:   [this.data.usuario?.nombre   || '', [Validators.required, Validators.minLength(2)]],
      apellido: [this.data.usuario?.apellido || ''],
      email:    [this.data.usuario?.email    || '', [Validators.required, Validators.email]],
      password: ['', this.data.usuario ? [] : [Validators.required, Validators.minLength(6)]],
      rol_id:   [this.data.usuario?.rol?.id  || null, Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.errorGuardado = '';
    const obs = this.data.usuario
      ? this.adminService.actualizarUsuario(this.data.usuario.id, this.form.value)
      : this.adminService.crearUsuario(this.form.value);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: any) => {
        this.guardando = false;
        this.errorGuardado = err?.error?.detail || 'Error al guardar el usuario.';
      }
    });
  }
}
