import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InicioComponent } from './inicio';

@NgModule({
  declarations: [InicioComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: InicioComponent }])
  ]
})
export class InicioModule {}
