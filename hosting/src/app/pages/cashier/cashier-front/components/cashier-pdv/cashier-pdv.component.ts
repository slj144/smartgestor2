/*
  📁 ARQUIVO: cashier-pdv.component.ts
  📂 LOCALIZAÇÃO: src/app/pages/cashier/cashier-front/components/cashier-pdv/
  🎯 FUNÇÃO: Componente TypeScript do PDV - Contém toda a lógica de negócio do ponto de venda
  ✨ MODIFICAÇÕES: 
     1. Adicionado campo warranty no data e no resetPanel
     2. Adicionado warranty no método composeData
     3. Adicionado método setWarranty para botões de sugestão
*/

import { Component, OnInit, OnDestroy, Output, Input } from '@angular/core';

// Components
import { ProductsSelectorComponent } from '../../../../stock/products/components/selector/selector.component';
import { PaymentMethodsSelectorComponent } from '../../../../registers/paymentMethods/components/selector/selector.component';
import { CashierFrontReceiptsComponent } from '../cashier-receipts/cashier-receipts.component';

// Services
import { CashierFrontPDVService } from './cashier-pdv.service';
import { ScannerService } from '@shared/services/scanner.service';
import { DataBridgeService } from '@shared/services/data-bridge.service';

// Translate
import { CashierFrontPDVTranslate } from './cashier-pdv.translate';

// Interfaces
import { ICashierSale, ECashierSaleStatus, ECashierSaleOrigin } from '@shared/interfaces/ICashierSale';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { FieldMask } from '@shared/utilities/fieldMask';
import { NotificationService } from '@shared/services/notification.service';
import { ENotificationStatus } from '@shared/interfaces/ISystemNotification';

import onScan from 'onscan.js';

@Component({
  selector: 'cashier-front-pdv',
  templateUrl: './cashier-pdv.component.html',
  styleUrls: ['./cashier-pdv.component.scss']
})
export class CashierFrontPDVComponent implements OnInit, OnDestroy {

  public static shared: CashierFrontPDVComponent;

  @Input() permissions;

  public translate = CashierFrontPDVTranslate.get();

  public loading: boolean = true;
  public data: any = {};
  public source: any = {};
  public settings: any = {};
  public loadingProducts: boolean = true;
  public sending: boolean = false;
  public saleCompleted: boolean = false;

  public isAdmin: boolean = Utilities.isAdmin;

  private layerComponent: any;

  constructor(
    private cashierFrontPDVService: CashierFrontPDVService,
    private dataBridgeService: DataBridgeService,
    private scannerService: ScannerService,
    private notificationService: NotificationService,
  ) {
    CashierFrontPDVComponent.shared = this;
  }

  public ngOnInit() {

    // setTimeout(()=>{
    //   //  onScan.simulate(document, "00112024");
    //   //  onScan.simulate(document, "00052024");
    //   //  onScan.simulate(document, "00052024");
    // }, 1000);

    if (this.dataBridgeService.getData('ServiceOrder')) {

      const code: number = (<any>this.dataBridgeService.getData('ServiceOrder')).saleCode;

      if (code) {

        this.cashierFrontPDVService.getSale(code).then((data) => {
          if (data) {
            this.onOpenSale(data);
          }
        });
      }
    }

    this.scannerSettings();
    this.generateBalance();
  }

  // Getter and Setter Methods

  public get companyProfile() {
    return Utilities.companyProfile;
  }

  // User Interface Action - Common

  public onApplyPrice(data: any, inputField: any, type: string) {

    const value = FieldMask.priceFieldMask(inputField.value);

    if (type == 'product') {
      data.unitaryPrice = (parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0);
      inputField.value = value;
    }

    if (type == 'service') {
      data.customPrice = (parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0);
      inputField.value = value;
    }

    this.generateBalance();
  }

  // User Interface Actions - Sales

  public onOpenSale(data: ICashierSale) {

    this.onResetPanel();

    this.data = Utilities.deepClone(data);
    this.source = Utilities.deepClone(data);

    if (this.data?.products?.length > 0) {
      ProductsSelectorComponent.shared.selectProducts(data.products);
    }

    if (this.data?.service?.types?.length > 0) {
      for (const item of (<any[]>this.data.service.types)) {
        item.customPrice = item.executionPrice;
      }
    }

    if (this.data?.paymentMethods?.length > 0) {
      PaymentMethodsSelectorComponent.shared.selectMethods(this.data.paymentMethods);
    }

    if (this.data.balance) {
      delete this.data.balance;
    }

    this.generateBalance();
  }

  // User Interface Actions - Products

  public onQuickSearch(input: any) {

    let value = $$(input).val();

    if (value != '') {

      Utilities.loading();

      const isCode = value.length < 8;
      const isAutoBarcode = value.length >= 8 && value.length < 13;

      if (isAutoBarcode) {
        value = value.substring(0, value.length - 4);
      }

      ProductsSelectorComponent.shared.onSearch({
        where: [
          { field: isAutoBarcode || isCode ? 'code' : 'barcode', operator: '=', value: isAutoBarcode || isCode ? parseInt(value) : value }
        ]
      }, true).then(() => {
        $$('.container-products .quick-search input').val('');
        Utilities.loading(false);
      });
    }
  }

  public onDeleteProductItem(index: number) {

    ProductsSelectorComponent.shared.onDeselectProduct(this.data.products[index]);
    this.data.products.splice(index, 1);

    this.generateBalance();
  }

  public onApplyQuantity(data: any, inputField: any) {

    const value = inputField.value;
    const quantity = FieldMask.numberFieldMask(value, 1, data.quantity);

    inputField.value = quantity;
    data.selectedItems = quantity;

    this.generateBalance();
  }

  public onApplyQuantityCorretion(data: any, inputField: any) {

    if (inputField.value == '') {

      inputField.value = 1;
      data.selectedItems = 1;

      this.generateBalance();
    }
  }

  // User Interface Actions - Payment Methods

  public onDeletePaymentItem(index: number) {
    PaymentMethodsSelectorComponent.shared.deselectMethod(this.data.paymentMethods[index]);
    this.checkPayment();
  }

  public onPaymentValue(data: any, inputField: any) {

    inputField.value = FieldMask.priceFieldMask(inputField.value);
    data.value = parseFloat(inputField.value != '' ? inputField.value.replace(/\./g, '').replace(',', '.') : 0);

    this.checkPayment();
  }

  public onPaymentParcel(data: any, selectField: any) {

    const parcel = selectField.value;

    for (const item of data.fees) {

      if (item.hasOwnProperty('selected')) {
        delete item.selected;
      }

      if (item.parcel == parcel) {
        item.selected = true;
      }
    }
  }

  public onPaymentNote(data: any, inputField: any) {

    const note = String(inputField.value).trim();

    if (note != '') {
      data.note = note;
    }

    if (data.note && note == '') {
      delete data.note;
    }
  }

  public onTogglePaymentNote(data: any) {
    data.hasNote = !data.hasNote;
  }

  // User Interface Actions - Balance

  public onToggleDropdown(target: any, data: any = null) {

    if (target == 'individualDiscount' && data) {
      data.dropdown = !data.dropdown ? true : false;
    } else {

      if (!this.data.dropdown) { this.data.dropdown = {} }

      if (target == 'balanceOptions') {
        this.data.dropdown.balanceOptions = !this.data.dropdown.balanceOptions ? true : false;
      }
    }
  }

  public onApplyDiscount(selectField: any, inputField: any) {

    let value: string;

    if (selectField.value == '$') {
      value = FieldMask.priceFieldMask(inputField.value);
      this.data.balance.discount = { type: '$', value: parseFloat((value || 0).toString().replace(/\./g, '').replace(',', '.')) }
    } else if (selectField.value == '%') {
      value = FieldMask.percentageFieldMask(inputField.value);
      this.data.balance.discount = { type: '%', value: parseFloat((value || 0).toString().replace(/\./g, '').replace(',', '.')) };
    }

    inputField.value = value;

    this.generateBalance();
  }

  public onApplyFee(selectField: any, inputField: any) {

    let value: string;

    if (selectField.value == '$') {
      value = FieldMask.priceFieldMask(inputField.value);
      this.data.balance.aditionalFee = { type: '$', value: parseFloat((value || 0).toString().replace(/\./g, '').replace(',', '.')) };
    } else if (selectField.value == '%') {
      value = FieldMask.percentageFieldMask(inputField.value);
      this.data.balance.aditionalFee = { type: '%', value: parseFloat((value || 0).toString().replace(/\./g, '').replace(',', '.')) };
    }

    inputField.value = value;

    this.generateBalance();
  }

  // 🆕 NOVO MÉTODO - Define garantia pelos botões de sugestão
  public setWarranty(value: string): void {
    this.data.warranty = value;
  }

  // User Interface Actions - General  

  public onRegister() {

    this.sending = true;

    const data = this.composeData();
    const source = this.composeSource();

    const operation = (!data.code ? 'register' : 'update');

    if (operation == "update" && Object.values(source || {}).length == 0) {

      this.notificationService.create({
        title: "Houve um erro inesperado. Por favor, tente novamente.",
        description: "Source Data not found",
        status: ENotificationStatus.danger
      });

      this.onResetPanel();
      return;
    }

    // console.log(data);
    // return;

    this.cashierFrontPDVService.registerSale(data, source, true).then(() => {

      if (source) {
        data.code = Utilities.prefixCode(data.code);
        data.operator = source.operator;
        data.registerDate = source.registerDate;
      }

      CashierFrontReceiptsComponent.shared.onOpen({ data });

      this.onResetPanel();
      this.saleCompleted = true;
    });
  }

  public onResetPanel() {

    // 🆕 MODIFICADO - Adicionado warranty: null
    // Limpa completamente os dados incluindo o campo de garantia
    this.data = {
      customer: null,
      member: null,
      products: [],
      paymentMethods: [],
      service: null,
      balance: null,
      dropdown: null,
      warranty: null  // 🆕 CAMPO DE GARANTIA ADICIONADO
    };

    this.source = {};
    this.settings = {};

    // Reseta os componentes seletores
    if (ProductsSelectorComponent.shared) {
      ProductsSelectorComponent.shared.reset();
    }

    if (PaymentMethodsSelectorComponent.shared) {
      PaymentMethodsSelectorComponent.shared.reset();
    }

    // Limpa os campos de input
    $$(".input-tax").val("0,00");
    $$(".input-discount").val("0,00");
    $$('.container-products .quick-search input').val('');
    // 🆕 LIMPA O CAMPO DE GARANTIA
    $$('.input-warranty').val('');

    // Limpa outros dados
    this.dataBridgeService.clearData('ServiceOrder');

    // Reseta o estado de envio
    this.sending = false;

    // Recalcula o balanço (vai zerar tudo)
    this.generateBalance();
  }

  // Mask Methods

  public onApplyNumberMask(event: Event) {
    $$(event.currentTarget).val(FieldMask.numberFieldMask($$(event.currentTarget).val(), null, null, true));
  }

  // Layer Actions

  public onOpenLayer(id: string) {
    // Se uma venda foi completada e está abrindo produtos
    if (id === 'products' && this.saleCompleted) {
      // Reseta o flag
      this.saleCompleted = false;
      // Força reset do componente
      if (ProductsSelectorComponent.shared) {
        ProductsSelectorComponent.shared.reset();
      }
    }

    // Se está abrindo o seletor de produtos e não tem produtos no carrinho
    // força a limpeza do componente selector
    if (id === 'products' && (!this.data.products || this.data.products.length === 0)) {
      if (ProductsSelectorComponent.shared) {
        ProductsSelectorComponent.shared.reset();
      }
    }

    this.layerComponent.onOpen({ activeComponent: id });
  }

  // Event Listeners

  public onLayerResponse(event: any) {

    // Check
    this.checkLoadingProducts(event);

    // Instance Capture
    if (event.instance) {
      this.layerComponent = event.instance;
    }

    // Data Capture
    if (event.customer) {
      this.data.customer = event.customer;
    }

    if (event.member) {
      this.data.member = event.member;
    }

    if (event.products) {
      // VERIFICAÇÃO PARA EVITAR DUPLICATAS
      if (!this.data.products) {
        this.data.products = [];
      }

      // Limpa produtos anteriores se houver nova seleção
      this.data.products = event.products;
    }

    if (event.paymentMethods) {
      // VERIFICAÇÃO TAMBÉM PARA MÉTODOS DE PAGAMENTO
      if (!this.data.paymentMethods) {
        this.data.paymentMethods = [];
      }

      // Limpa métodos anteriores se houver nova seleção
      this.data.paymentMethods = event.paymentMethods;
    }

    if (this.data.balance) {
      delete this.data.balance;
    }

    // Perform the Calculations
    this.generateBalance();
  }

  private checkLoadingProducts(event: any) {

    if (this.data.products?.length > 0 && event.products) {

      setTimeout(() => {
        this.loadingProducts = false;
      }, 1500);

      return;
    }

    if (!this.data.products || this.data.products?.length == 0) {

      setTimeout(() => {
        this.loadingProducts = false;
      }, 1500);

      return;
    }

    setTimeout(() => {
      this.loadingProducts = false;
    }, 1500);
  }

  // Auxiliary Methods - Private

  private generateBalance() {


    this.data.balance = (this.data.balance || {});

    this.data.balance.totalProducts = 0;
    this.data.balance.totalServices = 0;
    this.data.balance.totalDiscount = 0;
    this.data.balance.totalFee = 0;

    this.data.balance.totalPartial = 0;
    this.data.balance.totalSale = 0;

    // console.log(this.data.balance);

    // Perform Calculations    

    if (this.data.service && this.data.service.types && this.data.service.types.length > 0) {

      for (const item of this.data.service.types) {

        if (item.customPrice > item.executionPrice) {
          this.data.balance.totalServices += item.customPrice;
        } else {
          this.data.balance.totalServices += item.executionPrice;
        }

        this.data.balance.totalDiscount += (() => {
          return ((item.customPrice < item.executionPrice) ? (item.executionPrice - item.customPrice) : 0);
        })();
      }

      if (this.data.service && this.data.service.additional && this.data.service.additional > 0) {
        this.data.balance.totalServices += this.data.service.additional;
      } else if (!isNaN(this.data.service.additional)) { // Temp
        this.data.balance.totalDiscount += (this.data.service.additional * -1);
      }


      this.data.balance.totalPartial += this.data.balance.totalServices;
    } else {

      if (this.data.service && this.data.service.additional && !isNaN(this.data.service.additional)) {
        this.data.balance.totalServices += this.data.service.additional;
        this.data.balance.totalPartial += this.data.balance.totalServices;
      }
    }

    if (this.data.products && this.data.products.length > 0) {

      for (const item of this.data.products) {

        if (item.unitaryPrice > item.salePrice) {
          this.data.balance.totalProducts += (item.selectedItems * item.unitaryPrice);
        } else {
          this.data.balance.totalProducts += (item.selectedItems * item.salePrice);
        }

        this.data.balance.totalDiscount += (() => {

          const value = (item.unitaryPrice < item.salePrice) ? (item.salePrice - item.unitaryPrice) * item.selectedItems : 0;
          return isNaN(value) ? 0 : value;
        })();

      }

      this.data.balance.totalPartial += this.data.balance.totalProducts;
    }


    if (this.data.balance.aditionalFee) {

      const obj = this.data.balance.aditionalFee;

      if (obj.type == '$') {
        this.data.balance.totalFee += obj.value;
      } else if (obj.type == '%') {
        this.data.balance.totalFee += parseFloat((this.data.balance.totalPartial * (obj.value / 100)).toFixed(2));
      }

      this.data.balance.totalPartial += this.data.balance.totalFee;
    }

    if (this.data.balance.aditionalFee == undefined) {
      this.data.balance.totalFee = this.source?.balance?.subtotal?.fee || 0;
    }

    if (this.data.balance.discount) {

      const obj = this.data.balance.discount;

      if (obj.type == '$') {
        this.data.balance.totalDiscount += obj.value;
      } else if (obj.type == '%') {
        this.data.balance.totalDiscount += parseFloat((this.data.balance.totalSale * (obj.value / 100)).toFixed(2));
      }
    }

    // Apply Values

    if (this.data.balance.totalDiscount > 0) {
      this.data.balance.totalPartial -= this.data.balance.totalDiscount;
      this.data.balance.totalSale -= this.data.balance.totalDiscount;
    }

    if (this.data.balance.totalProducts > 0) {
      this.data.balance.totalSale += this.data.balance.totalProducts;
    }

    if (this.data.balance.totalServices > 0) {
      this.data.balance.totalSale += this.data.balance.totalServices;
    }

    if (this.data.balance.totalFee > 0) {
      this.data.balance.totalSale += this.data.balance.totalFee;
    }

    this.data.balance.totalSale = parseFloat(parseFloat(this.data.balance.totalSale).toFixed(2));

    // Checks the values of payment methods whenever changes occur

    this.checkPayment();
  }

  private checkPayment() {

    if (this.data.paymentMethods && (this.data.paymentMethods).length > 0) {

      let value = 0;

      for (const method of this.data.paymentMethods) {
        if (method.value) { value += method.value }
      }

      value = parseFloat(value.toFixed(2));

      if (value <= this.data.balance.totalSale) {

        this.settings.paymentMethods = {
          status: 'ACCEPTED',
          value: value,
          pendent: this.data.balance.totalSale - value
        };
      } else {

        this.settings.paymentMethods = {
          status: 'REFUSED',
          value: value,
          overplus: value - this.data.balance.totalSale
        };
      }
    }
  }

  private composeData() {

    // 🆕 MODIFICADO - Adicionado warranty no objeto de resposta
    const response: ICashierSale = {
      code: this.data.code,
      products: ([] as any),
      paymentMethods: ([] as any),
      balance: ({} as any),
      origin: (this.data.origin || ECashierSaleOrigin.CASHIER),
      status: ECashierSaleStatus.PENDENT,
      warranty: this.data.warranty || null  // 🆕 CAMPO DE GARANTIA ADICIONADO
    };

    if (this.data.requestCode) {
      response.requestCode = this.data.requestCode;
    }

    if (this.data.billToReceiveCode) {
      response.billToReceiveCode = this.data.billToReceiveCode;
    }

    if (this.data.customer) {

      response.customer = ({} as any);

      response.customer.code = this.data.customer.code;
      response.customer.name = this.data.customer.name;

      if (this.data.customer.personalDocument) {
        response.customer.personalDocument = this.data.customer.personalDocument;
      }

      if (this.data.customer.businessDocument) {
        response.customer.businessDocument = this.data.customer.businessDocument;
      }

      if (this.data.customer.address) {
        response.customer.address = this.data.customer.address;
      }

      if (this.data.customer.contacts && this.data.customer.contacts.phone) {
        response.customer.phone = this.data.customer.contacts.phone;
      }

      if (this.data.customer.contacts && this.data.customer.contacts.email) {
        response.customer.email = this.data.customer.contacts.email;
      }

      if (this.data.customer.description) {
        response.customer.description = this.data.customer.description;
      }
    }

    if (this.data.member) {

      response.member = ({} as any);

      response.member.code = this.data.member.code;
      response.member.name = this.data.member.name;

      if (this.data.member.address) {
        response.member.address = this.data.member.address;
      }

      if (this.data.member.contacts && this.data.member.contacts.phone) {
        response.member.phone = this.data.member.contacts.phone;
      }

      if (this.data.member.contacts && this.data.member.contacts.email) {
        response.member.email = this.data.member.contacts.email;
      }

      if (this.data.member.description) {
        response.member.description = this.data.member.description;
      }

    }

    if (this.data.service) {

      response.service = {
        _id: this.data.service._id,
        code: this.data.service.code
      };

      if (this.data.service.types) {

        response.service.types = [];

        $$(this.data.service.types).map((_, item) => {

          const obj: any = {
            code: item.code,
            name: item.name,
            costPrice: item.costPrice,
            customCostPrice: item.customCostPrice != undefined ? item.customCostPrice : item.costPrice,
            executionPrice: item.executionPrice,
            customPrice: item.customPrice,
            cnae: item.cnae,
            codigo: item.codigo,
            codigoTributacao: item.codigoTributacao || ""
          };

          if (item.tributes) {
            obj.tributes = item.tributes || {}
          }

          response.service.types.push(obj);
        });
      }
    }

    if (this.data.products) {

      for (const item of this.data.products) {

        const obj: any = {
          _id: item._id,
          code: item.code,
          name: item.name,
          costPrice: item.costPrice,
          salePrice: item.salePrice,
          unitaryPrice: item.unitaryPrice,
          quantity: parseInt(item.selectedItems)
        };

        if (item.tributes) {
          obj.tributes = item.tributes;
        }

        if (item.serialNumber) {
          obj.serialNumber = item.serialNumber;
        }

        if (item.internalCode) {
          obj.internalCode = item.internalCode;
        }

        if (item.commercialUnit) {

          obj.commercialUnit = {
            _id: item.commercialUnit._id,
            code: item.commercialUnit.code,
            name: item.commercialUnit.name
          };
        }

        if (item.category) {

          obj.category = {
            _id: item.category._id,
            code: item.category.code,
            name: item.category.name
          };
        }

        if (item.provider) {

          obj.provider = {
            _id: item.provider._id,
            code: item.provider.code,
            name: item.provider.name
          };
        }

        if (item.discount) {
          obj.discount = item.discount;
        }

        if (item.reserve) {
          obj.reserve = item.reserve;
        }

        response.products.push(obj);
      }
    }

    if (this.data.paymentMethods) {

      let value = 0;

      $$(this.data.paymentMethods).map((_, item) => {

        let obj: any = {
          code: item.code,
          name: (item.code > 6000 && item.alternateName ? item.alternateName : item.name),
          bankAccount: item.bankAccount,
          history: (item.history || []),
          value: (item.value || 0)
        };

        if (item.note) {
          obj.note = item.note;
        }

        if (item.fees && item.fees.length > 0) {

          for (const fee of item.fees) {

            if (fee.selected) {
              obj.fees = fee;
              delete fee.selected;
            }
          }
        } else {

          if (item.fee) {
            obj.fee = item.fee;
          }
        }

        if (item.uninvoiced) {
          obj.uninvoiced = item.uninvoiced;
        }
        value += obj.value;

        if (value > 0) {
          response.paymentMethods.push(obj);
        }
      });

      value = parseFloat(value.toFixed(2));

      if (value == this.data.balance.totalSale) {
        response.status = ECashierSaleStatus.CONCLUDED;
      }
    }

    if (this.data.billToReceive) {

    }

    if (this.data.balance) {

      response.balance.subtotal = ({} as any);

      if (this.data.balance.totalServices > 0) {
        response.balance.subtotal.services = this.data.balance.totalServices;
      }

      if (this.data.balance.totalProducts > 0) {
        response.balance.subtotal.products = this.data.balance.totalProducts;
      }

      if (this.data.balance.totalDiscount > 0) {
        response.balance.subtotal.discount = this.data.balance.totalDiscount;
      }

      if (this.data.balance.totalFee > 0) {
        response.balance.subtotal.fee = this.data.balance.totalFee;
      }

      response.balance.total = this.data.balance.totalSale;
    }


    return response;
  }

  private composeSource() {

    let source = null;

    if (Object.values(this.source).length > 0) {
      source = this.source;
    }

    return source;
  }


  // Utility Methods 

  private scannerSettings() {

    this.scannerService.getShot('CashierFrontPDVComponent', (barcode) => {

      Utilities.loading();

      const isCode = barcode.length >= 8 && barcode.length < 13;

      const code = isCode ? barcode.substring(0, barcode.length - 4) : barcode;

      // console.log(barcode, { field: isCode ? 'code' : 'barcode', operator: '=', value: isCode ? parseInt(code) : code });

      ProductsSelectorComponent.shared.onSearch({
        where: [
          { field: isCode ? 'code' : 'barcode', operator: '=', value: isCode ? parseInt(code) : code }
        ],
        data: { barcode }
      }, true).then(() => {
        Utilities.loading(false);
      });
    });
  }

  // Destruction Method

  public ngOnDestroy() {
    this.dataBridgeService.clearData('ServiceOrder');
    this.scannerService.removeListeners('CashierFrontPDVComponent');
  }

}