import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestAccessRoutingModule } from './request-access-routing.module';
import { RequestAccessComponent } from './pages/request-access/request-access.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [RequestAccessComponent],
  imports: [
    CommonModule,
    RequestAccessRoutingModule,
    FormsModule,
  ]
})
export class RequestAccessModule { }
