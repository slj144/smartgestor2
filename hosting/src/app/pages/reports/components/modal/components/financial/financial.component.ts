import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';

// Services
import { FinancialReportsService } from './financial.service';

// Translate
import { ReportsFinancesTranslate } from './financial.translate';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { DateTime } from '@shared/utilities/dateTime';
import { BillsToPayCategoriesService } from '@pages/registers/_aggregates/financial/bills-to-pay-categories/bills-to-pay-categories.service';
import { BillsToReceiveCategoriesService } from '@pages/registers/_aggregates/financial/bills-to-receive-categories/bills-to-receive-categories.service';

@Component({
  selector: 'financial-report',
  templateUrl: './financial.component.html',
  styleUrls: ['./financial.component.scss']
})
export class FinancialReportsComponent implements OnInit {  

  @Input() settings: any = {};
  @Output() callback: EventEmitter<any> = new EventEmitter();

  public translate = ReportsFinancesTranslate.get();

  public loading: boolean = true; 
  public typeActived: string = '';

  public formFilters: FormGroup;
  public formControls: any;

  public billsToPayCategories: any[] = [];
  public billsToReceiveCategories: any[] = [];

  public isMatrix = Utilities.isMatrix;

  private layerComponent: any; 

  constructor(
    private formBuilder: FormBuilder,
    private financialReportsService: FinancialReportsService,
    private billsToPayCategoriesService: BillsToPayCategoriesService,
    private billsToReceiveCategoriesService: BillsToReceiveCategoriesService,
  ) {}

  public ngOnInit() {
    this.callback.emit({ instance: this });
  }
  
  // Initialize Method

  public bootstrap() {

    this.onGetBillsToPayCategories();
    this.onGetBillsToReceiveCategories();

    if (this.settings.model.id == 'cashFlow') {

      const translate = this.translate.cashFlow;

      this.settings.model.filter = {
        weekly: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterWeek"),
        monthly: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterMonth"),
        lastMonth: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterLastMonth"),
        custom: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterPersonalized")
      };

      this.settings['fields'] = {
        default: [
          { label: translate.fields['default'].cashierResult.external, field: 'cashierResult', disabled: this.checkPermissions('default', 'cashierResult') },
          { label: translate.fields['default'].servicesOrdersResults.external, field: 'servicesOrdersResults', disabled: this.checkPermissions('default', 'servicesOrdersResults') },
          { label: translate.fields['default'].billsToReceiveResult.external, field: 'billsToReceiveResult', disabled: this.checkPermissions('default', 'billsToReceiveResult') },
          { label: translate.fields['default'].billsToPayResult.external, field: 'billsToPayResult', disabled: this.checkPermissions('default', 'billsToPayResult') },
          { label: translate.fields['default'].costs.external, field: 'costs', sub: [
            { field: 'products', disabled: false },
            { field: 'services', disabled: false },
            { field: 'payments', disabled: false },
            { field: 'total', disabled: false }
          ], disabled: this.checkPermissions('default', 'costs') },
          { label: translate.fields['default'].billing.external, field: 'billing', disabled: this.checkPermissions('default', 'billing') },
          { label: translate.fields['default'].grossProfit.external, field: 'grossProfit', disabled: this.checkPermissions('default', 'grossProfit') }
        ]
      };
    }

    if (this.settings.model.id == 'billsToPay') {

      const translate = this.translate.billsToPay;

      this.settings['types'] = [
        { id: 'paidAccounts', label: translate.types.paidAccounts },
        { id: 'pendingAccounts', label: translate.types.pendingAccounts },
        { id: 'overdueAccounts', label: translate.types.overdueAccounts },
        { id: 'canceledAccounts', label: translate.types.canceledAccounts }
      ];

      this.settings.model.filter = {
        weekly: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterWeek"),
        monthly: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterMonth"),
        lastMonth: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterLastMonth"),
        custom: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterPersonalized")
      };

      this.settings['fields'] = {
        paidAccounts: [
          { label: translate.fields['paidAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('paidAccounts', 'referenceCode') },
          { label: translate.fields['paidAccounts'].beneficiary.external, field: 'beneficiary', disabled: this.checkPermissions('paidAccounts', 'beneficiary') },
          { label: translate.fields['paidAccounts'].category.external, field: 'category', disabled: this.checkPermissions('paidAccounts', 'category') },
          { label: translate.fields['paidAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('paidAccounts', 'registerDate') },
          { label: translate.fields['paidAccounts'].dischargeDate.external, field: 'dischargeDate', disabled: this.checkPermissions('paidAccounts', 'dischargeDate') },
          { label: translate.fields['paidAccounts'].installments.external, field: 'installments', disabled: this.checkPermissions('paidAccounts', 'installments') },
          { label: translate.fields['paidAccounts'].discount.external, field: 'discount', disabled: this.checkPermissions('paidAccounts', 'discount') },
          { label: translate.fields['paidAccounts'].interest.external, field: 'interest', disabled: this.checkPermissions('paidAccounts', 'interest') },
          { label: translate.fields['paidAccounts'].amountPaid.external, field: 'amountPaid', disabled: this.checkPermissions('paidAccounts', 'amountPaid') },
          { label: translate.fields['paidAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('paidAccounts', 'accountValue') }
        ],
        pendingAccounts: [
          { label: translate.fields['pendingAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('pendingAccounts', 'referenceCode') },
          { label: translate.fields['pendingAccounts'].beneficiary.external, field: 'beneficiary', disabled: this.checkPermissions('pendingAccounts', 'beneficiary') },
          { label: translate.fields['pendingAccounts'].category.external, field: 'category', disabled: this.checkPermissions('pendingAccounts', 'category') },
          { label: translate.fields['pendingAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('pendingAccounts', 'registerDate') },
          { label: translate.fields['pendingAccounts'].dueDate.external, field: 'dueDate', disabled: this.checkPermissions('pendingAccounts', 'dueDate') },
          { label: translate.fields['pendingAccounts'].installmentsState.external, field: 'installmentsState', disabled: this.checkPermissions('pendingAccounts', 'installmentsState') },
          { label: translate.fields['pendingAccounts'].installmentValue.external, field: 'installmentValue', disabled: this.checkPermissions('pendingAccounts', 'installmentValue') },
          { label: translate.fields['pendingAccounts'].amountPaid.external, field: 'amountPaid', disabled: this.checkPermissions('pendingAccounts', 'amountPaid') },
          { label: translate.fields['pendingAccounts'].pendingAmount.external, field: 'pendingAmount', disabled: this.checkPermissions('pendingAccounts', 'pendingAmount') },
          { label: translate.fields['pendingAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('pendingAccounts', 'accountValue') }
        ],
        overdueAccounts: [
          { label: translate.fields['overdueAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('overdueAccounts', 'referenceCode') },
          { label: translate.fields['overdueAccounts'].beneficiary.external, field: 'beneficiary', disabled: this.checkPermissions('overdueAccounts', 'beneficiary') },
          { label: translate.fields['overdueAccounts'].category.external, field: 'category', disabled: this.checkPermissions('overdueAccounts', 'category') },
          { label: translate.fields['overdueAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('overdueAccounts', 'registerDate') },
          { label: translate.fields['overdueAccounts'].dueDate.external, field: 'dueDate', disabled: this.checkPermissions('overdueAccounts', 'dueDate') },
          { label: translate.fields['overdueAccounts'].installmentsState.external, field: 'installmentsState', disabled: this.checkPermissions('overdueAccounts', 'installmentsState') },
          { label: translate.fields['overdueAccounts'].installmentValue.external, field: 'installmentValue', disabled: this.checkPermissions('overdueAccounts', 'installmentValue') },
          { label: translate.fields['overdueAccounts'].amountPaid.external, field: 'amountPaid', disabled: this.checkPermissions('overdueAccounts', 'amountPaid') },
          { label: translate.fields['overdueAccounts'].pendingAmount.external, field: 'pendingAmount', disabled: this.checkPermissions('overdueAccounts', 'pendingAmount') },
          { label: translate.fields['overdueAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('overdueAccounts', 'accountValue') }
        ],
        canceledAccounts: [
          { label: translate.fields['canceledAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('canceledAccounts', 'referenceCode') },
          { label: translate.fields['canceledAccounts'].beneficiary.external, field: 'beneficiary', disabled: this.checkPermissions('canceledAccounts', 'beneficiary') },
          { label: translate.fields['canceledAccounts'].category.external, field: 'category', disabled: this.checkPermissions('canceledAccounts', 'category') },
          { label: translate.fields['canceledAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('canceledAccounts', 'registerDate') },
          { label: translate.fields['canceledAccounts'].dueDate.external, field: 'dueDate', disabled: this.checkPermissions('canceledAccounts', 'dueDate') },
          { label: translate.fields['canceledAccounts'].installmentsState.external, field: 'installmentsState', disabled: this.checkPermissions('canceledAccounts', 'installmentsState') },
          { label: translate.fields['canceledAccounts'].installmentValue.external, field: 'installmentValue', disabled: this.checkPermissions('canceledAccounts', 'installmentValue') },
          { label: translate.fields['canceledAccounts'].amountPaid.external, field: 'amountPaid', disabled: this.checkPermissions('canceledAccounts', 'amountPaid') },
          { label: translate.fields['canceledAccounts'].pendingAmount.external, field: 'pendingAmount', disabled: this.checkPermissions('canceledAccounts', 'pendingAmount') },
          { label: translate.fields['canceledAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('canceledAccounts', 'accountValue') }
        ]
      };
    }

    if (this.settings.model.id == 'billsToReceive') {

      const translate = this.translate.billsToReceive;

      this.settings['types'] = [
        { id: 'receivedAccounts', label: translate.types.receivedAccounts },
        { id: 'pendingAccounts', label: translate.types.pendingAccounts },
        { id: 'overdueAccounts', label: translate.types.overdueAccounts },
        { id: 'canceledAccounts', label: translate.types.canceledAccounts }
      ];

      this.settings.model.filter = {
        weekly: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterWeek"),
        monthly: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterMonth"),
        lastMonth: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterLastMonth"),
        custom: Utilities.isAdmin ? true : !!this.checkPermissions(this.settings['types'][0].id, null, "filterPersonalized")
      };

      this.settings['fields'] = {
        receivedAccounts: [
          { label: translate.fields['receivedAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('receivedAccounts', 'referenceCode') },
          { label: translate.fields['receivedAccounts'].debtor.external, field: 'debtor', disabled: this.checkPermissions('receivedAccounts', 'debtor') },
          { label: translate.fields['receivedAccounts'].category.external, field: 'category', disabled: this.checkPermissions('receivedAccounts', 'category') },
          { label: translate.fields['receivedAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('receivedAccounts', 'registerDate') },
          { label: translate.fields['receivedAccounts'].dischargeDate.external, field: 'dischargeDate', disabled: this.checkPermissions('receivedAccounts', 'dischargeDate') },
          { label: translate.fields['receivedAccounts'].installments.external, field: 'installments', disabled: this.checkPermissions('receivedAccounts', 'installments') },
          { label: translate.fields['receivedAccounts'].discount.external, field: 'discount', disabled: this.checkPermissions('receivedAccounts', 'discount') },
          { label: translate.fields['receivedAccounts'].interest.external, field: 'interest', disabled: this.checkPermissions('receivedAccounts', 'interest') },
          { label: translate.fields['receivedAccounts'].amountReceived.external, field: 'amountReceived', disabled: this.checkPermissions('receivedAccounts', 'amountReceived') },
          { label: translate.fields['receivedAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('receivedAccounts', 'accountValue') }
        ],
        pendingAccounts: [
          { label: translate.fields['pendingAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('pendingAccounts', 'referenceCode') },
          { label: translate.fields['pendingAccounts'].debtor.external, field: 'debtor', disabled: this.checkPermissions('pendingAccounts', 'debtor') },
          { label: translate.fields['pendingAccounts'].category.external, field: 'category', disabled: this.checkPermissions('pendingAccounts', 'category') },
          { label: translate.fields['pendingAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('pendingAccounts', 'registerDate') },
          { label: translate.fields['pendingAccounts'].dueDate.external, field: 'dueDate', disabled: this.checkPermissions('pendingAccounts', 'dueDate') },
          { label: translate.fields['pendingAccounts'].installmentsState.external, field: 'installmentsState', disabled: this.checkPermissions('pendingAccounts', 'installmentsState') },
          { label: translate.fields['pendingAccounts'].installmentValue.external, field: 'installmentValue', disabled: this.checkPermissions('pendingAccounts', 'installmentValue') },
          { label: translate.fields['pendingAccounts'].amountReceived.external, field: 'amountReceived', disabled: this.checkPermissions('pendingAccounts', 'amountReceived') },
          { label: translate.fields['pendingAccounts'].pendingAmount.external, field: 'pendingAmount', disabled: this.checkPermissions('pendingAccounts', 'pendingAmount') },
          { label: translate.fields['pendingAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('pendingAccounts', 'accountValue') }
        ],
        overdueAccounts: [
          { label: translate.fields['overdueAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('overdueAccounts', 'referenceCode') },
          { label: translate.fields['overdueAccounts'].debtor.external, field: 'debtor', disabled: this.checkPermissions('overdueAccounts', 'debtor') },
          { label: translate.fields['overdueAccounts'].category.external, field: 'category', disabled: this.checkPermissions('overdueAccounts', 'category') },
          { label: translate.fields['overdueAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('overdueAccounts', 'registerDate') },
          { label: translate.fields['overdueAccounts'].dueDate.external, field: 'dueDate', disabled: this.checkPermissions('overdueAccounts', 'dueDate') },
          { label: translate.fields['overdueAccounts'].installmentsState.external, field: 'installmentsState', disabled: this.checkPermissions('overdueAccounts', 'installmentsState') },
          { label: translate.fields['overdueAccounts'].installmentValue.external, field: 'installmentValue', disabled: this.checkPermissions('overdueAccounts', 'installmentValue') },
          { label: translate.fields['overdueAccounts'].amountReceived.external, field: 'amountReceived', disabled: this.checkPermissions('overdueAccounts', 'amountReceived') },
          { label: translate.fields['overdueAccounts'].pendingAmount.external, field: 'pendingAmount', disabled: this.checkPermissions('overdueAccounts', 'pendingAmount') },
          { label: translate.fields['overdueAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('overdueAccounts', 'accountValue') }
        ],
        canceledAccounts: [
          { label: translate.fields['canceledAccounts'].referenceCode.external, field: 'referenceCode', disabled: this.checkPermissions('canceledAccounts', 'referenceCode') },
          { label: translate.fields['canceledAccounts'].debtor.external, field: 'debtor', disabled: this.checkPermissions('canceledAccounts', 'debtor') },
          { label: translate.fields['canceledAccounts'].category.external, field: 'category', disabled: this.checkPermissions('canceledAccounts', 'category') },
          { label: translate.fields['canceledAccounts'].registerDate.external, field: 'registerDate', disabled: this.checkPermissions('canceledAccounts', 'registerDate') },
          { label: translate.fields['canceledAccounts'].dueDate.external, field: 'dueDate', disabled: this.checkPermissions('canceledAccounts', 'dueDate') },
          { label: translate.fields['canceledAccounts'].installmentsState.external, field: 'installmentsState', disabled: this.checkPermissions('canceledAccounts', 'installmentsState') },
          { label: translate.fields['canceledAccounts'].installmentValue.external, field: 'installmentValue', disabled: this.checkPermissions('canceledAccounts', 'installmentValue') },
          { label: translate.fields['canceledAccounts'].amountReceived.external, field: 'amountReceived', disabled: this.checkPermissions('canceledAccounts', 'amountReceived') },
          { label: translate.fields['canceledAccounts'].pendingAmount.external, field: 'pendingAmount', disabled: this.checkPermissions('canceledAccounts', 'pendingAmount') },
          { label: translate.fields['canceledAccounts'].accountValue.external, field: 'accountValue', disabled: this.checkPermissions('canceledAccounts', 'accountValue') }
        ]
      };
    }

    if (this.settings.model.id == 'bankTransactions') {

      this.settings.model.filter = {
        weekly: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterWeek"),
        monthly: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterMonth"),
        lastMonth: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterLastMonth"),
        custom: Utilities.isAdmin ? true : !!this.checkPermissions('default', null, "filterPersonalized")
      };

      this.settings['fields'] = {
        default: [

        ]
      };
    }  

    this.formSettings();

    setTimeout(() => { this.loading = false }, 1000);
  } 

  // User Interface Actions  
  
  public onTypesChange(id: string) {
    
    this.settings.model.filter = {
      weekly: Utilities.isAdmin ? true : !!this.checkPermissions(id, null, "filterWeek"),
      monthly: Utilities.isAdmin ? true : !!this.checkPermissions(id, null, "filterMonth"),
      lastMonth: Utilities.isAdmin ? true : !!this.checkPermissions(id, null, "filterLastMonth"),
      custom: Utilities.isAdmin ? true : !!this.checkPermissions(id, null, "filterPersonalized")
    };

    this.typeActived = id;
    this.toggleFields();
  }

  public onGenerateReport() {
    
    this.loading = true;

    const model = this.settings.model;
    const filter = this.captureFilters();

    this.settings.model.download = Utilities.isAdmin ? true : !!this.checkPermissions(this.typeActived, null, "downloadReport");

    if (model.id == 'cashFlow') {

      this.financialReportsService.getCashFlow({
        data: {
          period: {
            start: filter.period.start,
            end: filter.period.end
          },
          store: {
            id: filter.store._id
          }
        }
      }).then((data) => {
        this.launchReport('Fluxo de Caixa', model, filter, data);
      });
    }

    if (model.id == 'billsToPay') {

      if(filter.filterDateType == "installments.dueDate"){
        filter.period.start = filter.period.start.split(" ")[0];
        filter.period.end = filter.period.end.split(" ")[0];
      }

      const where: any[] =  [
        { field: filter.filterDateType || 'modifiedDate', operator: '>=', value: filter.period.start },
        { field: filter.filterDateType || 'modifiedDate', operator: '<=', value: filter.period.end },
        { field: 'owner', operator: '=', value: filter.store._id }
      ];

      if (filter.billCategory){
        where.push(filter.billCategory);
      }

      // console.log(where);

      this.financialReportsService.getBillsToPay({        
        where: where,
        orderBy: { code: 1 },
        data: { type: this.typeActived }
      }).then((data) => {
        this.launchReport('Contas à Pagar', model, filter, data);
      });
    }

    if (model.id == 'billsToReceive') {

      if(filter.filterDateType == "installments.dueDate"){
        filter.period.start = filter.period.start.split(" ")[0];
        filter.period.end = filter.period.end.split(" ")[0];
      }

      const where: any[] = [
        { field: filter.filterDateType || 'registerDate', operator: '>=', value: filter.period.start },
        { field: filter.filterDateType || 'registerDate', operator: '<=', value: filter.period.end },
        { field: 'owner', operator: '=', value: filter.store._id }
      ];

      if(filter.billCategory){
        where.push(filter.billCategory);
      }

      // console.log(where);

      this.financialReportsService.getBillsToReceive({     
        where: where,
        orderBy: { code: 1 },
        data: { type: this.typeActived }
      }).then((data) => {
        this.launchReport('Contas à Receber', model, filter, data);
      });
    }

    if (model.id == 'bankTransactions') {

      this.financialReportsService.getBankTransactions({     
        where: [
          { field: 'registerDate', operator: '>=', value: filter.period.start },
          { field: 'registerDate', operator: '<=', value: filter.period.end },
          { field: 'owner', operator: '=', value: filter.store._id }
        ],
        orderBy: { code: 1 },
        data: { type: this.typeActived }
      }).then((data) => {
        this.launchReport('Transações Bancárias', model, filter, data);
      });
    }

  }

  // Event Listeners

  public onLayerResponse(event: any) {

    if (event.instance) {
      this.layerComponent = event.instance;
    }   
  }

  // Setting Methods

  private formSettings() {

    this.typeActived = '';

    this.formFilters = this.formBuilder.group({
      store: [Utilities.storeID],
      period: ['today'],
      startDate: [`${DateTime.getCurrentYear()}-${DateTime.getCurrentMonth()}-01`],
      endDate: [`${DateTime.getCurrentYear()}-${DateTime.getCurrentMonth()}-${DateTime.getCurrentDay()}`],
      fields: this.formBuilder.array([]),
      billCategory: ["##all##"],
      filterDateType: ["registerDate"]
    });
    
    if (this.settings.types) {
      this.typeActived = this.settings.types[0].id;
      this.formFilters.addControl('types', new FormControl(this.settings.types[0].id, Validators.required));
    }
    
    if (this.typeActived == '' && this.settings.fields['default']) {
      this.typeActived = 'default';
    }

    this.formControls = this.formFilters.controls;

    this.toggleFields();
  }

  public onGetBillsToPayCategories(){
    const timer = setInterval(() => {
      if (this.formFilters) {

        clearInterval(timer);

        this.billsToPayCategoriesService.getCategories("FinancialReportsComponent", (res)=>{
          this.billsToPayCategoriesService.removeListeners("records", 'FinancialReportsComponent');
          this.billsToPayCategories = res;
          this.formFilters.get("billCategory").setValue("##all##");
        });
      }
    });
  }

  public onGetBillsToReceiveCategories(){
    const timer = setInterval(() => {
      if (this.formFilters) {

        clearInterval(timer);

        this.billsToReceiveCategoriesService.getCategories("FinancialReportsComponent", (res)=>{
          this.billsToReceiveCategoriesService.removeListeners("records", 'FinancialReportsComponent');
          this.billsToReceiveCategories = res;
          this.formFilters.get("billCategory").setValue("##all##");
        });
      }
    });
  }

  // Utility Methods

  private checkPermissions(type: string, field: string, action = null) {

    if (!action) {
      return (this.settings.permissions && this.settings.permissions[type] ? (this.settings.permissions[type].fields.indexOf(field) == -1) : false);
    } else {
      return (this.settings.permissions && this.settings.permissions[type] && this.settings.permissions[type].actions ? (this.settings.permissions[type].actions.indexOf(action) == -1) : false);
    }
  }

  private launchReport(title: string, model: any, filter: any, data: any) {

    this.layerComponent.onOpen({
      id: model.id,
      title: title,
      store: filter.store,
      download: this.settings.model.download,
      period: {
        start: filter.period.start,
        end: filter.period.end
      },
      type: this.typeActived,
      fields: filter.fields,
      data: data,
      date: DateTime.formatDate(DateTime.getDateObject().toISOString(), 'string')
    });

    setTimeout(() => this.loading = false, 500);
  }

  private captureFilters() {

    const filter = this.formFilters.value;

    filter.store = (() => {
    
      const store = (this.isMatrix ? filter.store : Utilities.storeID);

      for (const item of this.settings.stores) {
        if (item._id == store) {
          return item;
        }
      }
    })();

    filter.period = (() => {

      let period: any = {};
      let startDate: string = '';
      let endDate: string = '';

      if (filter.period == 'today') {
        startDate = DateTime.getDate('D');
        endDate = DateTime.getDate('D');
      }
      else if (filter.period == 'currentWeek') {
        startDate = DateTime.formatDate(DateTime.getStartWeek(new Date(DateTime.getDate())).toISOString()).date;
        endDate = DateTime.formatDate(DateTime.getEndWeek(new Date(DateTime.getDate())).toISOString()).date;
      }
      else if (filter.period == 'currentMonth') {
        startDate = `${DateTime.getCurrentYear()}-${DateTime.getCurrentMonth()}-01`;
        endDate = `${DateTime.getCurrentYear()}-${DateTime.getCurrentMonth()}-${DateTime.getCurrentDay()}`;
      }
      else if (filter.period == 'lastMonth') {

        let year = DateTime.getCurrentYear();
        let month = DateTime.getCurrentMonth();
        
        if (month == 1) {
          month = 12;
          year -= 1;
        }else{
          month = (parseInt(month.toString()) - 1) > 9 ? (parseInt(month.toString()) - 1) : `0${(parseInt(month.toString()) - 1)}`;
        }

        let lastDayOfMonth = (new Date(year, (<number>month), 0)).getDate();

        startDate = `${year}-${month}-01`;
        endDate = `${year}-${month}-${lastDayOfMonth}`;
      }

      period.start = (() => {
        const date = (filter.period == 'custom' ? filter.startDate : startDate);
        return DateTime.formatDate(date instanceof Date ? (<Date>date).toISOString() : date).date + ' 00:00:00';
      })();

      period.end = (() => {
        const date = (filter.period == 'custom' ? filter.endDate : endDate);
        return DateTime.formatDate(date instanceof Date ? (<Date>date).toISOString() : date).date + ' 23:59:59';
      })();

      delete filter.startDate;
      delete filter.endDate;

      return period;
    })();
    
    filter.fields = (() => {

      const arr = [];

      for (const i in filter.fields) {

        if (filter.fields[i]) {

          arr.push(this.settings.fields[this.typeActived][i].field);

          $$(this.settings.fields[this.typeActived][i].sub).map((_, item) => {
            if (!item.disabled) {
              arr.push(`${this.settings.fields[this.typeActived][i].field}/${item.field}`);
            }              
          });          
        }
      }

      return arr;
    })();

    if(filter.billCategory != "##all##"){
      const billCategory = filter.billCategory["0"] == "@" ? filter.billCategory : Utilities.prefixCode(parseInt(filter.billCategory));
      filter.billCategory = {field: "category.code", operator: "=", value: billCategory};
      // filter.billCategory.category = billCategory;
    }else{
      delete filter.billCategory;
    }

    if(this.typeActived == 'pendingAccounts' || this.typeActived == 'overdueAccounts'){
      if(filter.filterDateType == "registerDate"){
        filter.filterDateType = "registerDate";
      }
  
      if(filter.filterDateType == "expireDate"){
        filter.filterDateType = "installments.dueDate";
      }
    }else{
      delete filter.filterDateType;
    }
  

    // console.log(filter);

    // 

    return filter;
  }

  private toggleFields() {

    (this.formControls.fields as FormArray).clear();

    if (this.settings.fields && this.settings.fields[this.typeActived]) {

      let fields = [];

      for (const field of this.settings.fields[this.typeActived]) {

        if (!field.disabled) { 
          (this.formControls.fields as FormArray).push(new FormControl(field.value || true));
          fields.push(field);
        }
      }

      this.settings.fields[this.typeActived] = fields;
    }    
  }

}
