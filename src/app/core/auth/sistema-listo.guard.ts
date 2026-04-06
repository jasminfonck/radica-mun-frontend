import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';

@Injectable({ providedIn: 'root' })
export class SistemaListoGuard implements CanActivate {

  constructor(
    private adminService: AdminService,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.adminService.getEstadoSistema().pipe(
      map(estado => {
        if (estado.sistema_listo) return true;

        this.snack.open(
          'La configuración del sistema no está completa. Complete todos los pasos en Administración.',
          'Ir a configuración',
          { duration: 7000, panelClass: 'snack-advertencia' }
        ).onAction().subscribe(() => this.router.navigate(['/admin']));

        return this.router.createUrlTree(['/admin']);
      }),
      catchError(() => of(this.router.createUrlTree(['/admin'])))
    );
  }
}
