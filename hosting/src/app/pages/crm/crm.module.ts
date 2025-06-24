// Arquivo: crm.module.ts
// Localização: src/app/pages/crm/crm.module.ts
// Descrição: Módulo CRM completo com todos os componentes incluindo Aniversários

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Módulos
import { SharedModule } from '@shared/shared.module';
import { CrmRoutingModule } from './crm.routing';

// Componentes principais
import { CrmComponent } from './crm.component';
import { CrmDashboardComponent } from './dashboard/crm-dashboard.component';
import { LeadsComponent } from './leads/leads.component';
import { PipelineComponent } from './pipeline/pipeline.component';
import { ActivitiesComponent } from './activities/activities.component';

// Componentes auxiliares
import { CustomerImportComponent } from './components/customer-import/customer-import.component';
import { MessageTemplatesComponent } from './components/message-templates/message-templates.component';
import { BirthdayCustomersComponent } from './components/birthday-customers/birthday-customers.component';

// Serviços
import { CrmService } from './crm.service';
import { CustomerImportService } from './services/customer-import.service';
import { CrmAlertsService } from './services/crm-alerts.service';
import { SalesIntegrationService } from './services/sales-integration.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        RouterModule,
        DragDropModule,
        CrmRoutingModule
    ],
    declarations: [
        // Componentes principais
        CrmComponent,
        CrmDashboardComponent,
        LeadsComponent,
        PipelineComponent,
        ActivitiesComponent,

        // Componentes auxiliares
        CustomerImportComponent,
        MessageTemplatesComponent,
        BirthdayCustomersComponent  // ← NOVO COMPONENTE ADICIONADO
    ],
    providers: [
        CrmService,
        CustomerImportService,
        CrmAlertsService,
        SalesIntegrationService
    ]
})
export class CrmModule { }