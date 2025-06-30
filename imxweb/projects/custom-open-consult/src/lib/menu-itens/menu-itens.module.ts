import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddMenuService } from './add-menu.service';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers:[
    AddMenuService
  ]
})
export class MenuItensModule{
  constructor(private readonly addMenu: AddMenuService){
    console.log('[OpenConsult] Modulo [menu-itens] iniciado com sucesso !!');
  }
}
