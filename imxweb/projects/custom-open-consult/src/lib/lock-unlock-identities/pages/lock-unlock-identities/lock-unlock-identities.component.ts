import { Component } from '@angular/core';
import { SideNavigationComponent } from 'qbm';
import { MyResponsibilitiesRegistryService } from 'qer';

@Component({
  selector: 'lib-lock-unlock-identities',
  templateUrl: './lock-unlock-identities.component.html',
  styleUrl: './lock-unlock-identities.component.css'
})
export class LockUnlockIdentitiesComponent implements SideNavigationComponent{
  public data?: any;
  public contextId?: string | undefined;
  constructor(private myResponsibilitiesRegistryService: MyResponsibilitiesRegistryService){}

}
