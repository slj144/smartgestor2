import { Component, Output, EventEmitter, OnInit, ViewChild, OnChanges, ElementRef, AfterViewInit, ChangeDetectorRef, AfterViewChecked, SimpleChanges } from '@angular/core';

// Services
import { ServiceOrdersService } from '../../serviceOrders.service';
import { SettingsService } from '@pages/settings/settings.service';

// Translate
import { ServiceOrdersTranslate } from '../../serviceOrders.translate';

// Interfaces
import { EServiceOrderStatus } from '@shared/interfaces/IServiceOrder';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from "@shared/utilities/utilities";
import { Dispatch } from '@shared/utilities/dispatch';

@Component({
  selector: 'service-orders-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ServiceOrdersModalComponent implements OnInit{

  @Output() callback: EventEmitter<any> = new EventEmitter();
  
  public translate = ServiceOrdersTranslate.get()['modal'];

  public settings: any = {};

  @ViewChild("registerComponent", {static: false}) registerComponent;
  @ViewChild("filtersComponent", {static: false}) filtersComponent;
  @ViewChild("printComponent", {static: false}) printComponent;

  private modalComponent: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    private serviceOrdersService: ServiceOrdersService
  ){}

  public ngOnInit() {
    this.callback.emit({ instance: this });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    
    // console.log(changes);
  }

  public ngAfterViewInit(){
    
  }


  // User Interface Actions - General  

  public onCancel() {

    if(this.checkSubmit()){ return; }
    
    this.serviceOrdersService.registerService({ data: this.settings.data, isCancel: true }).then(() => {
      this.onClose();
    });
  }  

  public onUpdateStatus() {

    if(this.checkSubmit()){ return; }

    const data = this.settings.data;

    data.data.serviceStatus = data.data.serviceStatus ==  EServiceOrderStatus.CANCELED ? EServiceOrderStatus.PENDENT :( data.data.scheme.status == EServiceOrderStatus.CONCLUDED) ? EServiceOrderStatus.CONCLUDED : data.data.serviceStatus;
    
    const isAllocProducts = data.isAllocProductsThisStep || data.data.serviceStatus ==  EServiceOrderStatus.CANCELED ? true : false;

    this.serviceOrdersService.updateStatus(data.data, isAllocProducts, data).then(()=>{

      this.onClose();
    }).catch((error)=>{

      this.onClose();
      console.error(error);
    });
  }

  public onEmitNf(){
    this.settings.activeComponent = 'ServiceOrders/EmitNf';
    this.modalComponent.title = 'Emitir Nota Fiscal de Serviço';
  }

  // public checkNf(){
  //   return Utilities.isFiscal && !this.settings.data.nf;
  // }

  // Print Actions

  public onOpenPrinter() {

    const data = Utilities.deepClone(this.settings.data);
    data.products = this.settings.data.products;
    
    this.printComponent.onOpen({
      activeComponent: 'ServiceOrders/Receipt',
      data: data
    });
  }


  // Modal Actions

  public onOpen(settings: any = {}) {

    this.settings = settings;
    this.settings.data = (settings.data || {});

    const config: any = { mode: 'fullscreen' };
    const style: any = {};

    this.cdr.detectChanges();

    if (settings.activeComponent === 'ServiceOrders/Filters') {
      config.mode = settings.activeComponent === 'ServiceOrders/Filters' ? 'sidescreen' : 'fullscreen';
    }

    if ((this.settings.activeComponent === 'ServiceOrders/Create') || (this.settings.activeComponent === 'ServiceOrders/Update')) {
      style.backgroundImage = false;
    }
    
    if ((this.settings.activeComponent === 'ServiceOrders/Read') || (this.settings.activeComponent === 'ServiceOrders/Cancel')) {

      this.settingsService.getSOSettings('ServiceOrdersModalComponent', (data) => {

        this.settings.checklist = this.restructureChecklist(data.checklist);

        if (this.settings.data && this.settings.data.checklist) {
          this.markChecklist(this.settings.data.checklist);
        }        
      });
    }

    if (this.settings.data.saleCode){

      Dispatch.cashierFrontPDVService.getSale(parseInt(this.settings.data.saleCode)).then((res)=>{
        this.settings.sale = res;
        this.modalComponent.onOpen(config, style);
        this.checkTranslationChange();
      }).catch(()=>{});

    } else {

      this.modalComponent.onOpen(config, style);
      this.checkTranslationChange();
    }

    // Checks the component's response and initializes them

    if (        
        (this.settings.activeComponent === 'ServiceOrders/Filters' && this.filtersComponent) ||
        ((this.settings.activeComponent === 'ServiceOrders/Create') && this.registerComponent) ||
        (this.settings.activeComponent === 'ServiceOrders/Read') ||
        ((this.settings.activeComponent === 'ServiceOrders/Update') && this.registerComponent) ||
        ((this.settings.activeComponent === 'ServiceOrders/Cancel'))
    ) {

      if (this.settings.activeComponent === 'ServiceOrders/Filters' && this.filtersComponent) {
        this.filtersComponent.bootstrap(settings);
      }

      if (
        ((this.settings.activeComponent === 'ServiceOrders/Create') && this.registerComponent) ||
        ((this.settings.activeComponent === 'ServiceOrders/Update') && this.registerComponent)
      ) {
        this.registerComponent.bootstrap({ data: settings.data, action: this.settings.activeComponent.split("/")[1] });
      }
    }

    // Check when the translation changes

    Utilities.loading(false);
  }  

  public onClose(standard: boolean = false) {

    if (!standard) {
      this.modalComponent.onClose();
    }

    this.settings = {};

    this.settingsService.removeListeners("ServiceOrdersModalComponent", "service-orders-settings");
    Dispatch.removeListeners('languageChange', 'ServiceOrdersModalComponent');
  }

  public checkNf(){

    const item = this.settings.sale;

    if (Utilities.isFiscal && item){

      if (item.nf){

        const hasService = item.service && item.service.types ? item.service.types.length > 0 : false;
        const hasProducts = item.products ? item.products.length > 0 : false;

        if (typeof item.nf.status == "object"){
          if (item.nf && item.nf.status.nf && item.nf.status.nf != "CONCLUIDO"){
            return true;
          }
  
          if (item.nf && item.nf.status.nfse && item.nf.status.nfse != "CONCLUIDO"){
            return true;
          }
  
          if (item.nf && item.nf.status.nfse && item.nf.status.nfse == "CONCLUIDO" && item.nf.status.nf && item.nf.status.nf == "CONCLUIDO"){
            return false;
          }
  
          if (item.nf && !item.nf.conjugated && hasService && !item.nf.id.nfse){
            return true
          }
        }else{

          return false;
        }

      }else if (this.settings.data.paymentStatus == "CONCLUDED"){
        return true;
      }else{
        return false;
      }

      // return  this.permissions.emitNf && !item.nf || this.permissions.emitNf && item.nf && ;
    }else{
      return false;
    }
  }

  // Event Listeners

  public onModalResponse(event: any) {

    if (event.instance) {
      this.modalComponent = event.instance;
    }

    if (event.close) {
      this.onClose(true);
    }
  }

  public onFiltersResponse(event: any) {}

  public onRegisterResponse(event: any) {
    if (event.close) {
      this.onClose();
    }
  }
  
  public onPrintResponse(event: any) { }

  public onResponseRegisterNf(event){
    if (event.print){
      this.onClose();
    }
  }
  
  // Auxiliary Methods

  private restructureChecklist(data: any) {

    const checklist = Utilities.deepClone(data);

    $$(checklist).map((_, item) => {

      item.checked = false;

      if (item.subchecklist && item.subchecklist.length > 0) {

        const subchecklist: any = [];

        $$(item.subchecklist).map((_, item) => {
          subchecklist.push({ name: item, checked: false });
        });

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

          if (itemNV1.name == itemNV2.name && itemNV2.checked == undefined || itemNV1.name == itemNV2.name && itemNV2.checked) {

            itemNV1.checked = true;

            if (itemNV1.subchecklist) {              
              $$(itemNV1.subchecklist).map((_, sub) => { 
                sub.checked = (itemNV2.subchecklist.indexOf(sub.name) != -1);
              });
            }
          }
        });
      });

      this.settings.data.checklist = this.settings.checklist;

      delete this.settings.checklist;
    }
  }

  private checkTranslationChange() {

    const setTitle = () => {

      if (this.modalComponent) {

        if (this.settings.activeComponent == 'ServiceOrders/Filters') {
          this.modalComponent.title = this.translate.filters.title;
        }            

        if (this.settings.activeComponent == 'ServiceOrders/Create') {
          this.modalComponent.title = this.translate.action.register.type.create.title;
        } 
        
        if (this.settings.activeComponent == 'ServiceOrders/Read') {
          this.modalComponent.title = this.translate.action.read.title;
        }

        if (this.settings.activeComponent == 'ServiceOrders/Update') {
          this.modalComponent.title = this.translate.action.register.type.update.title;
        } 

        if (this.settings.activeComponent == 'ServiceOrders/Cancel') {
          this.modalComponent.title = this.translate.action.cancel.title;
        }

        if (this.settings.activeComponent == 'ServiceOrders/Delete') {
          this.modalComponent.title = this.translate.action.delete.title;
        }

        if (this.settings.activeComponent === 'ServiceOrders/UpdateStatus') {
          this.modalComponent.title = this.translate.action.updateStatus.title;
        }
      }
    };   
        
    Dispatch.onLanguageChange('ServiceOrdersModalComponent', () => {
      setTitle();
    });
    
    setTitle();
  }


  private checkSubmit(){
    if((<any>this).settings._isSubmited){ return true; }
    (<any>this).settings._isSubmited = true;
    return false;
  }

  // Destruction Method

  public ngOnDestroy() {

    this.settings = {};

    this.modalComponent = null;
    this.filtersComponent = null;
    this.registerComponent = null;
    this.printComponent = null;

    Dispatch.removeListeners('languageChange', 'ServiceOrdersModalComponent');
  }

}
