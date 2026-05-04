import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdminService } from '../services/admin.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SistemaListoGuard implements CanActivate {

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.adminService.getEstadoSistema().pipe(
      map(estado => {
        if (estado.sistema_listo) return true;

        if (this.auth.tieneRol('administrador')) {
          this.toast.infoConAccion(
            'La configuración del sistema no está completa. Complete todos los pasos.',
            'Ir a configuración',
          ).onAction().subscribe(() => this.router.navigate(['/admin']));
          return this.router.createUrlTree(['/admin']);
        }

        this.toast.advertencia('El sistema aún no está habilitado. Contacte al administrador.');
        this.auth.logout();
        return this.router.createUrlTree(['/login']);
      }),
      catchError(() => {
        if (this.auth.tieneRol('administrador')) {
          return of(this.router.createUrlTree(['/admin']));
        }
        this.auth.logout();
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }
}
