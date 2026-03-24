import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { LayoutComponent } from './core/layout/layout';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/login/login-module').then(m => m.LoginModule) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'inicio',    loadChildren: () => import('./features/inicio/inicio-module').then(m => m.InicioModule) },
      { path: 'admin',     loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule) },
      { path: 'recepcion', loadChildren: () => import('./features/recepcion/recepcion-module').then(m => m.RecepcionModule) },
      { path: 'radicado',  loadChildren: () => import('./features/radicado/radicado-module').then(m => m.RadicadoModule) },
      { path: 'consulta',  loadChildren: () => import('./features/consulta/consulta-module').then(m => m.ConsultaModule) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
