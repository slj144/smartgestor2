/**
 * =====================================================
 * ARQUIVO: app.module.ts
 * CAMINHO: src/app/app.module.ts
 * =====================================================
 * 
 * CORREÇÃO IMPLEMENTADA: Verificar se tenant tem CRM antes de inicializar
 * ✅ Só inicia GlobalSalesIntegrationService se o cliente pagou pelo CRM
 * =====================================================
 */

import { NgModule, CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';

// Modules
import { PagesModule } from '@pages/pages.module';
import { AuthModule } from '@auth/auth.module';
import { AppRoutingModule } from './app.routing';

// Components
import { AppComponent } from './app.component';

// Services
import { HttpInterceptorService } from '@shared/services/http-interceptor.service';
// ✅ GLOBAL SALES INTEGRATION SERVICE
import { GlobalSalesIntegrationService } from '@shared/services/global-sales-integration.service';

// Settings
import { environment } from 'src/environments/environment.prod';
import { ProjectSettings } from '@assets/settings/company-settings';

// Utilities
import { Utilities } from '@shared/utilities/utilities';

import ptBr from "@angular/common/locales/pt";
registerLocaleData(ptBr, 'pt-BR');

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    AuthModule,
    PagesModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // ✅ GLOBAL SALES INTEGRATION SERVICE
    GlobalSalesIntegrationService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {

  constructor(
    // ✅ INJETAR o serviço global para garantir inicialização automática
    private globalSalesIntegration: GlobalSalesIntegrationService
  ) {
    console.log('🌍 App Module carregado com integração global CRM ativa');

    // ✅ INICIALIZAR COM RETRY E STOREID
    this.initializeGlobalService();

    this.authSettings();

    const projectSettings = ProjectSettings.companySettings();

    if (projectSettings) {
      environment.companyName = projectSettings.companyName;
      environment.country = projectSettings.country;
      environment.timezone = projectSettings.timezone;
    }
  }

  /**
   * ✅ INICIALIZAR GLOBAL SERVICE COM VERIFICAÇÃO DE CRM
   */
  private initializeGlobalService(): void {
    let attempts = 0;
    const maxAttempts = 10;

    const tryInitialize = () => {
      attempts++;
      console.log(`🔄 App Module: Tentativa ${attempts}/${maxAttempts} de inicialização do Global Service`);

      // Verificar se o Utilities.storeID está disponível
      if (Utilities && Utilities.storeID) {
        console.log('✅ App Module: StoreID encontrado:', Utilities.storeID);

        // 🚨 NOVA VERIFICAÇÃO: Tenant tem CRM?
        const hasCRM = this.checkIfTenantHasCRM();

        if (hasCRM) {
          console.log('✅ App Module: Tenant tem CRM ativo - iniciando monitoramento');

          // ✅ INICIALIZAR O GLOBAL SERVICE COM O STOREID
          this.globalSalesIntegration.initializeWithStoreID(Utilities.storeID);

          // ✅ EXPOR GLOBALMENTE PARA DEBUG
          (window as any).globalSalesIntegration = this.globalSalesIntegration;

          console.log('✅ App Module: Global Service inicializado e exposto');
        } else {
          console.log('🚫 App Module: Tenant NÃO tem CRM - monitoramento NÃO será iniciado');
          console.log('📌 App Module: Cliente não contratou o módulo CRM');

          // NÃO inicializa o serviço!
          // Mas ainda expõe para debug (útil para o super admin)
          (window as any).globalSalesIntegration = {
            status: 'DISABLED',
            reason: 'Tenant sem CRM ativo',
            storeID: Utilities.storeID
          };
        }

      } else if (attempts < maxAttempts) {
        console.log('⏳ App Module: StoreID não disponível ainda, tentando novamente em 2 segundos...');
        setTimeout(tryInitialize, 2000);
      } else {
        console.error('❌ App Module: Falha ao inicializar Global Service - StoreID não encontrado');
      }
    };

    // Iniciar após 3 segundos para garantir carregamento
    setTimeout(tryInitialize, 3000);
  }

  /**
   * 🔍 VERIFICAR SE TENANT TEM CRM ATIVO
   * Verifica no localStorage se o tenant atual tem o módulo CRM contratado
   */
  private checkIfTenantHasCRM(): boolean {
    try {
      console.log('🔍 App Module: Verificando se tenant tem CRM...');

      // 🚨 LISTA DE EMERGÊNCIA - REMOVER DEPOIS DE TESTAR!
      // Descomente as linhas abaixo e adicione os IDs dos clientes com CRM
      /*
      const tenantsComCRM = [
        'bm-cliente1',  // Substitua pelos IDs reais
        'bm-cliente2',
        'bm-cliente3'
        // Adicione APENAS quem pagou pelo CRM
      ];
      
      if (!tenantsComCRM.includes(Utilities.storeID)) {
        console.log('🚫 EMERGÊNCIA: Tenant não está na lista de CRM');
        return false;
      }
      */

      // Pegar dados do localStorage
      const logins = localStorage.getItem('logins');
      if (!logins) {
        console.log('⚠️ App Module: Nenhum login encontrado no localStorage');
        return false;
      }

      const loginsData = JSON.parse(logins);
      const currentLogin = loginsData[(<any>window).id];

      if (!currentLogin) {
        console.log('⚠️ App Module: Login atual não encontrado');
        return false;
      }

      console.log('📋 App Module: Dados do projeto:', {
        projectId: currentLogin.projectId,
        storeID: Utilities.storeID,
        profile: currentLogin.projectInfo?.profile
      });

      // Verificar CRM em profile.data.crm (local correto)
      const crmInData = currentLogin.projectInfo?.profile?.data?.crm?.active === true;

      // Verificar CRM em profile.crm (local antigo/legado)
      const crmInProfile = currentLogin.projectInfo?.profile?.crm?.active === true;

      // CRM está ativo se estiver em qualquer um dos lugares
      const hasCRM = crmInData || crmInProfile;

      console.log('🎯 App Module: Status do CRM:', {
        crmInData: crmInData,
        crmInProfile: crmInProfile,
        resultado: hasCRM ? '✅ ATIVO' : '🚫 INATIVO'
      });

      return hasCRM;

    } catch (error) {
      console.error('❌ App Module: Erro ao verificar CRM:', error);
      // Em caso de erro, NÃO permitir (mais seguro)
      return false;
    }
  }

  private authSettings() {

    const handler = () => {

      const instances: number = (localStorage.getItem("instances") ? parseInt(localStorage.getItem("instances")) : 0);

      if (localStorage.getItem("reloadWindowID")) {
        (<any>window).id = localStorage.getItem("reloadWindowID");
      } else {
        if (instances == 0 && Object.values(Utilities.logins).length > 0) {
          (<any>window).id = (<any>Object.values(Utilities.logins)[0]).userId;
        }
      }

      localStorage.setItem("instances", (instances + 1).toString());
      localStorage.removeItem("reloadWindowID");
    };

    window.addEventListener("beforeunload", (evt) => {

      evt.preventDefault();

      const instances: number = (localStorage.getItem("instances") ? parseInt(localStorage.getItem("instances")) : 0);

      localStorage.setItem("instances", (instances > 0 ? instances - 1 : 0).toString());

      if (Utilities.windowID) {
        localStorage.setItem("reloadWindowID", Utilities.windowID);
      }

      window.removeEventListener("load", handler, true);
      window.removeEventListener("load", handler, false);
      window.addEventListener("load", handler);
    });

    handler();
  }

}