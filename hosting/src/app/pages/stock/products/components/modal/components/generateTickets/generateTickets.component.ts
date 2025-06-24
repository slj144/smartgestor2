import { Component, Output, EventEmitter, OnInit } from '@angular/core';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { FieldMask } from '@shared/utilities/fieldMask';

@Component({
  selector: 'generate-tickets',
  templateUrl: './generateTickets.component.html',
  styleUrls: ['./generateTickets.component.scss']
})
export class GenerateTicketsComponent implements OnInit {

  @Output() callback: EventEmitter<any> = new EventEmitter(); 
 
  public settings: any = {};  
  public checkBootstrap: boolean = false;
  public productsData: any = [];

  private layerComponent: any;
  private printComponent: any;
  private productsComponent: any;

  public ngOnInit() {
    this.callback.emit({ instance: this });
  }

  // Initialize Method

  public bootstrap(settings: any = {}) {

    this.settings = settings;

    this.settings.tickets = {
      name: true, price: true, barcode: true
    };

    this.settings.statistics = {
      tickets: 0, pages: 0, files: 0
    };

    setTimeout(() => {
      this.checkBootstrap = true;    
    }, 500);
  }

  // User Interface Actions

  public onToggleTicketData(target: string) {
    this.settings.tickets[target] = !this.settings.tickets[target];
  }

  public onRemoveProductItem(index: number) {

    this.productsData[index].selected = false;
    this.productsData.splice(index, 1);

    this.toggleContainerFloat();
  }

  public onGenerateTickets() {

    const that = this;

    // Configure tags

    const tickets = [];

    for (const item of this.productsData) {

      for (let i = 0; i < item.ticketsQuantity; i++) {

        tickets.push({
          name: (this.settings.tickets.name ? item.name : null),
          price: (this.settings.tickets.price ? item.salePrice : null),
          barcode: (this.settings.tickets.barcode ? item.barcode : null)
        });
      }     
    }

    // Configure pages
    
    const pages = [];
    const quantityPerSheet = 33;
    const quantityOfLeaves = Math.ceil(tickets.length / quantityPerSheet);    

    for (let p = 0; p < quantityOfLeaves; p++) {
      pages[p] = tickets.slice((p * quantityPerSheet), ((p+1) * quantityPerSheet));
    }    

    // Configure files

    const files = [];
    const pageLimit = 10;
    const quantityOfFiles = Math.ceil(quantityOfLeaves / pageLimit);

    for (let f = 0; f < quantityOfFiles; f++) {
      files[f] = (pages.slice((f * pageLimit), ((f+1) * pageLimit)));
    }

    // Configure print queue

    let currentIndex = 0;

    function generate(data) {

      that.printComponent.onLaunchPrint({        
        formatCode: 'Pimaco - A4056/A4256/A4356/A4056R',
        fileIndex: currentIndex,
        pages: data
      }).then(() => {

        currentIndex += 1;

        if (currentIndex < (files.length)) {
          generate(files[currentIndex]);
        } else {
          that.resetComponent();
        }
      });
    }

    generate(files[currentIndex]);
  }

  // Layer Actions

  public onOpenLayer(type: string) {

    let title = '';

    switch (type) {
      case 'Products':
        title = 'Products';
        break
    }

    this.layerComponent.onOpen({
      title: 'Products',
      activeComponent: type
    });
  }

  // Event Listeners

  public onLayerResponse(event: any) {

    if (event.instanceMain) {
      this.layerComponent = event.instanceMain;
    }

    if (event.instance) {
      this.productsComponent = event.instance;
    }

    if (event.productsData) {

      console.log(event.productsData);

      this.productsData = event.productsData;
    }

    this.toggleContainerFloat();
  }

  public onPrintResponse(event: any) {

    if (event.instance) {
      this.printComponent = event.instance;
    }   
  }

  // Auxiliary Methods

  public onApplyNumberMask(event: any, item: any, target: string) {

    const value = FieldMask.numberFieldMask($$(event.target)[0].value);

    $$(event.target).val(value);

    if (target == 'quantity') { 
      item.ticketsQuantity = (value ? parseInt(value) : 0);
    }

    this.composeStatistics();
  }

  public resetComponent() {

    this.productsData = [];

    this.settings.tickets = {
      name: true, price: true, barcode: true
    };

    $$('.container-float').css({ display: 'none' });
    $$('.container-products').css({ marginBottom: '0' });

    this.layerComponent.onClose();

    if (this.productsComponent) {
      this.productsComponent.resetData();
    }    
  }

  public composeStatistics() {

    this.settings.statistics = {
      tickets: 0, pages: 0, files: 0
    };

    for (const item of this.productsData) {
      this.settings.statistics.tickets += item.ticketsQuantity;
    }

    const calcPages = Math.ceil(this.settings.statistics.tickets / 33);

    this.settings.statistics.pages = ((calcPages < 10) ? calcPages : 10);
    const value = Math.ceil(calcPages / this.settings.statistics.pages);
    this.settings.statistics.files = isNaN(value) ? 0 : value;
  }

  private toggleContainerFloat() {

    const timer = setInterval(() => {

      const containerFloat = $$('.container-float');
      const containerProducts = $$('.container-products');

      if (containerFloat.length > 0 && containerProducts.length > 0) {
        clearInterval(timer);
        
        this.composeStatistics();

        if ((this.productsData).length > 0) {
          containerFloat.css({ display: 'block' });
          containerProducts.css({ marginBottom: `${(containerFloat.height() + 10)}px` });
        } else {
          containerFloat.css({ display: 'none' });
          containerProducts.css({ marginBottom: '0' });
        }
      }
    }, 0);
  }

}
