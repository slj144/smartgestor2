/**
 * Arquivo: pages.menu.ts
 * Localização: src/app/pages/pages.menu.ts
 * 
 * Descrição: Gerador dinâmico de menu principal do sistema
 * - Configura itens do menu baseado no perfil da empresa
 * - Aplica controle de permissões por usuário
 * - Suporta submenus e roteamento dinâmico
 * - Integra com sistema de traduções
 * - Verifica privilégios de administrador
 * - Controla visibilidade de módulos como CRM, Estoque, Financeiro, etc.
 */

// Translate
import { menuTranslation } from './pages.translation';

// Interfaces
import { IMenuOptions } from '@shared/interfaces/IMenuOptions';

// Utilities
import { Utilities } from '@shared/utilities/utilities';

// Settings
import { ProjectSettings } from '@assets/settings/company-settings';

export const setupMenu = (): IMenuOptions[] => {

  // 🔍 VERIFICANDO PERFIL
  console.log('🔍 VERIFICANDO PERFIL');
  console.log('Company Settings:', ProjectSettings.companySettings());
  console.log('Tipo de empresa:', ProjectSettings.companySettings().type);

  const MENU_ITEMS: IMenuOptions[] = [];

  const companyProfile = ProjectSettings.companySettings().profile;
  const loginData = Utilities.currentLoginData;

  if (companyProfile?.dashboard?.active && (Utilities.isAdmin || (Utilities.permissions().dashboard != null))) {
    MENU_ITEMS.push({ id: 'dashboard', title: menuTranslation.dashboard.title, icon: 'pie-chart-outline', route: `/${loginData.projectId}/dashboard` });
  }

  if (companyProfile?.requests?.active && (Utilities.isAdmin || (Utilities.permissions().requests != null))) {
    MENU_ITEMS.push({ id: 'requests', title: menuTranslation.requests.title, icon: 'shopping-bag-outline', route: `/${loginData.projectId}/pedidos` });
  }

  if (companyProfile?.cashier?.active && (Utilities.isAdmin || (Utilities.permissions().cashier != null))) {

    const item = {
      id: 'cashier',
      title: menuTranslation.cashier.title,
      icon: 'layout-outline',
      subItems: (() => {

        const subMenu = [];

        if (Utilities.isAdmin || (Utilities.permissions().cashier?.cashierFront != null)) {
          subMenu.push({ id: 'cashierFront', title: menuTranslation.cashier.subItems.cashierFront.title, icon: 'browser-outline', route: `/${loginData.projectId}/caixa/pdv` });
        }

        if (Utilities.isAdmin || (Utilities.permissions().cashier?.cashierRegisters != null)) {
          subMenu.push({ id: 'cashierRegisters', title: menuTranslation.cashier.subItems.cashierRegisters.title, icon: 'inbox-outline', route: `/${loginData.projectId}/caixa/registros-de-caixa` });
        }

        return subMenu;
      })()
    };

    if (item.subItems.length > 0) {
      MENU_ITEMS.push(item);
    }
  }

  if (companyProfile?.serviceOrders?.active && (Utilities.isAdmin || (Utilities.permissions().serviceOrders != null))) {

    const item = {
      id: 'services',
      title: menuTranslation.services.title,
      icon: 'bar-chart-outline',
      subItems: (() => {

        const subMenu = [];

        subMenu.push({ id: 'serviceOrders', title: menuTranslation.services.subItems.serviceOrders.title, icon: 'layers-outline', route: `/${loginData.projectId}/servicos/ordens-de-servico` });

        return subMenu;
      })()
    };

    if (item.subItems.length > 0) {
      MENU_ITEMS.push(item);
    }
  }

  if (companyProfile?.stock?.active && (Utilities.isAdmin || (Utilities.permissions().stock != null))) {

    const item = {
      id: 'stock',
      title: menuTranslation.stock.title,
      icon: 'grid-outline',
      subItems: (() => {

        const subMenu = [];

        if (companyProfile?.stock?.components?.products?.active && (Utilities.isAdmin || (Utilities.permissions().stock?.products != null))) {
          subMenu.push({ id: 'products', title: menuTranslation.stock.subItems.products.title, icon: 'grid-outline', route: `/${loginData.projectId}/estoque/produtos` });
        }

        if (companyProfile?.stock?.components?.purchases?.active && (Utilities.isAdmin || (Utilities.permissions().stock?.purchases != null))) {
          subMenu.push({ id: 'purchases', title: menuTranslation.stock.subItems.purchases.title, icon: 'shopping-cart-outline', route: `/${loginData.projectId}/estoque/compras` });
        }

        if (companyProfile?.stock?.components?.transfers?.active && (Utilities.isAdmin || (Utilities.permissions().stock?.transfers != null))) {
          subMenu.push({ id: 'transfers', title: menuTranslation.stock.subItems.transfers.title, icon: 'flip-2-outline', route: `/${loginData.projectId}/estoque/transferencias` });
        }

        return subMenu;
      })()
    };

    if (item.subItems.length > 0) {
      MENU_ITEMS.push(item);
    }
  }

  if (companyProfile?.financial?.active && (Utilities.isAdmin || (Utilities.permissions().financial != null))) {

    const item = {
      id: 'financial',
      title: menuTranslation.financial.title,
      icon: 'bar-chart-outline',
      subItems: (() => {

        const subMenu = [];

        if (companyProfile?.financial?.components?.billsToPay?.active && (Utilities.isAdmin || (Utilities.permissions().financial?.billsToPay != null))) {
          subMenu.push({ id: 'billsToPay', title: menuTranslation.financial.subItems.billsToPay.title, icon: 'log-out-outline', route: `/${loginData.projectId}/financeiro/contas-pagar` });
        }

        if (companyProfile?.financial?.components?.billsToReceive?.active && (Utilities.isAdmin || (Utilities.permissions().financial?.billsToReceive != null))) {
          subMenu.push({ id: 'billsRoReceive', title: menuTranslation.financial.subItems.billsToReceive.title, icon: 'log-in-outline', route: `/${loginData.projectId}/financeiro/contas-receber` });
        }

        if (companyProfile?.financial?.components?.bankAccounts?.active && (Utilities.isAdmin || (Utilities.permissions().financial?.bankAccounts != null))) {
          subMenu.push({ id: 'bankAccounts', title: menuTranslation.financial.subItems.bankAccounts.title, icon: 'bookmark-outline', route: `/${loginData.projectId}/financeiro/contas-bancarias` });
        }

        return subMenu;
      })()
    };

    if (item.subItems.length > 0) {
      MENU_ITEMS.push(item);
    }
  }

  if (companyProfile?.registers?.active && (Utilities.isAdmin || (Utilities.permissions().registers != null))) {

    const item = {
      id: 'retgisters',
      title: menuTranslation.registers.title,
      icon: 'clipboard-outline',
      subItems: (() => {

        const subMenu = [];

        if (companyProfile?.registers.components.customers?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.customers != null))) {
          subMenu.push({ id: 'customers', title: menuTranslation.registers.subItems.customers.title, icon: 'people-outline', route: `/${loginData.projectId}/registros/clientes` });
        }

        if (companyProfile?.registers.components.collaborators?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.collaborators != null))) {
          subMenu.push({ id: 'collaborators', title: menuTranslation.registers.subItems.collaborators.title, icon: 'person-outline', route: `/${loginData.projectId}/registros/colaboradores` });
        }

        if (companyProfile?.registers.components.providers?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.providers != null))) {
          subMenu.push({ id: 'providers', title: menuTranslation.registers.subItems.providers.title, icon: 'cube-outline', route: `/${loginData.projectId}/registros/fornecedores` });
        }

        if (companyProfile?.registers.components.carriers?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.carriers != null))) {
          subMenu.push({ id: 'carriers', title: menuTranslation.registers.subItems.carriers.title, icon: 'car-outline', route: `/${loginData.projectId}/registros/transportadoras` });
        }

        if (companyProfile?.registers.components.partners?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.partners != null))) {
          subMenu.push({ id: 'partners', title: menuTranslation.registers.subItems.partners.title, icon: 'star-outline', route: `/${loginData.projectId}/registros/parceiros` });
        }

        if (companyProfile?.registers.components.paymentMethods?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.paymentMethods != null))) {
          subMenu.push({ id: 'paymentsMethods', title: menuTranslation.registers.subItems.paymentMethods.title, icon: 'credit-card-outline', route: `/${loginData.projectId}/registros/meios-pagamento` });
        }

        if (companyProfile?.registers.components.services?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.services != null))) {
          subMenu.push({ id: 'services', title: menuTranslation.registers.subItems.services.title, icon: 'briefcase-outline', route: `/${loginData.projectId}/registros/servicos` });
        }

        if (companyProfile?.registers.components.vehicles?.active && (Utilities.isAdmin || (Utilities.permissions().registers?.vehicles != null))) {
          subMenu.push({ id: 'vehicles', title: menuTranslation.registers.subItems.vehicles.title, icon: 'car-outline', route: `/${loginData.projectId}/registros/veiculos` });
        }

        if (companyProfile?.registers.components.branches?.active && Utilities.isMatrix && (Utilities.isAdmin || (Utilities.permissions().registers?.branches != null))) {
          subMenu.push({ id: 'branches', title: menuTranslation.registers.subItems.branches.title, icon: 'home-outline', route: `/${loginData.projectId}/registros/filiais` });
        }

        return subMenu;
      })()
    };

    if (item.subItems.length > 0) {
      MENU_ITEMS.push(item);
    }
  }

  if (companyProfile?.fiscal?.active && (Utilities.isAdmin || (Utilities.permissions().fiscal != null))) {
    MENU_ITEMS.push({ id: 'fiscalNotes', title: menuTranslation.fiscal.title, icon: 'copy-outline', route: `/${loginData.projectId}/notas-fiscais` });
  }

  if (companyProfile?.reports?.active && (Utilities.isAdmin || (Utilities.permissions().reports != null))) {
    MENU_ITEMS.push({ id: 'reports', title: menuTranslation.reports.title, icon: 'file-text-outline', route: `/${loginData.projectId}/relatorios` });
  }

  if (companyProfile?.informations?.active && (Utilities.isAdmin || (Utilities.permissions().informations != null))) {
    MENU_ITEMS.push({ id: 'informations', title: menuTranslation.informations.title, icon: 'info-outline', route: `/${loginData.projectId}/informacoes` });
  }

  if (companyProfile?.settings?.active && (Utilities.isAdmin || (Utilities.permissions().settings != null))) {
    MENU_ITEMS.push({ id: 'settings', title: menuTranslation.settings.title, icon: 'settings-2-outline', route: `/${loginData.projectId}/configuracoes` });
  }

  // ⭐ CRM COM SUBMENU - VERSÃO SEGURA
  // Verificar CRM em ambos os lugares (profile.data.crm tem prioridade)
  const crmActive = companyProfile?.data?.crm?.active || companyProfile?.crm?.active;
  if (crmActive && (Utilities.isAdmin || (Utilities.permissions().crm != null))) {

    const item = {
      id: 'crm',
      title: '🚀 ' + menuTranslation.crm.title,
      icon: 'trending-up-outline',
      subItems: (() => {
        const subMenu = [];

        // Dashboard CRM
        const crmComponents = companyProfile?.data?.crm?.components || companyProfile?.crm?.components;
        if (crmComponents?.dashboard?.active) {
          subMenu.push({
            id: 'crmDashboard',
            title: menuTranslation.crm.subItems.dashboard.title,
            icon: 'activity-outline',
            route: `/${loginData.projectId}/crm/dashboard`
          });
        }

        // Leads
        if (crmComponents?.leads?.active &&
          (Utilities.isAdmin || (Utilities.permissions().crm?.modules?.includes('leads')))) {
          subMenu.push({
            id: 'crmLeads',
            title: menuTranslation.crm.subItems.leads.title,
            icon: 'people-outline',
            route: `/${loginData.projectId}/crm/leads`
          });
        }

        // Pipeline
        if (crmComponents?.pipeline?.active &&
          (Utilities.isAdmin || (Utilities.permissions().crm?.modules?.includes('pipeline')))) {
          subMenu.push({
            id: 'crmPipeline',
            title: menuTranslation.crm.subItems.pipeline.title,
            icon: 'funnel-outline',
            route: `/${loginData.projectId}/crm/pipeline`
          });
        }

        // Atividades
        if (crmComponents?.activities?.active &&
          (Utilities.isAdmin || (Utilities.permissions().crm?.modules?.includes('activities')))) {
          subMenu.push({
            id: 'crmActivities',
            title: menuTranslation.crm.subItems.activities.title,
            icon: 'calendar-outline',
            route: `/${loginData.projectId}/crm/atividades`
          });
        }

        // 🎂 ANIVERSÁRIOS - VERSÃO SEGURA COM 'as any'
        // Usando 'as any' para evitar erro de TypeScript sem quebrar o sistema de permissões
        if ((crmComponents?.birthdays?.active || Utilities.isAdmin) &&
          (Utilities.isAdmin || (Utilities.permissions().crm?.modules?.includes('aniversarios' as any)))) {
          subMenu.push({
            id: 'crmBirthdays',
            title: menuTranslation.crm.subItems.birthdays?.title || '🎂 Aniversários',
            icon: 'gift-outline',
            route: `/${loginData.projectId}/crm/aniversarios`
          });
        }

        return subMenu;
      })()
    };

    if (item.subItems.length > 0) {
      MENU_ITEMS.push(item);
    }
  }

  // ⭐ DEBUG
  console.log('=== DEBUG MENU ===');
  console.log('Profile:', companyProfile);
  console.log('CRM Active:', companyProfile?.data?.crm?.active || companyProfile?.crm?.active);
  console.log('CRM Components:', companyProfile?.crm?.components);
  console.log('Permissions:', Utilities.permissions());
  console.log('IsAdmin:', Utilities.isAdmin);
  console.log('Menu Items:', MENU_ITEMS);
  console.log('==================');

  return MENU_ITEMS;
}

export const MENU_ITEMS = setupMenu();