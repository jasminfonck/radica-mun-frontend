import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent }    from './pages/dashboard/admin-dashboard';
import { EntidadComponent }           from './pages/entidad/entidad';
import { UsuariosComponent }          from './pages/usuarios/usuarios';
import { DependenciasComponent }      from './pages/dependencias/dependencias';
import { CanalesComponent }           from './pages/canales/canales';
import { CatalogosComponent }         from './pages/catalogos/catalogos';
import { ConfiguracionComponent }     from './pages/configuracion/configuracion';

const routes: Routes = [
  { path: '',              component: AdminDashboardComponent },
  { path: 'entidad',       component: EntidadComponent },
  { path: 'usuarios',      component: UsuariosComponent },
  { path: 'dependencias',  component: DependenciasComponent },
  { path: 'canales',       component: CanalesComponent },
  { path: 'catalogos',     component: CatalogosComponent },
  { path: 'configuracion', component: ConfiguracionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
