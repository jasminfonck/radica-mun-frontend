import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatCardModule }        from '@angular/material/card';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatTableModule }       from '@angular/material/table';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ConsultaRoutingModule }        from './consulta-routing-module';
import { DashboardConsultaComponent }   from './pages/dashboard/dashboard-consulta';
import { BusquedaAvanzadaComponent }    from './pages/busqueda/busqueda-avanzada';
import { AuditoriaComponent }           from './pages/auditoria/auditoria';

@NgModule({
  declarations: [
    DashboardConsultaComponent,
    BusquedaAvanzadaComponent,
    AuditoriaComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConsultaRoutingModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatTooltipModule, MatProgressBarModule,
  ],
})
export class ConsultaModule {}
