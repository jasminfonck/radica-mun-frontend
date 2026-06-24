import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultaPublicaComponent } from './consulta-publica';

const routes: Routes = [
  { path: '', component: ConsultaPublicaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultaPublicaRoutingModule {}
