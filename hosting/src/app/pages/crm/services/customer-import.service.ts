// Arquivo: customer-import.service.ts
// Caminho: src/app/pages/crm/services/customer-import.service.ts
// Descrição: Serviço de importação inteligente de clientes com análise RFM
// VERSÃO CORRIGIDA - Resolve problema de duplicação de clientes

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
     * Debug e verificação de dados duplicados
     * Adicione esta chamada no início do método analyzeCustomers
     */
    private async debugDuplicateIssues(): Promise<void> {
        console.log('\n🔍 DEBUG - Verificando possíveis duplicatas...\n');

        try {
            // Buscar algumas vendas para análise
            const salesSnapshot = await this.iToolsService.database()
                .collection('CashierSales')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .limit(100)
                .get();

            if (salesSnapshot && salesSnapshot.docs) {
                const customerCodes = new Map<string, Set<string>>(); // nome -> conjunto de códigos
                const customerIds = new Map<string, Set<string>>(); // nome -> conjunto de IDs

                // Analisar cada venda
                salesSnapshot.docs.forEach(doc => {
                    const sale = (doc as any).data();
                    const customer = sale.customer || {};

                    if (customer.name) {
                        const normalizedName = this.normalizeCustomerName(customer.name);

                        // Coletar códigos
                        if (!customerCodes.has(normalizedName)) {
                            customerCodes.set(normalizedName, new Set());
                        }
                        if (customer.code) {
                            customerCodes.get(normalizedName).add(customer.code.toString());
                        }

                        // Coletar IDs
                        if (!customerIds.has(normalizedName)) {
                            customerIds.set(normalizedName, new Set());
                        }
                        if (customer._id) {
                            customerIds.get(normalizedName).add(customer._id);
                        }
                    }
                });

                // Mostrar clientes com múltiplos códigos ou IDs
                console.log('📊 Clientes com múltiplos códigos:');
                let foundIssues = false;

                customerCodes.forEach((codes, name) => {
                    if (codes.size > 1) {
                        foundIssues = true;
                        console.log(`   ⚠️ ${name}:`);
                        console.log(`      - Códigos encontrados: ${Array.from(codes).join(', ')}`);

                        // Verificar IDs também
                        if (customerIds.has(name)) {
                            const ids = customerIds.get(name);
                            if (ids.size > 1) {
                                console.log(`      - IDs diferentes: ${ids.size} IDs únicos`);
                                console.log(`        ${Array.from(ids).join('\n        ')}`);
                            }
                        }
                    }
                });

                if (!foundIssues) {
                    console.log('   ✅ Nenhum cliente com múltiplos códigos detectado');
                }

                // Verificar especificamente a LORENA
                const lorenaNames = Array.from(customerCodes.keys()).filter(name =>
                    name.includes('LORENA') && name.includes('MORAIS')
                );

                if (lorenaNames.length > 0) {
                    console.log('\n🔴 DEBUG ESPECIAL - LORENA:');
                    lorenaNames.forEach(name => {
                        console.log(`   Nome: "${name}"`);
                        if (customerCodes.has(name)) {
                            console.log(`   Códigos: ${Array.from(customerCodes.get(name)).join(', ')}`);
                        }
                        if (customerIds.has(name)) {
                            const ids = Array.from(customerIds.get(name));
                            console.log(`   IDs encontrados: ${ids.length}`);
                            ids.forEach(id => console.log(`     - ${id}`));
                        }
                    });
                }
            }

            console.log('\n' + '='.repeat(60) + '\n');

        } catch (error) {
            console.error('Erro no debug:', error);
        }
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
                        const data = (doc as any).data();
                        const customer = data.customer || data.client || data.cliente || {};
                        const customerDocName = customer.name || customer.nome || '';

                        if (customerDocName.toUpperCase().includes(customerName.toUpperCase())) {
                            matchingDocs.push({
                                id: doc.id,
                                code: data.code,
                                customer: customer,
                                value: data.balance?.total || data.total || 0,
                                date: data.registerDate || data.createdAt
                            });
                            totalFound++;
                        }
                    });

                    if (matchingDocs.length > 0) {
                        console.log(`✅ Encontrados ${matchingDocs.length} documentos em ${collName}:`);
                        matchingDocs.forEach(doc => {
                            console.log(`   - Doc ID: ${doc.id}`);
                            console.log(`     Code: ${doc.code}`);
                            console.log(`     Customer ID: ${doc.customer._id}`);
                            console.log(`     Customer Code: ${doc.customer.code}`);
                            console.log(`     Customer Name: ${doc.customer.name}`);
                            console.log(`     Value: R$ ${doc.value}`);
                            console.log(`     Date: ${doc.date}`);
                            console.log('');
                        });
                    } else {
                        console.log(`❌ Nenhum documento encontrado em ${collName}`);
                    }
                }
            }

            console.log(`\n📊 TOTAL GERAL: ${totalFound} documentos encontrados para "${customerName}"`);

        } catch (error) {
            console.error('Erro no debug específico:', error);
        }
    }

    /**
     * Contar documentos em todas as collections
     */
    private async countAllDocuments(): Promise<{ sales: number, cashier: number, orders: number, requests: number }> {
        const counts = { sales: 0, cashier: 0, orders: 0, requests: 0 };

        try {
            // Contar Sales - usando limit 1 para verificar se existe
            const salesSnapshot = await this.iToolsService.database()
                .collection('Sales')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .limit(1000)
                .get();
            counts.sales = salesSnapshot?.docs?.length || 0;

            // Contar CashierSales
            const cashierSnapshot = await this.iToolsService.database()
                .collection('CashierSales')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .limit(1000)
                .get();
            counts.cashier = cashierSnapshot?.docs?.length || 0;

            // Contar ServiceOrders
            const ordersSnapshot = await this.iToolsService.database()
                .collection('ServiceOrders')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .limit(1000)
                .get();
            counts.orders = ordersSnapshot?.docs?.length || 0;

            // Contar Requests
            const requestsSnapshot = await this.iToolsService.database()
                .collection('Requests')
                .where([{ field: 'owner', operator: '=', value: Utilities.storeID }])
                .limit(1000)
                .get();
            counts.requests = requestsSnapshot?.docs?.length || 0;

            // Se alguma coleção tem 1000 documentos, fazer contagem mais precisa
            if (counts.sales === 1000) {
                console.log('⚠️ Sales tem 1000+ documentos, usando estimativa');
                counts.sales = 1000; // Usar como estimativa mínima
            }
            if (counts.cashier === 1000) {
                console.log('⚠️ CashierSales tem 1000+ documentos, usando estimativa');
                counts.cashier = 1000;
            }
            if (counts.orders === 1000) {
                console.log('⚠️ ServiceOrders tem 1000+ documentos, usando estimativa');
                counts.orders = 1000;
            }
            if (counts.requests === 1000) {
                console.log('⚠️ Requests tem 1000+ documentos, usando estimativa');
                counts.requests = 1000;
            }

        } catch (error) {
            console.error('Erro ao contar documentos:', error);
        }

        return counts;
    }

    /**
     * Normalizar nome do cliente - Remove variações
     */
    private normalizeCustomerName(name: string): string {
        if (!name) return '';

        const original = name;
        const normalized = name
            .toUpperCase()
            .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove pontuação
            .replace(/\b(LTDA|ME|EPP|EIRELI|SA|S\/A|CIA|COMPANHIA)\b/g, '') // Remove tipos de empresa
            .trim();

        // DEBUG para LORENA
        if (name.includes('LORENA MORAIS')) {
            console.log(`📝 Normalização de nome:`);
            console.log(`   - Original: "${original}"`);
            console.log(`   - Normalizado: "${normalized}"`);
        }

        return normalized;
    }

    /**
     * Gerar ID único para cliente baseado em múltiplos campos - VERSÃO DEFINITIVA
     * CORREÇÃO: Não usar código do cliente no ID pois pode variar entre vendas
     */
    private generateCustomerId(customerData: any, docId: string): string {
        // DEBUG PARA LORENA
        if (customerData.name && customerData.name.includes('LORENA')) {
            console.log(`\n🔴 generateCustomerId para ${customerData.name}:`);
            console.log(`   - _id MongoDB: ${customerData._id}`);
            console.log(`   - code: ${customerData.code} ⚠️ (NÃO SERÁ USADO NO ID)`);
            console.log(`   - cpfCnpj: ${customerData.cpfCnpj}`);
            console.log(`   - phone: ${customerData.phone}`);
            console.log(`   - email: ${customerData.email}`);
        }

        // PRIORIDADE 1: usar o _id do MongoDB se existir e for válido
        // (24 caracteres hexadecimais = ID do MongoDB)
        if (customerData._id && typeof customerData._id === 'string' && customerData._id.length >= 20) {
            if (customerData.name && customerData.name.includes('LORENA')) {
                console.log(`   ✅ Usando _id MongoDB original: ${customerData._id}`);
            }
            return customerData._id;
        }

        // PRIORIDADE 2: CPF/CNPJ (documento único por pessoa - mais confiável)
        // Verificar todos os campos possíveis de CPF/CNPJ
        const cpfCnpj = customerData.cpfCnpj || customerData.cpf || customerData.cnpj ||
            customerData.documento || customerData.document || '';
        if (cpfCnpj) {
            const cleanDoc = cpfCnpj.replace(/\D/g, ''); // Remove tudo que não é número
            if (cleanDoc.length >= 11) { // CPF tem 11 dígitos, CNPJ tem 14
                const id = cleanDoc.length === 11 ? `cpf_${cleanDoc}` : `cnpj_${cleanDoc}`;
                if (customerData.name && customerData.name.includes('LORENA')) {
                    console.log(`   ✅ Usando CPF/CNPJ: ${id}`);
                }
                return id;
            }
        }

        // PRIORIDADE 3: Email (único por pessoa)
        const email = (customerData.email || '').toLowerCase().trim();
        if (email && email.includes('@') && email.length > 5) {
            // Email válido - usar como ID
            const emailId = `email_${email.replace(/[^a-z0-9@._-]/g, '')}`;
            if (customerData.name && customerData.name.includes('LORENA')) {
                console.log(`   ✅ Usando email: ${emailId}`);
            }
            return emailId;
        }

        // PRIORIDADE 4: Telefone (geralmente único por pessoa)
        const phone = (customerData.phone || customerData.telefone || customerData.cellphone ||
            customerData.celular || customerData.mobile || '').replace(/\D/g, '');
        if (phone.length >= 10) { // Telefone válido tem pelo menos 10 dígitos
            const id = `tel_${phone}`;
            if (customerData.name && customerData.name.includes('LORENA')) {
                console.log(`   ✅ Usando telefone: ${id}`);
            }
            return id;
        }

        // PRIORIDADE 5: WhatsApp (se diferente do telefone)
        const whatsapp = (customerData.whatsapp || customerData.whatsApp || '').replace(/\D/g, '');
        if (whatsapp.length >= 10 && whatsapp !== phone) {
            const id = `whats_${whatsapp}`;
            if (customerData.name && customerData.name.includes('LORENA')) {
                console.log(`   ✅ Usando WhatsApp: ${id}`);
            }
            return id;
        }

        // ATENÇÃO: NÃO USAR CÓDIGO DO CLIENTE NO ID!
        // O código pode mudar entre vendas para a mesma pessoa
        // Isso estava causando o bug da LORENA ter múltiplos IDs

        // ÚLTIMA OPÇÃO: Nome completo normalizado
        // Use com cuidado - pessoas diferentes podem ter o mesmo nome!
        const normalizedName = this.normalizeCustomerName(customerData.name || customerData.nome || '');
        if (normalizedName && normalizedName.length > 3) {
            // Criar hash do nome para evitar IDs muito longos
            const nameHash = this.createSimpleHash(normalizedName);
            const id = `nome_${nameHash}`;

            if (customerData.name && customerData.name.includes('LORENA')) {
                console.log(`   ⚠️ Usando nome normalizado (menos confiável): ${id}`);
                console.log(`   ⚠️ Nome normalizado: "${normalizedName}"`);
                console.log(`   ⚠️ AVISO: Pessoas com mesmo nome terão o mesmo ID!`);
            }
            return id;
        }

        // FALLBACK: Se não tem nenhuma informação útil
        // Usar timestamp + random para garantir unicidade
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        const id = `temp_${timestamp}_${random}`;

        if (customerData.name && customerData.name.includes('LORENA')) {
            console.log(`   ❌ Sem dados suficientes - usando ID temporário: ${id}`);
        }
        return id;
    }

    /**
     * Criar hash simples de uma string (para IDs baseados em nome)
     * Isso garante IDs consistentes e de tamanho fixo
     */
    private createSimpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converter para 32bit integer
        }
        // Converter para string hexadecimal positiva
        return Math.abs(hash).toString(36);
    }

    /**
     * Criar chave de merge baseada em múltiplos campos
     * Isso ajuda a identificar o mesmo cliente mesmo com dados ligeiramente diferentes
     */
    private createMergeKey(customerData: any): string[] {
        const keys = [];

        // Normalizar nome para comparação
        const normalizedName = this.normalizeCustomerName(customerData.name || '');

        // CPF/CNPJ
        const cpf = (customerData.cpfCnpj || customerData.cpf || customerData.cnpj || '').replace(/\D/g, '');
        if (cpf.length >= 11) {
            keys.push(`cpf:${cpf}`);
        }

        // Email
        const email = (customerData.email || '').toLowerCase().trim();
        if (email && email.includes('@')) {
            keys.push(`email:${email}`);
        }

        // Telefone
        const phone = (customerData.phone || customerData.telefone || '').replace(/\D/g, '');
        if (phone.length >= 10) {
            keys.push(`phone:${phone}`);
        }

        // Nome + Data de nascimento (se existir)
        if (normalizedName && customerData.birthDate) {
            keys.push(`name_birth:${normalizedName}_${customerData.birthDate}`);
        }

        // Só nome (menos confiável, mas ainda útil)
        if (normalizedName) {
            keys.push(`name:${normalizedName}`);
        }

        return keys;
    }

    /**
     * Encontrar cliente existente usando múltiplas chaves de merge
     */
    private findExistingCustomer(
        customerData: any,
        customersMap: Map<string, any>,
        mergeKeysMap: Map<string, string>
    ): { found: boolean; customerId: string; mergeKey: string } {

        const mergeKeys = this.createMergeKey(customerData);

        // Tentar encontrar por cada chave, em ordem de confiabilidade
        for (const key of mergeKeys) {
            if (mergeKeysMap.has(key)) {
                const existingId = mergeKeysMap.get(key);

                // Verificar se ainda existe no mapa principal
                if (customersMap.has(existingId)) {
                    // DEBUG para LORENA
                    if (customerData.name && customerData.name.includes('LORENA')) {
                        console.log(`   🔄 Cliente encontrado por ${key.split(':')[0]}`);
                    }
                    return { found: true, customerId: existingId, mergeKey: key };
                }
            }
        }

        return { found: false, customerId: '', mergeKey: '' };
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

        // Criar mapa de chaves de merge
        const mergeKeysMap = new Map<string, string>(); // chave de merge -> customerId

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
                            // DEBUG para LORENA
                            if (result.customerData.name && result.customerData.name.includes('LORENA')) {
                                console.log(`\n🔍 Processando ${result.customerData.name}:`);
                                console.log(`   - Documento: ${doc.id}`);
                                console.log(`   - Coleção: ${collectionName}`);
                                console.log(`   - Código do cliente: ${result.customerData.code}`);
                                console.log(`   - ID gerado: ${result.customerId}`);
                            }

                            // Tentar encontrar cliente existente usando múltiplas estratégias
                            const existingCustomer = this.findExistingCustomer(
                                result.customerData,
                                customersMap,
                                mergeKeysMap
                            );

                            let finalCustomerId = result.customerId;
                            let isNewCustomer = true;

                            if (existingCustomer.found) {
                                // Cliente encontrado - fazer merge
                                finalCustomerId = existingCustomer.customerId;
                                isNewCustomer = false;

                                if (result.customerData.name && result.customerData.name.includes('LORENA')) {
                                    console.log(`   ✅ MERGE realizado! Usando ID existente: ${finalCustomerId}`);
                                }
                            } else {
                                // Novo cliente - registrar todas as chaves de merge
                                const mergeKeys = this.createMergeKey(result.customerData);
                                for (const key of mergeKeys) {
                                    mergeKeysMap.set(key, finalCustomerId);
                                }

                                if (result.customerData.name && result.customerData.name.includes('LORENA')) {
                                    console.log(`   🆕 Novo cliente registrado com ID: ${finalCustomerId}`);
                                    console.log(`   📝 Chaves de merge registradas:`, mergeKeys);
                                }
                            }

                            // Adicionar ou atualizar cliente
                            if (customersMap.has(finalCustomerId)) {
                                // Cliente existe - adicionar pedido
                                const existing = customersMap.get(finalCustomerId);
                                existing.orders.push(result.orderData);

                                // Mesclar dados (manter os mais completos)
                                if (!existing.email && result.customerData.email) {
                                    existing.email = result.customerData.email;
                                    // Registrar nova chave de email
                                    const emailKey = `email:${result.customerData.email.toLowerCase().trim()}`;
                                    mergeKeysMap.set(emailKey, finalCustomerId);
                                }
                                if (!existing.phone && result.customerData.phone) {
                                    existing.phone = result.customerData.phone;
                                    // Registrar nova chave de telefone
                                    const phone = result.customerData.phone.replace(/\D/g, '');
                                    if (phone.length >= 10) {
                                        mergeKeysMap.set(`phone:${phone}`, finalCustomerId);
                                    }
                                }
                                if (!existing.cpfCnpj && result.customerData.cpfCnpj) {
                                    existing.cpfCnpj = result.customerData.cpfCnpj;
                                    // Registrar nova chave de CPF
                                    const cpf = result.customerData.cpfCnpj.replace(/\D/g, '');
                                    if (cpf.length >= 11) {
                                        mergeKeysMap.set(`cpf:${cpf}`, finalCustomerId);
                                    }
                                }

                                // Atualizar outros campos se necessário
                                if (!existing.birthDate && result.customerData.birthDate) {
                                    existing.birthDate = result.customerData.birthDate;
                                }

                                // Se o código mudou, manter o mais recente
                                if (result.customerData.code) {
                                    existing.code = result.customerData.code;
                                }

                                // DEBUG - mostrar total de pedidos
                                if (result.customerData.name && result.customerData.name.includes('LORENA')) {
                                    console.log(`   📊 Total de pedidos acumulados: ${existing.orders.length}`);
                                }
                            } else {
                                // Criar novo cliente
                                result.customerData._id = finalCustomerId;
                                customersMap.set(finalCustomerId, {
                                    ...result.customerData,
                                    orders: [result.orderData]
                                });

                                if (result.customerData.name && result.customerData.name.includes('LORENA')) {
                                    console.log(`   ✅ Cliente adicionado ao mapa`);
                                }
                            }
                        }

                        processedInCollection++;
                        currentProgress++;

                    } catch (error) {
                        console.error(`❌ Erro ao processar documento ${doc.id}:`, error);
                        // Continuar processando outros documentos
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
        const sale = (doc as any).data();

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
     * Processar documento de venda PDV - CORRIGIDO COM DEBUG DETALHADO
     */
    private processCashierSaleDocument(doc: any): any {
        const sale = (doc as any).data();

        // No sistema real, customer é um objeto completo
        const customerData = sale.customer || {};

        // Ignorar se não tem dados do cliente
        if (!customerData.name && !customerData._id) {
            return null;
        }

        // Gerar o ID do cliente
        const generatedId = this.generateCustomerId(customerData, doc.id);
        const customerId = customerData._id || generatedId;

        // DEBUG: Para LORENA, mostrar detalhes
        if (customerData.name && customerData.name.includes('LORENA MORAIS')) {
            console.log(`\n🔍 DEBUG ProcessCashierSale - LORENA:`);
            console.log(`   - Doc ID: ${doc.id}`);
            console.log(`   - Sale Code: ${sale.code}`);
            console.log(`   - Customer Name: "${customerData.name}"`);
            console.log(`   - Customer._id: ${customerData._id}`);
            console.log(`   - Customer Code: ${customerData.code}`);
            console.log(`   - Phone: ${customerData.phone}`);
            console.log(`   - Generated ID: ${generatedId}`);
            console.log(`   - Final Customer ID: ${customerId}`);
            console.log(`   - RegisterDate: ${sale.registerDate}`);
            console.log(`   - PaymentDate: ${sale.paymentDate}`);
            console.log(`   - Value: ${sale.balance?.total}`);
        }

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
        const order = (doc as any).data();

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
        const order = (doc as any).data();

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
    private extractOrderDate(order: any): Date | null {
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
            'orderDate',       // Pedidos
            'entryDate',       // Ordens de serviço
            'data',           // Genérico português
            'timestamp'       // Timestamp
        ];

        // Procurar o primeiro campo válido
        for (const field of dateFields) {
            const value = order[field];

            if (value) {
                // Tentar converter para Date
                const date = this.convertToDate(value);
                if (date && !isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Se não encontrou nenhuma data válida, retornar null
        console.warn('⚠️ Nenhuma data válida encontrada no pedido:', order.code || order._docId);
        return null;
    }

    /**
     * Converter valor para Date - suporta múltiplos formatos
     */
    private convertToDate(value: any): Date | null {
        if (!value) return null;

        // Já é um Date
        if (value instanceof Date) {
            return value;
        }

        // String
        if (typeof value === 'string') {
            // Formato ISO
            if (value.includes('T')) {
                return new Date(value);
            }

            // Formato brasileiro DD/MM/YYYY
            if (value.includes('/')) {
                const parts = value.split(/[/ :]/);
                if (parts.length >= 3) {
                    // DD/MM/YYYY HH:mm:ss
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // Mês começa em 0
                    const year = parseInt(parts[2]);
                    const hour = parts[3] ? parseInt(parts[3]) : 0;
                    const minute = parts[4] ? parseInt(parts[4]) : 0;
                    const second = parts[5] ? parseInt(parts[5]) : 0;

                    return new Date(year, month, day, hour, minute, second);
                }
            }

            // Formato americano YYYY-MM-DD
            if (value.includes('-')) {
                return new Date(value);
            }
        }

        // Timestamp (número)
        if (typeof value === 'number') {
            // Timestamp em segundos
            if (value < 10000000000) {
                return new Date(value * 1000);
            }
            // Timestamp em milissegundos
            return new Date(value);
        }

        // Firebase Timestamp
        if (value && typeof value === 'object') {
            // Firestore Timestamp
            if (value.seconds) {
                return new Date(value.seconds * 1000);
            }
            // Firebase ServerTimestamp
            if (value.toDate && typeof value.toDate === 'function') {
                return value.toDate();
            }
        }

        return null;
    }

    /**
     * Analisar cliente individual - VERSÃO FINAL COM DEBUG LORENA
     */
    private async analyzeCustomerFromOrders(customer: any): Promise<ICustomerAnalysis> {
        const orders = customer.orders || [];

        console.log(`\n📊 Analisando cliente: ${customer.name}`);
        console.log(`   ID: ${customer._id}`);
        console.log(`   Total de orders: ${orders.length}`);

        // DEBUG ESPECIAL PARA LORENA
        if (customer.name && customer.name.includes('LORENA MORAIS')) {
            console.log(`\n🔴 DEBUG ESPECIAL - LORENA MORAIS:`);
            console.log(`   - Customer Object:`, customer);
            console.log(`   - Total Orders: ${orders.length}`);

            // Mostrar todas as orders
            orders.forEach((order, index) => {
                console.log(`\n   Order ${index + 1}:`);
                console.log(`   - Collection: ${order._collection}`);
                console.log(`   - Code: ${order.code}`);
                console.log(`   - RegisterDate: ${order.registerDate}`);
                console.log(`   - PaymentDate: ${order.paymentDate}`);
                console.log(`   - Value: ${order.balance?.total || order.total || 0}`);
                console.log(`   - Customer in Order:`, order.customer);
            });
        }

        // DEBUG: Mostrar primeira order para verificar estrutura (reduzir para 5%)
        if (orders.length > 0 && Math.random() < 0.05) {
            const firstOrder = orders[0];
            console.log(`\n   🔍 DEBUG DA PRIMEIRA ORDER:`);
            console.log(`   - Collection: ${firstOrder._collection}`);
            console.log(`   - Type: ${firstOrder._type}`);
            console.log(`   - Code: ${firstOrder.code}`);
            console.log(`   - Possui customer: ${!!firstOrder.customer}`);
            console.log(`   - Possui balance: ${!!firstOrder.balance}`);
            console.log(`   - Balance.total: ${firstOrder.balance?.total}`);
            console.log(`   - Total direto: ${firstOrder.total}`);
            console.log(`   - Amount: ${firstOrder.amount}`);
        }

        // Otimização: Para clientes com muitas orders, usar cálculo agregado
        const useOptimization = orders.length > 100;

        let totalStats = {
            total: 0,
            count: 0,
            firstDate: null as Date | null,
            lastDate: null as Date | null
        };

        // Processar todas as orders
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];

            // Extrair valor da order
            const value = this.extractOrderValue(order);
            if (value > 0) {
                totalStats.total += value;
                totalStats.count++;
            }

            // Extrair data
            const orderDate = this.extractOrderDate(order);

            if (orderDate) {
                // Atualizar primeira e última data
                if (!totalStats.firstDate || orderDate < totalStats.firstDate) {
                    totalStats.firstDate = orderDate;
                }
                if (!totalStats.lastDate || orderDate > totalStats.lastDate) {
                    totalStats.lastDate = orderDate;
                }
            }

            // Debug a cada 100 orders processadas
            if (i > 0 && i % 100 === 0) {
                console.log(`   ⏳ Processadas ${i} de ${orders.length} orders...`);
            }
        }

        // Calcular métricas finais
        const now = new Date();
        const totalSpent = totalStats.total || 0;
        const firstPurchase = totalStats.firstDate || null;
        const lastPurchase = totalStats.lastDate || null;
        // Tratamento especial se não encontrou datas válidas
        if (!totalStats.firstDate || !totalStats.lastDate) {
            console.warn(`⚠️ Cliente ${customer.name} sem datas válidas nas orders.`);
        }

        // Calcular dias desde última compra
        const daysSinceLastPurchase = lastPurchase
            ? Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
            : -1;

        // Debug final - ESPECIAL PARA LORENA
        if (customer.name && customer.name.includes('LORENA MORAIS')) {
            console.log(`\n🔴 RESULTADO FINAL - LORENA:`);
            console.log(`   💰 Total gasto: R$ ${totalSpent.toFixed(2)}`);
            console.log(`   📅 Primeira compra: ${firstPurchase.toLocaleDateString()}`);
            console.log(`   📅 Última compra: ${lastPurchase.toLocaleDateString()}`);
            console.log(`   ⏱️ Dias desde última compra: ${daysSinceLastPurchase} dias`);
            console.log(`   📦 Total de compras: ${orders.length}`);
        } else {
            console.log(`   💰 Total gasto: R$ ${totalSpent.toFixed(2)}`);
            console.log(`   📅 Primeira compra: ${firstPurchase.toLocaleDateString()}`);
            console.log(`   📅 Última compra: ${lastPurchase.toLocaleDateString()}`);
            console.log(`   ⏱️ Dias desde última compra: ${daysSinceLastPurchase} dias`);
        }

        // Calcular outras métricas
        const totalPurchases = useOptimization ? totalStats.count : orders.length;
        const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

        // Frequência mensal
        const monthsDiff = firstPurchase && firstPurchase < now
            ? Math.max(1, (now.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30))
            : 1;
        const purchaseFrequency = totalPurchases / monthsDiff;

        // Categorização do cliente
        const metrics = {
            daysSinceLastPurchase,
            purchaseFrequency,
            totalSpent,
            averageTicket
        };

        const category = this.categorizeCustomer(metrics);
        const score = this.calculateCustomerScore(metrics);

        // Análise de produtos/categorias mais comprados
        const productAnalysis = this.analyzeTopProducts(orders);

        const analysis: ICustomerAnalysis = {
            customerId: customer._id,
            customerName: customer.name || 'Cliente sem nome',
            email: customer.email || '',
            phone: customer.phone || '',
            totalSpent,
            totalPurchases,
            averageTicket,
            purchaseFrequency,
            daysSinceLastPurchase,
            lastPurchaseDate: lastPurchase || undefined,
            firstPurchaseDate: firstPurchase || undefined,
            score,
            category,
            priority: this.calculatePriority(score, category),
            topCategories: productAnalysis.categories,
            topProducts: productAnalysis.products,
            source: customer.source || 'Múltiplas origens',
            recommendedAction: this.getRecommendedAction(category),
            observations: this.generateObservations(metrics),
            suggestedActions: this.generateSuggestedActions(category, metrics),
            scoreReason: this.getScoreReason(metrics)
        };

        return analysis;
    }

    /**
     * Extrair valor da order - suporta múltiplos formatos
     */
    private extractOrderValue(order: any): number {
        // Tentar múltiplas formas de pegar o valor
        const value = order.balance?.total ||
            order.total ||
            order.amount ||
            order.valor ||
            order.value ||
            order.valorTotal ||
            order.totalAmount ||
            0;

        // DEBUG ocasional (1% das vezes)
        if (Math.random() < 0.01 && value === 0) {
            console.warn(`⚠️ Order sem valor detectado:`, {
                code: order.code,
                collection: order._collection,
                hasBalance: !!order.balance,
                hasTotal: !!order.total,
                hasAmount: !!order.amount
            });
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
     * Analisar produtos mais comprados
     */
    private analyzeTopProducts(orders: any[]): { categories: string[], products: Array<{ name: string, count: number }> } {
        const productCount = new Map<string, number>();
        const categorySet = new Set<string>();

        // Limitar análise para performance
        const ordersToAnalyze = orders.slice(-100); // Últimas 100 compras

        ordersToAnalyze.forEach(order => {
            // Produtos
            const items = order.items || order.products || order.produtos || [];
            items.forEach((item: any) => {
                if (item.name || item.nome) {
                    const productName = item.name || item.nome;
                    productCount.set(productName, (productCount.get(productName) || 0) + 1);

                    // Categoria
                    if (item.category?.name) {
                        categorySet.add(item.category.name);
                    }
                }
            });
        });

        // Top 5 produtos
        const topProducts = Array.from(productCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            categories: Array.from(categorySet).slice(0, 3),
            products: topProducts
        };
    }

    /**
     * Categorizar cliente baseado em RFM
     */
    private categorizeCustomer(metrics: any): 'new' | 'hot' | 'warm' | 'cold' | 'vip' {
        const { daysSinceLastPurchase, purchaseFrequency, totalSpent } = metrics;

        // VIP: Alto valor e frequência
        if (totalSpent > 5000 && purchaseFrequency > 2) {
            return 'vip';
        }

        // Baseado em recência
        if (daysSinceLastPurchase <= 30) {
            return 'hot';
        } else if (daysSinceLastPurchase <= 90) {
            return 'warm';
        } else if (daysSinceLastPurchase <= 180) {
            return 'cold';
        }

        // Novo cliente (apenas uma compra recente)
        if (metrics.totalPurchases === 1 && daysSinceLastPurchase <= 30) {
            return 'new';
        }

        return 'cold';
    }

    /**
     * Calcular score do cliente (0-100)
     */
    private calculateCustomerScore(metrics: any): number {
        const { daysSinceLastPurchase, purchaseFrequency, totalSpent, averageTicket } = metrics;

        // Pesos
        const weights = {
            recency: 0.35,      // 35%
            frequency: 0.25,    // 25%
            monetary: 0.25,     // 25%
            ticket: 0.15        // 15%
        };

        // Normalizar métricas (0-100)
        const recencyScore = Math.max(0, 100 - (daysSinceLastPurchase / 3.65)); // 365 dias = 0
        const frequencyScore = Math.min(100, purchaseFrequency * 20); // 5+ compras/mês = 100
        const monetaryScore = Math.min(100, (totalSpent / 100)); // R$ 10.000+ = 100
        const ticketScore = Math.min(100, (averageTicket / 5)); // R$ 500+ = 100

        const finalScore =
            (recencyScore * weights.recency) +
            (frequencyScore * weights.frequency) +
            (monetaryScore * weights.monetary) +
            (ticketScore * weights.ticket);

        return Math.round(finalScore);
    }

    /**
     * Calcular prioridade
     */
    private calculatePriority(score: number, category: string): 'high' | 'medium' | 'low' {
        if (category === 'vip' || score >= 80) return 'high';
        if (category === 'hot' || score >= 50) return 'medium';
        return 'low';
    }

    /**
     * Obter razão do score
     */
    private getScoreReason(metrics: any): string {
        const reasons = [];

        if (metrics.daysSinceLastPurchase <= 30) {
            reasons.push('Compra recente');
        }
        if (metrics.purchaseFrequency > 2) {
            reasons.push('Alta frequência');
        }
        if (metrics.totalSpent > 1000) {
            reasons.push('Alto valor total');
        }
        if (metrics.averageTicket > 200) {
            reasons.push('Ticket médio elevado');
        }

        return reasons.join(', ') || 'Análise baseada em histórico';
    }

    /**
     * Gerar ações sugeridas
     */
    private generateSuggestedActions(category: string, metrics: any): string[] {
        const actions = [];

        switch (category) {
            case 'hot':
                actions.push('Oferecer produtos complementares');
                actions.push('Programa de fidelidade');
                break;
            case 'warm':
                actions.push('Campanha de reengajamento');
                actions.push('Cupom de desconto personalizado');
                break;
            case 'cold':
                actions.push('Oferta especial de reativação');
                actions.push('Pesquisa de satisfação');
                break;
            case 'new':
                actions.push('Email de boas-vindas');
                actions.push('Desconto na segunda compra');
                break;
            case 'vip':
                actions.push('Atendimento prioritário');
                actions.push('Ofertas exclusivas');
                break;
        }

        return actions;
    }

    /**
     * Obter ação recomendada
     */
    private getRecommendedAction(category: string): string {
        switch (category) {
            case 'vip':
                return '⭐ Tratamento VIP - manter engajamento com ofertas exclusivas';
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
                ...(doc as any).data()
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
     * Analisar cliente isolado - DEBUG
     */
    public async analyzeSpecificCustomer(customerName: string): Promise<void> {
        try {
            console.log(`\n🔍 ANÁLISE ISOLADA: "${customerName}"`);

            const allCustomersMap = new Map();

            // Buscar em todas as collections
            for (const collName of ['CashierSales', 'ServiceOrders', 'Sales', 'Requests']) {
                const snapshot = await this.iToolsService.database()
                    .collection(collName)
                    .where([
                        { field: 'owner', operator: '=', value: Utilities.storeID }
                    ])
                    .get();

                if (snapshot && snapshot.docs) {
                    snapshot.docs.forEach(doc => {
                        const data = (doc as any).data();
                        const customer = data.customer || data.client || data.cliente || {};
                        const customerDocName = customer.name || customer.nome || '';

                        if (customerDocName.toUpperCase().includes(customerName.toUpperCase())) {
                            // Processar documento
                            let result = null;

                            if (collName === 'CashierSales') {
                                result = this.processCashierSaleDocument(doc);
                            } else if (collName === 'ServiceOrders') {
                                result = this.processServiceOrderDocument(doc);
                            } else if (collName === 'Sales') {
                                result = this.processSaleDocument(doc);
                            } else if (collName === 'Requests') {
                                result = this.processRequestDocument(doc);
                            }

                            if (result && result.customerId) {
                                const finalCustomerId = customer._id || result.customerId;

                                if (allCustomersMap.has(finalCustomerId)) {
                                    const existing = allCustomersMap.get(finalCustomerId);
                                    existing.orders.push(result.orderData);
                                } else {
                                    allCustomersMap.set(finalCustomerId, {
                                        ...result.customerData,
                                        orders: [result.orderData]
                                    });
                                }
                            }
                        }
                    });
                }
            }

            // Analisar clientes encontrados
            const customers = Array.from(allCustomersMap.values());
            console.log(`\n👥 Clientes únicos encontrados: ${customers.length}`);

            if (customers.length > 0) {
                this.updateProgress('analyzing', 0, customers.length, 'Analisando...');

                const analyses = await this.analyzeCustomersInParallel(customers);
                analyses.sort((a, b) => b.score - a.score);

                // Mostrar resultado
                console.log(`\n📊 RESULTADO DA ANÁLISE ISOLADA:`);
                analyses.forEach(analysis => {
                    console.log(`\n   Cliente: ${analysis.customerName}`);
                    console.log(`   - ID: ${analysis.customerId}`);
                    console.log(`   - Total gasto: R$ ${analysis.totalSpent.toFixed(2)}`);
                    console.log(`   - Total de compras: ${analysis.totalPurchases}`);
                    console.log(`   - Última compra: ${analysis.lastPurchaseDate.toLocaleDateString()}`);
                    console.log(`   - Dias desde última compra: ${analysis.daysSinceLastPurchase}`);
                    console.log(`   - Categoria: ${analysis.category}`);
                    console.log(`   - Score: ${analysis.score}`);
                });

                this.analysisResultsSubject.next(analyses);
                this.updateProgress('completed', customers.length, customers.length, 'Análise isolada concluída!');
            } else {
                this.updateProgress('completed', 0, 0, 'Nenhum cliente encontrado');
            }

        } catch (error) {
            console.error('❌ Erro na análise isolada:', error);
            this.updateProgress('error', 0, 0, 'Erro ao analisar cliente');
        }
    }

    /**
     * MÉTODO PRINCIPAL - Análise otimizada
     */
    public async analyzeCustomers(): Promise<ICustomerAnalysis[]> {
        try {
            console.log('🚀 INICIANDO ANÁLISE OTIMIZADA DE CLIENTES...');

            // ADICIONAR DEBUG NO INÍCIO
            await this.debugDuplicateIssues();

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

            // DEBUG: Mostrar resumo dos clientes detectados
            console.log(`\n📊 RESUMO DOS CLIENTES DETECTADOS:`);

            // Procurar especificamente por LORENA
            const lorenasFound = customers.filter(c => c.name && c.name.includes('LORENA MORAIS'));
            if (lorenasFound.length > 0) {
                console.log(`\n🔴 LORENAS ENCONTRADAS: ${lorenasFound.length}`);
                lorenasFound.forEach(lorena => {
                    console.log(`\n   Cliente: ${lorena.name}`);
                    console.log(`   - ID: ${lorena._id}`);
                    console.log(`   - Phone: ${lorena.phone}`);
                    console.log(`   - CPF: ${lorena.cpfCnpj}`);
                    console.log(`   - Total de vendas: ${lorena.orders.length}`);
                    console.log(`   - Vendas IDs:`, lorena.orders.map(o => o.code || o._docId));
                });
            }

            // Mostrar top 10 clientes por número de vendas
            const topCustomers = customers
                .sort((a, b) => b.orders.length - a.orders.length)
                .slice(0, 10);

            console.log(`\n📈 TOP 10 CLIENTES POR NÚMERO DE VENDAS:`);
            topCustomers.forEach((customer, index) => {
                console.log(`   ${index + 1}. ${customer.name}: ${customer.orders.length} vendas`);
            });

            this.updateProgress('analyzing', 0, customers.length, 'Analisando clientes...');

            const analyses = await this.analyzeCustomersInParallel(customers);

            // Ordenar por score
            analyses.sort((a, b) => b.score - a.score);

            // DEBUG FINAL: Mostrar resultado da LORENA
            const lorenaResults = analyses.filter(a => a.customerName.includes('LORENA MORAIS'));
            if (lorenaResults.length > 0) {
                console.log(`\n🔴 RESULTADO FINAL PARA LORENA(S):`);
                lorenaResults.forEach(lorena => {
                    console.log(`\n   Cliente: ${lorena.customerName}`);
                    console.log(`   - ID: ${lorena.customerId}`);
                    console.log(`   - Total gasto: R$ ${lorena.totalSpent.toFixed(2)}`);
                    console.log(`   - Total de compras: ${lorena.totalPurchases}`);
                    console.log(`   - Última compra: ${lorena.lastPurchaseDate.toLocaleDateString()}`);
                    console.log(`   - Dias desde última compra: ${lorena.daysSinceLastPurchase}`);
                    console.log(`   - Categoria: ${lorena.category}`);
                    console.log(`   - Score: ${lorena.score}`);
                });
            }

            this.analysisResultsSubject.next(analyses);
            this.updateProgress('completed', customers.length, customers.length, 'Análise concluída!');

            return analyses;

        } catch (error) {
            console.error('❌ Erro na análise de clientes:', error);
            this.updateProgress('error', 0, 0, 'Erro ao analisar clientes');
            throw error;
        }
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