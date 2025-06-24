import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Modules
import { SharedModule } from '@shared/shared.module';

// Components
import { ServiceOrdersComponent } from './serviceOrders.component';
import { ServiceOrdersModalComponent } from './components/modal/modal.component';
import { ServiceOrdersRegisterComponent } from './components/modal/components/register/register.component';
import { ServiceOrdersRegisterLayerComponent } from './components/modal/components/register/components/layer/layer.component';
import { ServiceOrdersReceiptsComponent } from './components/modal/components/receipts/receipts.component';
import { ServiceOrdersStatusComponent } from './components/modal/components/status/status.component';
import { ServiceOrdersReceiptsPrintComponent } from './components/modal/components/receipts/components/print/print.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: 'ordens-de-servico', component: ServiceOrdersComponent },
      { path: '**', redirectTo: 'ordens-de-servico', pathMatch: 'full' }
    ]),
  ],
  declarations: [
    ServiceOrdersComponent,
    ServiceOrdersModalComponent,    
    ServiceOrdersRegisterComponent,
    ServiceOrdersRegisterLayerComponent,    
    ServiceOrdersReceiptsComponent,
    ServiceOrdersReceiptsPrintComponent,
    ServiceOrdersStatusComponent
  ]
})
export class ServiceOrdersModule {}
