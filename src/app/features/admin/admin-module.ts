import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule }             from '@angular/material/card';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatTableModule }            from '@angular/material/table';
import { MatDialogModule }           from '@angular/material/dialog';
import { MatSelectModule }           from '@angular/material/select';
import { MatChipsModule }            from '@angular/material/chips';
import { MatSlideToggleModule }      from '@angular/material/slide-toggle';
import { MatTabsModule }             from '@angular/material/tabs';
import { MatListModule }             from '@angular/material/list';
import { MatTooltipModule }          from '@angular/material/tooltip';
import { MatProgressBarModule }      from '@angular/material/progress-bar';
import { MatSnackBarModule }         from '@angular/material/snack-bar';

import { AdminRoutingModule }        from './admin-routing-module';

// Páginas
import { AdminDashboardComponent }   from './pages/dashboard/admin-dashboard';
import { EntidadComponent }          from './pages/entidad/entidad';
import { UsuariosComponent }         from './pages/usuarios/usuarios';
import { UsuarioDialogComponent }    from './pages/usuarios/usuario-dialog';
import { DependenciasComponent }     from './pages/dependencias/dependencias';
import { CanalesComponent }          from './pages/canales/canales';
import { CatalogosComponent }        from './pages/catalogos/catalogos';
import { ConfiguracionComponent }    from './pages/configuracion/configuracion';
import { AuditoriaComponent }        from './pages/auditoria/auditoria';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    EntidadComponent,
    UsuariosComponent,
    UsuarioDialogComponent,
    DependenciasComponent,
    CanalesComponent,
    CatalogosComponent,
    ConfiguracionComponent,
    AuditoriaComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatTableModule, MatDialogModule, MatSelectModule,
    MatChipsModule, MatSlideToggleModule, MatTabsModule,
    MatListModule, MatTooltipModule, MatProgressBarModule,
    MatSnackBarModule,
  ]
})
export class AdminModule {}
