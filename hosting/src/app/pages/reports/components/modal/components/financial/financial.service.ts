import { Injectable } from "@angular/core";
import { IToolsService } from "@shared/services/iTools.service";

// Services
import { CashierReportsService } from "../cashier/cashier.service";

// Interfaces
import { IFinancialBillToPay, EFinancialBillToPayStatus } from '@shared/interfaces/IFinancialBillToPay';
import { IFinancialBillToReceive, EFinancialBillToReceiveStatus } from '@shared/interfaces/IFinancialBillToReceive';
import { ICollection } from "@itools/interfaces/ICollection";

// Types
import { query } from "@shared/types/query";

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { DateTime } from '@shared/utilities/dateTime';

@Injectable({ providedIn: 'root' })
export class FinancialReportsService {

  constructor(
    private iToolsService: IToolsService,
    private cashierReportsService: CashierReportsService
  ) {}

  public async getCashFlow(settings: { data?: { period: { start: string, end: string }, store: { id: string } } }) {

    return (new Promise<any>(async (resolve) => {

      const data: any = {};

      data.cashier = await this.cashierReportsService.getResume({
        where: [
          { field: 'date', operator: '>=', value: settings.data.period.start },
          { field: 'date', operator: '<=', value: settings.data.period.end },
          { field: 'owner', operator: '=', value: settings.data.store.id }
        ],
        orderBy: { code: 1 } 
      });

      resolve(this.treatCashFlow(data)); 
    }));
  }

  public async getBillsToPay(settings: { where: query['where'], orderBy: query['orderBy'], data: { type: string } }) {

    return (new Promise<any>((resolve) => {      

      this.addStatusClausesForAccountsPayable({ where: settings.where, data: settings.data })

      const collection = this.iToolsService.database().collection('FinancialBillsToPay');
      collection.orderBy(settings.orderBy);
      collection.where(settings.where);      

      this.batchDataSearch(collection, settings).then((result) => {
        resolve(this.treatBillsToPay(result, { type: settings.data.type }));
      });
    }));
  }

  public async getBillsToReceive(settings: { where: query['where'], orderBy: query['orderBy'], data: { type: string } }) {

    return (new Promise<any>((resolve) => {

      this.addStatusClausesForAccountsReceivable({ where: settings.where, data: settings.data });

      const collection = this.iToolsService.database().collection('FinancialBillsToReceive');
      collection.orderBy(settings.orderBy);
      collection.where(settings.where);

      this.batchDataSearch(collection, settings).then((result) => {
        resolve(this.treatBillsToReceive(result, { type: settings.data.type }));
      });
    }));
  }

  public async getBankTransactions(settings: { where: query['where'], orderBy: query['orderBy'], data: { type: string } }) {

    return (new Promise<any>((resolve) => {

      const collection = this.iToolsService.database().collection('FinancialBankTransactions');
      collection.orderBy(settings.orderBy);
      collection.where(settings.where);

      collection.get().then((response) => {      
        const data: any = [];
        response.docs.forEach((doc)=>{
          data.push(doc.data());
        });

        resolve(this.treatBankTransactions(data, null))
      });
    }));
  }

  // Auxiliaries Methods

  private addStatusClausesForAccountsPayable(settings: { where: query['where'], data: { type: string } }) {

    settings.where = (() => {

      const clauses: query['where'] = (settings.where || []);

      switch (settings.data.type) {
        case 'paidAccounts':
          clauses.push({ field: 'installments.paidAmount', operator: '>', value: 0 });
          clauses.push({ field: 'status', operator: '!=', value: EFinancialBillToPayStatus.CANCELED });
          break;
        case 'pendingAccounts':
        case 'overdueAccounts':
          clauses.push({ field: 'status', operator: '=', value: EFinancialBillToPayStatus.PENDENT });
          break;
        case 'canceledAccounts':
          clauses.push({ field: 'status', operator: '=', value: EFinancialBillToPayStatus.CANCELED });
          break;
      }

      return clauses;
    })();
  }
  
  private addStatusClausesForAccountsReceivable(settings: { where: query['where'], data: { type: string } }) {

    settings.where = (() => {

      const clauses: query['where'] = (settings.where || []);

      switch (settings.data.type) {
        case 'receivedAccounts':
          clauses.push({ field: 'status', operator: '=', value: EFinancialBillToReceiveStatus.CONCLUDED });
          clauses.push({ field: 'installments.receivedAmount', operator: '>', value: 0 });
          break;
        case 'pendingAccounts':
        case 'overdueAccounts':
          clauses.push({ field: 'status', operator: '=', value: EFinancialBillToReceiveStatus.PENDENT });
          break;
        case 'canceledAccounts':
          clauses.push({ field: 'status', operator: '=', value: EFinancialBillToReceiveStatus.CANCELED });
          break;
      }

      return clauses;
    })();
  }

  private batchDataSearch(collection: ICollection, settings: query) {

    return (new Promise<any>((resolve, reject) => {

      settings.where = (settings.where.length > 0 ? settings.where : []);
      settings.start = (settings.start >= 0 ? settings.start : 0);
      settings.limit = (settings.limit > 0 ? settings.limit : 500);

      collection.count().get().then((res) => {

        const count = (res.docs.length > 0 ? res.docs[0].data().count : 0);
        const requestsCount = Math.ceil(count / 500);

        let data = [];
        let control = 1;          
        let success = null;
        let error = null;

        const requestRecursive = (settings: query) => {

          try {              

            collection.where(settings.where);
            collection.startAfter(settings.start);
            collection.limit(settings.limit);

            collection.get().then((res) => {
  
              for (const doc of res.docs) {
                data.push(doc.data());
              }         
              
              if (requestsCount > 1) {

                if (control <= requestsCount) {
    
                  settings.start = (settings.limit * control);
                  control++;
    
                  setTimeout(() => {
                    if (control < (requestsCount + 1)) {
                      requestRecursive(settings);
                    }
                  }, 200);
                }
    
                if (control == (requestsCount + 1)) {
                  success = true;
                }
              } else {
                success = true;
              }
            }).catch((e) => {
              throw new Error(e);
            });
          } catch(e) {
            error = e;
          }                      
        };

        if (count > 0) {
          requestRecursive(settings);
        } else {
          success = true;
        }
        
        const timer = setInterval(() => {

          if (success) {
            clearInterval(timer);
            resolve(data);
          }

          if (error) {
            clearInterval(timer);
            reject(error);
          }
        }, 200);
      });
    }));    
  }  

  // Utility Methods

  private treatCashFlow(data: any[]) {

    const obj: any = {}

    const balance = {
      cashier: 0, billsToPay: 0,
      billsToReceive: 0, productsCosts: 0,
      servicesCosts: 0, costs: 0, 
      paymentsCosts: 0, revenue: 0,
      grossProfit: 0
    };

    $$(data).map((type, value) => {

      if (type == 'cashier') {
        
        $$(value).map((_, item) => {

          const billsToPay = item.balance.billsToPay ?? 0;
          const billsToReceive = item.balance.billsToReceive ?? 0;

          const cashierPartialResult = ((item.balance.sales + item.balance.inflows) - item.balance.outflows);

          obj[item.date] = {
            cashier: cashierPartialResult,  
            productsCosts: item.balance.productsCosts,
            servicesCosts: item.balance.servicesCosts,
            paymentsCosts: item.balance.paymentsCosts,
            billsToPay: billsToPay,
            billsToReceive: billsToReceive
          }
        });
      }

      // if (type == 'billsToPay') {

      //   $$(value.records || []).map((_, item) => {

      //     console.log(item);
      //     const date = item.paymentDate || item.registerDate;

      //     if (!obj[date]) {
      //       obj[date] = {};
      //     }

      //     if (!obj[date].billsToPay) {             
      //       obj[date].billsToPay = 0;
      //     }

      //     obj[date].billsToPay += item.paid;
      //   });
      // }

      // if (type == 'billsToReceive') {

      //   $$(value.records || []).map((_, item) => {

      //     if (!obj[item.registerDate]) {
      //       obj[item.registerDate] = {};             
      //     }

      //     if (!obj[item.registerDate].billsToReceive) {
      //       obj[item.registerDate].billsToReceive = 0;
      //     }

      //     obj[item.registerDate].billsToReceive += item.received;
      //   });
      // }        
    });

    // console.log(obj);

    $$(obj).map((date, item) => {

      item.date = date;
      item.cashier = (item.cashier || 0);
      item.billsToPay = (item.billsToPay || 0);
      item.billsToReceive = (item.billsToReceive || 0);
      item.productsCosts = (item.productsCosts || 0);
      item.servicesCosts = (item.servicesCosts || 0);
      item.paymentsCosts = (item.paymentsCosts || 0);
      item.costs = (item.productsCosts + item.servicesCosts + item.paymentsCosts);
      item.revenue = ((item.cashier + item.billsToReceive) - item.billsToPay);
      item.grossProfit = (item.revenue - item.costs);

      balance.cashier += item.cashier;
      balance.billsToPay += item.billsToPay;
      balance.billsToReceive += item.billsToReceive;
      balance.productsCosts += item.productsCosts;
      balance.servicesCosts += item.servicesCosts;
      balance.paymentsCosts += item.paymentsCosts;
      balance.costs += item.costs;
      balance.revenue += item.revenue;
      balance.grossProfit += item.grossProfit;
    });

    const records: any = Object.values(obj);

    records.sort((a, b) => {
      return ((a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    });

    return { records, balance };
  }  

  private treatBillsToPay(data: IFinancialBillToPay[], settings: { type: string }) {

    const result: any = { records: [], balance: {} };

    if (settings.type == 'paidAccounts') {

      const records = [];
      const balance = { amountPaid: 0, accountValue: 0 };

      for (let item of data) {

        const obj: any = {};

        const isZero = item.installments.length == 0;

        obj.code = Utilities.prefixCode(item.code);
        obj.referenceCode = item.referenceCode;
        obj.beneficiary = item.beneficiary;
        obj.category = item.category;
        obj.registerDate = item.registerDate;
        obj.dischargeDate = isZero ? item.modifiedDate : item.installments[item.currentInstallment].dueDate;
        obj.installments = isZero ? "0 / 0" : (item.paidInstallments + ' / ' + item.totalInstallments);
        obj.discount = 0;
        obj.interest = 0;
        obj.amountPaid = item.paid;
        obj.accountValue = item.amount;

        balance.amountPaid += obj.amountPaid;
        balance.accountValue += obj.accountValue;

        records.push(obj);
      }

      result.records = records;
      result.balance = balance;
    }

    if (settings.type == 'pendingAccounts') {

      const records = [];
      const balance = { amountPaid: 0, pendingAmount: 0, accountValue: 0 };

      for (let item of data) {

        const obj: any = {};

        obj.code = Utilities.prefixCode(item.code);
        obj.referenceCode = item.referenceCode;
        obj.beneficiary = item.beneficiary;
        obj.category = item.category;
        obj.registerDate = item.registerDate;
        obj.dueDate = item.installments[item.currentInstallment].dueDate;
        obj.installmentsState = (item.paidInstallments + ' / ' + item.totalInstallments);
        obj.installmentValue = item.installments[item.currentInstallment].amount;
        obj.amountPaid = item.paid;
        obj.pendingAmount = (item.amount - item.paid);
        obj.accountValue = item.amount;

        balance.amountPaid += obj.amountPaid;
        balance.pendingAmount += obj.pendingAmount;
        balance.accountValue += obj.accountValue;

        records.push(obj);
      }

      result.records = records;
      result.balance = balance;
    }

    if (settings.type == 'overdueAccounts') {

      const records = [];
      const balance = { amountPaid: 0, pendingAmount: 0, accountValue: 0 };

      for (let item of data) {

        if (DateTime.getDate('D') > item.installments[item.currentInstallment].dueDate) {
          
          const obj: any = {};

          const isZero = item.installments.length == 0;

          obj.code = Utilities.prefixCode(item.code);
          obj.referenceCode = item.referenceCode;
          obj.beneficiary = item.beneficiary;
          obj.category = item.category;
          obj.registerDate = item.registerDate;
          obj.dueDate = item.installments[item.currentInstallment]?.dueDate;
          obj.installmentsState = isZero ? "0 / 0" : (item.paidInstallments + ' / ' + item.totalInstallments);
          obj.installmentValue = item.installments[item.currentInstallment]?.amount || 0;
          obj.amountPaid = item.paid;
          obj.pendingAmount = (item.amount - item.paid);
          obj.accountValue = item.amount;
  
          balance.amountPaid += obj.amountPaid;
          balance.pendingAmount += obj.pendingAmount;
          balance.accountValue += obj.accountValue;

          records.push(obj);
        }        
      }

      result.records = records;
      result.balance = balance;
    }

    if (settings.type == 'canceledAccounts') {

      const records = [];
      const balance = { amountPaid: 0, pendingAmount: 0, accountValue: 0 };

      for (let item of data) {
          
        const obj: any = {};


        const isZero = item.installments.length == 0;

        obj.code = Utilities.prefixCode(item.code);
        obj.referenceCode = item.referenceCode;
        obj.beneficiary = item.beneficiary;
        obj.category = item.category;
        obj.registerDate = item.registerDate;
        obj.dueDate = item.installments[item.currentInstallment]?.dueDate;
        obj.installmentsState = isZero ? "0 / 0" : (item.paidInstallments + ' / ' + item.totalInstallments);
        obj.installmentValue = item.installments[item.currentInstallment]?.amount || 0;
        obj.amountPaid = item.paid;
        obj.pendingAmount = (item.amount - item.paid);
        obj.accountValue = item.amount;

        balance.amountPaid += obj.amountPaid;
        balance.pendingAmount += obj.pendingAmount;
        balance.accountValue += obj.accountValue;

        records.push(obj);
      }

      result.records = records;
      result.balance = balance;
    }

    return result;
  }

  private treatBillsToReceive(data: IFinancialBillToReceive[], settings: { type: string }) {

    const result: any = { records: [], balance: {} };

    if (settings.type == 'receivedAccounts') {

      const records = [];
      const balance = { amountReceived: 0, accountValue: 0 };

      for (let item of data) {

        const obj: any = {};

        obj.code = Utilities.prefixCode(item.code);
        obj.referenceCode = item.referenceCode;
        obj.debtor = item.debtor;
        obj.category = item.category;
        obj.registerDate = item.registerDate;
        obj.dischargeDate = item.installments[item.currentInstallment]?.receiptDate;
        obj.installments = (item.receivedInstallments + ' / ' + item.totalInstallments);
        obj.discount = 0;
        obj.interest = 0;
        obj.amountReceived = item.received;
        obj.accountValue = item.amount;

        balance.amountReceived += obj.amountReceived;
        balance.accountValue += obj.accountValue;

        records.push(obj);
      }

      result.records = records;
      result.balance = balance;
    }

    if (settings.type == 'pendingAccounts') {

      const records = [];
      const balance = { amountReceived: 0, pendingAmount: 0, accountValue: 0 };

      for (let item of data) {

        const obj: any = {};

        obj.code = Utilities.prefixCode(item.code);
        obj.referenceCode = item.referenceCode;
        obj.debtor = item.debtor;
        obj.category = item.category;
        obj.registerDate = item.registerDate;
        obj.dueDate = item.installments[item.currentInstallment]?.dueDate;
        obj.installmentsState = (item.receivedInstallments + ' / ' + item.totalInstallments);
        obj.installmentValue = item.installments[item.currentInstallment]?.amount;
        obj.amountReceived = item.received;
        obj.pendingAmount = (item.amount - item.received);
        obj.accountValue = item.amount;

        balance.amountReceived += obj.amountReceived;
        balance.pendingAmount += obj.pendingAmount;
        balance.accountValue += obj.accountValue;

        records.push(obj);
      }

      result.records = records;
      result.balance = balance;
    }

    if (settings.type == 'overdueAccounts') {

      const records = [];
      const balance = { amountReceived: 0, pendingAmount: 0, accountValue: 0 };

      for (let item of data) {

        if (DateTime.getDate('D') > item.installments[item.currentInstallment].dueDate) {
          
          const obj: any = {};

          obj.code = Utilities.prefixCode(item.code);
          obj.referenceCode = item.referenceCode;
          obj.debtor = item.debtor;
          obj.category = item.category;
          obj.registerDate = item.registerDate;
          obj.dueDate = item.installments[item.currentInstallment]?.dueDate;
          obj.installmentsState = (item.receivedInstallments + ' / ' + item.totalInstallments);
          obj.installmentValue = item.installments[item.currentInstallment]?.amount;
          obj.amountReceived = item.received;
          obj.pendingAmount = (item.amount - item.received);
          obj.accountValue = item.amount;
  
          balance.amountReceived += obj.amountReceived;
          balance.pendingAmount += obj.pendingAmount;
          balance.accountValue += obj.accountValue;

          records.push(obj);
        }        
      }

      result.records = records;
      result.balance = balance;
    }

    if (settings.type == 'canceledAccounts') {

      const records = [];
      const balance = { amountReceived: 0, pendingAmount: 0, accountValue: 0 };

      for (let item of data) {
          
        const obj: any = {};

        obj.code = Utilities.prefixCode(item.code);
        obj.referenceCode = item.referenceCode;
        obj.debtor = item.debtor;
        obj.category = item.category;
        obj.registerDate = item.registerDate;
        obj.dueDate = item.installments[item.currentInstallment]?.dueDate;
        obj.installmentsState = (item.receivedInstallments + ' / ' + item.totalInstallments);
        obj.installmentValue = item.installments[item.currentInstallment]?.amount;
        obj.amountReceived = item.received;
        obj.pendingAmount = (item.amount - item.received);
        obj.accountValue = item.amount;

        balance.amountReceived += obj.amountReceived;
        balance.pendingAmount += obj.pendingAmount;
        balance.accountValue += obj.accountValue;

        records.push(obj);
      }

      result.records = records;
      result.balance = balance;
    }

    return result;
  }

  private treatBankTransactions(data: any[], setting: any) {

    const arrData = (!setting ? data : []);

    const obj = {
      balance: {
        total: 0
      },
      records: []
    }

    arrData.forEach((item)=>{
      item.date = item.registerDate;
      item.code = Utilities.prefixCode(item.code);
      obj.balance.total += item.type == "DEPOSIT" ? item.value : (item.value * -1);
      obj.records.push(item);
      // delete item.registerDate;
    });
    
    obj.records.sort((a, b) => {
      return ((a.code < b.code) ? -1 : ((a.code > b.code) ? 1 : 0));
    });
    
    return obj;
  }

}