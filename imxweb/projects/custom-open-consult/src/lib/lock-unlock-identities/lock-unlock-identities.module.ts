import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LockUnlockIdentitiesRoutingModule } from './lock-unlock-identities-routing.module';
import { LockUnlockIdentitiesComponent } from './pages/lock-unlock-identities/lock-unlock-identities.component';
import { MyResponsibilitiesRegistryService } from 'qer';
import { HELP_CONTEXTUAL } from 'qbm';
import { ProjectConfig } from '@imx-modules/imx-api-qbm';


@NgModule({
  declarations: [LockUnlockIdentitiesComponent],
  imports: [
    CommonModule,
    LockUnlockIdentitiesRoutingModule,
    ReactiveFormsModule,
  ]
})
export class LockUnlockIdentitiesModule{
  constructor(private myResponsibilitiesRegistryService: MyResponsibilitiesRegistryService){
    console.log('[OpenConsult] Modulo [LockUnlockIdentitiesModule] iniciado com sucesso');
    this.setup();
  }
  
  private setup(): void{
    this.myResponsibilitiesRegistryService.registerFactory((preProps: string[], features: string[], projectConfig: ProjectConfig, groups: string[])=>{
      return{
        instance: LockUnlockIdentitiesComponent,
        sortOrder: 7,
        name: 'identities',
        caption: '#LDS#Lock/Unlock identities'
      }
    })
  }
}
