import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatCardModule }          from '@angular/material/card';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatSelectModule }        from '@angular/material/select';
import { MatButtonModule }        from '@angular/material/button';
import { MatIconModule }          from '@angular/material/icon';
import { MatDividerModule }       from '@angular/material/divider';
import { MatRadioModule }         from '@angular/material/radio';
import { MatCheckboxModule }      from '@angular/material/checkbox';
import { MatProgressBarModule }   from '@angular/material/progress-bar';

import { FormularioPublicoRoutingModule } from './formulario-publico-routing';
import { FormularioPublicoComponent }     from './formulario-publico';

@NgModule({
  declarations: [FormularioPublicoComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormularioPublicoRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatProgressBarModule,
  ],
})
export class FormularioPublicoModule {}
