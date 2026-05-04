import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormularioPublicoComponent } from './formulario-publico';

const routes: Routes = [
  { path: '', component: FormularioPublicoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormularioPublicoRoutingModule {}
