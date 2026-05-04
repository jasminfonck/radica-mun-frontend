import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { AdminGuard } from './core/auth/admin.guard';
import { SistemaListoGuard } from './core/auth/sistema-listo.guard';
import { LayoutComponent } from './core/layout/layout';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/login/login-module').then(m => m.LoginModule) },
  { path: 'formulario', loadChildren: () => import('./features/formulario-publico/formulario-publico-module').then(m => m.FormularioPublicoModule) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'inicio',    canActivate: [SistemaListoGuard], loadChildren: () => import('./features/inicio/inicio-module').then(m => m.InicioModule) },
      { path: 'admin',     canActivate: [AdminGuard],          loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule) },
      { path: 'recepcion', canActivate: [SistemaListoGuard], loadChildren: () => import('./features/recepcion/recepcion-module').then(m => m.RecepcionModule) },
      { path: 'radicado',  canActivate: [SistemaListoGuard], loadChildren: () => import('./features/radicado/radicado-module').then(m => m.RadicadoModule) },
      { path: 'consulta',  canActivate: [SistemaListoGuard], loadChildren: () => import('./features/consulta/consulta-module').then(m => m.ConsultaModule) },
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
