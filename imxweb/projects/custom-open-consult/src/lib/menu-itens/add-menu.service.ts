import { Injectable } from '@angular/core';
import { ProjectConfig } from '@imx-modules/imx-api-qbm';
import { MenuService, MenuItem} from 'qbm';

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

      const menuObj: MenuItem = {
        id: 'ROOT_OPENCONSULT',
        title: '#LDS#Open Consult Telas',
        items: []
      }

      //if(groups.includes('CCC_OpenConsult'))
      if(groups.includes('VI_4_ALLUSER')){
        menuObj.items?.push({
            id: 'OPEN_CONSULT_CREATE_USER',
            route: 'create-user',
            title: '#LDS#Criar usuarios'
          })
      }
      return menuObj;
    })
  }
}
