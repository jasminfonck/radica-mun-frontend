import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, UsuarioOut, Rol } from '../../../../core/services/admin.service';
import { UsuarioDialogComponent } from './usuario-dialog';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.html',
  standalone: false
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuarioOut[] = [];
  roles: Rol[] = [];
  columnas = ['nombre', 'email', 'rol', 'estado', 'acciones'];

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    forkJoin({
      usuarios: this.adminService.getUsuarios(),
      roles:    this.adminService.getRoles(),
    }).subscribe({
      next: ({ usuarios, roles }) => {
        this.usuarios = usuarios;
        this.roles    = roles;
        this.cdr.markForCheck();
      },
    });
  }

  abrirDialogo(usuario?: UsuarioOut): void {
    this.dialog.open(UsuarioDialogComponent, {
      width: '500px',
      data: { usuario, roles: this.roles }
    }).afterClosed().subscribe(guardado => { if (guardado) this.cargar(); });
  }

  toggleEstado(usuario: UsuarioOut): void {
    this.adminService.actualizarUsuario(usuario.id, { activo: !usuario.activo }).subscribe({
      next: () => this.cargar(),
      error: err => {
        const msg = err?.error?.detail || 'No se pudo actualizar el usuario.';
        this.snack.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }
}
