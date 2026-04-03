import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BandejaRadicadosComponent } from './pages/bandeja/bandeja-radicados';
import { DetalleRadicadoComponent }  from './pages/detalle/detalle-radicado';

const routes: Routes = [
  { path: '',    component: BandejaRadicadosComponent },
  { path: ':id', component: DetalleRadicadoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RadicadoRoutingModule {}
