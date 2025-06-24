// Arquivo: customer-import.component.ts
// Localização: src/app/pages/crm/components/customer-import/customer-import.component.ts
// Componente: Interface de Importação Inteligente de Clientes

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Serviços
import { CustomerImportService, ICustomerAnalysis } from '../../services/customer-import.service';
import { AlertService } from '@shared/services/alert.service';
import { IToolsService } from '@shared/services/iTools.service';

// Utilities
import { Utilities } from '@shared/utilities/utilities';

@Component({
    selector: 'app-customer-import',
    templateUrl: './customer-import.component.html',
    styleUrls: ['./customer-import.component.scss']
})
export class CustomerImportComponent implements OnInit, OnDestroy {

    @Output() onClose = new EventEmitter<void>();
    @Output() onImportComplete = new EventEmitter<number>();

    private destroy$ = new Subject<void>();

    // Estados
    public currentStep: 'start' | 'analyzing' | 'selection' | 'importing' | 'complete' = 'start';

    // Dados
    public analysisResults: ICustomerAnalysis[] = [];
    public allAnalysisResults: ICustomerAnalysis[] = []; // Guarda todos os resultados originais
    public selectedCustomers: Set<string> = new Set();
    public importProgress = {
        status: 'idle',
        current: 0,
        total: 0,
        message: ''
    };

    // Filtros
    public filterCategory = 'all';
    public filterPriority = 'all';
    public searchTerm = '';
    public showOnlyNew = true;

    // Estatísticas
    public stats = {
        totalCustomers: 0,
        hotCustomers: 0,
        warmCustomers: 0,
        coldCustomers: 0,
        newCustomers: 0,
        totalValue: 0,
        averageScore: 0
    };

    // Controles de UI
    public selectAll = false;
    public sortBy: 'score' | 'value' | 'recent' = 'score';
    public sortOrder: 'asc' | 'desc' = 'desc';

    constructor(
        private customerImportService: CustomerImportService,
        private alertService: AlertService,
        private iToolsService: IToolsService
    ) { }

    ngOnInit(): void {
        // Observar progresso
        this.customerImportService.importProgress$
            .pipe(takeUntil(this.destroy$))
            .subscribe(progress => {
                this.importProgress = progress;

                // Atualizar step baseado no status
                if (progress.status === 'analyzing') {
                    this.currentStep = 'analyzing';
                } else if (progress.status === 'completed' && this.currentStep === 'analyzing') {
                    this.currentStep = 'selection';
                } else if (progress.status === 'importing') {
                    this.currentStep = 'importing';
                } else if (progress.status === 'completed' && this.currentStep === 'importing') {
                    this.currentStep = 'complete';
                }
            });

        // Observar resultados da análise
        this.customerImportService.analysisResults$
            .pipe(takeUntil(this.destroy$))
            .subscribe(results => {
                this.allAnalysisResults = results; // Guarda todos os resultados
                this.analysisResults = [...results]; // Cria uma cópia para filtrar
                this.calculateStats();
                this.applyFiltersAndSort();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.customerImportService.resetProgress();
    }

    private async debugCollections(): Promise<void> {
        console.log('🔍 DEBUG: Verificando estrutura dos dados...');
        console.log('🏢 Store ID:', Utilities.storeID);

        // Verificar TODOS os tipos de documentos
        const collections = ['Requests', 'Sales', 'CashierSales', 'ServiceOrders'];

        for (const collection of collections) {
            try {
                const snapshot = await this.iToolsService.database()
                    .collection(collection)
                    .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                    .limit(3) // Pegar 3 exemplos
                    .get();

                if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
                    console.log(`\n📦 Estrutura de ${collection}:`);

                    snapshot.docs.forEach((doc, index) => {
                        const data = doc.data();
                        console.log(`\nExemplo ${index + 1}:`);
                        console.log('ID:', doc.id);
                        console.log('Campos principais:', Object.keys(data));

                        // Verificar valores
                        console.log('Valores encontrados:');
                        ['total', 'value', 'valor', 'totalValue', 'amount', 'valorTotal',
                            'totalAmount', 'subtotal', 'totalPrice', 'finalValue'].forEach(field => {
                                if (data[field] !== undefined) {
                                    console.log(`  - ${field}: ${data[field]}`);
                                }
                            });

                        // Verificar datas
                        console.log('Datas encontradas:');
                        ['date', 'createdAt', 'created', 'registerDate', 'saleDate',
                            'orderDate', 'datetime'].forEach(field => {
                                if (data[field]) {
                                    console.log(`  - ${field}: ${data[field]}`);
                                }
                            });

                        // Verificar cliente
                        console.log('Dados do cliente:');
                        ['customer', 'client', 'cliente', 'customerId', 'clientId'].forEach(field => {
                            if (data[field]) {
                                console.log(`  - ${field}:`, data[field]);
                            }
                        });
                    });
                }
            } catch (error) {
                console.error(`❌ Erro ao verificar ${collection}:`, error);
            }
        }
    }
    // Adicione estes métodos na classe CustomerImportComponent

    /**
     * DEBUG: Buscar vendas de um cliente específico
     */
    public async debugCustomer(): Promise<void> {
        const customerName = prompt('Digite o nome do cliente para debugar:');

        if (customerName) {
            console.log(`🔍 Iniciando debug para: ${customerName}`);

            try {
                await this.customerImportService.debugSpecificCustomer(customerName);
                console.log('✅ Debug concluído! Verifique o console.');
            } catch (error) {
                console.error('❌ Erro no debug:', error);
            }
        }
    }

    /**
     * Executar análise com log detalhado
     */
    public async analyzeWithDebug(): Promise<void> {
        // Ativar modo debug temporariamente
        console.log('🐛 MODO DEBUG ATIVADO - Logs detalhados serão exibidos');

        // Fazer análise normal
        await this.analyzeCustomers();
    }
    analyzeCustomers() {
        throw new Error('Method not implemented.');
    }

    // Iniciar análise
    public async startAnalysis(): Promise<void> {
        try {
            // Debug primeiro
            await this.debugCollections();

            this.currentStep = 'analyzing';
            await this.customerImportService.analyzeCustomers();
        } catch (error) {
            this.alertService.alert('Erro ao analisar clientes', 'error');
            this.currentStep = 'start';
        }
    }

    // Calcular estatísticas
    private calculateStats(): void {
        // IMPORTANTE: usar allAnalysisResults para as estatísticas
        const allResults = this.allAnalysisResults;

        this.stats = {
            totalCustomers: allResults.length,
            hotCustomers: allResults.filter(c => c.category === 'hot').length,
            warmCustomers: allResults.filter(c => c.category === 'warm').length,
            coldCustomers: allResults.filter(c => c.category === 'cold').length,
            newCustomers: allResults.filter(c => c.category === 'new').length,
            totalValue: allResults.reduce((sum, c) => sum + c.totalSpent, 0),
            averageScore: allResults.length > 0
                ? Math.round(allResults.reduce((sum, c) => sum + c.score, 0) / allResults.length)
                : 0
        };
    }

    // Aplicar filtros e ordenação
    public applyFiltersAndSort(): void {
        // IMPORTANTE: sempre começar com TODOS os resultados
        let filtered = [...this.allAnalysisResults];

        // Filtro por categoria
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(c => c.category === this.filterCategory);
        }

        // Filtro por prioridade
        if (this.filterPriority !== 'all') {
            filtered = filtered.filter(c => c.priority === this.filterPriority);
        }

        // Filtro por busca
        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.customerName.toLowerCase().includes(search) ||
                c.email.toLowerCase().includes(search) ||
                c.phone.includes(search)
            );
        }

        // Ordenação
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (this.sortBy) {
                case 'score':
                    comparison = a.score - b.score;
                    break;
                case 'value':
                    comparison = a.totalSpent - b.totalSpent;
                    break;
                case 'recent':
                    comparison = a.daysSinceLastPurchase - b.daysSinceLastPurchase;
                    break;
            }

            return this.sortOrder === 'asc' ? comparison : -comparison;
        });

        // Atualizar a lista filtrada
        this.analysisResults = filtered;
    }

    // Alternar seleção
    public toggleSelection(customerId: string): void {
        if (this.selectedCustomers.has(customerId)) {
            this.selectedCustomers.delete(customerId);
        } else {
            this.selectedCustomers.add(customerId);
        }

        // Verificar se todos estão selecionados
        this.selectAll = this.selectedCustomers.size === this.analysisResults.length;
    }

    // Selecionar/Deselecionar todos
    public toggleSelectAll(): void {
        if (this.selectAll) {
            this.selectedCustomers.clear();
        } else {
            this.analysisResults.forEach(customer => {
                this.selectedCustomers.add(customer.customerId);
            });
        }
        this.selectAll = !this.selectAll;
    }

    // Selecionar por categoria
    public selectByCategory(category: string): void {
        this.analysisResults
            .filter(c => c.category === category)
            .forEach(c => this.selectedCustomers.add(c.customerId));
    }

    // Importar selecionados
    public async importSelected(): Promise<void> {
        if (this.selectedCustomers.size === 0) {
            this.alertService.alert('Selecione pelo menos um cliente para importar', 'warning');
            return;
        }

        const selectedAnalyses = this.analysisResults.filter(c =>
            this.selectedCustomers.has(c.customerId)
        );

        const confirm = await this.alertService.confirm(
            `Importar ${selectedAnalyses.length} cliente(s) como leads?`,
            'Esta ação criará novos leads no CRM'
        );

        if (confirm.isConfirmed) {
            try {
                await this.customerImportService.importSelectedCustomers(selectedAnalyses);
                this.onImportComplete.emit(selectedAnalyses.length);
            } catch (error) {
                this.alertService.alert('Erro ao importar clientes', 'error');
            }
        }
    }

    // Voltar para leads
    public backToLeads(): void {
        this.onClose.emit();
    }

    // Formatar moeda
    public formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    // Obter cor da categoria
    public getCategoryColor(category: string): string {
        switch (category) {
            case 'hot': return 'danger';
            case 'warm': return 'warning';
            case 'cold': return 'primary';
            case 'new': return 'success';
            default: return 'secondary';
        }
    }

    // Obter ícone da categoria
    public getCategoryIcon(category: string): string {
        switch (category) {
            case 'hot': return 'flame-outline';
            case 'warm': return 'thermometer-outline';
            case 'cold': return 'snow-outline';
            case 'new': return 'star-outline';
            default: return 'help-outline';
        }
    }

    // Obter label da categoria
    public getCategoryLabel(category: string): string {
        switch (category) {
            case 'hot': return 'Quente';
            case 'warm': return 'Morno';
            case 'cold': return 'Frio';
            case 'new': return 'Novo';
            default: return category;
        }
    }

    // Obter cor da prioridade
    public getPriorityColor(priority: string): string {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'secondary';
            default: return 'light';
        }
    }

    // Obter porcentagem do progresso
    public getProgressPercentage(): number {
        if (this.importProgress.total === 0) return 0;
        return Math.round((this.importProgress.current / this.importProgress.total) * 100);
    }

    // Mudar ordenação
    public changeSort(sortBy: 'score' | 'value' | 'recent'): void {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'desc';
        }
        this.applyFiltersAndSort();
    }
}