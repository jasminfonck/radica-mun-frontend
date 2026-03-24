import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Sprint 5 — HU-05: se desarrollará aquí la consulta, reportes y auditoría
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', template: '<p>Módulo de Consulta — en desarrollo (Sprint 5)</p>' }
    ] as any)
  ]
})
export class ConsultaModule {}
