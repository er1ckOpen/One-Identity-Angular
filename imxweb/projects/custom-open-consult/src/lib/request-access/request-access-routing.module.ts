import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequestAccessComponent } from './pages/request-access/request-access.component';

const routes: Routes = [
  {
    path: 'request-access',
    component: RequestAccessComponent
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequestAccessRoutingModule { }
