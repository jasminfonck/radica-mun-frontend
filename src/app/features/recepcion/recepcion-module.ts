import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule }           from '@angular/material/card';
import { MatButtonModule }         from '@angular/material/button';
import { MatIconModule }           from '@angular/material/icon';
import { MatFormFieldModule }      from '@angular/material/form-field';
import { MatInputModule }          from '@angular/material/input';
import { MatSelectModule }         from '@angular/material/select';
import { MatTableModule }          from '@angular/material/table';
import { MatListModule }           from '@angular/material/list';
import { MatTooltipModule }        from '@angular/material/tooltip';
import { MatProgressBarModule }    from '@angular/material/progress-bar';
import { MatTabsModule }           from '@angular/material/tabs';

import { RecepcionRoutingModule }     from './recepcion-routing-module';
import { BandejaComponent }           from './pages/bandeja/bandeja';
import { NuevaRecepcionComponent }    from './pages/nueva/nueva-recepcion';
import { DetalleRecepcionComponent }  from './pages/detalle/detalle-recepcion';

@NgModule({
  declarations: [
    BandejaComponent,
    NuevaRecepcionComponent,
    DetalleRecepcionComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RecepcionRoutingModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatListModule, MatTooltipModule,
    MatProgressBarModule, MatTabsModule,
  ]
})
export class RecepcionModule {}
