import { Component, OnInit } from '@angular/core';
import { QerApiService } from 'qer';
import { UserModelService } from 'qer';
import { QerPermissionsService } from 'qer';
import { imx_SessionService as SessionService } from 'qbm';
import { Router } from '@angular/router';

interface Resource {
  uid?: string;
  display?: string;
  desc?: string;
}

@Component({
  selector: 'lib-request-access',
  templateUrl: './request-access.component.html',
  styleUrl: './request-access.component.css',
})
export class RequestAccessComponent implements OnInit {
  constructor(
    private readonly qerApi: QerApiService,
    private readonly userService: UserModelService,
    private readonly permissionService: QerPermissionsService,
    private readonly session: SessionService,
    private readonly router: Router,
  ) {}

  products: any = {};
  productKeys: string[] = [];
  selectedSystemUid: string = '';
  selectedSystemDisplay: string = '';
  availableAccesses: any[] = [];
  selectedAccesses: any[] = [];
  justificativa: string = '';
  itemsPerPage = 5;
  list_users: any[] = [];

  // Controle de página
  availablePage = 1;
  selectedPage = 1;

  showUserSelect: boolean = false;
  selectedUserUid: string = '';

  endDate = '';
  startDate = '';

  async ngOnInit(): Promise<void> {
    const categories = await this.qerApi.v2Client.portal_servicecategories_get();
    const serviceItems = await this.qerApi.v2Client.portal_serviceitems_get();
    //const vItShopv2 = await this.qerApi.v2Client.portal_itshop_cart_get();

    const entities_category = categories.Entities ?? [];
    const entities_serviceItems = serviceItems.Entities ?? [];

    for (let i = 0; i < entities_category.length; i++) {
      const uid_category = entities_category[i].Keys?.[0];
      const display_category = entities_category[i].LongDisplay;

      if (uid_category) {
        this.products[uid_category] = {
          uid: uid_category,
          display: display_category,
          serviceItems: [],
        };
      }

      for (let j = 0; j < entities_serviceItems.length; j++) {
        const uid_service = entities_serviceItems[j].Keys?.[0];
        const uid_service_category = entities_serviceItems[j].Columns?.UID_AccProductGroup?.Value;

        if (uid_category) {
          if (uid_service_category && uid_category === uid_service_category) {
            const service = {
              uid: uid_service,
              display: entities_serviceItems[j].LongDisplay,
              desc: entities_serviceItems[j].Columns?.Description?.DisplayValue,
              selected: false,
            };
            this.products[uid_category].serviceItems.push(service);
          }
        }
      }
    }

    this.productKeys = Object.keys(this.products);
    console.log('[DEBUG] Produtos carregados:', this.products);

    if (await this.isAdminOrSegInfo()) {
      this.showUserSelect = true;
      let allUsers = await this.qerApi.v2Client.portal_person_all_get();
      let entities = allUsers.Entities ?? [];
      for (let i = 0; i < entities.length; i++) {
        let user_uid = entities[i].Keys?.[0];
        let user_display = entities[i].Display;
        this.list_users.push({ uid: user_uid, display: user_display });
      }
      if (!this.selectedUserUid) {
        this.selectedUserUid = this.session.SessionState?.UserUid || '';
      }
    }
  }

  async isAdminOrSegInfo(): Promise<boolean> {
    const user_groups = await this.userService.getGroups();
    const isAdmin = await this.permissionService.isPersonAdmin();
    let userContainsGroup = false;

    for (let i = 0; i < user_groups.length; i++) {
      if (user_groups[i].Name == 'CCC_OpenConsult') {
        userContainsGroup = true;
        break;
      }
    }

    if (isAdmin && userContainsGroup) return true;
    else return false;
  }

  onSystemChange() {
    const selected = this.products[this.selectedSystemUid];
    this.selectedSystemDisplay = selected.display;
    this.availableAccesses = selected.serviceItems.map((item: any) => ({
      ...item,
      selected: false,
    }));
    this.availablePage = 1; // Resetar página
  }

  adicionar() {
    const adicionados = this.availableAccesses.filter((item) => item.selected && !this.selectedAccesses.some((sa) => sa.uid === item.uid));
    this.selectedAccesses.push(...adicionados.map((a) => ({ ...a, selected: false })));
  }

  cancelar() {
    this.selectedAccesses = this.selectedAccesses.filter((item) => !item.selected);
  }

  async handleSubmit(): Promise<void> {
    const finalAccess = this.selectedAccesses;
    const reason = this.justificativa;
    const dataProducts: any[] = [];
    const cartItems: any[] = [];
    let result: any;
    let startDateObj: any;
    let endDateObj: any;
    let recipient = this.selectedUserUid || this.session.SessionState?.UserUid;

    if (this.startDate) {
      const [startDateY, startDateM, startDateD] = this.startDate.split('-');
      startDateObj = new Date(+startDateY, +startDateM - 1, +startDateD);
    } else startDateObj = null;

    if (this.endDate) {
      const [endDateY, endDateM, endDateD] = this.endDate.split('-');
      endDateObj = new Date(+endDateY, +endDateM - 1, +endDateD);
    } else endDateObj = null;

    if (!reason.trim()) {
      alert('Justificativa é obrigatória!');
      return;
    }

    console.log('[ENVIAR] Acessos selecionados:', finalAccess);
    console.log('[ENVIAR] Justificativa:', reason);
    console.log('[ENVIAR] Data de inicio:', this.startDate);
    console.log('[ENVIAR] Data de fim', this.endDate);

    const itshop_cart = await this.qerApi.typedClient.PortalCartitem.Get();

    // Preenche uma lista de productos para transformar em itens "Requestables"
    for (let i = 0; i < finalAccess.length; i++) {
      for (let j = 0; j < itshop_cart.Data.length; j++) {
        const cartItem = itshop_cart.Data[j];
        const sameProduct = finalAccess[i].uid === cartItem.UID_AccProduct.value;
        const sameRecipient = recipient === cartItem.UID_PersonOrdered.value;

        if (sameProduct && sameRecipient) {
          // Buscar o nome do usuário
          const recipientUser = this.list_users.find((u) => u.uid === recipient);
          const recipientName = recipientUser ? recipientUser.display : 'Usuário desconhecido';

          // Buscar todos os nomes de produtos selecionados
          const produtosNomes = finalAccess.map((a) => a.display).join(', ');

          alert(`O(s) produto(s) já foram adicionados ao carrinho para o usuário: ${recipientName}.\n` + `Produtos: ${produtosNomes}`);
          return;
        }
      }

      dataProducts.push({
        UidAccProduct: finalAccess[i].uid,
        UidPerson: recipient,
      });
    }

    // Preenchendo os itens e enviando para o carrinho
    const servicesforperson = await this.qerApi.v2Client.portal_itshop_findproducts_post(dataProducts);
    for (let i = 0; i < servicesforperson.length; i++) {
      const cartItem = this.qerApi.typedClient.PortalCartitem.createEntity();
      cartItem.UID_PersonOrdered.value = this.selectedUserUid || this.session.SessionState?.UserUid || '';
      cartItem.UID_ITShopOrg.value = servicesforperson[i].UidITShopOrg || '';
      cartItem.ValidFrom.value = startDateObj;
      cartItem.ValidUntil.value = endDateObj;
      cartItem.OrderReason.value = reason;
      cartItems.push(cartItem);
      result = await this.qerApi.typedClient.PortalCartitem.Post(cartItem);
      cartItems.push(result);
    }

     alert('Solicitação enviada com sucesso! Você será redirecionado para a tela inicial.');

      setTimeout(() => {
        this.router.navigate(['/dashboard']); // ou '/', ou qualquer rota que seja sua tela de início
      }, 2000);

    if (this.showUserSelect) {
      console.log('[ENVIAR] Usuário selecionado:', this.selectedUserUid);
    }
  }

  // Paginação: Acessos disponíveis
  paginatedAvailableAccesses() {
    const start = (this.availablePage - 1) * this.itemsPerPage;
    return this.availableAccesses.slice(start, start + this.itemsPerPage);
  }
  availableTotalPages(): number {
    return Math.ceil(this.availableAccesses.length / this.itemsPerPage);
  }

  // Paginação: Acessos selecionados
  paginatedSelectedAccesses() {
    const start = (this.selectedPage - 1) * this.itemsPerPage;
    return this.selectedAccesses.slice(start, start + this.itemsPerPage);
  }
  selectedTotalPages(): number {
    return Math.ceil(this.selectedAccesses.length / this.itemsPerPage);
  }

  // Navegação
  nextPage(type: 'available' | 'selected') {
    if (type === 'available' && this.availablePage < this.availableTotalPages()) {
      this.availablePage++;
    } else if (type === 'selected' && this.selectedPage < this.selectedTotalPages()) {
      this.selectedPage++;
    }
  }

  prevPage(type: 'available' | 'selected') {
    if (type === 'available' && this.availablePage > 1) {
      this.availablePage--;
    } else if (type === 'selected' && this.selectedPage > 1) {
      this.selectedPage--;
    }
  }
}
