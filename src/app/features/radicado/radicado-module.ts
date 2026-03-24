import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Sprint 4 — HU-04: se desarrollará aquí la radicación y constancias
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', template: '<p>Módulo de Radicado — en desarrollo (Sprint 4)</p>' }
    ] as any)
  ]
})
export class RadicadoModule {}
