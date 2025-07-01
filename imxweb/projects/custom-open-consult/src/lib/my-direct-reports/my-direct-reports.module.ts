import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyDirectReportsComponent } from './pages/my-direct-reports/my-direct-reports.component';
import { MyDirectReportsRoutingModule } from './my-direct-reports-routing.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [MyDirectReportsComponent],
  imports: [
    CommonModule,
    MyDirectReportsRoutingModule,
    FormsModule,
  ]
})
export class MyDirectReportsModule { }
