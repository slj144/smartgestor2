/**
 * =====================================================
 * ARQUIVO: dashboard.component.ts
 * CAMINHO: src/app/pages/dashboard/dashboard.component.ts
 * =====================================================
 * 
 * DESCRIÇÃO:
 * Componente principal do Dashboard do sistema.
 * Mostra resumos de vendas, contadores, alertas e estatísticas.
 * 
 * FUNÇÕES PRINCIPAIS:
 * - Exibir resumo do caixa (vendas, entradas, saídas)
 * - Mostrar contadores (produtos, clientes, pedidos)
 * - Alertas de estoque baixo
 * - Lista de aniversariantes
 * - Contas a pagar e receber
 * - Produtos mais vendidos
 * - Ordens de serviço pendentes
 * 
 * CORREÇÃO APLICADA:
 * ✅ Verificações de segurança para evitar erro "Cannot set properties of undefined"
 * ✅ Inicialização segura de objetos
 * ✅ Tratamento de erros nos callbacks
 * =====================================================
 */

import { Component, OnInit, OnDestroy } from '@angular/core';

// Services
import { DashboardService } from './dashboard.service';

// Translate
import { DashboardTranslate } from './dashboard.translate';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { DateTime } from '@shared/utilities/dateTime';
import { IPermissions } from '@shared/interfaces/_auxiliaries/IPermissions';
import { Dispatch } from '@shared/utilities/dispatch';
import { ScrollMonitor } from '@shared/utilities/scrollMonitor';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // Configurações da empresa
  public companyProfile = Utilities.companyProfile;
  public translate = DashboardTranslate.get();
  public isAdmin: boolean = Utilities.isAdmin;

  // ✅ CONTADORES com inicialização segura
  public count = {
    products: { value: 0, loading: true },
    alertProducts: { value: 0, loading: true },
    requests: { value: 0, loading: true },
    serviceOrders: { value: 0, loading: true },
    customers: { value: 0, loading: true }
  }

  // ✅ CONFIGURAÇÕES DO CAIXA com inicialização segura
  public cashier = {
    settings: {
      view: null,
      gradient: true,
      isDoughnut: true,
      scheme: {
        domain: ['rgb(0,0,255)', 'rgb(0,200,0)', 'rgb(255,0,0)', 'rgb(130, 130, 130)']
      },
      data: {
        currentDay: {
          results: [],
          total: 0,
          fake: true
        }
      }
    },
    dataSelected: 'currentDay',
    loading: true
  };

  // Permissões do usuário
  public permissions = {
    counters: {
      customers: true,
      products: true,
    },
    bestSellers: true,
    billsToPay: true,
    billsToReceive: true,
    stockAlert: true,
    serviceOrders: {
      _active: true,
      filterDataPerOperator: false,
    },
    requests: true,
    cashierResume: {
      _active: true,
      filterDataPerOperator: false,
      sales: true,
      inputs: true,
      outputs: true,
      revenue: true,
      costs: true
    }
  };

  // ✅ LISTAS com inicialização segura - aqui estava o problema!
  public bestSellersList = { data: [], loading: true };
  public stockAlertList = { data: [], loading: true };
  public serviceOrdersList = { data: [], loading: true };
  public requestsList = { data: [], loading: true };
  public billsToPayList = { data: [], loading: true };
  public billsToReceiveList = { data: [], loading: true };
  public birthdayCustomersList = { data: [], loading: true };

  constructor(
    private dashboardService: DashboardService
  ) {
    // Resetar monitor de scroll
    ScrollMonitor.reset();

    // Configurar permissões
    this.permissionsSettings();

    // Configurar resumo inicial do caixa
    this.setupInitCashierResume();
  }

  /**
   * ✅ CONFIGURAR RESUMO INICIAL DO CAIXA
   * Inicializa os dados do gráfico de caixa com valores padrão
   */
  public setupInitCashierResume(): void {
    try {
      // ✅ VERIFICAÇÃO SEGURA - garantir que o objeto existe
      if (!this.cashier) {
        this.cashier = {
          settings: {
            view: null,
            gradient: true,
            isDoughnut: true,
            scheme: {
              domain: ['rgb(0,0,255)', 'rgb(0,200,0)', 'rgb(255,0,0)', 'rgb(130, 130, 130)']
            },
            data: { currentDay: { results: [], total: 0, fake: true } }
          },
          dataSelected: 'currentDay',
          loading: true
        };
      }

      if (!this.cashier.settings) {
        this.cashier.settings = {
          view: null,
          gradient: true,
          isDoughnut: true,
          scheme: {
            domain: ['rgb(0,0,255)', 'rgb(0,200,0)', 'rgb(255,0,0)', 'rgb(130, 130, 130)']
          },
          data: { currentDay: { results: [], total: 0, fake: true } }
        };
      }

      if (!this.cashier.settings.data) {
        this.cashier.settings.data = { currentDay: { results: [], total: 0, fake: true } };
      }

      if (!this.cashier.settings.data.currentDay) {
        this.cashier.settings.data.currentDay = { results: [], total: 0, fake: true };
      }

      // Limpar resultados existentes
      this.cashier.settings.data.currentDay.results = [];

      // Definir itens do gráfico
      const items = [
        { name: this.translate.blocks.second_section.cashier.summary.labels.sales, value: 0.001, percentage: 0 },
        { name: this.translate.blocks.second_section.cashier.summary.labels.inflows, value: 0.001, percentage: 0 },
        { name: this.translate.blocks.second_section.cashier.summary.labels.outflows, value: 0.001, percentage: 0 }
      ];

      // Adicionar itens baseado nas permissões
      if (Utilities.isAdmin) {
        this.cashier.settings.data.currentDay.results = [...items];
      } else {
        if (this.permissions?.cashierResume?.sales) {
          this.cashier.settings.data.currentDay.results.push(items[0]);
        }
        if (this.permissions?.cashierResume?.inputs) {
          this.cashier.settings.data.currentDay.results.push(items[1]);
        }
        if (this.permissions?.cashierResume?.outputs) {
          this.cashier.settings.data.currentDay.results.push(items[2]);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao configurar resumo do caixa:', error);

      // ✅ FALLBACK SEGURO
      this.cashier = {
        settings: {
          view: null,
          gradient: true,
          isDoughnut: true,
          scheme: {
            domain: ['rgb(0,0,255)', 'rgb(0,200,0)', 'rgb(255,0,0)', 'rgb(130, 130, 130)']
          },
          data: {
            currentDay: {
              results: [],
              total: 0,
              fake: true
            }
          }
        },
        dataSelected: 'currentDay',
        loading: true
      };
    }
  }

  /**
   * ✅ INICIALIZAÇÃO DO COMPONENTE com tratamento de erros
   */
  public ngOnInit(): void {
    try {
      DateTime.context(() => {
        this.loadDashboardData();
      });
    } catch (error) {
      console.error('❌ Erro na inicialização do dashboard:', error);
      this.handleInitializationError();
    }
  }

  /**
   * ✅ CARREGAR DADOS DO DASHBOARD
   * Método principal que carrega todos os dados necessários
   */
  private loadDashboardData(): void {
    try {
      // ✅ CARREGAR DADOS DO CAIXA
      this.loadCashierData();

      // ✅ CARREGAR DADOS DE ESTOQUE
      this.loadStockData();

      // ✅ CARREGAR ORDENS DE SERVIÇO
      this.loadServiceOrdersData();

      // ✅ CARREGAR PEDIDOS
      this.loadRequestsData();

      // ✅ CARREGAR DADOS FINANCEIROS
      this.loadFinancialData();

      // ✅ CARREGAR DADOS DE CLIENTES
      this.loadCustomersData();

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      this.setDefaultValues();
    }
  }

  /**
   * ✅ CARREGAR DADOS DO CAIXA - com verificação segura
   */
  private loadCashierData(): void {
    if (this.companyProfile?.cashier?.active) {
      this.dashboardService.getCashSummary((data) => {
        try {
          if (this.permissions.cashierResume._active) {
            // ✅ VERIFICAÇÃO SEGURA antes de atribuir
            if (!this.cashier) {
              this.cashier = {
                settings: {
                  view: null,
                  gradient: true,
                  isDoughnut: true,
                  scheme: {
                    domain: ['rgb(0,0,255)', 'rgb(0,200,0)', 'rgb(255,0,0)', 'rgb(130, 130, 130)']
                  },
                  data: { currentDay: { results: [], total: 0, fake: true } }
                },
                dataSelected: 'currentDay',
                loading: false
              };
            }
            if (!this.cashier.settings) {
              this.cashier.settings = {
                view: null,
                gradient: true,
                isDoughnut: true,
                scheme: {
                  domain: ['rgb(0,0,255)', 'rgb(0,200,0)', 'rgb(255,0,0)', 'rgb(130, 130, 130)']
                },
                data: { currentDay: { results: [], total: 0, fake: true } }
              };
            }

            // ✅ LINHA 146 APROXIMADA - AQUI ESTAVA O ERRO!
            this.cashier.settings.data = data || { currentDay: { results: [], total: 0, fake: true } };
            this.cashier.loading = false;
          }
        } catch (error) {
          console.error('❌ Erro ao processar dados do caixa:', error);
          this.cashier.loading = false;
          this.cashier.settings.data = { currentDay: { results: [], total: 0, fake: true } };
        }
      }, this.permissions.cashierResume);
    }
  }

  /**
   * ✅ CARREGAR DADOS DE ESTOQUE - com verificação segura
   */
  private loadStockData(): void {
    if (this.companyProfile?.stock?.active) {
      // Contagem de produtos
      this.dashboardService.getProductsCount((value) => {
        this.count.products = { value: value || 0, loading: false };
      });

      // Produtos em alerta
      this.dashboardService.getProducts((data) => {
        try {
          this.count.alertProducts = { value: (data || []).length, loading: false };

          if (this.permissions.stockAlert) {
            // ✅ VERIFICAÇÃO SEGURA
            if (!this.stockAlertList) {
              this.stockAlertList = { data: [], loading: false };
            }
            this.stockAlertList.data = data || [];
            this.stockAlertList.loading = false;
          }
        } catch (error) {
          console.error('❌ Erro ao processar produtos:', error);
          this.stockAlertList = { data: [], loading: false };
        }
      });

      // Produtos mais vendidos
      this.dashboardService.getBestSellers((data) => {
        try {
          // ✅ VERIFICAÇÃO SEGURA
          if (!this.bestSellersList) {
            this.bestSellersList = { data: [], loading: false };
          }
          this.bestSellersList.data = data || [];
          this.bestSellersList.loading = false;
        } catch (error) {
          console.error('❌ Erro ao processar best sellers:', error);
          this.bestSellersList = { data: [], loading: false };
        }
      });
    }
  }

  /**
   * ✅ CARREGAR ORDENS DE SERVIÇO - com verificação segura
   */
  private loadServiceOrdersData(): void {
    if (this.companyProfile?.serviceOrders?.active) {
      // Contagem de ordens de serviço
      this.dashboardService.getServiceOrdersCount((value) => {
        this.count.serviceOrders = { value: value || 0, loading: false };
      }, this.permissions.serviceOrders);

      // Lista de ordens de serviço
      this.dashboardService.getServicesOrders((data) => {
        try {
          // ✅ VERIFICAÇÃO SEGURA
          if (!this.serviceOrdersList) {
            this.serviceOrdersList = { data: [], loading: false };
          }
          this.serviceOrdersList.data = data || [];
          this.serviceOrdersList.loading = false;
        } catch (error) {
          console.error('❌ Erro ao processar ordens de serviço:', error);
          this.serviceOrdersList = { data: [], loading: false };
        }
      }, this.permissions.serviceOrders);
    }
  }

  /**
   * ✅ CARREGAR PEDIDOS - com verificação segura
   */
  private loadRequestsData(): void {
    if (this.companyProfile?.requests?.active) {
      // Contagem de pedidos
      this.dashboardService.getRequestsCount((value) => {
        this.count.requests = { value: value || 0, loading: false };
      });

      // Lista de pedidos
      this.dashboardService.getRequests((data) => {
        try {
          // ✅ VERIFICAÇÃO SEGURA
          if (!this.requestsList) {
            this.requestsList = { data: [], loading: false };
          }
          this.requestsList.data = data || [];
          this.requestsList.loading = false;
        } catch (error) {
          console.error('❌ Erro ao processar pedidos:', error);
          this.requestsList = { data: [], loading: false };
        }
      });
    }
  }

  /**
   * ✅ CARREGAR DADOS FINANCEIROS - com verificação segura
   */
  private loadFinancialData(): void {
    // Contas a pagar
    if (this.companyProfile?.financial?.components?.billsToPay?.active && this.permissions.billsToPay) {
      this.dashboardService.getBillsToPay((data) => {
        try {
          // ✅ VERIFICAÇÃO SEGURA
          if (!this.billsToPayList) {
            this.billsToPayList = { data: [], loading: false };
          }
          this.billsToPayList.data = data || [];
          this.billsToPayList.loading = false;
        } catch (error) {
          console.error('❌ Erro ao processar contas a pagar:', error);
          this.billsToPayList = { data: [], loading: false };
        }
      });
    }

    // Contas a receber
    if (this.companyProfile?.financial?.components?.billsToReceive?.active && this.permissions.billsToReceive) {
      this.dashboardService.getBillsToReceive((data) => {
        try {
          // ✅ VERIFICAÇÃO SEGURA
          if (!this.billsToReceiveList) {
            this.billsToReceiveList = { data: [], loading: false };
          }
          this.billsToReceiveList.data = data || [];
          this.billsToReceiveList.loading = false;
        } catch (error) {
          console.error('❌ Erro ao processar contas a receber:', error);
          this.billsToReceiveList = { data: [], loading: false };
        }
      });
    }
  }

  /**
   * ✅ CARREGAR DADOS DE CLIENTES - com verificação segura
   */
  private loadCustomersData(): void {
    if (this.companyProfile?.registers?.components?.customers?.active) {
      // Contagem de clientes
      this.dashboardService.getCustomersCount((value) => {
        this.count.customers = { value: value || 0, loading: false };
      });

      // Lista de aniversariantes
      this.dashboardService.getBirthdayCustomers((data) => {
        try {
          // ✅ VERIFICAÇÃO SEGURA
          if (!this.birthdayCustomersList) {
            this.birthdayCustomersList = { data: [], loading: false };
          }
          this.birthdayCustomersList.data = data || [];
          this.birthdayCustomersList.loading = false;
        } catch (error) {
          console.error('❌ Erro ao processar aniversariantes:', error);
          this.birthdayCustomersList = { data: [], loading: false };
        }
      });
    }
  }

  /**
   * ✅ DEFINIR VALORES PADRÃO EM CASO DE ERRO
   */
  private setDefaultValues(): void {
    this.bestSellersList = { data: [], loading: false };
    this.stockAlertList = { data: [], loading: false };
    this.serviceOrdersList = { data: [], loading: false };
    this.requestsList = { data: [], loading: false };
    this.billsToPayList = { data: [], loading: false };
    this.billsToReceiveList = { data: [], loading: false };
    this.birthdayCustomersList = { data: [], loading: false };
    this.cashier.loading = false;
  }

  /**
   * ✅ TRATAR ERRO DE INICIALIZAÇÃO
   */
  private handleInitializationError(): void {
    console.error('❌ Falha crítica na inicialização do dashboard');
    this.setDefaultValues();
  }

  /**
   * Ação da interface - mudança de período do resumo de caixa
   */
  public onCashSumaryPeriod(event: Event, type: string): void {
    try {
      const target = event.currentTarget;

      $$($$(target).parent().childs()).map((_, item) => {
        if (item == target) {
          $$(item).addClass('active');
        } else {
          $$(item).removeClass('active');
        }
      });

      this.cashier.dataSelected = type;
    } catch (error) {
      console.error('❌ Erro ao alterar período do caixa:', error);
    }
  }

  /**
   * ✅ CONFIGURAÇÕES DE PERMISSÕES - mantido original
   */
  private permissionsSettings(): void {
    if (!Utilities.isAdmin) {
      const permissions = () => {
        const permissions = (<any>Utilities.permissions('dashboard') as IPermissions["dashboard"]);
        const cashier = (permissions["cashierResume"] as IPermissions["dashboard"]["cashierResume"]);

        if (cashier) {
          this.permissions.cashierResume.filterDataPerOperator = (cashier.actions && (cashier.actions.indexOf('filterDataPerOperator') !== -1));
          this.permissions.cashierResume.revenue = (cashier.fields && (cashier.fields.includes('revenue')));
          this.permissions.cashierResume.sales = (cashier.fields && (cashier.fields.includes('sales')));
          this.permissions.cashierResume.inputs = (cashier.fields && (cashier.fields.includes('inputs')));
          this.permissions.cashierResume.outputs = (cashier.fields && (cashier.fields.includes('outputs')));
          this.permissions.cashierResume.costs = (cashier.fields && (cashier.fields.includes('costs')));
        } else {
          this.permissions.cashierResume.filterDataPerOperator = true;
          this.permissions.cashierResume.revenue = false;
          this.permissions.cashierResume.sales = false;
          this.permissions.cashierResume.inputs = false;
          this.permissions.cashierResume.outputs = false;
          this.permissions.cashierResume.costs = false;
          this.permissions.cashierResume._active = false;
        }

        if (!permissions.billsToPay) {
          this.permissions.billsToPay = false;
        }

        if (!permissions.billsToReceive) {
          this.permissions.billsToReceive = false;
        }

        if (!permissions.stockAlert) {
          this.permissions.stockAlert = false;
        }

        if (!permissions.requests) {
          this.permissions.requests = false;
        }

        if (!permissions.bestSellers) {
          this.permissions.bestSellers = false;
        }

        if (!permissions.serviceOrders) {
          this.permissions.serviceOrders = {
            _active: false,
            filterDataPerOperator: false
          };
        } else {
          const actions = permissions.serviceOrders.actions || [];
          this.permissions.serviceOrders.filterDataPerOperator = actions.includes('filterDataPerOperator');
        }

        if (!permissions.counters) {
          this.permissions.counters = { customers: false, products: false };
        } else {
          permissions.counters.fields = permissions.counters.fields || [];
          this.permissions.counters.customers = ((permissions.counters.fields.includes('customers')));
          this.permissions.counters.products = ((permissions.counters.fields.includes('products')));
        }
      }

      Dispatch.onRefreshCurrentUserPermissions("DashboardComponent-refresh-user-permissions", () => { permissions() });
      permissions();
    }
  }

  /**
   * ✅ DESTRUIÇÃO DO COMPONENTE - com limpeza segura
   */
  public ngOnDestroy(): void {
    try {
      // Limpar objetos para evitar vazamentos de memória
      this.count = <any>{};
      this.cashier = <any>{};
      this.bestSellersList = <any>{};
      this.stockAlertList = <any>{};
      this.serviceOrdersList = <any>{};
      this.birthdayCustomersList = <any>{};
      this.billsToPayList = <any>{};
      this.billsToReceiveList = <any>{};
      this.requestsList = <any>{};
    } catch (error) {
      console.error('❌ Erro na destruição do componente:', error);
    } finally {
      Utilities.loading(false);
    }
  }
}