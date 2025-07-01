import { Component, OnInit } from '@angular/core';
import { QerApiService } from 'qer';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css'
})
export class CreateUserComponent implements OnInit {
  public identity: any;
  public isLoading = true;
  public formData = {
    firstName: '',
    lastName: '',
    personnelNumber: '',
    email: '',
    isThirdParty: false,
    company: ''
  };


  constructor(
    private readonly qerApi: QerApiService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const response = await this.qerApi.typedClient.PortalPersonReportsInteractive.Get();
    this.identity = response.Data[0];
    this.isLoading = false;
    
  }

  async save(): Promise<void> {
    const entity = this.identity.GetEntity();
    entity.GetColumn('FirstName').PutValue(this.formData.firstName);
    entity.GetColumn('LastName').PutValue(this.formData.lastName);
    entity.GetColumn('DefaultEmailAddress').PutValue(this.formData.email);
    entity.GetColumn('PersonnelNumber').PutValue(this.formData.personnelNumber);
    //entity.GetColumn('CompanyMember').PutValue(this.formData.company);
    //entity.GetColumn('UID_PersonHead').PutValue('5d7a90fb-c04d-4ade-92df-5a6dd605185d');

    if(this.formData.isThirdParty){
      entity.GetColumn('EmployeeType').PutValue('Partner');
      entity.GetColumn('IsExternal').PutValue(this.formData.isThirdParty);
    }
    else entity.GetColumn('EmployeeType').PutValue('Employee');

    await entity.Commit(false);
    this.router.navigate(['/dashboard']); // redireciona após salvar
  }

  cancel(): void {
    this.router.navigate(['/dashboard']); // ou para onde preferir
  }
}
