import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import readXlsxFile from 'read-excel-file';

// Services
import { DataImportService } from './dataImport.service';
import { ProductsService } from '../../../../products.service';
import { ProductCategoriesService } from '../../../../../../registers/_aggregates/stock/product-categories/product-categories.service';
import { ProductCommercialUnitsService } from '../../../../../../registers/_aggregates/stock/product-commercial-units/product-commercial-units.service';
import { ProvidersService } from '../../../../../../registers/providers/providers.service';

// Interfaces
import { EStockLogAction } from '@shared/interfaces/IStockLog';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { IStockProduct } from '@shared/interfaces/IStockProduct';
import { EPersonType } from '@shared/enum/EPersonType';
import { IToolsService } from '@shared/services/iTools.service';
import { iTools } from '@itools/index';
import { DateTime } from '@shared/utilities/dateTime';

@Component({
  selector: 'data-import',
  templateUrl: './dataImport.component.html',
  styleUrls: ['./dataImport.component.scss']
})
export class DataImportComponent implements OnInit {

  @Output() public callback: EventEmitter<any> = new EventEmitter(); 
 
  public settings: any = {};
  public productsCategories: any = {};
  public productsCommercialUnits: any = {};
  public productsProviders: any = {};

  public checkBootstrap: boolean = false;

  private checkFileUrl: boolean = false;
  private checkProductsCategories: boolean = false;
  private checkProductsCommercialUnits: boolean = false;
  private checkProductsProviders: boolean = false;

  constructor(
    private dataImportService: DataImportService,
    private productsService: ProductsService,
    private productCategoriesService: ProductCategoriesService,
    private productCommercialUnitsService: ProductCommercialUnitsService,
    private productProvidersService: ProvidersService,
    private itoolsService: IToolsService
  ) {}

  public ngOnInit() {

    this.checkFileUrl = true; // Temp

    this.dataImportService.getFileUrl().subscribe((url) => {

      this.settings.model = {
        fileName: 'Planilha de Importacao', fileLink: url
      };

      this.checkFileUrl = true;
    });

    this.productCategoriesService.getCategories('DataImportComponent', (data) => {

      const obj: { [key:number]: IStockProduct['category'] } = {}

      $$(data).map((_, item) => {
        obj[parseInt(<string>item.code)] = {
          _id: item._id, code: item.code,
          name: item.name
        };
      });

      this.productsCategories = obj;
      this.checkProductsCategories = true;
    });

    this.productCommercialUnitsService.getUnits('DataImportComponent', (data) => {

      const obj: { [key:number]: IStockProduct['commercialUnit'] } = {}

      $$(data).map((_, item) => {
        obj[parseInt(<string>item.code)] = {
          _id: item._id, code: item.code,
          name: item.name, symbol: item.symbol
        };
      });

      this.productsCommercialUnits = obj;
      this.checkProductsCommercialUnits = true;
    });

    this.productProvidersService.getProviders('DataImportComponent', (data) => {

      const obj: { [key:number]: IStockProduct['provider'] } = {}

      $$(data).map((_, item) => {

        obj[parseInt(<string>item.code)] = {
          _id: item._id, code: item.code,
          name: item.name
        };

        if (item.address) {
          obj[parseInt(<string>item.code)].address = item.address;
        }

        if (item.contacts && item.contacts.email) {
          obj[parseInt(<string>item.code)].email = item.contacts.email;
        }

        if (item.contacts && item.contacts.phone) {
          obj[parseInt(<string>item.code)].phone = item.contacts.phone;
        }

        if (item.lastSupply) {
          obj[parseInt(<string>item.code)].lastSupply = item.lastSupply;
        }
      });

      this.productsProviders = obj;
      this.checkProductsProviders = true;
    });

    this.callback.emit({ instance: this });
  }

  // Getter and Setter Methods

  public get isMatrix() {
    return (Utilities.storeID == 'matrix');
  }

  // Initialize Method

  public bootstrap() {

    const timer = setInterval(() => {

      if (
        this.checkFileUrl && this.checkProductsCategories &&
        this.checkProductsCommercialUnits && this.checkProductsProviders        
      ) {

        clearInterval(timer);

        this.checkBootstrap = true;

        this.settings.informations = {
          mode: 'register', data: [], errors: [], valid: false
        };


        // console.log(this.settings);
        
        $$('#inputXLSFile').val('');
      }
    }, 200);
  }

  // User Interface Actions

  public onChangeSelect(event) {

    $$('#inputXLSFile').val('');
    
    this.settings.informations.mode = event.currentTarget.value;
    this.settings.informations.valid = false;
  }

  public parseCurrencyToNumber(value: string){
    return parseFloat(value.toString().replace(/\./g,'').replace(',','.'));
  }

  public onChangeInput(event) {

    const file: File = event.currentTarget.files[0];

    this.settings.informations.errors = [];
    this.settings.informations.valid = false;

    if (file) {

      if (file.type != 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        
        event.currentTarget.value = '';

        alert('O arquivo não é compatível. Selecione um arquivo com extensão ".xlsx".');
        return;
      }

      let schema = {};

      if (this.isMatrix) {

        const checkRequired = (this.settings.informations.mode == 'register');     
        // const checkRequired = (this.settings.informations.mode == 'create/update');     

        schema = {
          'CODIGO':             { prop: 'code', type: String, required: this.settings.informations.mode == "update", parse: (value) => this.checkString(value) },
          'NOME':               { prop: 'name', type: String, required: checkRequired, parse: (value) => this.checkString(value) },
          'NUMERO DE SERIE':    { prop: 'serialNumber', type: String, required: false, parse: (value) => this.checkString(value) },
          'QUANTIDADE':         { prop: 'quantity', type: Number, required: checkRequired, parse: (value) => this.checkNumber(value, 'integer') },
          'ALERTA':             { prop: 'alert', type: String, required: checkRequired, parse: (value) => this.checkNumber(value, 'integer') },
          'PRECO DE CUSTO':     { prop: 'costPrice', type: Number, required: checkRequired, parse: (value) => this.checkNumber(value, 'float') },
          'PRECO DE VENDA':     { prop: 'salePrice', type: Number, required: checkRequired, parse: (value) => this.checkNumber(value, 'float') },          
          'CATEGORIA':          { prop: 'category', type: String, required: checkRequired, parse: (value) => this.checkValue(value, 'category') },
          'TIPO':  { prop: 'commercialUnit', type: String, required: checkRequired, parse: (value) => this.checkValue(value, 'commercialUnit') },
          'FORNECEDOR':         { prop: 'provider', type: String, required: false, parse: (value) => this.checkValue(value, 'provider') },
          'CODIGO DE BARRAS':   { prop: 'barcode', type: String, required: false, parse: (value) => this.checkString(value) }          
        };
      } else {

        schema = {
          'CODIGO':             { prop: 'code', type: String, required: true },
          'QUANTIDADE':         { prop: 'quantity', type: Number, required: false, parse: (value) => this.checkNumber(value, 'integer') },
          'ALERTA':             { prop: 'alert', type: String, required: false, parse: (value) => this.checkNumber(value, 'integer') },
          'PRECO DE CUSTO':     { prop: 'costPrice', type: Number, required: false, parse: (value) => this.checkNumber(value, 'float') },
          'PRECO DE VENDA':     { prop: 'salePrice', type: Number, required: false, parse: (value) => this.checkNumber(value, 'float') }
        };
      }

      readXlsxFile(file, { schema }).then((data) => {

        const errors = data.errors;

        if (errors.length == 0) {

          if ((data.rows).length > 0) {            
            this.settings.informations.data = data.rows;
            this.settings.informations.valid = true;
          } else {
            alert('O arquivo selecionado não possui dados. Por favor, insira dados ou escolha outro arquivo.');
          }            
        } else {

          for (const item of errors) {

            switch (item.error) {
              case 'required':
                this.settings.informations.errors.push(
                  ` Linha - ${(item.row + 1)} / Coluna - <b>${item.column}</b> - O campo é requerido.`
                );
                break;
              case 'invalid':
                this.settings.informations.errors.push(
                  ` Linha - ${(item.row + 1)} / Coluna - <b>${item.column}</b> - O campo possui valor inválido.`
                );
                break;
              case 'nonexistent':
                this.settings.informations.errors.push(
                  ` Linha - ${(item.row + 1)} / Coluna - <b>${item.column}</b> - O código ${item.value} não está cadastrado.`
                );
                break;
            }
          }
        }
      });
    }   
  }

  public onClearInput(event) {

    event.currentTarget.value = '';

    this.settings.informations.data = [];
    this.settings.informations.errors = [];
    this.settings.informations.valid = false;
  }

  public onImport() {

    let data = this.settings.informations.data;
    
    if(!Utilities.isMatrix){
      data = data.map((item)=>{

        const obj: any =  {
          code: parseInt(item.code),
          branches: {}
        };

        obj.branches[Utilities.storeID] = {};
  
        if(item.quantity){
          obj.branches[Utilities.storeID].quantity = item.quantity;
        }
  
        if(item.alert != undefined){
          obj.branches[Utilities.storeID].alert = isNaN(item.alert) ? 0 : item.alert;
        }
  
        if(item.costPrice){
          obj.branches[Utilities.storeID].costPrice = item.costPrice;
        }

        if(item.salePrice){
          obj.branches[Utilities.storeID].salePrice = item.salePrice;
        }

        return obj;
  
      })
    }

    if (data.length > 0) {

      this.productsService.registerProducts(data, null, {action: EStockLogAction.IMPORT}).then(() => {
        this.callback.emit({ close: true });
      });
    }
  }

  // Auxiliary Methods

  private checkString(value: any) {
    return value.toString();
  }

  private checkValue(value: any, type: string) {

    const code = parseInt(<string>value);

    if (!isNaN(code)) {

      if (type == 'category') {

        if (this.productsCategories[code]) {
          return this.productsCategories[code];
        } else {
          throw new Error('NaN');
        }
      }

      if (type == 'commercialUnit') {

        if (this.productsCommercialUnits[code]) {
          return this.productsCommercialUnits[code];
        } else {
          throw new Error('NaN');
        }
      }

      if (type == 'provider') {

        if (this.productsProviders[code]) {
          return this.productsProviders[code];
        } else {
          throw new Error('NaN');
        }
      }
    } else {
      throw new Error('NaN');
    }

    console.log(value, type);
  }

  private checkNumber(value: any, type: string) {

    if (type == 'integer') { value = parseInt(value) }        
    if (type == 'float') { value = parseFloat(value) }

    if (isNaN(value)) { throw new Error('invalid') }

    return value;
  }

}


// 0
// : 
// "Cód. interno"
// 1
// : 
// "Nome"
// 2
// : 
// "Variação"
// 3
// : 
// "Cód. barra"
// 4
// : 
// "Unidade"
// 5
// : 
// "Estoque"
// 6
// : 
// "Estoque min."
// 7
// : 
// "Estoque max."
// 8
// : 
// "Custo unit."
// 9
// : 
// "Custo total"
// 10
// : 
// "Total Loja"
// 11
// : 
// "Total Loja 2"
// 12
// : 
// "Total Varejo"