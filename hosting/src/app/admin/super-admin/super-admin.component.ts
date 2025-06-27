/**
 * Arquivo: super-admin.component.ts
 * Localização: src/app/main/super-admin/super-admin.component.ts
 * 
 * Descrição: Componente principal do painel Super Admin
 * - Gerencia criação, edição e visualização de instâncias do sistema
 * - Controla ativação/desativação de módulos (CRM, Fiscal, etc.)
 * - Administra status de pagamento das instâncias
 * - Oferece ferramentas de debug e monitoramento
 * - Exporta relatórios de instâncias
 * - Gerencia diferentes tipos de perfis de negócio
 * - Interface para copiar dados de acesso das instâncias
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { iTools } from '../../../assets/tools/iTools';
import { SuperAdminAuthService } from './super-admin-auth.service';

@Component({
    selector: 'app-super-admin',
    templateUrl: './super-admin.component.html',
    styleUrls: ['./super-admin.component.scss']
})
export class SuperAdminComponent implements OnInit, OnDestroy {

    // Dados da nova instância
    novaInstancia = {
        secretKey: "1da392a6-89d2-3304-a8b7-959572c7e44e",
        companyName: "",
        projectId: "",
        language: "pt_BR",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        profile: {
            name: "Commerce",
            data: {}
        },
        stores: [{
            _id: "matrix",
            name: "",
            billingName: "",
            limitUsers: 10,
            limitBranches: 0,
            cnpj: "",
            isPaid: true,
            contacts: {
                whatsapp: "",
                email: "",
                phone: ""
            },
            address: {
                postalCode: "",
                city: "",
                country: "Brasil",
                state: "",
                addressLine: ""
            }
        }]
    };

    // Tipo de módulo selecionado
    tipoModulo = 'commerce';
    incluiFiscal = false;
    incluiCRM = false;

    // Controle de edição
    editandoInstancia = false;
    instanciaEditando: any = null;

    // Lista de módulos disponíveis
    modulosDisponiveis = [
        {
            id: 'commerce',
            nome: 'Comércio',
            descricao: 'Para lojas e comércios em geral',
            icone: '🏪',
            profile: 'Commerce'
        },
        {
            id: 'distributor',
            nome: 'Distribuidor',
            descricao: 'Para distribuidoras e atacadistas',
            icone: '📦',
            profile: 'Distributor'
        },
        {
            id: 'mechanics',
            nome: 'Oficina Mecânica',
            descricao: 'Para oficinas e auto centers',
            icone: '🔧',
            profile: 'Mechanics'
        }
    ];

    // Opções de moeda e idioma
    moedas = [
        { value: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
        { value: 'USD', label: 'Dólar Americano', symbol: '$' },
        { value: 'EUR', label: 'Euro', symbol: '€' },
        { value: 'GBP', label: 'Libra Esterlina', symbol: '£' }
    ];

    idiomas = [
        { value: 'pt_BR', label: 'Português (Brasil)' },
        { value: 'en_US', label: 'Inglês (EUA)' }
    ];

    // Controle de estado
    carregando = false;
    mensagem = "";
    tipoMensagem = "";
    mostrarFormulario = false;
    mostrarModalAcesso = false;
    instanciaSelecionada: any = null;
    urlInstanciaSelecionada = "";
    alterandoStatus = false;

    // Dados de acesso após criar
    dadosAcesso = {
        url: "",
        mostrar: false
    };

    // Lista de instâncias
    instancias: any[] = [];
    instanciasFiltradas: any[] = [];
    carregandoInstancias = false;
    filtroInstancias = "";
    filtroStatus = "todos";

    // Contadores de status
    contadorAtivas = 0;
    contadorInativas = 0;

    // === PROPRIEDADES DO MONITOR ===

    // Controle de abas
    abaAtiva: 'instancias' | 'monitor' = 'instancias';

    // Dados do monitor
    monitorData = {
        totalRequests: 0,
        activeWebSockets: 0,
        totalErrors: 0,
        errorRate: 0,
        tenantsMetrics: [] as any[],
        slowOperations: [] as any[],
        systemHealth: 'good' as 'good' | 'warning' | 'critical'
    };

    // Monitor em tempo real
    monitorInterval: any;
    monitorStartTime = new Date();

    constructor(
        private http: HttpClient,
        private authService: SuperAdminAuthService
    ) { }

    ngOnInit(): void {
        console.log('Super Admin carregado!');
        this.buscarInstancias();

        // Iniciar monitor se estiver na aba
        if (this.abaAtiva === 'monitor') {
            this.iniciarMonitor();
        }
    }

    ngOnDestroy(): void {
        // Parar monitor
        this.pararMonitor();
    }

    // Realiza o logout
    logout(): void {
        this.authService.logout();
    }

    // Busca todas as instâncias
    buscarInstancias() {
        this.carregandoInstancias = true;
        this.instancias = [];
        this.instanciasFiltradas = [];

        const managerInstance = new iTools();
        managerInstance.initializeApp({
            projectId: "projects-manager"
        });

        console.log('Buscando projetos no banco projects-manager...');

        managerInstance.database().collection("Projects").get().then((snapshot: any) => {
            console.log('Snapshot recebido:', snapshot);

            if (snapshot && snapshot.docs) {
                snapshot.docs.forEach((doc: any) => {
                    // CORREÇÃO: Tenta diferentes formas de acessar os dados
                    let data = null;
                    if (typeof doc.data === 'function') {
                        data = doc.data();
                    } else if (doc._data) {
                        data = doc._data;
                    } else {
                        data = doc;
                    }

                    console.log('Projeto encontrado:', data);

                    if (data && data.companyName) {
                        // Usa profileName se existir, senão tenta detectar
                        let profileName = data.profileName || this.detectarTipoPerfil(data.profile);

                        const instancia = {
                            companyName: data.companyName,
                            projectId: doc._id || doc.id,
                            profile: data.profile || { name: profileName }, // IMPORTANTE: Usar o profile completo
                            stores: [{ cnpj: data.cnpj || "N/A" }],
                            database: data.database || {},
                            currency: data.currency,
                            language: data.language,
                            timezone: data.timezone,
                            country: data.country,
                            isPaid: data.isPaid !== undefined ? data.isPaid : true,
                            createdAt: data.createdAt || null,
                            hasCRM: false // Inicializar como false
                        };

                        // CORREÇÃO: Melhorar detecção do profileName
                        if (data.profileName) {
                            instancia.profile.name = data.profileName;
                        } else if (data.profile?.name) {
                            instancia.profile.name = data.profile.name;
                        } else {
                            // Detectar baseado nas propriedades do profile
                            instancia.profile.name = this.detectarTipoPerfil(data.profile);
                        }

                        console.log(`📋 Instância ${instancia.projectId}:`);
                        console.log('   - Profile completo:', data.profile);
                        console.log('   - ProfileName detectado:', instancia.profile.name);

                        // Verificar CRM - priorizar profile.data.crm (local correto)
                        // Se existir em ambos os lugares, usar profile.data.crm
                        if (instancia.profile?.data?.crm !== undefined) {
                            instancia.hasCRM = instancia.profile.data.crm.active || false;
                        } else if (instancia.profile?.crm !== undefined) {
                            // Fallback para o local antigo (legado)
                            instancia.hasCRM = instancia.profile.crm.active || false;
                        } else {
                            instancia.hasCRM = false;
                        }

                        console.log(`Instância ${instancia.projectId} - CRM ativo: ${instancia.hasCRM}`);

                        this.instancias.push(instancia);
                    }
                });

                console.log('Total de instâncias encontradas:', this.instancias.length);

                // Ordena por data de criação (mais recentes primeiro)
                this.instancias.sort((a, b) => {
                    if (!a.createdAt) return 1;
                    if (!b.createdAt) return -1;

                    const dateA = a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                    const dateB = b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();

                    return dateB - dateA;
                });
            }

            this.instanciasFiltradas = [...this.instancias];
            this.contadorAtivas = this.instancias.filter(inst => inst.isPaid !== false).length;
            this.contadorInativas = this.instancias.filter(inst => inst.isPaid === false).length;

            this.carregandoInstancias = false;
            managerInstance.close();
        }).catch((erro: any) => {
            console.error('Erro ao buscar projetos:', erro);
            this.mensagem = "Erro ao carregar instâncias";
            this.tipoMensagem = "erro";
            this.carregandoInstancias = false;
            managerInstance.close();
        });
    }

    // Detecta o tipo de perfil baseado nas propriedades
    private detectarTipoPerfil(profile: any): string {
        if (!profile) return 'Commerce';

        console.log('🔍 Detectando tipo de perfil:', profile);

        // Verifica primeiro se tem profileName definido
        if (profile.name) {
            return profile.name;
        }

        // CORREÇÃO: Verifica se tem a propriedade 'vehicles' no registers
        if (profile.registers?.components?.vehicles?.active) {
            return profile.fiscal?.active ? 'Mechanics/Fiscal' : 'Mechanics';
        }
        // Detecta baseado nas propriedades do profile
        else if (profile.menu?.active || profile.kitchen?.active) {
            return profile.fiscal?.active ? 'Restaurant/Fiscal' : 'Restaurant';
        }
        else if (profile.tithes?.active || profile.donations?.active) {
            return 'Church';
        }
        else if (profile.socialDemands?.active || profile.crafts?.active) {
            return 'Cabinet';
        }
        else if (profile.students?.active || profile.registers?.components?.students?.active) {
            return 'School';
        }
        else if (profile.serviceOrders?.active) {
            // Se tem serviceOrders mas não tem vehicles, é Commerce
            return profile.fiscal?.active ? 'Commerce/Fiscal' : 'Commerce';
        }
        else {
            // Padrão baseado em fiscal
            return profile.fiscal?.active ? 'Commerce/Fiscal' : 'Commerce';
        }
    }

    // Cria nova instância
    criarInstancia() {
        // Se está editando, chamar método de atualização
        if (this.editandoInstancia) {
            this.atualizarInstancia();
            return;
        }

        this.carregando = true;
        this.mensagem = "";
        this.dadosAcesso.mostrar = false;

        const moduloSelecionado = this.modulosDisponiveis.find(m => m.id === this.tipoModulo);

        let profileName = moduloSelecionado!.profile;
        if (this.incluiFiscal) {
            profileName = profileName + '/Fiscal';
        }

        // Criar objeto de perfil base
        const profileData: any = this.getBaseProfile(this.tipoModulo);

        // Adicionar ou remover CRM
        if (this.incluiCRM) {
            profileData.crm = {
                active: true,
                components: {
                    dashboard: { active: true },
                    leads: { active: true },
                    pipeline: { active: true },
                    activities: { active: true }
                }
            };
        } else {
            // Garantir que CRM não existe no perfil
            delete profileData.crm;
        }

        // Adicionar fiscal se selecionado
        if (this.incluiFiscal) {
            profileData.fiscal = { active: true };
        }

        this.novaInstancia.profile.name = profileName;
        this.novaInstancia.profile.data = profileData;

        const url = 'https://functions.ipartts.com/bm-iparttsdev/createProjectInstance';

        console.log('Enviando para:', url);
        console.log('Tipo de módulo:', this.tipoModulo);
        console.log('Inclui Fiscal:', this.incluiFiscal);
        console.log('Inclui CRM:', this.incluiCRM);
        console.log('Profile Name:', profileName);
        console.log('Profile Data:', profileData);
        console.log('Dados completos:', this.novaInstancia);

        this.http.post(url, this.novaInstancia).subscribe({
            next: (resposta: any) => {
                console.log('Sucesso!', resposta);

                const tipoDescricao = moduloSelecionado!.nome +
                    (this.incluiFiscal ? ' com Fiscal' : '') +
                    (this.incluiCRM ? ' com CRM' : '');

                this.mensagem = `Instância ${tipoDescricao} criada com sucesso!`;
                this.tipoMensagem = "sucesso";

                this.dadosAcesso = {
                    url: `https://smartgestor.ipartts.com/${this.novaInstancia.projectId}/login`,
                    mostrar: true
                };

                this.mostrarFormulario = false;
                this.carregando = false;
                this.buscarInstancias();
            },
            error: (erro) => {
                console.error('Erro:', erro);
                this.mensagem = `Erro: ${erro.message || 'Falha ao criar instância'}`;
                this.tipoMensagem = "erro";
                this.carregando = false;
            }
        });
    }

    // Atualizar instância existente
    private atualizarInstancia() {
        this.carregando = true;
        this.mensagem = "";

        console.log('🔄 Atualizando instância:', this.instanciaEditando.projectId);

        // Conectar ao banco projects-manager
        const managerInstance = new iTools();
        managerInstance.initializeApp({
            projectId: "projects-manager"
        });

        // Preparar dados de atualização
        const updates: any = {
            currency: this.novaInstancia.currency,
            language: this.novaInstancia.language,
            timezone: this.novaInstancia.timezone
        };

        // Atualizar perfil com CRM
        const profileData = this.getBaseProfile(this.tipoModulo);

        if (this.incluiCRM) {
            profileData.crm = {
                active: true,
                components: {
                    dashboard: { active: true },
                    leads: { active: true },
                    pipeline: { active: true },
                    activities: { active: true }
                }
            };
        } else {
            delete profileData.crm;
        }

        if (this.incluiFiscal) {
            profileData.fiscal = { active: true };
        } else {
            // Remover módulo fiscal caso exista
            profileData.fiscal = iTools.FieldValue.unset();
        }

        // CORREÇÃO: Salvar no formato correto
        updates.profile = {
            name: this.modulosDisponiveis.find(m => m.id === this.tipoModulo)!.profile +
                (this.incluiFiscal ? '/Fiscal' : ''),
            data: profileData  // ⬅️ IMPORTANTE: dados vão dentro de 'data'
        };
        if (!this.incluiFiscal) {
            (<any>updates.profile).fiscal = iTools.FieldValue.unset();
        }

        updates.profileName = updates.profile.name;

        console.log('📝 Dados de atualização:', updates);

        // Atualizar no banco
        managerInstance.database()
            .collection("Projects")
            .doc(this.instanciaEditando.projectId)
            .update(updates)
            .then(() => {
                console.log('✅ Instância atualizada no banco!');

                this.mensagem = `Instância "${this.instanciaEditando.companyName}" atualizada com sucesso!`;
                this.tipoMensagem = "sucesso";

                this.carregando = false;
                this.fecharFormulario();
                this.buscarInstancias();

                managerInstance.close();
            })
            .catch((erro) => {
                console.error('❌ Erro ao atualizar:', erro);
                this.mensagem = `Erro ao atualizar: ${erro.message}`;
                this.tipoMensagem = "erro";
                this.carregando = false;
                managerInstance.close();
            });
    }

    // Obter perfil base por tipo
    private getBaseProfile(tipo: string): any {
        const profiles: any = {
            commerce: {
                dashboard: { active: true },
                cashier: { active: true },
                requests: { active: true },
                serviceOrders: { active: true },
                stock: {
                    active: true,
                    components: {
                        products: { active: true },
                        purchases: { active: true },
                        transfers: { active: true }
                    }
                },
                financial: {
                    active: true,
                    components: {
                        billsToPay: { active: true },
                        billsToReceive: { active: true },
                        bankAccounts: { active: true }
                    }
                },
                registers: {
                    active: true,
                    components: {
                        customers: { active: true },
                        collaborators: { active: true },
                        providers: { active: true },
                        carriers: { active: true },
                        partners: { active: true },
                        paymentMethods: { active: true },
                        services: { active: true },
                        branches: { active: true }
                    }
                },
                reports: { active: true },
                informations: { active: true },
                settings: { active: true }
            },
            distributor: {
                dashboard: { active: true },
                cashier: { active: true },
                requests: { active: true },
                stock: {
                    active: true,
                    components: {
                        products: { active: true },
                        purchases: { active: true },
                        transfers: { active: true }
                    }
                },
                financial: {
                    active: true,
                    components: {
                        billsToPay: { active: true },
                        billsToReceive: { active: true },
                        bankAccounts: { active: true }
                    }
                },
                registers: {
                    active: true,
                    components: {
                        customers: { active: true },
                        collaborators: { active: true },
                        providers: { active: true },
                        carriers: { active: true },
                        partners: { active: true },
                        paymentMethods: { active: true },
                        services: { active: true },
                        branches: { active: true }
                    }
                },
                reports: { active: true },
                informations: { active: true },
                settings: { active: true }
            },
            mechanics: {
                dashboard: { active: true },
                cashier: { active: true },
                requests: { active: true },
                serviceOrders: { active: true },
                stock: {
                    active: true,
                    components: {
                        products: { active: true },
                        purchases: { active: true },
                        transfers: { active: true }
                    }
                },
                financial: {
                    active: true,
                    components: {
                        billsToPay: { active: true },
                        billsToReceive: { active: true },
                        bankAccounts: { active: true }
                    }
                },
                registers: {
                    active: true,
                    components: {
                        customers: { active: true },
                        collaborators: { active: true },
                        providers: { active: true },
                        carriers: { active: true },
                        partners: { active: true },
                        paymentMethods: { active: true },
                        services: { active: true },
                        vehicles: { active: true },
                        branches: { active: true }
                    }
                },
                reports: { active: true },
                informations: { active: true },
                settings: { active: true }
            }
        };

        return profiles[tipo] || profiles.commerce;
    }

    // Método para debug completo do CRM
    async debugCRM(instancia: any) {
        console.log('🔍 ===== DEBUG CRM COMPLETO =====');
        console.log('📦 Instância local:', instancia);

        const managerInstance = new iTools();
        const operationId = `debug-${Date.now()}`;

        try {
            await managerInstance.initializeApp({
                projectId: "projects-manager"
            });

            // Buscar dados direto do banco
            const doc = await managerInstance.database()
                .collection("Projects")
                .doc(instancia.projectId)
                .get();

            if (!doc || !doc.data) {
                console.error('❌ Projeto não encontrado no banco!');
                return;
            }

            const projectData = doc.data();

            console.log('🗄️ Dados completos do banco:', projectData);
            console.log('📋 Profile:', projectData.profile);
            console.log('📊 Profile.data:', projectData.profile?.data);
            console.log('🚀 Profile.crm:', projectData.profile?.crm);
            console.log('🎯 Profile.data.crm:', projectData.profile?.data?.crm);

            // Verificar onde está o CRM
            if (projectData.profile?.crm) {
                console.log('✅ CRM encontrado em profile.crm:', projectData.profile.crm);
            }
            if (projectData.profile?.data?.crm) {
                console.log('✅ CRM encontrado em profile.data.crm:', projectData.profile.data.crm);
            }

            managerInstance.close();

            // Agora vamos verificar o que o sistema está vendo
            console.log('🖥️ ===== O QUE O SISTEMA VÊ =====');

            // Recarregar as configurações
            const logins = window.localStorage.getItem("logins") ? JSON.parse(window.localStorage.getItem("logins")) : {};
            const currentLoginData = logins[(<any>window).id] || {};

            console.log('💾 LocalStorage - currentLoginData:', currentLoginData);
            console.log('📱 LocalStorage - projectInfo:', currentLoginData.projectInfo);
            console.log('🔧 LocalStorage - profile:', currentLoginData.projectInfo?.profile);

        } catch (erro) {
            console.error('❌ Erro no debug:', erro);
            managerInstance.close();
        }

        console.log('🔍 ===== FIM DO DEBUG =====');
    }

    // Forçar atualização do localStorage após mudar CRM
    forcarAtualizacaoLocalStorage(projectId: string, temCRM: boolean) {
        console.log('💾 Forçando atualização do localStorage...');

        const logins = window.localStorage.getItem("logins") ? JSON.parse(window.localStorage.getItem("logins")) : {};
        const currentLoginData = logins[(<any>window).id];

        if (currentLoginData && currentLoginData.projectId === projectId) {
            console.log('📝 Atualizando projectInfo no localStorage');

            if (!currentLoginData.projectInfo) {
                currentLoginData.projectInfo = {};
            }
            if (!currentLoginData.projectInfo.profile) {
                currentLoginData.projectInfo.profile = {};
            }

            // Atualizar CRM em ambos os lugares
            currentLoginData.projectInfo.profile.crm = {
                active: temCRM,
                components: {
                    dashboard: { active: true },
                    leads: { active: true },
                    pipeline: { active: true },
                    activities: { active: true }
                }
            };

            // Se tem profile.data, atualizar lá também
            if (currentLoginData.projectInfo.profile.data) {
                currentLoginData.projectInfo.profile.data.crm = currentLoginData.projectInfo.profile.crm;
            }

            // Salvar no localStorage
            logins[(<any>window).id] = currentLoginData;
            window.localStorage.setItem("logins", JSON.stringify(logins));

            console.log('✅ LocalStorage atualizado!');

            // Forçar reload do menu
            window.location.reload();
        }
    }

    // Alternar CRM rapidamente (versão que corrige inconsistências)
    async alternarCRM(instancia: any) {
        const novoStatusCRM = !instancia.hasCRM;
        const acao = novoStatusCRM ? 'ativar' : 'desativar';

        const confirmacao = confirm(`Tem certeza que deseja ${acao} o CRM para "${instancia.companyName}"?`);

        if (!confirmacao) {
            return;
        }

        this.alterandoStatus = true;
        this.mensagem = "";

        console.log(`🔄 Alternando CRM de ${instancia.projectId} para: ${novoStatusCRM}`);

        // Usar um ID único para cada operação
        const operationId = `crm-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const managerInstance = new iTools();

        try {
            // Inicializar com projectId
            await managerInstance.initializeApp({
                projectId: "projects-manager"
            });

            // Buscar dados atuais
            const doc = await managerInstance.database()
                .collection("Projects")
                .doc(instancia.projectId)
                .get();

            if (!doc || !doc.data) {
                throw new Error('Projeto não encontrado');
            }

            const projectData = doc.data();
            console.log('📄 Dados atuais do projeto:', projectData);

            // Garantir estrutura do profile
            if (!projectData.profile) {
                projectData.profile = { name: 'Commerce', data: {} };
            }
            if (!projectData.profile.data) {
                projectData.profile.data = {};
            }

            // Preparar objeto CRM
            const crmConfig = novoStatusCRM ? {
                active: true,
                components: {
                    dashboard: { active: true },
                    leads: { active: true },
                    pipeline: { active: true },
                    activities: { active: true }
                }
            } : { active: false };

            // IMPORTANTE: Atualizar AMBOS os lugares para manter consistência
            const updateData: any = {
                'profile.data.crm': crmConfig
            };

            // Se o profile.crm existe (legado), remover para evitar conflito
            if (projectData.profile.crm !== undefined) {
                updateData['profile.crm'] = null; // Remover o campo legado
                console.log('🗑️ Removendo profile.crm legado');
            }

            console.log('📝 Dados de atualização:', updateData);

            // Atualizar no banco
            await managerInstance.database()
                .collection("Projects")
                .doc(instancia.projectId)
                .update(updateData);

            console.log('✅ CRM atualizado com sucesso no banco!');

            // Fechar conexão ANTES de atualizar localmente
            managerInstance.close();

            // Atualizar localmente
            instancia.hasCRM = novoStatusCRM;
            if (!instancia.profile) instancia.profile = {};
            if (!instancia.profile.data) instancia.profile.data = {};
            instancia.profile.data.crm = crmConfig;

            // Remover CRM do lugar errado se existir
            if (instancia.profile.crm) {
                delete instancia.profile.crm;
            }

            this.mensagem = `CRM ${novoStatusCRM ? 'ativado' : 'desativado'} para ${instancia.companyName}!`;
            this.tipoMensagem = "sucesso";

            setTimeout(() => {
                this.mensagem = "";
            }, 3000);

            // Limpar cache local se for a instância atual
            const logins = window.localStorage.getItem("logins") ? JSON.parse(window.localStorage.getItem("logins")) : {};
            const currentLoginData = logins[(<any>window).id];

            if (currentLoginData && currentLoginData.projectId === instancia.projectId) {
                console.log('🧹 Limpando cache da instância atual...');

                // Forçar atualização removendo dados do profile
                if (currentLoginData.projectInfo?.profile) {
                    delete currentLoginData.projectInfo.profile.crm;
                    if (currentLoginData.projectInfo.profile.data) {
                        delete currentLoginData.projectInfo.profile.data.crm;
                    }
                }

                // Salvar no localStorage
                logins[(<any>window).id] = currentLoginData;
                window.localStorage.setItem("logins", JSON.stringify(logins));

                console.log('✅ Cache limpo! Recarregando em 2 segundos...');

                // Mostrar mensagem para o usuário fazer logout
                alert('⚠️ CRM ' + (novoStatusCRM ? 'ativado' : 'desativado') + ' com sucesso!\n\nPara que as alterações tenham efeito completo, faça logout e login novamente na instância.');
            }

            // Recarregar a lista para garantir consistência
            setTimeout(() => {
                this.buscarInstancias();
            }, 1000);

        } catch (erro: any) {
            console.error('❌ Erro ao alternar CRM:', erro);
            this.mensagem = `Erro ao ${acao} CRM: ${erro.message || 'Erro desconhecido'}`;
            this.tipoMensagem = "erro";

            // Garantir que a conexão seja fechada
            try {
                managerInstance.close();
            } catch (e) {
                console.error('Erro ao fechar conexão:', e);
            }
        } finally {
            this.alterandoStatus = false;
        }
    }

    // Muda o tipo de módulo
    mudarTipoModulo(tipo: string) {
        this.tipoModulo = tipo;
        console.log('Tipo de módulo alterado para:', tipo);
    }

    // Gera projectId baseado no nome
    gerarProjectId() {
        // Quando estamos editando uma instância existente o ProjectId não deve
        // ser alterado automaticamente. A geração ocorre apenas para novas
        // instâncias.
        if (this.editandoInstancia) {
            return;
        }


        if (this.novaInstancia.companyName) {
            const id = this.novaInstancia.companyName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .trim();

            this.novaInstancia.projectId = 'bm-' + id;
            this.novaInstancia.stores[0].name = this.novaInstancia.companyName.toLowerCase();
            this.novaInstancia.stores[0].billingName = this.novaInstancia.companyName.toUpperCase();
        }
    }

    // Limpa formulário
    limparFormulario() {
        this.novaInstancia = {
            secretKey: "1da392a6-89d2-3304-a8b7-959572c7e44e",
            companyName: "",
            projectId: "",
            language: "pt_BR",
            currency: "BRL",
            timezone: "America/Sao_Paulo",
            profile: {
                name: "Commerce",
                data: {}
            },
            stores: [{
                _id: "matrix",
                name: "",
                billingName: "",
                limitUsers: 10,
                limitBranches: 0,
                cnpj: "",
                isPaid: true,
                contacts: {
                    whatsapp: "",
                    email: "",
                    phone: ""
                },
                address: {
                    postalCode: "",
                    city: "",
                    country: "Brasil",
                    state: "",
                    addressLine: ""
                }
            }]
        };

        this.dadosAcesso.mostrar = false;
        this.mensagem = "";
        this.tipoModulo = 'commerce';
        this.incluiFiscal = false;
        this.incluiCRM = false;
        this.editandoInstancia = false;
        this.instanciaEditando = null;
    }

    // Volta para a lista de instâncias
    voltarParaLista() {
        this.dadosAcesso.mostrar = false;
        this.mensagem = "";
    }

    // Abre o formulário para criar nova instância
    criarNovaInstancia() {
        this.dadosAcesso.mostrar = false;
        this.limparFormulario();
        this.abrirFormulario();
    }

    // Copia URL
    copiarUrl(url: string) {
        navigator.clipboard.writeText(url).then(() => {
            this.mensagem = "URL copiada com sucesso!";
            this.tipoMensagem = "sucesso";
            setTimeout(() => {
                this.mensagem = "";
            }, 3000);
        });
    }

    // Copia todos os dados de acesso
    copiarDadosAcesso() {
        const dados = `
  URL: ${this.dadosAcesso.url}
  Usuário: matrixadmin
  Senha: 21211212
  
  Atenção: Altere a senha no primeiro acesso!
          `.trim();

        navigator.clipboard.writeText(dados).then(() => {
            this.mensagem = "Dados de acesso copiados com sucesso!";
            this.tipoMensagem = "sucesso";
            setTimeout(() => {
                this.mensagem = "";
            }, 3000);
        });
    }

    // Filtra instâncias
    filtrarInstancias() {
        const filtro = this.filtroInstancias.toLowerCase();
        let listaParaFiltrar = [...this.instancias];

        if (this.filtroStatus === 'ativas') {
            listaParaFiltrar = listaParaFiltrar.filter(inst => inst.isPaid !== false);
        } else if (this.filtroStatus === 'inativas') {
            listaParaFiltrar = listaParaFiltrar.filter(inst => inst.isPaid === false);
        }

        if (!filtro) {
            this.instanciasFiltradas = listaParaFiltrar;
            return;
        }

        this.instanciasFiltradas = listaParaFiltrar.filter(instancia => {
            return instancia.companyName.toLowerCase().includes(filtro) ||
                instancia.projectId.toLowerCase().includes(filtro) ||
                (instancia.stores?.[0]?.cnpj && instancia.stores[0].cnpj.includes(filtro));
        });
    }

    // Filtra por status
    filtrarPorStatus(status: string) {
        this.filtroStatus = status;
        this.filtrarInstancias();
    }

    // Abre o formulário modal
    abrirFormulario() {
        this.mostrarFormulario = true;
        this.mensagem = "";
    }

    // Fecha o formulário modal
    fecharFormulario() {
        this.mostrarFormulario = false;
        this.editandoInstancia = false;
        this.instanciaEditando = null;
        this.limparFormulario();
    }

    // Mostra modal com informações de acesso
    mostrarInfoAcesso(instancia: any) {
        this.instanciaSelecionada = instancia;
        this.urlInstanciaSelecionada = `https://smartgestor.ipartts.com/${instancia.projectId}/login`;
        this.mostrarModalAcesso = true;
    }

    // Fecha modal de acesso
    fecharModalAcesso() {
        this.mostrarModalAcesso = false;
        this.instanciaSelecionada = null;
    }
    // Abre a instância em nova aba e injeta o monitor de requisições
    acessarInstanciaComMonitor(instancia: any) {
        if (!instancia || !instancia.projectId) {
            console.error('Instância inválida para monitoramento', instancia);
            return;
        }

        const url = `https://smartgestor.ipartts.com/${instancia.projectId}/login`;
        const novaJanela = window.open(url, '_blank');

        if (!novaJanela) {
            console.error('Falha ao abrir nova aba. Verifique bloqueio de pop-ups.');
            return;
        }

        const inject = () => {
            try {
                const scriptEl = novaJanela.document.createElement('script');
                scriptEl.id = 'super-admin-monitor-script';
                scriptEl.text = this.getMonitorScript();
                novaJanela.document.head.appendChild(scriptEl);
            } catch (e) {
                console.error('Erro ao injetar monitor na nova janela', e);
                if (typeof (novaJanela as any).eval === 'function') {
                    (novaJanela as any).eval(this.getMonitorScript());
                }
            }
        };

        if (novaJanela.document.readyState === 'complete') {
            inject();
        } else {
            novaJanela.addEventListener('load', inject);
        }
    }
    // Copia informações completas
    copiarInfoCompleta() {
        const info = `
  Empresa: ${this.instanciaSelecionada.companyName}
  Project ID: ${this.instanciaSelecionada.projectId}
  URL: ${this.urlInstanciaSelecionada}
  
  Login padrão:
  Usuário: matrixadmin
  Senha: 21211212
          `.trim();

        navigator.clipboard.writeText(info).then(() => {
            this.mensagem = "Informações copiadas com sucesso!";
            this.tipoMensagem = "sucesso";
            setTimeout(() => {
                this.mensagem = "";
            }, 3000);
        });
    }

    // Formata data para exibição
    formatarData(data: any): string {
        if (!data) return 'N/A';

        try {
            let date: Date;

            // CORREÇÃO: Trata diferentes formatos de data
            if (data.seconds) {
                // Formato Firestore Timestamp
                date = new Date(data.seconds * 1000);
            } else if (data._seconds) {
                // Formato alternativo do Firestore
                date = new Date(data._seconds * 1000);
            } else if (typeof data === 'string') {
                // String de data
                date = new Date(data);
            } else if (data instanceof Date) {
                // Já é um objeto Date
                date = data;
            } else if (typeof data === 'number') {
                // Timestamp em millisegundos
                date = new Date(data);
            } else {
                // Tenta converter diretamente
                date = new Date(data);
            }

            // Verifica se a data é válida
            if (!isNaN(date.getTime())) {
                // Formata para o padrão brasileiro
                const dia = date.getDate().toString().padStart(2, '0');
                const mes = (date.getMonth() + 1).toString().padStart(2, '0');
                const ano = date.getFullYear();
                const hora = date.getHours().toString().padStart(2, '0');
                const minuto = date.getMinutes().toString().padStart(2, '0');

                // Retorna data e hora
                return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
            }
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            console.log('Objeto de data problemático:', data);
        }

        return 'N/A';
    }

    // Retorna a descrição do tipo baseado no profile name
    getTipoDescricao(profileName: string): string {
        if (!profileName) return '🏪 Comércio';

        console.log('🏷️ Obtendo descrição para:', profileName);

        const baseProfile = profileName.replace('/Fiscal', '');
        const temFiscal = profileName.includes('/Fiscal');

        let tipo = '';
        let icone = '';

        switch (baseProfile) {
            case 'Commerce':
                icone = '🏪';
                tipo = 'Comércio';
                break;
            case 'Distributor':
                icone = '📦';
                tipo = 'Distribuidor';
                break;
            case 'Mechanics':
                icone = '🔧';
                tipo = 'Oficina';
                break;
            case 'Church':
                icone = '⛪';
                tipo = 'Igreja';
                break;
            case 'Restaurant':
                icone = '🍽️';
                tipo = 'Restaurante';
                break;
            case 'School':
                icone = '🎓';
                tipo = 'Escola';
                break;
            case 'Cabinet':
                icone = '🏛️';
                tipo = 'Gabinete';
                break;
            default:
                console.log('⚠️ Tipo não reconhecido:', baseProfile);
                icone = '🏪';
                tipo = 'Comércio';
        }

        if (temFiscal) {
            tipo += ' + Fiscal';
        }

        return `${icone} ${tipo}`;
    }

    // Retorna a classe CSS para o badge
    getBadgeClass(profileName: string): string {
        if (!profileName) return 'badge-default';

        const baseProfile = profileName.replace('/Fiscal', '');

        switch (baseProfile) {
            case 'Commerce':
                return 'badge-commerce';
            case 'Distributor':
                return 'badge-distributor';
            case 'Mechanics':
                return 'badge-mechanics';
            case 'Church':
                return 'badge-church';
            case 'Restaurant':
                return 'badge-restaurant';
            case 'School':
                return 'badge-school';
            case 'Cabinet':
                return 'badge-cabinet';
            default:
                return 'badge-default';
        }
    }

    // Exporta lista de instâncias para CSV
    exportarLista() {
        const headers = ['Empresa', 'Project ID', 'Tipo', 'Status', 'CRM', 'Moeda', 'Idioma', 'CNPJ', 'Email', 'Criado em'];

        const rows = this.instanciasFiltradas.map(inst => [
            inst.companyName,
            inst.projectId,
            this.getTipoDescricao(inst.profile?.name).replace(/[^\w\s+]/g, ''),
            inst.isPaid === false ? 'Inativa' : 'Ativa',
            inst.hasCRM ? 'Sim' : 'Não',
            this.getMoedaLabel(inst.currency),
            this.getIdiomaLabel(inst.language),
            inst.stores?.[0]?.cnpj || 'N/A',
            inst.stores?.[0]?.contacts?.email || 'N/A',
            this.formatarData(inst.createdAt)
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `instancias_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.mensagem = "Lista exportada com sucesso!";
        this.tipoMensagem = "sucesso";
        setTimeout(() => {
            this.mensagem = "";
        }, 3000);
    }

    // Alterna o status de ativo/inativo da instância
    alternarStatusInstancia(instancia: any) {
        const novoStatus = instancia.isPaid === false ? 'ativar' : 'desativar';
        const confirmacao = confirm(`Tem certeza que deseja ${novoStatus} a instância "${instancia.companyName}"?`);

        if (!confirmacao) {
            return;
        }

        this.alterandoStatus = true;
        this.mensagem = "";

        const novoIsPaid = instancia.isPaid === false ? true : false;

        console.log(`Alterando status da instância ${instancia.projectId} para isPaid: ${novoIsPaid}`);

        const url = 'https://functions.ipartts.com/bm-iparttsdev/updateInstanceStatus';

        const payload = {
            secretKey: "1da392a6-89d2-3304-a8b7-959572c7e44e",
            projectId: instancia.projectId,
            isPaid: novoIsPaid
        };

        console.log('Enviando requisição para:', url);
        console.log('Payload:', payload);

        this.http.post(url, payload).subscribe({
            next: (resposta: any) => {
                console.log('Resposta da API:', resposta);

                const managerInstance = new iTools();
                managerInstance.initializeApp({
                    projectId: "projects-manager"
                });

                managerInstance.database().collection("Projects").doc(instancia.projectId).update({
                    isPaid: novoIsPaid
                }).then(() => {
                    console.log('Status também atualizado no projects-manager');
                    managerInstance.close();

                    instancia.isPaid = novoIsPaid;

                    this.contadorAtivas = this.instancias.filter(inst => inst.isPaid !== false).length;
                    this.contadorInativas = this.instancias.filter(inst => inst.isPaid === false).length;

                    this.mensagem = `Instância ${novoIsPaid ? 'ativada' : 'desativada'} com sucesso!`;
                    this.tipoMensagem = "sucesso";

                    setTimeout(() => {
                        this.mensagem = "";
                    }, 3000);

                    this.alterandoStatus = false;
                }).catch((erro: any) => {
                    console.error('Erro ao atualizar projects-manager:', erro);
                    instancia.isPaid = novoIsPaid;

                    this.contadorAtivas = this.instancias.filter(inst => inst.isPaid !== false).length;
                    this.contadorInativas = this.instancias.filter(inst => inst.isPaid === false).length;

                    this.mensagem = `Instância ${novoIsPaid ? 'ativada' : 'desativada'} com sucesso!`;
                    this.tipoMensagem = "sucesso";

                    setTimeout(() => {
                        this.mensagem = "";
                    }, 3000);

                    this.alterandoStatus = false;
                    managerInstance.close();
                });
            },
            error: (erro) => {
                console.error('Erro na API:', erro);

                if (erro.status === 404) {
                    this.mensagem = "Função de atualização não disponível. Entre em contato com o suporte.";
                    this.tipoMensagem = "erro";
                } else {
                    this.mensagem = `Erro ao ${novoStatus} instância: ${erro.message || 'Falha na comunicação'}`;
                    this.tipoMensagem = "erro";
                }

                this.alterandoStatus = false;
            }
        });
    }

    // Editar instância existente
    editarInstancia(instancia: any) {
        console.log('📝 Editando instância:', instancia);

        this.instanciaEditando = instancia;
        this.editandoInstancia = true;

        // Preencher o formulário com os dados atuais
        this.novaInstancia = {
            ...this.novaInstancia,
            companyName: instancia.companyName,
            projectId: instancia.projectId,
            currency: instancia.currency || 'BRL',
            language: instancia.language || 'pt_BR',
            timezone: instancia.timezone || 'America/Sao_Paulo',
            profile: instancia.profile || { name: 'Commerce', data: {} }
        };

        // Preencher outros campos se existirem
        if (instancia.stores && instancia.stores[0]) {
            this.novaInstancia.stores[0].cnpj = instancia.stores[0].cnpj || '';
        }

        // Detectar se tem CRM - verificar em profile.data também
        this.incluiCRM = instancia.profile?.crm?.active ||
            instancia.profile?.data?.crm?.active ||
            false;

        // Detectar se tem Fiscal
        const profileName = instancia.profile?.name || '';
        this.incluiFiscal = profileName.includes('Fiscal');

        // Detectar tipo de módulo
        if (profileName.includes('Mechanics')) {
            this.tipoModulo = 'mechanics';
        } else if (profileName.includes('Distributor')) {
            this.tipoModulo = 'distributor';
        } else {
            this.tipoModulo = 'commerce';
        }

        // Abrir formulário
        this.mostrarFormulario = true;
    }

    // Métodos auxiliares para exibir configurações
    getMoedaSimbolo(currency: string): string {
        const simbolos: any = {
            'BRL': 'R$',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        return simbolos[currency] || 'R$';
    }

    getMoedaLabel(currency: string): string {
        const moeda = this.moedas.find(m => m.value === currency);
        return moeda ? moeda.label : 'Real Brasileiro';
    }

    getIdiomaFlag(language: string): string {
        const flags: any = {
            'pt_BR': '🇧🇷',
            'en_US': '🇺🇸'
        };
        return flags[language] || '🇧🇷';
    }

    getIdiomaLabel(language: string): string {
        const idioma = this.idiomas.find(i => i.value === language);
        return idioma ? idioma.label : 'Português (Brasil)';
    }

    // Método de debug para verificar status do CRM
    verificarCRM() {
        console.log('🔍 ===== VERIFICANDO STATUS DO CRM =====');

        // Verificar localStorage
        const logins = window.localStorage.getItem("logins") ? JSON.parse(window.localStorage.getItem("logins")) : {};
        console.log('📦 Todos os logins:', logins);

        // Verificar cada login
        Object.keys(logins).forEach(key => {
            const login = logins[key];
            console.log(`\n🏢 Instância: ${login.projectId}`);
            console.log('Profile:', login.projectInfo?.profile);
            console.log('CRM em profile:', login.projectInfo?.profile?.crm);
            console.log('CRM em profile.data:', login.projectInfo?.profile?.data?.crm);
        });

        console.log('\n🔍 ===== FIM DA VERIFICAÇÃO =====');
    }

    // Método para limpar cache do localStorage
    limparCacheCompleto() {
        console.log('🧹 ===== LIMPANDO CACHE COMPLETO =====');

        const logins = window.localStorage.getItem("logins") ? JSON.parse(window.localStorage.getItem("logins")) : {};

        Object.keys(logins).forEach(key => {
            const login = logins[key];
            console.log(`\n🏢 Limpando cache de: ${login.projectId}`);

            if (login.projectInfo?.profile) {
                // Remover dados conflitantes
                if (login.projectInfo.profile.crm && login.projectInfo.profile.data?.crm) {
                    // Se existem ambos, priorizar profile.data.crm
                    login.projectInfo.profile.crm = login.projectInfo.profile.data.crm;
                    console.log('✅ Sincronizado CRM de profile.data para profile');
                }
            }
        });

        // Salvar no localStorage
        window.localStorage.setItem("logins", JSON.stringify(logins));
        console.log('✅ Cache limpo e sincronizado!');

        // Verificar novamente
        this.verificarCRM();

        alert('Cache limpo! Por favor, faça logout e login novamente para aplicar as mudanças.');
    }

    // === MÉTODOS DO MONITOR ===

    // Alternar entre abas
    mudarAba(aba: 'instancias' | 'monitor') {
        this.abaAtiva = aba;

        if (aba === 'monitor') {
            this.iniciarMonitor();
        } else {
            this.pararMonitor();
        }
    }

    // Iniciar monitoramento
    iniciarMonitor() {
        console.log('🚀 Iniciando monitor do Super Admin...');

        // Injetar script de monitoramento em todas as instâncias
        this.injetarMonitorGlobal();

        // Atualizar dados a cada 5 segundos
        this.monitorInterval = setInterval(() => {
            this.atualizarDadosMonitor();
        }, 5000);

        // Primeira atualização
        this.atualizarDadosMonitor();
    }

    // Parar monitoramento
    pararMonitor() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    // Injetar monitor global
    injetarMonitorGlobal() {
        const monitorScript = this.getMonitorScript();

        // Executar no contexto global da página sem depender de "eval"
        // (alguns navegadores podem bloquear eval por política de segurança)
        try {
            const scriptEl = document.createElement('script');
            scriptEl.id = 'super-admin-monitor-script';
            scriptEl.text = monitorScript;
            document.head.appendChild(scriptEl);
        } catch (e) {
            // Fallback para eval caso a criação dinâmica falhe
            if (typeof (window as any).eval === 'function') {
                (window as any).eval(monitorScript);
            }
        }
    }

    // Retorna o script de monitoramento utilizado nas páginas
    private getMonitorScript(): string {
        return `
             if (!window.SuperAdminMonitor) {
                 window.SuperAdminMonitor = {
                     requests: [],
                     errors: 0,
                     websockets: 0,
                     tenantData: new Map()
                 };
                 
                 // Interceptar Fetch
                 const originalFetch = window.fetch;
                 window.fetch = async function(...args) {
                     const tenant = window.location.pathname.split('/')[1];
                     const start = performance.now();
                     
                     try {
                         const response = await originalFetch(...args);
                         const duration = performance.now() - start;
                         
                         window.SuperAdminMonitor.requests.push({
                             tenant: tenant,
                             type: 'fetch',
                             duration: duration,
                             url: args[0],
                             timestamp: new Date()
                         });
                         
                         if (!response.ok) {
                             window.SuperAdminMonitor.errors++;
                         }
                         
                         return response;
                     } catch (error) {
                         window.SuperAdminMonitor.errors++;
                         throw error;
                     }
                 };
                 
                 // Interceptar WebSocket
                 const OriginalWebSocket = window.WebSocket;
                 window.WebSocket = function(...args) {
                     const ws = new OriginalWebSocket(...args);
                     const tenant = window.location.pathname.split('/')[1];
                     
                     window.SuperAdminMonitor.websockets++;
                     
                     ws.addEventListener('close', () => {
                         window.SuperAdminMonitor.websockets--;
                     });
                     
                     ws.addEventListener('message', (event) => {
                         try {
                             const data = JSON.parse(event.data);
                             if (data.error || (data.actionResult && !data.actionResult.status)) {
                                 window.SuperAdminMonitor.errors++;
                             }
                         } catch (e) {}
                     });
                     
                     return ws;
                    };
            }
            `;
    }

    // Atualizar dados do monitor
    atualizarDadosMonitor() {
        // Coletar dados do monitor global
        if ((window as any).SuperAdminMonitor) {
            const monitor = (window as any).SuperAdminMonitor;

            // Atualizar totais
            this.monitorData.totalRequests = monitor.requests.length;
            this.monitorData.totalErrors = monitor.errors;
            this.monitorData.activeWebSockets = monitor.websockets;

            // Calcular taxa de erro
            this.monitorData.errorRate = this.monitorData.totalRequests > 0
                ? (this.monitorData.totalErrors / this.monitorData.totalRequests) * 100
                : 0;

            // Agrupar por tenant
            this.calcularMetricasPorTenant(monitor.requests);

            // Identificar operações lentas
            this.identificarOperacoesLentas(monitor.requests);

            // Determinar saúde do sistema
            this.determinarSaudeDoSistema();
        }

        // Buscar dados adicionais das instâncias
        this.complementarDadosInstancias();
    }

    // Calcular métricas por tenant
    calcularMetricasPorTenant(requests: any[]) {
        const tenantMap = new Map();

        requests.forEach(req => {
            if (!tenantMap.has(req.tenant)) {
                tenantMap.set(req.tenant, {
                    tenant: req.tenant,
                    requests: 0,
                    totalTime: 0,
                    errors: 0,
                    avgResponseTime: 0
                });
            }

            const data = tenantMap.get(req.tenant);
            data.requests++;
            data.totalTime += req.duration;
        });

        // Converter para array e calcular médias
        this.monitorData.tenantsMetrics = Array.from(tenantMap.values()).map(data => {
            data.avgResponseTime = data.requests > 0 ? data.totalTime / data.requests : 0;

            // Encontrar nome da empresa
            const instancia = this.instancias.find(i => i.projectId === data.tenant);
            data.companyName = instancia?.companyName || data.tenant;
            data.isPaid = instancia?.isPaid !== false;

            return data;
        }).sort((a, b) => b.requests - a.requests); // Ordenar por mais ativo
    }

    // Identificar operações lentas
    identificarOperacoesLentas(requests: any[]) {
        this.monitorData.slowOperations = requests
            .filter(req => req.duration > 1000) // Mais de 1 segundo
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10) // Top 10 mais lentas
            .map(req => ({
                ...req,
                durationFormatted: (req.duration / 1000).toFixed(2) + 's',
                companyName: this.instancias.find(i => i.projectId === req.tenant)?.companyName || req.tenant
            }));
    }

    // Determinar saúde do sistema
    determinarSaudeDoSistema() {
        if (this.monitorData.errorRate > 10) {
            this.monitorData.systemHealth = 'critical';
        } else if (this.monitorData.errorRate > 5 || this.monitorData.slowOperations.length > 5) {
            this.monitorData.systemHealth = 'warning';
        } else {
            this.monitorData.systemHealth = 'good';
        }
    }

    // Complementar com dados das instâncias
    complementarDadosInstancias() {
        // Para cada instância ativa, verificar se está no monitor
        this.instancias.forEach(instancia => {
            const metrica = this.monitorData.tenantsMetrics.find(m => m.tenant === instancia.projectId);

            if (!metrica && instancia.isPaid !== false) {
                // Instância ativa mas sem atividade
                this.monitorData.tenantsMetrics.push({
                    tenant: instancia.projectId,
                    companyName: instancia.companyName,
                    requests: 0,
                    totalTime: 0,
                    errors: 0,
                    avgResponseTime: 0,
                    isPaid: true,
                    inactive: true
                });
            }
        });
    }

    // Exportar relatório do monitor
    exportarRelatorioMonitor() {
        const relatorio = {
            dataExportacao: new Date(),
            periodoMonitoramento: {
                inicio: this.monitorStartTime,
                fim: new Date(),
                duracaoMinutos: Math.round((new Date().getTime() - this.monitorStartTime.getTime()) / 60000)
            },
            resumoGeral: {
                totalRequisicoes: this.monitorData.totalRequests,
                totalErros: this.monitorData.totalErrors,
                taxaErro: this.monitorData.errorRate.toFixed(2) + '%',
                websocketsAtivos: this.monitorData.activeWebSockets,
                saudeSistema: this.monitorData.systemHealth
            },
            metricasPorTenant: this.monitorData.tenantsMetrics,
            operacoesLentas: this.monitorData.slowOperations,
            recomendacoes: this.gerarRecomendacoes()
        };

        const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitor-superadmin-${new Date().toISOString()}.json`;
        a.click();
    }

    // Gerar recomendações automáticas
    gerarRecomendacoes(): string[] {
        const recomendacoes = [];

        // Taxa de erro alta
        if (this.monitorData.errorRate > 10) {
            recomendacoes.push('⚠️ Taxa de erro crítica! Verificar logs do servidor urgentemente.');
        } else if (this.monitorData.errorRate > 5) {
            recomendacoes.push('⚠️ Taxa de erro elevada. Investigar possíveis problemas.');
        }

        // Operações lentas
        if (this.monitorData.slowOperations.length > 5) {
            recomendacoes.push('🐌 Muitas operações lentas detectadas. Considere otimizar queries ou adicionar índices.');
        }

        // Tenants inativos
        const inativos = this.monitorData.tenantsMetrics.filter(t => t.inactive).length;
        if (inativos > 5) {
            recomendacoes.push(`💤 ${inativos} tenants sem atividade. Verificar se estão com problemas de acesso.`);
        }

        // Tenants com muitos erros
        const tenantsComErros = this.monitorData.tenantsMetrics.filter(t => t.errors > 10);
        if (tenantsComErros.length > 0) {
            recomendacoes.push(`❌ ${tenantsComErros.length} tenants com muitos erros. Verificar individualmente.`);
        }

        // WebSockets
        if (this.monitorData.activeWebSockets > 100) {
            recomendacoes.push('🔌 Muitos WebSockets ativos. Implementar connection pooling pode ajudar.');
        }

        if (recomendacoes.length === 0) {
            recomendacoes.push('✅ Sistema operando normalmente!');
        }

        return recomendacoes;
    }

    // Limpar dados do monitor
    limparDadosMonitor() {
        if ((window as any).SuperAdminMonitor) {
            (window as any).SuperAdminMonitor = {
                requests: [],
                errors: 0,
                websockets: 0,
                tenantData: new Map()
            };
        }

        this.monitorStartTime = new Date();
        this.atualizarDadosMonitor();
    }
}