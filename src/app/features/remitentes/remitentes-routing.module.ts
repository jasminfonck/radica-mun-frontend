import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaRemitentesComponent } from './pages/lista/lista-remitentes';
import { EditarRemitenteComponent }  from './pages/editar/editar-remitente';

const routes: Routes = [
  { path: '',           component: ListaRemitentesComponent },
  { path: ':id/editar', component: EditarRemitenteComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RemitentesRoutingModule {}
