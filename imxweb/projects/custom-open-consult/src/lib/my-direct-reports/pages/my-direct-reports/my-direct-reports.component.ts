import { Component } from '@angular/core';
import { QerApiService } from 'qer';

@Component({
  selector: 'lib-my-direct-reports',
  templateUrl: './my-direct-reports.component.html',
  styleUrl: './my-direct-reports.component.css'
})
export class MyDirectReportsComponent {
  constructor(private readonly qerApi: QerApiService){
    this.init();
  }
  public subordinates: any[] = [];
  public selectedEntity: any;
  public selectedUserUid = '';
  public formData = {
    fullName: '',
    email: '',
    phone: '',
    isActive: true
  };

  private async init(): Promise<void>{
    const result = await this.qerApi.typedClient.PortalPersonReports.Get({OnlyDirect: true});
    this.subordinates = result.Data;
  }

  async onUserSelect(): Promise<void> {
    if (!this.selectedUserUid) return;

    const result = await this.qerApi.typedClient.PortalPersonReportsInteractive.Get_byid(this.selectedUserUid);
    const user = result.Data[0];

    const entity = user.GetEntity();
    this.formData.fullName = `${entity.GetColumn('LastName').GetValue()}, ${entity.GetColumn('FirstName').GetValue()}`;
    this.formData.email = entity.GetColumn('DefaultEmailAddress').GetValue();
    //this.formData.phone = entity.GetColumn('Phone').GetValue();
    this.formData.isActive = !entity.GetColumn('IsInActive').GetValue();

    this.selectedEntity = entity; 
  }

  async save(): Promise<void> {
    if (!this.selectedEntity) return;

    this.selectedEntity.GetColumn('DefaultEmailAddress').PutValue(this.formData.email);
    //this.selectedEntity.GetColumn('Phone').PutValue(this.formData.phone);
    this.selectedEntity.GetColumn('IsInActive').PutValue(!this.formData.isActive);
    await this.selectedEntity.Commit();
    alert('Dados Alterados !');
  }
}
