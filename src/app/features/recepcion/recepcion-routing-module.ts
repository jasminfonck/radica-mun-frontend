import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BandejaComponent }           from './pages/bandeja/bandeja';
import { NuevaRecepcionComponent }    from './pages/nueva/nueva-recepcion';
import { DetalleRecepcionComponent }  from './pages/detalle/detalle-recepcion';

const routes: Routes = [
  { path: '',        component: BandejaComponent },
  { path: 'nueva',   component: NuevaRecepcionComponent },
  { path: ':id',     component: DetalleRecepcionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecepcionRoutingModule {}
