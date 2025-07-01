import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyDirectReportsComponent } from './pages/my-direct-reports/my-direct-reports.component';

const routes: Routes = [
  {
    path: 'direct-reports',
    component: MyDirectReportsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyDirectReportsRoutingModule { }
