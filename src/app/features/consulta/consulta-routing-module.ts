import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardConsultaComponent } from './pages/dashboard/dashboard-consulta';
import { BusquedaAvanzadaComponent }  from './pages/busqueda/busqueda-avanzada';
import { ReportesComponent }          from './pages/reportes/reportes';
import { AuditoriaComponent }         from './pages/auditoria/auditoria';

const routes: Routes = [
  { path: '',           component: DashboardConsultaComponent },
  { path: 'busqueda',   component: BusquedaAvanzadaComponent },
  { path: 'reportes',   component: ReportesComponent },
  { path: 'auditoria',  component: AuditoriaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultaRoutingModule {}
