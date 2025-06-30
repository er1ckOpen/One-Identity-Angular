import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LockUnlockIdentitiesComponent } from './pages/lock-unlock-identities/lock-unlock-identities.component';

const routes: Routes = [
  {
    path: 'lock-unlock-identities',
    component: LockUnlockIdentitiesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LockUnlockIdentitiesRoutingModule { }
