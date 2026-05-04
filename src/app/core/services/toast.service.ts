import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {

  constructor(private snack: MatSnackBar) {}

  exito(mensaje: string, duracion = 4000): void {
    this.snack.open(mensaje, '✕', {
      duration: duracion,
      panelClass: ['toast', 'toast-exito'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  error(mensaje: string, duracion = 7000): void {
    this.snack.open(mensaje, '✕', {
      duration: duracion,
      panelClass: ['toast', 'toast-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  advertencia(mensaje: string, duracion = 7000): void {
    this.snack.open(mensaje, '✕', {
      duration: duracion,
      panelClass: ['toast', 'toast-advertencia'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  info(mensaje: string, duracion = 5000): void {
    this.snack.open(mensaje, '✕', {
      duration: duracion,
      panelClass: ['toast', 'toast-info'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  infoConAccion(
    mensaje: string,
    textoAccion: string,
    duracion = 8000,
  ): MatSnackBarRef<any> {
    return this.snack.open(mensaje, textoAccion, {
      duration: duracion,
      panelClass: ['toast', 'toast-info'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
