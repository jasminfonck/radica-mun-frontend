import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InicioComponent } from './inicio';

@NgModule({
  declarations: [InicioComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: InicioComponent }]),
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ]
})
export class InicioModule {}
