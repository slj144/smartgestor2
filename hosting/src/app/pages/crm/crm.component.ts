/**
 * =====================================================
 * ARQUIVO: crm.component.ts
 * CAMINHO: src/app/pages/crm/crm.component.ts
 * =====================================================
 * 
 * CORREÇÃO FINAL:
 * ✅ SalesIntegrationService TOTALMENTE DESABILITADO
 * ✅ Usando APENAS GlobalSalesIntegrationService  
 * ✅ Evita duplicação de leads e atividades
 * =====================================================
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// Serviços
import { CrmService } from './crm.service';
import { SalesIntegrationService } from './services/sales-integration.service';

// Utilities
import { Utilities } from '@shared/utilities/utilities';
import { Dispatch } from '@shared/utilities/dispatch';

@Component({
    selector: 'app-crm',
    templateUrl: './crm.component.html',
    styleUrls: ['./crm.component.scss']
})
export class CrmComponent implements OnInit, OnDestroy {

    // Menu do CRM
    public crmMenu = [
        {
            title: 'Dashboard',
            icon: 'activity-outline',
            link: 'dashboard',
            active: true,
            permission: 'view'
        },
        {
            title: 'Leads',
            icon: 'people-outline',
            link: 'leads',
            active: false,
            permission: 'leads'
        },
        {
            title: 'Pipeline',
            icon: 'funnel-outline',
            link: 'pipeline',
            active: false,
            permission: 'pipeline'
        },
        {
            title: 'Atividades',
            icon: 'calendar-outline',
            link: 'atividades',
            active: false,
            permission: 'activities'
        }
    ];

    // Permissões
    public permissions: any = {
        actions: [],
        modules: [],
        fields: []
    };

    public visibleMenu: any[] = [];

    // ✅ CONTROLE DE INICIALIZAÇÃO
    private initialized = false;

    constructor(
        private router: Router,
        private crmService: CrmService,
        private salesIntegration: SalesIntegrationService
    ) { }

    ngOnInit(): void {
        // ✅ EVITAR MÚLTIPLAS INICIALIZAÇÕES
        if (this.initialized) {
            console.warn('⚠️ CRM já foi inicializado - evitando loop');
            return;
        }

        console.log('=== CRM Component Carregado! ===');
        this.initialized = true;

        // ✅ 1. VERIFICAR PERMISSÕES PRIMEIRO
        this.checkPermissions();

        // ✅ 2. SE NÃO TEM PERMISSÃO, PARAR AQUI
        if (this.visibleMenu.length === 0) {
            console.warn('❌ Sem permissões - não iniciando serviços');
            return;
        }

        // ✅ 3. INICIALIZAR SERVIÇOS APENAS UMA VEZ
        this.initializeServices();

        // ✅ 4. LISTENER PARA MUDANÇAS DE PERMISSÕES
        Dispatch.onRefreshCurrentUserPermissions('CrmComponent', () => {
            console.log('🔄 Permissões alteradas - verificando novamente...');
            this.checkPermissions();
        });
    }

    /**
     * ✅ INICIALIZAR SERVIÇOS - TOTALMENTE DESABILITADO PARA EVITAR DUPLICAÇÃO
     */
    private initializeServices(): void {
        try {
            console.log('🚀 Iniciando serviços do CRM...');

            // 🚫 SALES INTEGRATION SERVICE TOTALMENTE DESABILITADO
            console.log('🚫 Sales Integration Service TOTALMENTE DESABILITADO para evitar duplicação');
            console.log('✅ Usando APENAS Global Sales Integration Service (via App Module)');

            // 🚫 NÃO CHAMAR NENHUM MÉTODO DO SALES INTEGRATION
            // this.salesIntegration.startMonitoring(); // DESABILITADO

            // ✅ VERIFICAR SE GLOBAL SERVICE ESTÁ ATIVO
            if ((window as any).globalSalesIntegrationService) {
                const globalService = (window as any).globalSalesIntegrationService;
                const stats = globalService.getMonitoringStats();

                console.log('✅ Global Service Status:', stats);

                if (!stats.isActive) {
                    console.log('⚠️ Global Service não está ativo - tentando reativar...');
                    globalService.startGlobalMonitoring();
                } else {
                    console.log('✅ Global Service ativo e monitorando vendas');
                    console.log(`📊 Listeners ativos: ${stats.listenersCount}`);
                    console.log(`⚙️ Processando: ${stats.processingCount} vendas`);
                }
            } else {
                console.log('⚠️ Global Service não encontrado no window');
                console.log('🔍 Verificando se foi inicializado no App Module...');
            }

            // ✅ EXPOR APENAS O GLOBAL SERVICE (se existir)
            if ((window as any).globalSalesIntegrationService && !(window as any).crmComponent) {
                (window as any).crmComponent = this;
                console.log('✅ CRM Component exposto globalmente para debug');
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar serviços do CRM:', error);
        }
    }

    /**
     * ✅ VERIFICAR PERMISSÕES
     */
    private checkPermissions(): void {
        console.log('🔍 Verificando permissões do usuário...');

        try {
            if (Utilities.isAdmin) {
                console.log('✅ Admin - acesso total liberado');

                this.permissions = {
                    actions: ['add', 'edit', 'delete', 'view'],
                    modules: ['leads', 'activities', 'pipeline', 'reports'],
                    fields: ['value', 'notes', 'assignedTo']
                };
                this.visibleMenu = [...this.crmMenu];
            } else {
                console.log('🔍 Usuário não-admin - verificando permissões específicas...');

                const userPermissions = Utilities.permissions()?.crm;

                if (!userPermissions) {
                    console.warn('❌ Usuário sem permissão para acessar o CRM');
                    setTimeout(() => {
                        this.router.navigate(['/']);
                    }, 100);
                    return;
                }

                console.log('✅ Permissões encontradas:', userPermissions);
                this.permissions = userPermissions;

                this.visibleMenu = this.crmMenu.filter(item => {
                    if (item.permission === 'view') return true;
                    const hasPermission = this.permissions.modules.includes(item.permission);
                    console.log(`${hasPermission ? '✅' : '❌'} Menu "${item.title}": ${hasPermission ? 'liberado' : 'bloqueado'}`);
                    return hasPermission;
                });
            }

            if (this.visibleMenu.length === 0) {
                console.warn('❌ Nenhum menu visível - redirecionando');
                setTimeout(() => {
                    this.router.navigate(['/']);
                }, 100);
                return;
            }

            console.log('📋 Menus visíveis:', this.visibleMenu.map(m => m.title));

        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            setTimeout(() => {
                this.router.navigate(['/']);
            }, 100);
        }
    }

    /**
     * Verificar se tem permissão específica
     */
    public hasPermission(action: string, module?: string): boolean {
        if (Utilities.isAdmin) return true;

        if (module && !this.permissions.modules.includes(module)) {
            return false;
        }

        return this.permissions.actions.includes(action);
    }

    /**
     * Navegar entre as seções
     */
    public navigate(item: any): void {
        if (item.permission !== 'view' && !this.permissions.modules.includes(item.permission)) {
            console.warn('❌ Sem permissão para acessar:', item.title);
            return;
        }

        this.visibleMenu.forEach(menu => menu.active = false);
        item.active = true;

        console.log('🔗 Navegando para:', item.link);
        const projectId = Utilities.currentLoginData.projectId;
        this.router.navigate([`/${projectId}/crm/${item.link}`]);
    }

    /**
     * ✅ DESTRUIÇÃO MELHORADA - SEM INTERFERIR NO GLOBAL SERVICE
     */
    ngOnDestroy(): void {
        console.log('🔄 Destruindo CRM Component...');

        // Remover listeners
        Dispatch.removeListeners('refreshCurrentUserPermissions', 'CrmComponent');

        // 🚫 NÃO PARAR O SALES INTEGRATION (já está desabilitado)
        console.log('✅ Sales Integration Service não foi iniciado - nada para parar');

        // 🚫 NÃO PARAR O GLOBAL SERVICE (ele roda no App Module)
        console.log('✅ Global Service continua rodando (gerenciado pelo App Module)');

        // ✅ LIMPAR REFERÊNCIA DO COMPONENT
        if ((window as any).crmComponent) {
            delete (window as any).crmComponent;
            console.log('🧹 Referência do CRM Component removida');
        }

        // ✅ RESETAR FLAGS
        this.initialized = false;
    }

    /**
     * ✅ MÉTODO PARA DEBUG - ATUALIZADO
     */
    public getDebugInfo(): any {
        const globalService = (window as any).globalSalesIntegrationService;

        return {
            permissions: this.permissions,
            visibleMenu: this.visibleMenu.map(m => m.title),
            isAdmin: Utilities.isAdmin,
            storeID: Utilities.storeID,
            initialized: this.initialized,

            // Global Service Info
            globalServiceExists: !!globalService,
            globalServiceStats: globalService ? globalService.getMonitoringStats() : null,

            // Sales Integration Info
            salesIntegrationService: 'TOTALMENTE DESABILITADO (evitar duplicação)',
            salesIntegrationStarted: false,

            // Status
            servicesInfo: {
                globalService: globalService ? 'ATIVO' : 'INATIVO',
                salesIntegration: 'DESABILITADO',
                duplicateProtection: 'ATIVO'
            }
        };
    }

    /**
     * ✅ MÉTODO PARA VERIFICAR STATUS DOS SERVIÇOS
     */
    public checkServicesStatus(): void {
        console.log('=== STATUS DOS SERVIÇOS DE INTEGRAÇÃO ===');

        const globalService = (window as any).globalSalesIntegrationService;

        if (globalService) {
            const stats = globalService.getMonitoringStats();
            console.log('✅ Global Sales Integration Service:', {
                status: stats.isActive ? 'ATIVO' : 'INATIVO',
                listeners: stats.listenersCount,
                processing: stats.processingCount,
                tenant: stats.tenant
            });
        } else {
            console.log('❌ Global Sales Integration Service: NÃO ENCONTRADO');
        }

        console.log('🚫 Sales Integration Service: TOTALMENTE DESABILITADO');
        console.log('📊 Resultado: APENAS UM SERVIÇO ATIVO (sem duplicação)');

        console.log('=== FIM DO STATUS ===');
    }

    /**
     * ✅ MÉTODO PARA FORÇAR RESTART DO GLOBAL SERVICE (APENAS)
     */
    public forceRestartGlobalService(): void {
        console.log('🔄 Forçando reinicialização do Global Service...');

        const globalService = (window as any).globalSalesIntegrationService;

        if (globalService) {
            console.log('⏹️ Parando Global Service...');
            globalService.stopGlobalMonitoring();

            setTimeout(() => {
                console.log('🚀 Reiniciando Global Service...');
                globalService.startGlobalMonitoring();

                const stats = globalService.getMonitoringStats();
                console.log('✅ Global Service reiniciado:', stats);
            }, 2000);
        } else {
            console.log('❌ Global Service não encontrado');
        }
    }
}