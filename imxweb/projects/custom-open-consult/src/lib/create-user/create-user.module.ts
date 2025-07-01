import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateUserComponent } from './pages/create-user/create-user.component';
import { CreateUserRoutingModule } from './create-user-routing.module';
import { EuiCoreModule } from '@elemental-ui/core';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [CreateUserComponent],
  imports: [
    CommonModule,
    CreateUserRoutingModule,
    EuiCoreModule,
    FormsModule,
  ]
})
export class CreateUserModule{ 
}
