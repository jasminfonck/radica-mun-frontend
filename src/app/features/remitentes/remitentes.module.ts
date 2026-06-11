import { NgModule } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule }        from '@angular/router';

import { MatCardModule }        from '@angular/material/card';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatTableModule }       from '@angular/material/table';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule }       from '@angular/material/chips';
import { MatCheckboxModule }    from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule }   from '@angular/material/paginator';
import { MatSnackBarModule }    from '@angular/material/snack-bar';
import { MatDividerModule }     from '@angular/material/divider';

import { RemitentesRoutingModule }   from './remitentes-routing.module';
import { ListaRemitentesComponent }  from './pages/lista/lista-remitentes';
import { EditarRemitenteComponent }  from './pages/editar/editar-remitente';

@NgModule({
  declarations: [
    ListaRemitentesComponent,
    EditarRemitenteComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    RemitentesRoutingModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatTooltipModule, MatProgressBarModule,
    MatChipsModule, MatCheckboxModule, MatSlideToggleModule,
    MatPaginatorModule, MatSnackBarModule, MatDividerModule,
  ],
})
export class RemitentesModule {}
