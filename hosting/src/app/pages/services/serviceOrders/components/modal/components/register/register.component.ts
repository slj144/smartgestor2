import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

// Components
import { ServicesSelectorComponent } from '@pages/registers/services/components/selector/selector.component';
import { ProductsSelectorComponent } from '@pages/stock/products/components/selector/selector.component';

// Services
import { ServiceOrdersService } from '@pages/services/serviceOrders/serviceOrders.service';
import { PartnersService } from '@pages/registers/partners/partners.service';
import { SettingsService } from '@pages/settings/settings.service';

// Translate
import { ServiceOrdersTranslate } from '@pages/services/serviceOrders/serviceOrders.translate';

// Interfaces
import { EServiceOrderPaymentStatus, EServiceOrderStatus, IServiceOrder } from '@shared/interfaces/IServiceOrder';
import { IPermissions } from '@shared/interfaces/_auxiliaries/IPermissions';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { FieldMask } from '@shared/utilities/fieldMask';
import { DateTime } from '@shared/utilities/dateTime';
import { ProjectSettings } from '@assets/settings/company-settings';
import { Dispatch } from '@shared/utilities/dispatch';
import { IOperator } from '@shared/interfaces/_auxiliaries/IOperator';

@Component({
  selector: 'service-orders-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class ServiceOrdersRegisterComponent implements OnInit, OnDestroy {

  @Output() public callback: EventEmitter<any> = new EventEmitter();

  public static shared: ServiceOrdersRegisterComponent;

  public loading: boolean = true;  
  public data: any = {};
  public settings: any = {};
  public translate: any;
  public formServiceOrder: FormGroup;
  public companyProfile: any;
  public permissions: any;
  public collaborators: any[] = [];

  private isAdmin = Utilities.isAdmin;

  private layerComponent: any;   

  constructor(
    private formBuilder: FormBuilder,
    private partnersService: PartnersService,
    private settingsService: SettingsService,
    private serviceOrdersService: ServiceOrdersService
  ) {
    ServiceOrdersRegisterComponent.shared = this;
  }

  public ngOnInit() {

    this.translate = ServiceOrdersTranslate.get()['modal']['action']['register'];
    this.companyProfile = ProjectSettings.companySettings().profile;

    this.callback.emit({ instance: this });
    
    this.onResetPanel();

    this.permissionsSettings();    
    this.formSettings();
  }

  public bootstrap(settings: any = {}) {

    this.data = Utilities.deepClone(settings.data);
    this.settings.action = settings.action;
    this.settings.originalData = Utilities.deepClone(this.data);

    this.partnersService.getPartners('ServiceOrdersRegisterComponent', (data) => {
      this.settings.technicalAssistance = (data || []);
    });

    this.settingsService.getSOSettings('ServiceOrdersRegisterComponent', (data) => {
      this.settings.checklist = this.restructureChecklist(data.checklist);
      this.markChecklist(this.data.checklist);
    });

    Dispatch.collaboratorsService.query([{field: "owner", operator: "=", value: Utilities.storeID}], false, false, false, false).then((collaborators)=>{
      this.collaborators = collaborators || [];
    });


    if (
      (this.data.customer && this.data.customer.phone) ||
      (this.data.customer && this.data.customer.email)
    ) {

      settings.data.customer.contacts = {};

      if (this.data.customer.phone) {

        this.data.customer.contacts = this.data.customer.contacts || {};

        this.data.customer.contacts.phone = this.data.customer.phone;
        delete this.data.customer.phone;
      }

      if (this.data.customer.email) {
        this.data.customer.contacts.email = this.data.customer.email;
        delete this.data.customer.email;
      }

      if(this.data && this.data.vehicle){
        this.data.vehicle.proprietary = this.data.customer;
      }
    }

    if (this.data.products && (this.data.products.length > 0)) {
      ProductsSelectorComponent.shared.selectProducts(this.data.products);
    }
    
    if (this.data.services && (this.data.services.length > 0)) {
      ServicesSelectorComponent.shared.selectServices(this.data.services);
    }

    this.formSettings(this.data);
    this.generateBalance();
  }

  // Getter and Setter Methods

  public get formControls() {
    return this.formServiceOrder.controls;
  }

  // User Interface Action - Common

  public onApplyPrice(data: any, inputField: any, type: string) {

    const value = FieldMask.priceFieldMask(inputField.value);

    if (type == 'product') {
      data.unitaryPrice = (parseFloat(value.replace(/\./g,'').replace(',','.')) || 0);
      inputField.value = value;
    }

    if (type == 'service') {
      data.customPrice = (parseFloat(value.replace(/\./g,'').replace(',','.')) || 0);
      inputField.value = value;
    }

    if (type == 'service-cost') {
      data.customCostPrice = (parseFloat(value.replace(/\./g,'').replace(',','.')) || 0);
      inputField.value = value;
    }

    this.generateBalance();
  }

  // User Interface Actions - Services

  public onDeleteServiceItem(index: number) {

    ServicesSelectorComponent.shared.deselectService(this.data.services[index]);
    this.data.services.splice(index, 1);

    this.generateBalance();
  }

  // User Interface Actions - Products

  public onQuickSearch(event: Event) {

    const value = $$(event.currentTarget).val();

    if (value != '') {
      
      Utilities.loading();
  
      ProductsSelectorComponent.shared.onSearch({
        where: [
          { field: 'code', operator: '=', value: parseInt(value) }
        ]
      }, true).then(() => {
        $$('.container-products .quick-search input').val('');
        Utilities.loading(false);
      });
    }
  }

  public onDeleteProductItem(index: number) {

    ProductsSelectorComponent.shared.onDeselectProduct(this.data.products[index]);
    this.generateBalance();
  }
  
  public onApplyQuantity(data: any, inputField: any) {

    const value = inputField.value;

    // const maxQuantity = (()=>{
    //   if(this.data.code){
    //     if(this.data.isAllocProducts){
    //       return parseInt((data.selectedItems || 0)) + data.quantity
    //     }else{
    //       return (data.selectedItems)
    //     }
    //   }else{
    //     return data.quantity;
    //   }
    // })();

    const quantity = FieldMask.numberFieldMask(value, 1, data.quantity);

    // console.log(quantity, maxQuantity, data);

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

  // User Interface Actions - Checklist

  public onChangeChecklist(value: string, parent: string) {

    $$(this.settings.checklist).map((_, item) => {

      if (!parent && !item.subchecklist) {

        if (item.name == value) {
          item.checked = !item.checked;
        }
      } else {

        if (item.name == parent) {
          
          let subActive = 0;     

          $$(item.subchecklist).map((_, sub) => {

            if (value == sub.name) {
              sub.checked = !sub.checked;
            }

            if (sub.checked) {
              subActive += 1;
            }
          });
          
          item.checked = (subActive > 0);          
        }
      }
    });
  }

  // User Interface Actions - General

  public onRegister() {

    if(this.checkSubmit()){ return; }

    const data = this.composeData();

    // console.log(data);

    // return;
    
    this.serviceOrdersService.registerService({ data }).then(() => {
      this.callback.emit({ close: true });
      this.onResetPanel();
    });
  }

  public onResetPanel() {
    
    this.data = {};

    if (ProductsSelectorComponent.shared) {
      ProductsSelectorComponent.shared.reset(); 
    }

    if (ServicesSelectorComponent.shared) {
      ServicesSelectorComponent.shared.reset(); 
    }

    if ($$('#container-request-register').length > 0) {
      $$('#container-request-register')[0].scrollTop = 0;
    }
  }

  // Mask Methods

  public onApplyNumberMask(event: Event) {
    $$(event.currentTarget).val(FieldMask.numberFieldMask($$(event.currentTarget).val(), null, null, true));
  }

  // Layer Actions

  public onOpenLayer(type: string) {
    this.layerComponent.onOpen({ activeComponent: type });
  }

  // Event Listeners

  public onLayerResponse(event: any) {

    // Instance Capture

    if (event.instance) {
      this.layerComponent = event.instance;   
    }

    // Data Capture

    if (event.customer) {
      this.data.customer = event.customer;
    }

    if (event.vehicle) {
      this.data.vehicle = event.vehicle;
      this.data.customer = this.data.vehicle.proprietary;
    }

    if (event.services) {
      this.data.services = event.services;
    }

    if (event.products) {
      this.data.products = event.products;
    }

    // Perform the Calculations

    this.generateBalance();
  }  

  // Auxiliary Methods

  private formSettings(data: any = {}) {

    this.formServiceOrder = this.formBuilder.group({
      _id: [data._id],
      code: [data.code],
      equipment: this.formBuilder.group({
        model: [data.equipment && data.equipment.model ? data.equipment.model : ''],
        brand: [data.equipment && data.equipment.brand ? data.equipment.brand : ''],
        password: [data.equipment && data.equipment.password ? data.equipment.password : ''],
        serialNumber: [data.equipment && data.equipment.serialNumber ? data.equipment.serialNumber : '']
      }),
      settings: this.formBuilder.group({
        executor: [data?.executor?.username ?? Utilities.operator.username],
        serviceExecution: [data.execution && data.execution.type ? data.execution.type : 'INTERNAL'],
        technicalAssistance: [data.execution && data.execution.provider ? data.execution.provider.code : ''],
        entryDate: [data.entryDate ?? DateTime.getDate('D')],
        deliveryDate: [data.deliveryDate ?? DateTime.getDate('D')]        
      }),
      description: [data.description ?? ''],
      checklist: [data.hasChecklist ?? true]
    });

    this.generateBalance();

    if(this.settings.action){
      if(this.settings.action.toLowerCase() == "create"){
        this.loading = false;
      }else if( this.settings.action.toLowerCase() == "update"){

         setTimeout(()=>{
          this.loading = false;
         }, data?.products.length > 0 ? 3000 : 500);

        // const timer = setInterval(()=>{

        //   let totalSale: any = document.querySelector("#balanceTotalSale")?.textContent.match(/[0-9\.\,]+/)
  
        //   if(totalSale && !isNaN(data.balance.totalSale)){
  
        //     totalSale = (totalSale[0] || "").replace(".","").replace(",",".");

        //     if(parseFloat(totalSale), data.balance.totalSale){
        //       clearInterval(timer);
        //       this.loading = false;
        //     }
  
        //   }
        // });
      }
    }

  }

  private generateBalance() {

    this.data.balance = (this.data.balance || {});

    this.data.balance.totalProducts = 0;
    this.data.balance.totalServices = 0;
    this.data.balance.totalDiscount = 0;
    this.data.balance.totalFee = 0;

    this.data.balance.totalPartial = 0;
    this.data.balance.totalSale = 0;

    // Perform Calculations    
    
    if (this.data.services && this.data.services.length > 0) {

      for (const item of this.data.services) {

        if (item.customPrice > item.executionPrice) {
          this.data.balance.totalServices += item.customPrice;
        } else {
          this.data.balance.totalServices += item.executionPrice;
        }
        
        this.data.balance.totalDiscount += (() => {
          return ((item.customPrice < item.executionPrice) ? (item.executionPrice - item.customPrice) : 0);
        })();
      }

      this.data.balance.totalPartial += this.data.balance.totalServices;
      this.data.balance.totalSale += this.data.balance.totalServices;
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
      this.data.balance.totalSale += this.data.balance.totalProducts;
    }


    // Apply Values

    if (this.data.balance.totalDiscount > 0) {
      this.data.balance.totalPartial -= this.data.balance.totalDiscount;
      this.data.balance.totalSale -= this.data.balance.totalDiscount;
    }

    if (this.data.balance.totalFee > 0) {
      this.data.balance.totalSale += this.data.balance.totalFee;
    }
  }

  private composeData() {

    const formData = this.formServiceOrder.value;

    const response: IServiceOrder = {
      _id: this.data._id,
      code: this.data.code,      
      entryDate: '',
      deliveryDate: '',
      description: '',
      execution: ({} as any),
      executor: ({} as any),
      customer: ({} as any),
      services: ([] as any),
      products: ([] as any),
      equipment: ({} as any),
      balance: ({} as any),
      paymentStatus: EServiceOrderPaymentStatus.PENDENT,
      serviceStatus: (this.data.serviceStatus || EServiceOrderStatus.PENDENT),
      hasChecklist: (this.data.hasChecklist || formData.checklist),
      isAllocProducts: (this.data.isAllocProducts || false)
    };    

    if (this.data.customer) {

      response.customer = ({} as any);

      response.customer._id = this.data.customer._id;
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
    }  

    if (this.data.vehicle) {
      delete this.data.vehicle.proprietary;
      response.vehicle = this.data.vehicle;
    }

    if (this.data.services) {

      $$(this.data.services).map((_, item) => {

        response.services.push({
          _id: item._id,
          code: item.code,
          name: item.name,
          costPrice: item.costPrice,
          executionPrice: item.executionPrice,
          customCostPrice: item.customCostPrice != undefined ? item.customCostPrice : item.costPrice,
          customPrice: item.customPrice,
          cnae: item.cnae,
          codigo: item.codigo,
          codigoTributacao: item.codigoTributacao || "",
          tributes: item.tributes
        });
      });
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
          quantity: parseInt(item.selectedItems),
          tributes: item.tributes
        };

        if (item.serialNumber) {
          obj.serialNumber = item.serialNumber;
        }

        if (item.type) {
          obj.type = { 
            _id: item.type._id, code: item.type.code, name: item.type.name
          };
        }

        if (item.category) {
          obj.category = { 
            _id: item.category._id, code: item.category.code, name: item.category.name
          };
        }

        if (item.discount) {
          obj.discount = item.discount;
        }

        response.products.push(obj);
      }
    }
    
    if (formData.description) {
      response.description = formData.description;
    }

    if (formData.equipment) {
      response.equipment.model = (formData.equipment.model || '');
      response.equipment.brand = (formData.equipment.brand || '');
      response.equipment.password = (formData.equipment.password || '');
      response.equipment.serialNumber = (formData.equipment.serialNumber || '');
    }

    if (formData.checklist) {

      const checklist: any = [];

      $$(this.settings.checklist).map((_, item) => {

        if (item.checked) {
          
          const obj: any = {
            name: item.name
          };

          if (item.subchecklist) {

            const arr: any = [];

            $$(item.subchecklist).map((_, sub) => {
              
              if (sub.checked) {
                arr.push(sub.name);
              }
            });

            obj.subchecklist = arr;
          }          
          
          checklist.push(obj);
        }
      });

      response.checklist = checklist;
    }

    if (formData.settings) {

      if (formData.settings.executor) {

        const collaborator = this.collaborators.filter((item)=> item.username ==  formData.settings.executor)[0] || Utilities.operator;
  
        response.executor = <IOperator>{
          code: collaborator.code,
          name: collaborator.name,
          username: collaborator.username,
          usertype: collaborator.usertype
        };
      }

      if (formData.settings.serviceExecution) {

        response.execution.type = formData.settings.serviceExecution;

        if (formData.settings.serviceExecution == 'EXTERNAL' && formData.settings.technicalAssistance) {

          const obj: any = {};
          const code = formData.settings.technicalAssistance;

          $$(this.settings.technicalAssistance).map((_, item) => {

            if (item.code == code) {

              obj._id = item._id;
              obj.code = item.code;
              obj.name = item.name;

              if (item.contacts && item.contacts.email) {
                obj.email = item.contacts.email;
              }

              if (item.contacts && item.contacts.phone) {
                obj.phone = item.contacts.phone;
              }

              if (item.address) {

                const local = item.address.local;
                const number = (item.address.number ? (' Nº' + item.address.number) : '');
                const complement = (item.address.complement ? (' ' + item.address.complement) : '');
                const neighborhood = (item.address.neighborhood ? (', ' + item.address.neighborhood) : '');
                const city = (item.address.city ? (', ' + item.address.city) : '');
                const state = (item.address.state ? (' - ' + item.address.state) : '');

                obj.address = `${local}${number}${complement}${neighborhood}${city}${state}`;
              }
            }
          });

          response.execution.provider = obj;
        }
      }
      
      if (formData.settings.entryDate) {
        response.entryDate = formData.settings.entryDate;
      }

      if (formData.settings.deliveryDate) {
        response.deliveryDate = formData.settings.deliveryDate;
      }
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

  // Utility Methods

  private restructureChecklist(data: any) {

    const checklist = Utilities.deepClone(data);

    $$(checklist).map((_, item) => {

      item.checked = false;

      if (item.subchecklist && item.subchecklist.length > 0) {

        const subchecklist: any = [];

        $$(item.subchecklist).map((_, item) => {
          subchecklist.push({ name: item, checked: false });
        });

        item.disabled = true;
        item.subchecklist = subchecklist;
      } else {
        delete item.subchecklist;
      }
    });

    return (checklist || []);
  }

  private markChecklist(data: any) {

    if (data) {

      $$(this.settings.checklist).map((_, itemNV1) => {

        $$(data).map((_, itemNV2) => {

          if (itemNV1.name == itemNV2.name) {

            itemNV1.checked = true;

            if (itemNV1.subchecklist) {              
              $$(itemNV1.subchecklist).map((_, sub) => { 
                sub.checked = (itemNV2.subchecklist.indexOf(sub.name) != -1);
              });
            }
          }
        });
      });
    }
  }

  private permissionsSettings() {

    const setupPermissions = () => {
     
      if (Utilities.isAdmin) {

        this.permissions = {
          add: true,
          edit: true,
          delete: true,
          cancel: true,
          filterDataPerOperator: false,
          editPrice: true,
          editServiceCostPrice: true
        };
      } else {

        const permissions = Utilities.permissions("serviceOrders") as IPermissions["serviceOrders"];

        if (permissions) {

          this.permissions = {
            filterDataPerOperator:(permissions.actions.indexOf('filterDataPerOperator') !== -1),
            add: permissions.actions.indexOf("add") !== -1,
            edit: permissions.actions.indexOf("edit") !== -1,
            delete: permissions.actions.indexOf("delete") !== -1,
            cancel: permissions.actions.indexOf("cancel") !== -1,
            editPrice: permissions.actions.indexOf("editPrice") !== -1,
            editServiceCostPrice: permissions.actions.indexOf("editServiceCostPrice") !== -1
          };
        }
      }
    };

    setupPermissions();
  }

  private checkSubmit() {

    if (this.settings._isSubmited) { return true; }

    this.settings._isSubmited = true;
    return false;
  }

  // Destruction Method

  public ngOnDestroy() {
    
    this.data = {};
    this.layerComponent = null;

    this.onResetPanel();
  }

}
