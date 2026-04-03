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

import { RadicadoRoutingModule }      from './radicado-routing-module';
import { BandejaRadicadosComponent }  from './pages/bandeja/bandeja-radicados';
import { DetalleRadicadoComponent }   from './pages/detalle/detalle-radicado';

@NgModule({
  declarations: [
    BandejaRadicadosComponent,
    DetalleRadicadoComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RadicadoRoutingModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatTooltipModule, MatProgressBarModule,
  ],
})
export class RadicadoModule {}
