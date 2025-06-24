// customer-import.service.ts
// VERSÃO CORRIGIDA COMPLETA - Análise precisa de clientes

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IToolsService } from '@shared/services/iTools.service';
import { Utilities } from '@shared/utilities/utilities';

// Interface para controle de performance
interface IBatchConfig {
    batchSize: number;      // Quantos documentos buscar por vez
    maxMemoryItems: number; // Máximo de items na memória
    parallelAnalysis: number; // Quantas análises simultâneas
}

@Injectable({
    providedIn: 'root'
})
export class CustomerImportService {

    // Configurações de performance
    private readonly BATCH_CONFIG: IBatchConfig = {
        batchSize: 500,         // Busca 500 documentos por vez
        maxMemoryItems: 5000,   // Máximo 5000 items na memória
        parallelAnalysis: 5     // Analisa 5 clientes por vez
    };

    // Subjects para comunicação
    public progressSubject = new BehaviorSubject<IImportProgress>({
        status: 'idle',
        current: 0,
        total: 0,
        message: ''
    });

    public analysisResultsSubject = new BehaviorSubject<ICustomerAnalysis[]>([]);

    // Observables públicos para o componente
    public importProgress$ = this.progressSubject.asObservable();
    public analysisResults$ = this.analysisResultsSubject.asObservable();

    constructor(
        private iToolsService: IToolsService
    ) { }

    /**
     * Resetar progresso
     */
    public resetProgress(): void {
        this.progressSubject.next({
            status: 'idle',
            current: 0,
            total: 0,
            message: ''
        });
        this.analysisResultsSubject.next([]);
    }

    /**
     * DEBUG: Buscar vendas específicas de um cliente
     */
    public async debugSpecificCustomer(customerName: string): Promise<void> {
        console.log(`\n🔍 DEBUG ESPECÍFICO: Buscando vendas de "${customerName}"`);

        try {
            // Buscar em todas as collections
            const collections = ['CashierSales', 'ServiceOrders', 'Sales', 'Requests'];
            let totalFound = 0;

            for (const collName of collections) {
                console.log(`\n📦 Buscando em ${collName}...`);

                const snapshot = await this.iToolsService.database()
                    .collection(collName)
                    .where([
                        { field: 'owner', operator: '=', value: Utilities.storeID }
                    ])
                    .get();

                if (snapshot && snapshot.docs) {
                    const matchingDocs = [];

                    // Procurar documentos onde o nome do cliente contém a string buscada
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        const customer = data.customer || data.client || data.cliente || {};
                        const customerDocName = customer.name || customer.nome || '';

                        if (customerDocName.toUpperCase().includes(customerName.toUpperCase())) {
                            matchingDocs.push({
                                id: doc.id,
                                customerName: customerDocName,
                                customerId: customer._id || 'sem ID',
                                customerCode: customer.code || 'sem código',
                                date: data.registerDate || data.entryDate || data.date || 'sem data',
                                value: data.balance?.total || data.total || data.value || 0,
                                status: data.status || data.serviceStatus || 'sem status',
                                code: data.code || 'sem código venda'
                            });
                        }
                    });

                    if (matchingDocs.length > 0) {
                        console.log(`✅ Encontrados ${matchingDocs.length} documentos:`);
                        matchingDocs.forEach((doc, index) => {
                            console.log(`\n  ${index + 1}. Venda #${doc.code}:`);
                            console.log(`     - ID Documento: ${doc.id}`);
                            console.log(`     - Nome Cliente: "${doc.customerName}"`);
                            console.log(`     - ID Cliente: ${doc.customerId}`);
                            console.log(`     - Código Cliente: ${doc.customerCode}`);
                            console.log(`     - Data: ${doc.date}`);
                            console.log(`     - Valor: R$ ${doc.value}`);
                            console.log(`     - Status: ${doc.status}`);
                        });
                        totalFound += matchingDocs.length;
                    } else {
                        console.log(`❌ Nenhum documento encontrado`);
                    }
                }
            }

            console.log(`\n📊 RESUMO: Total de ${totalFound} vendas encontradas para clientes com nome contendo "${customerName}"`);

        } catch (error) {
            console.error('❌ Erro no debug:', error);
        }
    }

    /**
     * MÉTODO PRINCIPAL - Análise otimizada
     */
    public async analyzeCustomers(): Promise<ICustomerAnalysis[]> {
        try {
            console.log('🚀 INICIANDO ANÁLISE OTIMIZADA DE CLIENTES...');

            // Resetar resultados
            this.analysisResultsSubject.next([]);
            this.updateProgress('fetching', 0, 0, 'Contando clientes...');

            // 1️⃣ CONTAR DOCUMENTOS
            const totalCounts = await this.countAllDocuments();
            const totalDocuments = totalCounts.sales + totalCounts.cashier + totalCounts.orders + totalCounts.requests;

            console.log(`📊 Total de documentos para processar: ${totalDocuments}`);
            console.log(`   - Vendas (Sales): ${totalCounts.sales}`);
            console.log(`   - PDV (CashierSales): ${totalCounts.cashier}`);
            console.log(`   - OS (ServiceOrders): ${totalCounts.orders}`);
            console.log(`   - Pedidos (Requests): ${totalCounts.requests}`);

            if (totalDocuments === 0) {
                this.updateProgress('completed', 0, 0, 'Nenhum cliente encontrado');
                return [];
            }

            // 2️⃣ BUSCAR E PROCESSAR COM PAGINAÇÃO
            this.updateProgress('fetching', 0, totalDocuments, 'Buscando dados...');

            const allCustomersMap = new Map();
            let processedCount = 0;

            // Processar cada coleção com paginação
            processedCount = await this.processBatchCollectionPaginated(
                'Sales',
                totalCounts.sales,
                allCustomersMap,
                processedCount,
                totalDocuments,
                this.processSaleDocument
            );

            processedCount = await this.processBatchCollectionPaginated(
                'CashierSales',
                totalCounts.cashier,
                allCustomersMap,
                processedCount,
                totalDocuments,
                this.processCashierSaleDocument
            );

            processedCount = await this.processBatchCollectionPaginated(
                'ServiceOrders',
                totalCounts.orders,
                allCustomersMap,
                processedCount,
                totalDocuments,
                this.processServiceOrderDocument
            );

            processedCount = await this.processBatchCollectionPaginated(
                'Requests',
                totalCounts.requests,
                allCustomersMap,
                processedCount,
                totalDocuments,
                this.processRequestDocument
            );

            // 3️⃣ ANALISAR CLIENTES
            const customers = Array.from(allCustomersMap.values());
            console.log(`\n👥 Total de clientes únicos: ${customers.length}`);

            this.updateProgress('analyzing', 0, customers.length, 'Analisando clientes...');

            const analyses = await this.analyzeCustomersInParallel(customers);

            // Ordenar por score
            analyses.sort((a, b) => b.score - a.score);

            this.analysisResultsSubject.next(analyses);
            this.updateProgress('completed', customers.length, customers.length, 'Análise concluída!');

            return analyses;

        } catch (error) {
            console.error('❌ Erro na análise:', error);
            this.updateProgress('error', 0, 0, 'Erro ao analisar clientes');
            throw error;
        }
    }

    /**
     * Contar documentos de cada coleção
     */
    private async countAllDocuments() {
        const counts = {
            sales: 0,
            cashier: 0,
            orders: 0,
            requests: 0
        };

        // Contar Sales
        try {
            const snapshot = await this.iToolsService.database()
                .collection('Sales')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .get();
            counts.sales = snapshot.docs?.length || 0;
        } catch (e) {
            console.log('⚠️ Erro ao contar Sales:', e);
        }

        // Contar CashierSales
        try {
            const snapshot = await this.iToolsService.database()
                .collection('CashierSales')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .get();
            counts.cashier = snapshot.docs?.length || 0;
        } catch (e) {
            console.log('⚠️ Erro ao contar CashierSales:', e);
        }

        // Contar ServiceOrders
        try {
            const snapshot = await this.iToolsService.database()
                .collection('ServiceOrders')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .get();
            counts.orders = snapshot.docs?.length || 0;
        } catch (e) {
            console.log('⚠️ Erro ao contar ServiceOrders:', e);
        }

        // Contar Requests
        try {
            const snapshot = await this.iToolsService.database()
                .collection('Requests')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .get();
            counts.requests = snapshot.docs?.length || 0;
        } catch (e) {
            console.log('⚠️ Erro ao contar Requests:', e);
        }

        return counts;
    }

    /**
     * Normalizar nome do cliente para evitar duplicatas
     */
    private normalizeCustomerName(name: string): string {
        if (!name) return '';

        return name
            .toUpperCase()
            .trim()
            .replace(/\s+/g, ' ') // Múltiplos espaços para um
            .replace(/[^\w\s]/g, '') // Remove caracteres especiais
            .replace(/\b(LTDA|ME|EPP|EIRELI|SA|S\/A)\b/g, '') // Remove tipos de empresa
            .trim();
    }

    /**
     * Gerar ID único para cliente baseado em múltiplos campos - VERSÃO MELHORADA
     */
    private generateCustomerId(customerData: any, docId: string): string {
        // PRIORIDADE ABSOLUTA: usar o _id do cliente se existir
        if (customerData._id) {
            return customerData._id;
        }

        // Segunda prioridade: CPF/CNPJ (mais confiável que nome)
        if (customerData.cpfCnpj) {
            const cpf = customerData.cpfCnpj.replace(/\D/g, '');
            if (cpf.length >= 11) return `cpf_${cpf}`;
        }
        if (customerData.cpf) {
            const cpf = customerData.cpf.replace(/\D/g, '');
            if (cpf.length >= 11) return `cpf_${cpf}`;
        }
        if (customerData.cnpj) {
            const cnpj = customerData.cnpj.replace(/\D/g, '');
            if (cnpj.length >= 14) return `cnpj_${cnpj}`;
        }

        // Terceira prioridade: telefone (também único)
        if (customerData.phone || customerData.telefone) {
            const phone = (customerData.phone || customerData.telefone).replace(/\D/g, '');
            if (phone.length >= 10) return `tel_${phone}`;
        }

        // IMPORTANTE: Se tem código do cliente, usar ele com o nome
        if (customerData.code && customerData.name) {
            const normalizedName = this.normalizeCustomerName(customerData.name);
            return `code_${customerData.code}_${normalizedName.replace(/\s/g, '_')}`;
        }

        // Última opção: usar nome normalizado
        const normalizedName = this.normalizeCustomerName(customerData.name || customerData.nome || '');
        if (normalizedName) {
            // IMPORTANTE: incluir mais informações para evitar colisões
            const nameParts = normalizedName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';
            return `nome_${firstName}_${lastName}_${docId.substr(-6)}`;
        }

        // Fallback absoluto
        return `doc_${docId}`;
    }

    /**
     * Processar coleção com paginação e merge de duplicatas - VERSÃO MELHORADA
     */
    private async processBatchCollectionPaginated(
        collectionName: string,
        totalCount: number,
        customersMap: Map<string, any>,
        currentProgress: number,
        totalProgress: number,
        processDocument: (doc: any) => { customerId: string, customerData: any, orderData: any }
    ): Promise<number> {

        if (totalCount === 0) return currentProgress;

        console.log(`\n📦 Processando ${collectionName} (${totalCount} documentos)...`);

        // Mapas para evitar duplicações
        const customersByName = new Map<string, string>(); // normalizedName -> customerId
        const customersByPhone = new Map<string, string>(); // phone -> customerId
        const customersByCpf = new Map<string, string>(); // cpf -> customerId

        let processedInCollection = 0;
        let currentPage = 0;
        let hasMore = true;

        while (hasMore && processedInCollection < totalCount) {
            try {
                const offset = currentPage * this.BATCH_CONFIG.batchSize;

                const query = this.iToolsService.database()
                    .collection(collectionName)
                    .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                    .orderBy({ '_id': 1 })
                    .startAfter(offset)
                    .limit(this.BATCH_CONFIG.batchSize);

                const batch = await query.get();

                if (!batch || !batch.docs || batch.docs.length === 0) {
                    hasMore = false;
                    break;
                }

                console.log(`📄 Página ${currentPage + 1}: Processando ${batch.docs.length} documentos...`);

                for (const doc of batch.docs) {
                    try {
                        const result = processDocument.call(this, doc);

                        if (result && result.customerId) {
                            const normalizedName = result.customerData.normalizedName;
                            const phone = result.customerData.phone?.replace(/\D/g, '');
                            const cpf = result.customerData.cpfCnpj?.replace(/\D/g, '');

                            // Determinar o ID final do cliente (evitar duplicatas)
                            let finalCustomerId = result.customerId;
                            let merged = false;

                            // PRIORIDADE 1: Se tem _id original do MongoDB, usar ele
                            if (result.customerData._id && result.customerData._id.length === 24) {
                                finalCustomerId = result.customerData._id;
                            }
                            // PRIORIDADE 2: Verificar por CPF
                            else if (cpf && cpf.length >= 11 && customersByCpf.has(cpf)) {
                                finalCustomerId = customersByCpf.get(cpf);
                                merged = true;
                                console.log(`🔄 Merge por CPF: "${result.customerData.name}" → Cliente existente`);
                            }
                            // PRIORIDADE 3: Verificar por telefone
                            else if (phone && phone.length >= 10 && customersByPhone.has(phone)) {
                                finalCustomerId = customersByPhone.get(phone);
                                merged = true;
                                console.log(`🔄 Merge por telefone: "${result.customerData.name}" → Cliente existente`);
                            }
                            // PRIORIDADE 4: Verificar por nome (só se muito similar)
                            else if (normalizedName && customersByName.has(normalizedName)) {
                                // Só fazer merge por nome se for exatamente igual
                                finalCustomerId = customersByName.get(normalizedName);
                                merged = true;
                                console.log(`🔄 Merge por nome: "${result.customerData.name}" → Cliente existente`);
                            }

                            // Registrar nos mapas de controle
                            if (!merged) {
                                if (normalizedName) customersByName.set(normalizedName, finalCustomerId);
                                if (phone && phone.length >= 10) customersByPhone.set(phone, finalCustomerId);
                                if (cpf && cpf.length >= 11) customersByCpf.set(cpf, finalCustomerId);
                            }

                            // Adicionar ou atualizar cliente
                            if (customersMap.has(finalCustomerId)) {
                                const existing = customersMap.get(finalCustomerId);
                                existing.orders.push(result.orderData);

                                // Atualizar dados do cliente se estiverem mais completos
                                if (!existing.email && result.customerData.email) {
                                    existing.email = result.customerData.email;
                                }
                                if (!existing.phone && result.customerData.phone) {
                                    existing.phone = result.customerData.phone;
                                }
                                if (!existing.cpfCnpj && result.customerData.cpfCnpj) {
                                    existing.cpfCnpj = result.customerData.cpfCnpj;
                                }
                                if (!existing._id && result.customerData._id) {
                                    existing._id = result.customerData._id;
                                }

                                // Limitar orders na memória se necessário
                                if (existing.orders.length > this.BATCH_CONFIG.maxMemoryItems) {
                                    existing.orders = existing.orders
                                        .sort((a, b) => {
                                            const dateA = this.extractOrderDate(a).getTime();
                                            const dateB = this.extractOrderDate(b).getTime();
                                            return dateB - dateA;
                                        })
                                        .slice(0, this.BATCH_CONFIG.maxMemoryItems);
                                }
                            } else {
                                result.customerData._id = finalCustomerId;
                                customersMap.set(finalCustomerId, {
                                    ...result.customerData,
                                    orders: [result.orderData]
                                });
                            }
                        }

                        processedInCollection++;
                        currentProgress++;

                    } catch (error) {
                        console.error(`Erro ao processar documento:`, error);
                    }
                }

                this.updateProgress('fetching', currentProgress, totalProgress,
                    `Processando ${collectionName}: ${processedInCollection}/${totalCount}`);

                if (batch.docs.length < this.BATCH_CONFIG.batchSize) {
                    hasMore = false;
                }

                currentPage++;
                await this.delay(100);

            } catch (error) {
                console.error(`Erro ao buscar página ${currentPage} de ${collectionName}:`, error);

                // Se falhar na paginação, tentar método simples
                if (currentPage === 0) {
                    return this.processBatchCollectionSimple(
                        collectionName, totalCount, customersMap,
                        currentProgress, totalProgress, processDocument
                    );
                }

                currentPage++;
                await this.delay(500);
            }
        }

        console.log(`✅ ${collectionName} processado: ${processedInCollection} documentos`);
        console.log(`👥 Clientes únicos detectados: ${customersMap.size}`);

        return currentProgress;
    }

    /**
     * Método fallback simples (busca tudo de uma vez)
     */
    private async processBatchCollectionSimple(
        collectionName: string,
        totalCount: number,
        customersMap: Map<string, any>,
        currentProgress: number,
        totalProgress: number,
        processDocument: (doc: any) => { customerId: string, customerData: any, orderData: any }
    ): Promise<number> {

        console.log(`⚠️ Usando método simples para ${collectionName}...`);

        try {
            const snapshot = await this.iToolsService.database()
                .collection(collectionName)
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .get();

            if (snapshot && snapshot.docs) {
                let processedInCollection = 0;

                // Processar em chunks para não bloquear UI
                const chunkSize = 100;
                for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
                    const chunk = snapshot.docs.slice(i, i + chunkSize);

                    for (const doc of chunk) {
                        try {
                            const result = processDocument.call(this, doc);

                            if (result && result.customerId) {
                                if (customersMap.has(result.customerId)) {
                                    const existing = customersMap.get(result.customerId);
                                    existing.orders.push(result.orderData);
                                } else {
                                    customersMap.set(result.customerId, {
                                        ...result.customerData,
                                        orders: [result.orderData]
                                    });
                                }
                            }

                            processedInCollection++;
                            currentProgress++;

                        } catch (error) {
                            console.error(`Erro ao processar documento:`, error);
                        }
                    }

                    // Atualizar progresso a cada chunk
                    if (i % 500 === 0) {
                        this.updateProgress('fetching', currentProgress, totalProgress,
                            `Processando ${collectionName}: ${processedInCollection}/${snapshot.docs.length}`);
                        await this.delay(10);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro no fallback de ${collectionName}:`, error);
        }

        return currentProgress;
    }

    /**
     * Analisar clientes em paralelo
     */
    private async analyzeCustomersInParallel(customers: any[]): Promise<ICustomerAnalysis[]> {
        const analyses: ICustomerAnalysis[] = [];
        const batchSize = this.BATCH_CONFIG.parallelAnalysis;

        // Processar em lotes paralelos
        for (let i = 0; i < customers.length; i += batchSize) {
            const batch = customers.slice(i, i + batchSize);

            // Analisar lote em paralelo
            const batchPromises = batch.map(customer =>
                this.analyzeCustomerFromOrders(customer)
                    .catch(error => {
                        console.error(`Erro ao analisar ${customer.name}:`, error);
                        return null;
                    })
            );

            const batchResults = await Promise.all(batchPromises);

            // Adicionar resultados válidos
            batchResults.forEach(result => {
                if (result) analyses.push(result);
            });

            // Atualizar progresso
            this.updateProgress('analyzing',
                Math.min(i + batchSize, customers.length),
                customers.length,
                `Analisando clientes: ${Math.min(i + batchSize, customers.length)}/${customers.length}`
            );

            // Pequena pausa entre lotes
            await this.delay(50);
        }

        return analyses;
    }

    /**
     * Processar documento de venda
     */
    private processSaleDocument(doc: any): any {
        const sale = doc.data();

        const customerData = sale.customer || sale.client || sale.cliente || {};

        // Usar método melhorado para gerar ID único
        const customerId = this.generateCustomerId(customerData, doc.id);
        const customerName = customerData.name || customerData.nome || sale.customerName || 'Cliente Venda';

        if (!customerData.name && !customerData.phone && !customerData._id) {
            return null;
        }

        return {
            customerId: customerId,
            customerData: {
                _id: customerId,
                name: customerName,
                normalizedName: this.normalizeCustomerName(customerName),
                email: customerData.email || '',
                phone: customerData.phone || customerData.telefone || '',
                cpfCnpj: customerData.cpfCnpj || '',
                owner: Utilities.storeID,
                source: 'Vendas'
            },
            orderData: {
                ...sale,
                _collection: 'Sales',
                _type: 'sale',
                _docId: doc.id
            }
        };
    }

    /**
     * Processar documento de venda PDV - CORRIGIDO PARA ESTRUTURA REAL
     */
    private processCashierSaleDocument(doc: any): any {
        const sale = doc.data();

        // No sistema real, customer é um objeto completo
        const customerData = sale.customer || {};

        // Ignorar se não tem dados do cliente
        if (!customerData.name && !customerData._id) {
            return null;
        }

        // Usar o ID do cliente se existir, senão gerar um baseado em outros dados
        const customerId = customerData._id || this.generateCustomerId(customerData, doc.id);

        return {
            customerId: customerId,
            customerData: {
                _id: customerId,
                name: customerData.name || 'Cliente PDV',
                normalizedName: this.normalizeCustomerName(customerData.name || ''),
                email: customerData.email || '',
                phone: customerData.phone || customerData.cellphone || '',
                cpfCnpj: customerData.cpfCnpj || customerData.cpf || customerData.cnpj || '',
                code: customerData.code || null,
                owner: Utilities.storeID,
                source: 'PDV/Caixa'
            },
            orderData: {
                ...sale,
                _collection: 'CashierSales',
                _type: 'pdv_sale',
                _docId: doc.id
            }
        };
    }

    /**
     * Processar documento de ordem de serviço - CORRIGIDO PARA ESTRUTURA REAL
     */
    private processServiceOrderDocument(doc: any): any {
        const order = doc.data();

        // No sistema real, customer é um objeto completo com todos os dados
        const customerData = order.customer || {};

        // Ignorar se não tem cliente
        if (!customerData.name && !customerData._id) {
            return null;
        }

        // Usar o ID do cliente se existir
        const customerId = customerData._id || this.generateCustomerId(customerData, doc.id);

        return {
            customerId: customerId,
            customerData: {
                _id: customerId,
                name: customerData.name || 'Cliente OS',
                normalizedName: this.normalizeCustomerName(customerData.name || ''),
                email: customerData.email || '',
                phone: customerData.phone || customerData.telefone || '',
                cpfCnpj: customerData.cpfCnpj ||
                    (customerData.personalDocument && customerData.personalDocument.value) || '',
                code: customerData.code || null,
                owner: Utilities.storeID,
                source: 'Ordens de Serviço'
            },
            orderData: {
                ...order,
                _collection: 'ServiceOrders',
                _type: 'service_order',
                _docId: doc.id
            }
        };
    }

    /**
     * Processar documento de pedido
     */
    private processRequestDocument(doc: any): any {
        const order = doc.data();

        // Tentar múltiplas formas de pegar cliente
        const customerData = order.customer ||
            order.client ||
            order.cliente ||
            order.clientData ||
            {};

        // Usar método melhorado para gerar ID único
        const customerId = this.generateCustomerId(customerData, doc.id);
        const customerName = customerData.name ||
            customerData.nome ||
            order.customerName ||
            order.clientName ||
            order.clienteNome ||
            'Cliente Pedido';

        if (!customerData.name && !customerData.phone && !customerData._id) {
            return null;
        }

        return {
            customerId: customerId,
            customerData: {
                _id: customerId,
                name: customerName,
                normalizedName: this.normalizeCustomerName(customerName),
                email: customerData.email || order.email || order.clientEmail || '',
                phone: customerData.phone || order.phone || order.telefone || '',
                owner: Utilities.storeID,
                source: 'Pedidos'
            },
            orderData: {
                ...order,
                _collection: 'Requests',
                _type: 'request',
                _docId: doc.id
            }
        };
    }

    /**
     * NOVO MÉTODO: Extrair data da order com suporte a múltiplos formatos - VERSÃO MELHORADA
     */
    private extractOrderDate(order: any): Date {
        // Lista expandida de campos de data possíveis (ordem de prioridade)
        const dateFields = [
            'paymentDate',      // CashierSales - data do pagamento (mais recente)
            'modifiedDate',     // Data de modificação (pode ser mais recente)
            'registerDate',     // Campo principal
            'date',            // Campo genérico
            'createdAt',       // Padrão
            'created',         // Variação
            'dataVenda',       // Português
            'saleDate',        // Inglês
            'orderDate',       // Específico de pedido
            'data',            // Português simples
            'entryDate',       // ServiceOrders - data de entrada
            'deliveryDate',    // ServiceOrders - data de entrega
            'fechamento',      // Data de fechamento
            'emissao',         // Data de emissão
            'dataEmissao',     // Variação
            'dataCriacao',     // Variação português
            'updatedAt',       // Padrão atualização
            'timestamp',       // Pode ser timestamp
            '_createdAt',      // Com underscore
            '_timestamp'       // Com underscore
        ];

        // DEBUG: para 10% das orders, mostrar quais campos de data existem
        if (Math.random() < 0.1) {
            console.log(`\n📅 DEBUG extractOrderDate - Order ${order.code || order._docId}:`);
            dateFields.forEach(field => {
                const value = this.getNestedValue(order, field);
                if (value) {
                    console.log(`   - ${field}: ${value}`);
                }
            });
        }

        // Tentar cada campo em ordem de prioridade
        for (const field of dateFields) {
            const value = this.getNestedValue(order, field);

            if (value) {
                const date = this.parseDate(value);
                if (date && !isNaN(date.getTime())) {
                    // Validar que a data não é no futuro
                    const now = new Date();
                    if (date <= now) {
                        // DEBUG: mostrar qual campo foi usado
                        if (Math.random() < 0.05) { // 5% de chance
                            console.log(`   ✅ Usando campo "${field}" com data: ${date.toLocaleDateString()}`);
                        }
                        return date;
                    }
                }
            }
        }

        // Se não encontrou nenhuma data válida, retornar uma data antiga como fallback
        console.warn(`⚠️ Nenhuma data válida encontrada para order:`, {
            id: order._docId || order._id,
            code: order.code,
            status: order.status || order.serviceStatus
        });

        // Retornar data de 1 ano atrás como fallback
        const fallbackDate = new Date();
        fallbackDate.setFullYear(fallbackDate.getFullYear() - 1);
        return fallbackDate;
    }

    /**
     * NOVO MÉTODO: Buscar valor aninhado (suporta campos como "metadata.date")
     */
    private getNestedValue(obj: any, path: string): any {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * NOVO MÉTODO: Parser universal de datas (CORRIGIDO PARA FORMATO DO SISTEMA)
     */
    private parseDate(value: any): Date | null {
        if (!value) return null;

        // Se já é Date válida
        if (value instanceof Date) {
            return value;
        }

        // Se é string (FORMATO PRINCIPAL DO SISTEMA: "YYYY-MM-DD HH:MM:SS")
        if (typeof value === 'string') {
            value = value.trim();

            // FORMATO PRINCIPAL: "2020-11-27 17:36:34"
            const mainFormatMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
            if (mainFormatMatch) {
                const year = parseInt(mainFormatMatch[1]);
                const month = parseInt(mainFormatMatch[2]) - 1; // Mês é 0-indexed
                const day = parseInt(mainFormatMatch[3]);
                const hour = parseInt(mainFormatMatch[4]);
                const minute = parseInt(mainFormatMatch[5]);
                const second = parseInt(mainFormatMatch[6]);

                const date = new Date(year, month, day, hour, minute, second);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }

            // FORMATO SECUNDÁRIO: "2020-07-17" (só data)
            const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateOnlyMatch) {
                const year = parseInt(dateOnlyMatch[1]);
                const month = parseInt(dateOnlyMatch[2]) - 1;
                const day = parseInt(dateOnlyMatch[3]);

                const date = new Date(year, month, day, 0, 0, 0);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }

            // Formato ISO (caso tenha)
            if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }

            // Tentar parse direto como último recurso
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        // Se é objeto MongoDB Date/ISODate
        if (value && typeof value === 'object') {
            if (value.$date) {
                return new Date(value.$date);
            }
            if (value.seconds) {
                return new Date(value.seconds * 1000);
            }
        }

        // Se é timestamp numérico
        if (typeof value === 'number') {
            const date = value > 9999999999 ? new Date(value) : new Date(value * 1000);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    /**
     * Obter valor da order - CORRIGIDO
     */
    private getOrderValue(order: any): number {
        // Se balance é um objeto, pegar o total de dentro dele
        let value: any = 0;

        // Prioridade 1: balance.total (estrutura correta de ServiceOrders)
        if (order.balance && typeof order.balance === 'object') {
            value = order.balance.total || order.balance.subtotal || 0;
        }
        // Prioridade 2: paymentMethods (estrutura de CashierSales)
        else if (order.paymentMethods && Array.isArray(order.paymentMethods)) {
            value = order.paymentMethods.reduce((sum, payment) => {
                return sum + (payment.value || 0);
            }, 0);
        }
        // Prioridade 3: produtos (somar salePrice * quantity)
        else if (order.products && Array.isArray(order.products)) {
            value = order.products.reduce((sum, product) => {
                const price = product.salePrice || product.unitaryPrice || 0;
                const quantity = product.quantity || 1;
                return sum + (price * quantity);
            }, 0);
        }
        // Prioridade 4: outros campos de valor
        else {
            value = order.balance ||
                order.total ||
                order.value ||
                order.valor ||
                order.totalValue ||
                order.amount ||
                order.valorTotal ||
                order.totalAmount ||
                order.subtotal ||
                order.totalPrice ||
                order.finalValue ||
                order.totalFinal ||
                order.saleValue ||
                0;
        }

        // Converter para número se necessário
        if (typeof value === 'string') {
            return parseFloat(value) || 0;
        } else if (typeof value === 'number') {
            return value;
        } else {
            return 0;
        }
    }

    /**
     * Analisar cliente individual - VERSÃO FINAL CORRIGIDA
     */
    private async analyzeCustomerFromOrders(customer: any): Promise<ICustomerAnalysis> {
        const orders = customer.orders || [];

        console.log(`\n📊 Analisando cliente: ${customer.name}`);
        console.log(`   ID: ${customer._id}`);
        console.log(`   Total de orders: ${orders.length}`);

        // DEBUG: Mostrar primeira order para verificar estrutura
        if (orders.length > 0 && Math.random() < 0.2) { // 20% de chance de debug
            const firstOrder = orders[0];
            console.log(`\n   🔍 DEBUG DA PRIMEIRA ORDER:`);
            console.log(`   - Collection: ${firstOrder._collection}`);
            console.log(`   - Type: ${firstOrder._type}`);
            console.log(`   - Code: ${firstOrder.code}`);
            console.log(`   - Status: ${firstOrder.status || firstOrder.serviceStatus || 'N/A'}`);

            // Extrair e mostrar data
            const date = this.extractOrderDate(firstOrder);
            console.log(`   - Data original: ${firstOrder.registerDate || firstOrder.entryDate || 'sem data'}`);
            console.log(`   - Data processada: ${date.toLocaleDateString()} (${this.formatDateDebug(date)})`);

            // Extrair e mostrar valor
            const value = this.getOrderValue(firstOrder);
            console.log(`   - Balance: ${JSON.stringify(firstOrder.balance)}`);
            console.log(`   - Valor processado: R$ ${value.toFixed(2)}`);
        }

        // Se tem muitas orders, trabalhar com amostra + estatísticas
        const useOptimization = orders.length > 1000;
        let workingOrders = orders;
        let totalStats = { count: orders.length, total: 0 };

        if (useOptimization) {
            // Calcular total real de todas as orders
            totalStats.total = orders.reduce((sum, order) => {
                const value = this.getOrderValue(order);
                return sum + value;
            }, 0);

            // Trabalhar com amostra das 1000 mais recentes
            workingOrders = orders
                .sort((a, b) => {
                    const dateA = this.extractOrderDate(a);
                    const dateB = this.extractOrderDate(b);
                    return dateB.getTime() - dateA.getTime();
                })
                .slice(0, 1000);
        }

        // Calcular métricas
        const now = new Date();
        let totalSpent = useOptimization ? totalStats.total : 0;
        let firstPurchase = now;
        let lastPurchase = new Date(0);
        const categories = new Set<string>();
        const products = new Map<string, number>();

        // Processar orders
        workingOrders.forEach(order => {
            // Calcular valor total se não está otimizado
            if (!useOptimization) {
                const orderValue = this.getOrderValue(order);
                totalSpent += orderValue;
            }

            // Extrair data
            const orderDate = this.extractOrderDate(order);

            if (orderDate && !isNaN(orderDate.getTime())) {
                if (orderDate < firstPurchase) firstPurchase = orderDate;
                if (orderDate > lastPurchase) lastPurchase = orderDate;
            }

            // Produtos (CashierSales e Sales)
            const items = order.products || order.items || order.produtos || [];
            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    const productName = item.name || item.productName || item.nome || item.product || item.description;
                    const category = item.category || item.categoria;

                    // Categoria pode ser string ou objeto
                    if (category) {
                        if (typeof category === 'string') {
                            categories.add(category);
                        } else if (category.name) {
                            categories.add(category.name);
                        }
                    }

                    if (productName) {
                        products.set(productName, (products.get(productName) || 0) + 1);
                    }
                });
            }

            // Serviços (ServiceOrders)
            if (order.services && Array.isArray(order.services)) {
                order.services.forEach((service: any) => {
                    const serviceName = service.name || service.description;
                    if (serviceName) {
                        products.set(`Serviço: ${serviceName}`, (products.get(`Serviço: ${serviceName}`) || 0) + 1);
                        categories.add('Serviços');
                    }
                });
            }
        });

        // VALIDAÇÃO: Se não encontrou datas válidas, usar fallback
        if (lastPurchase.getTime() === 0) {
            console.log(`   ⚠️ AVISO: Nenhuma data válida encontrada! Usando data atual como fallback.`);
            // Se temos orders, assumir que a última foi há 30 dias
            if (orders.length > 0) {
                lastPurchase = new Date();
                lastPurchase.setDate(lastPurchase.getDate() - 30);
                firstPurchase = new Date();
                firstPurchase.setDate(firstPurchase.getDate() - 365);
            } else {
                lastPurchase = now;
                firstPurchase = now;
            }
        }

        // Calcular dias desde última compra
        const daysSinceLastPurchase = Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

        // Debug final
        console.log(`   💰 Total gasto: R$ ${totalSpent.toFixed(2)}`);
        console.log(`   📅 Primeira compra: ${firstPurchase.toLocaleDateString()}`);
        console.log(`   📅 Última compra: ${lastPurchase.toLocaleDateString()}`);
        console.log(`   ⏱️ Dias desde última compra: ${daysSinceLastPurchase} dias`);

        // Calcular outras métricas
        const totalPurchases = useOptimization ? totalStats.count : orders.length;
        const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

        // Frequência mensal
        const monthsDiff = firstPurchase < now
            ? Math.max(1, (now.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30))
            : 1;
        const purchaseFrequency = totalPurchases / monthsDiff;

        // Calcular score
        const score = this.calculateCustomerScore({
            totalSpent,
            purchaseFrequency,
            daysSinceLastPurchase,
            averageTicket,
            totalPurchases
        });

        // Determinar categoria
        const category = this.determineCustomerCategoryImproved({
            score,
            daysSinceLastPurchase,
            totalPurchases,
            totalSpent,
            purchaseFrequency,
            averageTicket
        });

        console.log(`   🏆 Score: ${score}`);
        console.log(`   🏷️ Categoria: ${category}`);

        // Determinar prioridade baseada na categoria
        const priority = this.determinePriority(category, score);

        // Top produtos
        const topProducts = Array.from(products.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Gerar ações sugeridas
        const suggestedActions = this.generateSuggestedActions(category, {
            daysSinceLastPurchase,
            averageTicket,
            purchaseFrequency,
            totalSpent,
            totalPurchases
        });

        // Gerar razão do score
        const scoreReason = this.generateScoreReason(score, {
            daysSinceLastPurchase,
            purchaseFrequency,
            totalSpent,
            averageTicket
        });

        return {
            customerId: customer._id,
            customerName: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            totalSpent,
            totalPurchases,
            averageTicket,
            purchaseFrequency,
            daysSinceLastPurchase,
            lastPurchaseDate: lastPurchase,
            firstPurchaseDate: firstPurchase,
            score,
            category,
            priority,
            topCategories: Array.from(categories).slice(0, 5),
            topProducts,
            source: customer.source || 'Desconhecido',
            recommendedAction: this.getRecommendedAction(category, daysSinceLastPurchase, totalSpent),
            observations: this.generateObservations({
                category,
                daysSinceLastPurchase,
                purchaseFrequency,
                totalSpent,
                averageTicket
            }),
            suggestedActions,
            scoreReason
        };
    }

    /**
     * NOVO MÉTODO: Formatar data para debug
     */
    private formatDateDebug(date: Date): string {
        if (!date || isNaN(date.getTime())) {
            return 'data inválida';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'hoje';
        if (diffDays === 1) return 'ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;

        return `${Math.floor(diffDays / 365)} anos atrás`;
    }

    /**
     * Gerar ações sugeridas baseadas no perfil do cliente
     */
    private generateSuggestedActions(category: string, metrics: any): string[] {
        const actions = [];

        switch (category) {
            case 'vip':
                actions.push('Oferecer programa VIP');
                actions.push('Atendimento prioritário');
                actions.push('Produtos exclusivos');
                break;
            case 'hot':
                actions.push('Enviar promoções personalizadas');
                actions.push('Recomendar produtos complementares');
                if (metrics.purchaseFrequency > 2) {
                    actions.push('Programa de fidelidade');
                }
                break;
            case 'warm':
                actions.push('Campanha de reengajamento');
                actions.push('Cupom de desconto');
                if (metrics.daysSinceLastPurchase > 45) {
                    actions.push('Ligação de follow-up');
                }
                break;
            case 'cold':
                actions.push('Oferta especial de reativação');
                actions.push('Pesquisa de satisfação');
                actions.push('Desconto progressivo');
                break;
            case 'new':
                actions.push('Email de boas-vindas');
                actions.push('Cupom primeira compra');
                actions.push('Acompanhar experiência');
                break;
        }

        // Adicionar ações baseadas em métricas específicas
        if (metrics.daysSinceLastPurchase > 60 && metrics.daysSinceLastPurchase < 180) {
            actions.push('Follow-up por WhatsApp');
        }

        if (metrics.averageTicket > 1000) {
            actions.push('Oferecer parcelamento');
        }

        if (metrics.purchaseFrequency > 3) {
            actions.push('Criar lista VIP WhatsApp');
        }

        // Remover duplicatas e retornar máximo 3 ações
        return [...new Set(actions)].slice(0, 3);
    }

    /**
     * Gerar explicação do score
     */
    private generateScoreReason(score: number, metrics: any): string {
        const reasons = [];

        // Análise de recência
        if (metrics.daysSinceLastPurchase < 30) {
            reasons.push('compra recente');
        } else if (metrics.daysSinceLastPurchase > 180) {
            reasons.push('muito tempo sem comprar');
        }

        // Análise de frequência
        if (metrics.purchaseFrequency > 3) {
            reasons.push('cliente frequente');
        } else if (metrics.purchaseFrequency < 0.5) {
            reasons.push('baixa frequência');
        }

        // Análise de valor
        if (metrics.totalSpent > 5000) {
            reasons.push('alto valor total');
        }
        if (metrics.averageTicket > 1000) {
            reasons.push('ticket elevado');
        }

        // Montar frase final
        if (score >= 80) {
            return `Cliente premium: ${reasons.join(', ')}`;
        } else if (score >= 60) {
            return `Bom potencial: ${reasons.join(', ')}`;
        } else if (score >= 40) {
            return `Necessita atenção: ${reasons.join(', ')}`;
        } else {
            return `Requer estratégia especial: ${reasons.join(', ')}`;
        }
    }

    /**
     * Determinar prioridade do cliente
     */
    private determinePriority(category: string, score: number): 'high' | 'medium' | 'low' {
        if (category === 'vip' || (category === 'hot' && score >= 80)) {
            return 'high';
        }
        if (category === 'warm' || category === 'new' || (category === 'hot' && score >= 60)) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Calcular score do cliente
     */
    private calculateCustomerScore(metrics: any): number {
        let score = 0;

        // Valor total (40%)
        if (metrics.totalSpent > 10000) score += 40;
        else if (metrics.totalSpent > 5000) score += 30;
        else if (metrics.totalSpent > 1000) score += 20;
        else if (metrics.totalSpent > 500) score += 10;
        else score += 5;

        // Frequência (30%)
        if (metrics.purchaseFrequency > 5) score += 30;
        else if (metrics.purchaseFrequency > 2) score += 20;
        else if (metrics.purchaseFrequency > 1) score += 10;
        else score += 5;

        // Recência (30%)
        if (metrics.daysSinceLastPurchase < 30) score += 30;
        else if (metrics.daysSinceLastPurchase < 60) score += 20;
        else if (metrics.daysSinceLastPurchase < 90) score += 10;
        else if (metrics.daysSinceLastPurchase < 180) score += 5;

        return Math.min(100, score);
    }

    /**
     * Determinar categoria do cliente - VERSÃO MELHORADA
     */
    private determineCustomerCategoryImproved(metrics: any): 'new' | 'hot' | 'warm' | 'cold' | 'vip' {
        // VIP - Critérios mais flexíveis
        if ((metrics.totalSpent > 3000 && metrics.score >= 70) ||
            (metrics.totalSpent > 5000) ||
            (metrics.purchaseFrequency > 4 && metrics.averageTicket > 500)) {
            return 'vip';
        }

        // Novo - Primeira ou segunda compra recente
        if (metrics.totalPurchases <= 3 && metrics.daysSinceLastPurchase < 60) {
            return 'new';
        }

        // Quente - Ativo recentemente OU bom score
        if (metrics.daysSinceLastPurchase < 45 ||
            (metrics.daysSinceLastPurchase < 90 && metrics.score >= 50) ||
            (metrics.purchaseFrequency > 2)) {
            return 'hot';
        }

        // Morno - Moderadamente ativo
        if (metrics.daysSinceLastPurchase < 120 ||
            metrics.score >= 30 ||
            metrics.totalSpent > 500) {
            return 'warm';
        }

        // Frio - Inativo (só cai aqui se não passou nos outros)
        return 'cold';
    }

    /**
     * Obter ação recomendada
     */
    private getRecommendedAction(category: string, daysSince: number, totalSpent: number): string {
        switch (category) {
            case 'vip':
                return '⭐ Oferecer benefícios exclusivos e atendimento prioritário';
            case 'new':
                return '🎯 Enviar cupom de segunda compra e acompanhar experiência';
            case 'hot':
                return '🔥 Apresentar novos produtos e promoções personalizadas';
            case 'warm':
                return '📧 Reengajar com ofertas especiais baseadas no histórico';
            case 'cold':
                return '🎁 Campanha de reativação com desconto especial';
            default:
                return '📊 Analisar melhor o perfil do cliente';
        }
    }

    /**
     * Gerar observações
     */
    private generateObservations(metrics: any): string[] {
        const obs = [];

        if (metrics.daysSinceLastPurchase > 180) {
            obs.push('⚠️ Cliente inativo há mais de 6 meses');
        }

        if (metrics.purchaseFrequency > 3) {
            obs.push('✅ Cliente frequente - fidelizado');
        }

        if (metrics.averageTicket > 1000) {
            obs.push('💰 Alto ticket médio');
        }

        if (metrics.totalSpent > 10000) {
            obs.push('🏆 Cliente de alto valor');
        }

        return obs;
    }

    /**
     * IMPORTAR CLIENTES SELECIONADOS
     */
    public async importSelectedCustomers(selectedAnalyses: ICustomerAnalysis[]): Promise<void> {
        try {
            this.updateProgress('importing', 0, selectedAnalyses.length, 'Iniciando importação...');

            let imported = 0;
            let errors = 0;

            for (const analysis of selectedAnalyses) {
                try {
                    this.updateProgress('importing', imported, selectedAnalyses.length,
                        `Importando ${analysis.customerName}...`);

                    // Verificar se já existe lead
                    const existingLead = await this.checkExistingLead(analysis.email, analysis.customerId);

                    if (!existingLead) {
                        // Criar novo lead
                        await this.createLeadFromAnalysis(analysis);
                        imported++;
                    } else {
                        // Atualizar lead existente
                        await this.updateExistingLead(existingLead._id, analysis);
                        imported++;
                    }

                } catch (error) {
                    console.error(`Erro ao importar ${analysis.customerName}:`, error);
                    errors++;
                }
            }

            const message = errors > 0
                ? `Importação concluída! ${imported} importados, ${errors} erros.`
                : `Importação concluída! ${imported} clientes importados com sucesso!`;

            this.updateProgress('completed', imported, selectedAnalyses.length, message);

        } catch (error) {
            console.error('Erro na importação:', error);
            this.updateProgress('error', 0, 0, 'Erro ao importar clientes');
            throw error;
        }
    }

    /**
     * Verificar se já existe lead
     */
    private async checkExistingLead(email: string, customerId: string): Promise<any> {
        if (!email) return null;

        const snapshot = await this.iToolsService.database()
            .collection('CRMLeads')
            .where([
                { field: 'owner', operator: '=', value: Utilities.storeID },
                { field: 'email', operator: '=', value: email }
            ])
            .limit(1)
            .get();

        if (snapshot.docs && snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
            return {
                _id: doc.id,
                ...doc.data()
            };
        }

        return null;
    }

    /**
     * Criar lead a partir da análise
     */
    private async createLeadFromAnalysis(analysis: ICustomerAnalysis): Promise<void> {
        const leadData = {
            owner: Utilities.storeID,
            name: analysis.customerName,
            email: analysis.email,
            phone: analysis.phone,
            status: 'new',
            score: analysis.score,
            category: analysis.category,
            priority: analysis.priority,
            source: 'import',
            importSource: analysis.source,
            totalSpent: analysis.totalSpent,
            totalPurchases: analysis.totalPurchases,
            averageTicket: analysis.averageTicket,
            lastPurchaseDate: analysis.lastPurchaseDate,
            daysSinceLastPurchase: analysis.daysSinceLastPurchase,
            tags: [`imported-${new Date().toISOString().split('T')[0]}`, analysis.category],
            notes: `Cliente importado automaticamente. ${analysis.observations.join('. ')}`,
            customerId: analysis.customerId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Gerar ID único para o novo lead
        const newLeadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Usar doc().update() ao invés de add()
        await this.iToolsService.database()
            .collection('CRMLeads')
            .doc(newLeadId)
            .update(leadData);
    }

    /**
     * Atualizar lead existente
     */
    private async updateExistingLead(leadId: string, analysis: ICustomerAnalysis): Promise<void> {
        const updateData = {
            score: analysis.score,
            category: analysis.category,
            priority: analysis.priority,
            totalSpent: analysis.totalSpent,
            totalPurchases: analysis.totalPurchases,
            averageTicket: analysis.averageTicket,
            lastPurchaseDate: analysis.lastPurchaseDate,
            daysSinceLastPurchase: analysis.daysSinceLastPurchase,
            updatedAt: new Date()
        };

        await this.iToolsService.database()
            .collection('CRMLeads')
            .doc(leadId)
            .update(updateData);
    }

    /**
     * Atualizar progresso - com tipo correto
     */
    private updateProgress(
        status: 'idle' | 'fetching' | 'analyzing' | 'importing' | 'completed' | 'error',
        current: number,
        total: number,
        message: string
    ): void {
        this.progressSubject.next({
            status,
            current,
            total,
            message,
            percentage: total > 0 ? Math.round((current / total) * 100) : 0
        });
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Interfaces
export interface IImportProgress {
    status: 'idle' | 'fetching' | 'analyzing' | 'importing' | 'completed' | 'error';
    current: number;
    total: number;
    message: string;
    percentage?: number;
}

export interface ICustomerAnalysis {
    customerId: string;
    customerName: string;
    email: string;
    phone: string;
    totalSpent: number;
    totalPurchases: number;
    averageTicket: number;
    purchaseFrequency: number;
    daysSinceLastPurchase: number;
    lastPurchaseDate?: Date;
    firstPurchaseDate?: Date;
    score: number;
    category: 'new' | 'hot' | 'warm' | 'cold' | 'vip';
    priority: 'high' | 'medium' | 'low';
    topCategories: string[];
    topProducts: Array<{ name: string; count: number }>;
    source: string;
    recommendedAction: string;
    observations: string[];
    suggestedActions: string[];
    scoreReason: string;
}