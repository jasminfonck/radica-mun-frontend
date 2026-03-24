import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdminService, UsuarioOut, Rol } from '../../../../core/services/admin.service';
import { UsuarioDialogComponent } from './usuario-dialog';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.html',
  standalone: false
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuarioOut[] = [];
  roles: Rol[] = [];
  columnas = ['nombre', 'email', 'rol', 'estado', 'acciones'];

  constructor(private adminService: AdminService, private dialog: MatDialog) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.adminService.getUsuarios().subscribe(u => this.usuarios = u);
    this.adminService.getRoles().subscribe(r => this.roles = r);
  }

  abrirDialogo(usuario?: UsuarioOut): void {
    this.dialog.open(UsuarioDialogComponent, {
      width: '500px',
      data: { usuario, roles: this.roles }
    }).afterClosed().subscribe(guardado => { if (guardado) this.cargar(); });
  }

  toggleEstado(usuario: UsuarioOut): void {
    this.adminService.actualizarUsuario(usuario.id, { activo: !usuario.activo })
      .subscribe(() => this.cargar());
  }
}
