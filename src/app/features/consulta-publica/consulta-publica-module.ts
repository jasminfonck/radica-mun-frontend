import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatCardModule }        from '@angular/material/card';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule }     from '@angular/material/divider';

import { ConsultaPublicaRoutingModule }  from './consulta-publica-routing';
import { ConsultaPublicaComponent }      from './consulta-publica';
import { AccessibilityWidgetComponent }  from '../formulario-publico/accessibility-widget/accessibility-widget.component';

@NgModule({
  declarations: [ConsultaPublicaComponent],
  imports: [
    CommonModule,
    AccessibilityWidgetComponent,
    ReactiveFormsModule,
    ConsultaPublicaRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
})
export class ConsultaPublicaModule {}
