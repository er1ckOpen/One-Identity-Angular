import { Injectable } from '@angular/core';
import { ProjectConfig } from '@imx-modules/imx-api-qbm';
import { MenuService } from 'qbm';

@Injectable({
  providedIn: 'root'
})
export class AddMenuService {

  constructor(private readonly menuService: MenuService){
    console.log('[OpenConsult] Service [add-menu] iniciado com sucesso !!');
    this.registerMenu();
  }

  private registerMenu(): void{
    this.menuService.addMenuFactories((preProps: string[], features: string[], projectConfig: ProjectConfig, groups: string[])=>{
      return{
        id: 'ROOT_OPENCONSULT',
        title: '#LDS#Open Consult Telas',
        items: [
          {
            id: 'OPEN_CONSULT_CREATE_USER',
            route: 'create-user',
            title: '#LDS#Criar usuarios'
          },
        ]
      }
    })
  }
}
