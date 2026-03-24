import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Sprint 2 — HU-02: se desarrollará aquí la recepción multicanal
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', template: '<p>Módulo de Recepción — en desarrollo (Sprint 2)</p>' }
    ] as any)
  ]
})
export class RecepcionModule {}
