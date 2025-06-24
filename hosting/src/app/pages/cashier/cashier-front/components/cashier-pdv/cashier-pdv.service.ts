import { Injectable } from "@angular/core";
import { iTools } from "@itools/index";

// Services
import { IToolsService } from '@shared/services/iTools.service';
import { ProductsService } from "@pages/stock/products/products.service";
import { BillsToReceiveService } from "@pages/financial/bills-to-receive/bills-to-receive.service";
import { BankAccountsService } from "@pages/financial/bank-accounts/bank-accounts.service";
import { NotificationService } from '@shared/services/notification.service';
import { SystemLogsService } from '@shared/services/system-logs.service';

// Translate
import { CashierFrontPDVTranslate } from "./cashier-pdv.translate";

// Interfaces
import { IBatch } from '@itools/interfaces/IBatch';
import { ICollection } from '@itools/interfaces/ICollection';
import { ICashierSale, ECashierSaleStatus, ECashierSaleOrigin } from '@shared/interfaces/ICashierSale';
import { EServiceOrderPaymentStatus, EServiceOrderStatus } from '@shared/interfaces/IServiceOrder';
import { EFinancialBankTransactionType } from "@shared/interfaces/IFinancialBankTransaction";
import { EStockLogAction } from '@shared/interfaces/IStockLog';
import { ISystemLog, ESystemLogType, ESystemLogAction } from '@shared/interfaces/ISystemLog';
import { ENotificationStatus } from '@shared/interfaces/ISystemNotification';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { Dispatch } from "@shared/utilities/dispatch";

@Injectable({ providedIn: 'root' })
export class CashierFrontPDVService {

  public translate = CashierFrontPDVTranslate.get();

  constructor(
    private iToolsService: IToolsService,
    private productsService: ProductsService,
    private billsToReceiveService: BillsToReceiveService,
    private bankAccountsService: BankAccountsService,
    private notificationService: NotificationService,
    private systemLogsService: SystemLogsService
  ) {}

  // Getter and Setter Methods

  public get serviceOrdersService() {
    return Dispatch.serviceOrdersService;
  }

  // CRUD Methods

  public async getSale(code: number) {

    return (new Promise<any>((resolve, reject) => {

      const collection = this.iToolsService.database().collection('CashierSales');

      collection.where([
        { field: 'code', operator: '=', value: code },
        { field: 'owner', operator: '=', value: Utilities.storeID }
      ]);

      collection.limit(1);

      collection.get().then((res) => {

        if (res.docs.length > 0) {
          resolve(res.docs[0].data());
        } else {
          reject();
        }        
      });
    }));
  }

  public async registerSale(data: ICashierSale, source?: ICashierSale, allocateProducts?: boolean, batch?: IBatch) {

    return (new Promise<any>(async (resolve, reject) => {
      
      const checkBatch = (batch != undefined);
      const operation = (!data.code ? 'register' : 'update' );

      try {

        if (!batch) { Utilities.loading() }

        batch = (batch || this.iToolsService.database().batch());
   
        let docRef: any = this.collRef().doc(data._id);

        if (!data.code) {
          data.code = iTools.FieldValue.control('SystemControls', Utilities.storeID, `${this.collRef().id}.code`);
          data.owner = Utilities.storeID;
          data.operator = Utilities.operator;
          data.registerDate = iTools.FieldValue.date(Utilities.timezone);
        } else {
 
          data.code = parseInt(<string>data.code);

          if (!data._id) {

            docRef = { collName: this.collRef().id, where: [
              { field: 'code', operator: '=', value: data.code },
              { field: 'owner', operator: '=', value: Utilities.storeID }
            ] };
          }
        }

        data.modifiedDate = iTools.FieldValue.date(Utilities.timezone);

        const batchRef = batch.update(docRef, data, { merge: true });
        
        if (allocateProducts) {
          await this.checkProducts(data, source, operation, batch, batchRef);
        }

        await this.checkRequest(data, operation, batch);
        await this.checkServiceOrder(data, operation, batch);
        // await this.checkBillsToReceive(data, source, operation, batch, batchRef);
        await this.checkBankAccount(data, source, operation, batch);

        await this.systemLogs(data, operation, batch, batchRef);

        if (!checkBatch) {

          console.log(Utilities.deepClone(batch));

          batch.commit().then((response: any) => {

            Utilities.loading(false);

            if (operation == 'register') {
              data.code = Utilities.prefixCode(response.controls[batchRef]['CashierSales']['code']);
              data.registerDate = response.places[batchRef].registerDate;
            }

            resolve(response);

            this.notifications(operation, 'success');
          }).catch((error) => {

            Utilities.loading(false);
            reject(error);

            this.notifications(operation, 'error');
            console.error(`Error: ${error.message}`);
          });
        } else {
          resolve({ batchRef });
        }
      } catch(error) {

        Utilities.loading(false);

        if (!checkBatch) {
          this.notifications(operation, 'error');
          console.error(`Error: ${error.message}`);
        }

        reject(error);
      }
    }));
  }

  public async cancelSale(data: ICashierSale, batch?: IBatch) {

    return (new Promise<void>(async (resolve, reject) => {
      
      const checkBatch = (batch != undefined);

      try {

        if (!batch) { Utilities.loading() }

        batch = (batch || this.iToolsService.database().batch());

        let docRef: any = this.collRef().doc(data._id);

        if (!data._id && data.code) {
          docRef = { collName: this.collRef().id, where: [{ field: 'code', operator: '=', value: parseInt(<string>data.code) }] };    
        } else if (!data._id && !data.code) {
          new Error('The data reported does not have a record code or id.');
        }

        batch.update(docRef, {
          status: ECashierSaleStatus.CANCELED
        }, { merge: true });

        await this.checkProducts(data, null, 'cancel', batch);
        await this.checkRequest(data, 'cancel', batch);
        await this.checkBankAccount(data, null, 'cancel', batch);        
        await this.checkServiceOrder(data, 'cancel', batch);
        await this.systemLogs(data, 'cancel', batch);

        if (!checkBatch) {

          batch.commit().then(async() => { 

            // await this.cancelNote(data, docRef);

            Utilities.loading(false);
            resolve();

            this.notifications('cancel', 'success');
          }).catch((error) => {

            Utilities.loading(false);
            reject(error);

            this.notifications('cancel', 'error');
            console.error(`Error: ${error.message}`);
          });
        } else {
          resolve();
        }
      } catch(error) {

        Utilities.loading(false);

        if (!checkBatch) {
          this.notifications('cancel', 'error');
          console.error(`Error: ${error.message}`);
        }

        reject(error);
      }
    }));
  } 

  public async changeSaleOperator(data: ICashierSale, batch?: IBatch) {

    return (new Promise<void>(async (resolve, reject) => {
      
      const checkBatch = (batch != undefined);

      try {

        if (!batch) { Utilities.loading() }

        batch = (batch || this.iToolsService.database().batch());

        let docRef: any = this.collRef().doc(data._id);

        if (data.code) {
          data.code = parseInt(<string>data.code);
        }

        if (!data._id && data.code) {
          docRef = { collName: this.collRef().id, where: [{ field: 'code', operator: '=', value: data.code }] };    
        } else if (!data._id && !data.code) {
          new Error('The data reported does not have a record code or id.');
        }

        await this.iToolsService.database().collection("StockLogs").where([
          {field: "action", operator: "=", value: "SALE"},
          {field: "originReferenceCode", operator: "=", value: data.code}
        ]).get().then((logs)=>{

          logs.docs.forEach((log)=>{
            batch.update(log.ref, {operator: data.operator}, {merge: true});
          });
        });

        this.registerSale(data, null, false, batch);

        await this.systemLogs(data, 'update', batch);

        if (!checkBatch) {

          batch.commit().then(() => { 

            Utilities.loading(false);
            resolve();

            this.notifications('cancel', 'success');
          }).catch((error) => {

            Utilities.loading(false);
            reject(error);

            this.notifications('cancel', 'error');
            console.error(`Error: ${error.message}`);
          });
        } else {
          resolve();
        }
      } catch(error) {

        Utilities.loading(false);

        if (!checkBatch) {
          this.notifications('cancel', 'error');
          console.error(`Error: ${error.message}`);
        }

        reject(error);
      }
    }));
  } 

  // Auxiliary Methods - Fiscal

  private async cancelNote(data, docRef) {

    return new Promise<void>((resolve, reject) => {

      if (data.nf) {

        let statusNf = true;
        let statusNfse = true;

        const exec = (type, id) => {

          if (type == "NF"){
            statusNf = false;
          }
          
          if (type == "NFSE"){
            statusNfse = false;
          }

          Dispatch.fiscalService.cancelNote(type, id, "CANCELAMENTO DE VENDA", true, true).then(() => {
          
            const batch = this.iToolsService.database().batch();
            
            batch.update(docRef, {
              nf: {status: "CANCELADO"}
            }, { merge: true });
            
            batch.commit().then(() => {
              
              if (type == "NF") {
                statusNf = true;
              }
              
              if (type == "NFSE") {
                statusNfse = true;
              }

            }).catch(() => {

              if (type == "NF") {
                statusNf = false;
              }
              
              if (type == "NFSE") {
                statusNfse = false;
              }
            });
          }).catch(() => {
            statusNf = true;
            statusNfse = true;
          });
        };

        if (data.nf.id.nf && data.nf.status.nf == "CONCLUIDO") {
          exec(data.nf.type.nf, data.nf.id.nf);
        }

        if (data.nf.id.nfse && data.nf.status.nfse == "CONCLUIDO") {
          exec(data.nf.type.nfse, data.nf.id.nfse);
        }

        const it = setInterval(() => {

          if (statusNf && statusNfse) {
            clearInterval(it);
            resolve();
          }
        }, 100);
     
      } else {
        resolve();
      }
    });
  }

  // Auxiliary Methods - Products

  private async checkProducts(data: ICashierSale, source: ICashierSale, operation: ('register'|'update'|'cancel'), batch: IBatch, batchRef?: any) {
      
    return (new Promise<any>( async(resolve, reject) => {

      const arrProducts: any = [];

      const componseObject = ((code: string, quantity: number) => {

        const obj: any = { code: parseInt(code.toString()) };

        if (Utilities.isMatrix) {
          obj.quantity = iTools.FieldValue.inc(quantity);
        } else {

          obj.branches = {};
          obj.branches[Utilities.storeID] = { 
            quantity: iTools.FieldValue.inc(quantity)
          };
        }

        return obj;
      });

      const hasSource = Object.values(source || {}).length > 0;

      if (!hasSource) {

        $$(data.products).map((_, item) => {

          let quantity: number = item.quantity;

          if (!isNaN(quantity)) {

            if (operation == 'register') {
              quantity = (quantity * -1);
              arrProducts.push(componseObject(item.code, quantity));
            }      

            if (operation == 'cancel') {
              arrProducts.push(componseObject(item.code, quantity));
            }
          } else {
            throw new Error();
          }
        });
      } else {
        
        const updateData = Utilities.deepClone(Utilities.parseArrayToObject(data.products || [].map((item)=> { item.code = parseInt(item.code.toString()); return item }), 'code'));
        const sourceData = Utilities.deepClone(Utilities.parseArrayToObject(source.products || [].map((item)=> { item.code = parseInt(item.code.toString()); return item }), 'code'));

        $$(updateData).map((_, item) => {          

          const data = sourceData[item.code] || sourceData[parseInt(item.code.toString())];

          if (data) {
            
            if (!isNaN(data.quantity)) {

              if (item.quantity != data.quantity) {

                if (!isNaN(item.quantity)) {
                  arrProducts.push(componseObject(item.code, (data.quantity - item.quantity)));
                } else {
                  throw new Error();
                }
              }
            } else {
              throw new Error();
            }

            delete sourceData[item.code];
            delete sourceData[parseInt(item.code.toString())];
          } else {
            arrProducts.push(componseObject(item.code, (item.quantity * -1)));
          }
        });

        if (Object.values(sourceData).length > 0) {

          $$(sourceData).map((_, item) => {
            arrProducts.push(componseObject(item.code, item.quantity));
          });
        }
      }

      const query = (()=>{
        return arrProducts.map((item)=>{
          return {field: "code", operator: "=", value: parseInt(item.code)}
        })
      })();

      await this.productsService.query(query, false, true, false, false).then((searchedProducts)=>{

        arrProducts.forEach((localProduct, index)=>{
          let find = false;
          searchedProducts.forEach((remoteProduct)=>{
            if(parseInt(localProduct.code) == parseInt(remoteProduct.code.toString())){
              find = true;
            }
          });

          if(!find){
            arrProducts.splice(index, 1);
          }
        })
      });

      
      if (arrProducts.length > 0) {

        const saleCode: any = (operation == 'register' ? iTools.FieldValue.bindBatchData(batchRef, 'code') : parseInt(<string>data.code));

        this.productsService.registerProducts(arrProducts, batch, {action: EStockLogAction.SALE, originReferenceCode: saleCode})
          .then((response) => { resolve(response) }).catch((error) => { reject(error) });
      } else {
        resolve(null);
      }
    }));
  }
  
  // Auxiliary Methods - Service Orders

  private async checkRequest(data: ICashierSale, operation: ('register'|'update'|'cancel'), batch: IBatch) {

    return new Promise<void>((resolve, reject) => {
    
      if ((data.origin == ECashierSaleOrigin.REQUEST) && (operation != 'register')) {

        const updateObject = { 
          code: data.requestCode,
          saleCode: data.code,
          saleStatus: (operation != 'cancel' ? data.status : ECashierSaleStatus.CANCELED)
        };

        if(data.requestCode){
          Dispatch.requestsService.registerRequest(updateObject, batch)
          .then((response) => { resolve(response) }).catch((error) => { reject(error) });
        }else{
          resolve();
        }
      
        
      } else {
        resolve();
      }
    });
  }

  private async checkServiceOrder(data: ICashierSale, operation: ('register'|'update'|'cancel'), batch: IBatch) {

    return new Promise<void>((resolve, reject) => {  
    
      if (data.origin == ECashierSaleOrigin.SERVICE_ORDER) {

        let updateObject = null;

        if ((operation == 'update') && (data.status == ECashierSaleStatus.CONCLUDED)) {
          updateObject = { code: data.service.code, paymentStatus: EServiceOrderPaymentStatus.CONCLUDED };
        }
        
        if (operation == 'cancel') {
          updateObject = { code: data.service.code, serviceStatus: EServiceOrderStatus.CANCELED };
        }

        if (updateObject && (operation == 'update') || (operation == 'cancel')) {

          Dispatch.serviceOrdersService.registerService({ data: updateObject }, batch)
            .then(() => { resolve() }).catch((error) => { reject(error) });
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  // Auxiliary Methods - Bills Receive

  private async checkBillsToReceive(data: ICashierSale, source: ICashierSale, operation: ('register'|'update'|'cancel'), batch: IBatch, batchRef: number) {

    return (new Promise<void>(async (resolve, reject) => {
      
      try {
      
        if (operation == 'register') {

          if (data.status == ECashierSaleStatus.PENDENT) {

            this.billsToReceiveService.registerBill(data.billToReceive.config, batch)
              .then((response) => { resolve(response) }).catch((error) => { reject(error) });
          } else {
            resolve(null);
          }

        } else if (operation == 'update') {

          if (data.billToReceiveCode) {

            this.billsToReceiveService.registerBill(data.billToReceive.config, batch)
              .then((response) => { resolve(response) }).catch((error) => { reject(error) });
          } else {
            resolve(null);
          }
        } else if (operation == 'cancel') {

          if (data.billToReceiveCode) {
            
            this.billsToReceiveService.cancelBill(data.billToReceive.config, batch)
              .then((response) => { resolve(response) }).catch((error) => { reject(error) });
          }
        }
      } catch(error) {
        reject(error);
      }    
    }));
  }

  // Auxiliary Methods - Bank Account

  private async checkBankAccount(data: ICashierSale, source: ICashierSale, operation: ('register'|'update'|'cancel'), batch: IBatch) {

    return (new Promise<void>(async (resolve, reject) => {

      try {

        const defaultAccount: any = (await this.bankAccountsService.query([{field: "code", operator: "=", value: "@0001"}], false, false, false, false))[0];

        const bankTransitions: any = [];

        const keepOriginalMetadata = (() => {
          return (source && data.status == "CONCLUDED" && source.status == "CONCLUDED" && source.balance.total == data.balance.total);  
        })();

        const paymentDate = source ? source.paymentDate : "";

        const componseObject = ((method: any, index?: number) => {

          if (!method.bankAccount && !defaultAccount || method.bankAccount && !method.bankAccount.code && !defaultAccount) {
            throw new Error("Meio de pagamento não possui Conta Bancária configurada!");
          }

          method.bankAccount = method.bankAccount && method.bankAccount.code ? method.bankAccount : {
            _id: defaultAccount._id,
            code: defaultAccount.code,
            agency: defaultAccount.agency,
            account: defaultAccount.account,
            name: defaultAccount.name
          };

          if (data.paymentMethods[index]){
            data.paymentMethods[index].bankAccount = method.bankAccount;
          }

          const obj: any = { 
            code: method.bankAccount.code,
            transaction: {
              bankAccount: method.bankAccount,
              type: (operation != 'cancel' ? (method.value > 0 ? EFinancialBankTransactionType.DEPOSIT : EFinancialBankTransactionType.WITHDRAW) : EFinancialBankTransactionType.WITHDRAW),
              value: (method.value > 0 ? method.value : (method.value * -1)),
              uninvoiced: !!method.uninvoiced
            }
          };

          if (index >= 0 && data.paymentMethods[index]) {

            if (!data.paymentMethods[index].history) {
              data.paymentMethods[index].history = [];
            }

            data.paymentMethods[index].history.push({
              date: keepOriginalMetadata ? paymentDate : iTools.FieldValue.date(Utilities.timezone),
              value: method.value
            });

          }

          return obj;
        });

        if (!source && (operation != 'cancel')) {

          $$(Utilities.deepClone(data.paymentMethods)).map((index, item) => {
            bankTransitions.push(componseObject(item, index));
          });
        } else {
          
          const sourceData = Utilities.parseArrayToObject(Utilities.deepClone((<any>(source || {})).paymentMethods), 'code');

          $$(Utilities.deepClone(data.paymentMethods)).map((index, item) => {

            const source = sourceData[item.code];

            if (source) {

              if (item.value != source.value) {
                item.value = (item.value - source.value);
                bankTransitions.push(componseObject(item, index));
              }

              delete sourceData[item.code];
            } else {
              bankTransitions.push(componseObject(item, index));
            }
          });

          if (Object.values(sourceData).length > 0) {
            
            $$(sourceData).map((_, item) => {
              item.value = (item.value * -1);
              bankTransitions.push(componseObject(item));
            });
          }
        }

        if (bankTransitions.length > 0) {

          $$(bankTransitions).map((_, data) => {
            this.bankAccountsService.registerAccount(data, batch);
          });

          data.paymentDate = keepOriginalMetadata ? paymentDate : iTools.FieldValue.date(Utilities.timezone);
        }

        if (data.balance.total == 0){
          data.paymentDate = iTools.FieldValue.date(Utilities.timezone);
          data.status = ECashierSaleStatus.CONCLUDED;
        }

        resolve();
        
      } catch(error) {
        reject(error);
      }
    }));
  }  

  // Auxiliary Methods - Logs

  private async systemLogs(data: ICashierSale, action: string, batch: IBatch, batchRef?: number) {

    const settings: ISystemLog = {
      data: [<any>{}]
    };    

    settings.data[0].referenceCode = (action == 'register' ? iTools.FieldValue.bindBatchData(batchRef, 'code') : parseInt(<string>data.code));
    settings.data[0].type = ESystemLogType.CashierSales;

    if (action == 'register') {
      settings.data[0].action = ESystemLogAction.REGISTER;
      settings.data[0].note = this.translate.systemLog.register;
    }

    if (action == 'update') {
      settings.data[0].action = ESystemLogAction.UPDATE;
      settings.data[0].note = this.translate.systemLog.update;
    }
    
    if (action == 'delete') {
      settings.data[0].action = ESystemLogAction.DELETION;
      settings.data[0].note = this.translate.systemLog.delete;
    }

    return this.systemLogsService.registerLogs(settings, batch);
  }

  // Utility Methods

  private collRef(): ICollection {
    return this.iToolsService.database().collection('CashierSales');
  }

  private notifications(action: string, result: string, storage: boolean = false) {

    const settings: any = {
      title: this.translate.componentTitle
    };

    if (result == 'success') {

      if (action == 'register') {
        settings.description = this.translate.notification.register;
      }

      if (action == 'update') {
        settings.description = this.translate.notification.update;
      }

      if (action == 'delete') {
        settings.description = this.translate.notification.delete;
      }

      settings.status = ENotificationStatus.success;
    }

    if (result == 'error') {
      settings.description = this.translate.notification.error;
      settings.status = ENotificationStatus.danger;
    }

    this.notificationService.create(settings, storage);
  }

}
