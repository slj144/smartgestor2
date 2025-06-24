// Arquivo: selector.component.ts
// Localização: src/app/pages/stock/products/components/selector/selector.component.ts

import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

// Services
import { ProductsService } from '../../products.service';
import { AlertService } from '@shared/services/alert.service';

// Translate
import { ProductsSelectorTranslate } from './selector.translate';

// Interfaces
import { IStockProduct } from '@shared/interfaces/IStockProduct';

// Types
import { query } from '@shared/types/query';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';

@Component({
  selector: 'products-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss']
})
export class ProductsSelectorComponent implements OnInit {

  @Output() callback: EventEmitter<any> = new EventEmitter();
  @ViewChild('searchBar', { static: true }) searchBar: ElementRef;

  public static shared: ProductsSelectorComponent;

  public translate = ProductsSelectorTranslate.get();

  public loading: boolean = false;
  public filtersBadge: number = 0;
  public settings: any = {};
  public recordsData: any = [];
  public searchText: string = '';
  public productsPreSelected: any = [];
  public productsSelected: any = [];

  constructor(
    private productsService: ProductsService,
    private alertService: AlertService
  ) {
    ProductsSelectorComponent.shared = this;
  }

  public ngOnInit() {
    this.callback.emit({ instance: this });
  }

  // Initialize Method

  public bootstrap(settings: { selectAll?: boolean, alertOutStock?: boolean }) {

    this.settings = (settings || {});
    this.settings.additional = this.settings.additional || {};
    this.settings.alertOutStock = this.settings.alertOutStock == undefined ? true : !!this.settings.alertOutStock;

    $$(this.searchBar.nativeElement).find('input')[0].focus();
  }

  // Filter Methods

  public onFilter() {

  }

  public onSearch(settings?: { where: query['where'], data?: any }, scanner?: boolean, alertOutStock: boolean = true, alertNotFound: boolean = true): Promise<IStockProduct[]> {

    return (new Promise((resolve, reject) => {

      const value = $$(this.searchBar.nativeElement).find('input').val().toLowerCase();

      if (!settings || !settings.where) {

        if (value != '') {

          this.loading = true;

          const values = [];
          let queryString = "";

          value.split(';').map((v) => {
            if (v.trim()) {
              values.push(v.trim().toLowerCase());
            }
          });

          settings = { where: [] };

          $$(values).map((_, value) => {

            if (!isNaN(parseInt(value))) {

              if (value.length < 13) {
                settings.where.push({ field: 'code', operator: '=', value: parseInt(value) });
              } else {
                settings.where.push({ field: 'barcode', operator: '=', value: String(value) });
              }
            }

            if (isNaN(parseInt(value))) {

              let parts = value.split("*")
              const startString = parts[0].trim();
              parts.shift();

              queryString += startString;

              parts.forEach((str) => {
                str = str.trim().replaceAll(/\-/g, "\-").replaceAll(/\\/g, "\\").replaceAll(/\//g, "\/").replaceAll(/\_/g, "\_").replaceAll(/\%/g, "\%").replaceAll(/\$/g, "\$").replaceAll(/\@/g, "\@").replaceAll(/\!/g, "\!").replaceAll(/\(/g, "\(").replaceAll(/\)/g, "\)").replaceAll(/\[/g, "\[").replaceAll(/\]/g, "\_").replaceAll(/\{/g, "\{").replaceAll(/\}/g, "\}").replaceAll(/\:/g, "\:").replaceAll(/\,/g, "\,").replaceAll(/\./g, "\.");
                queryString += "[\\w\\W\\s]*" + `${str}`
              });

              if (queryString.length > 0) {
                queryString += "[\\w\\W\\s]*";
                settings.where.push({ field: 'name', operator: 'like', value: new RegExp(queryString, 'gi') });
              }
            }
          });

        } else {

          this.recordsData = [];
          this.searchText = '';

          return;
        }
      }

      this.productsService.query(settings.where, false, true, false, false).then((data) => {

        if (data.length > 0) {

          $$(data).map((key, item) => {
            if (item._isDisabled) { data.splice(key, 1) }
          });

          if (scanner) {

            $$(data).map((_, item) => {

              $$(this.productsSelected).map((_, product) => {

                if (item.code == product.code) {

                  if (product.selectedItems < item.quantity) {
                    product.selectedItems += 1;
                  }
                }
              });

              this.onSelectProduct(item, false, alertOutStock);
            });
          }
        } else if (alertNotFound) {

          this.alertService.alert(this.translate.alert.notFound, 'warning');
        }

        this.recordsData = data;
        this.searchText = value;

        this.loading = false;

        resolve(data);
      }).catch((error) => {
        reject(error);
      });
    }));
  }

  // Operating Actions

  public onResetSearchBar() {

    this.recordsData = [];
    this.searchText = '';

    $$(this.searchBar.nativeElement).find('input').val('');
  }

  public onSelectProduct(data: any, preSelect: boolean = false, alertOutStock: boolean = true) {

    this.settings.alertOutStock = this.settings.alertOutStock == undefined ? alertOutStock : !!this.settings.alertOutStock;

    if (preSelect) {
      data.reserve = data.selectedItems;
    } else {

      if (!this.settings.selectAll && (data.quantity <= 0) && this.settings.alertOutStock) {
        this.alertService.alert(this.translate.alert.outOfStock, 'warning');
        return;
      }
    }

    if (this.productsSelected.length > 0) {

      let index = -1;
      let c = 0;

      for (const item of this.productsSelected) {
        if (item.code == data.code) { index = c }
        c++;
      }

      if (index == -1) {
        this.productsSelected.push(data);
        data.selected = true;
      }
    } else {
      this.productsSelected.push(data);
      data.selected = true;
    }

    for (let item of this.productsSelected) {
      item.selectedItems = (item.selectedItems || 1);
    }

    this.callback.emit({ data: this.productsSelected, additional: this.settings.additional });
  }

  public onDeselectProduct(data: IStockProduct) {

    const productsSelected = [];

    for (let item of this.productsSelected) {
      if (item.code != data.code) {
        productsSelected.push(item);
      }
    }

    data.selected = false;
    delete data.selectedItems;

    this.productsSelected = productsSelected;

    this.callback.emit({ data: this.productsSelected, additional: this.settings.additional });
  }

  // Auxiliary Methods

  public selectProducts(data: any[]) {

    const settings: { where: query['where'] } = { where: [] };

    $$(data).map((_, item) => {
      settings.where.push({ field: 'code', operator: '=', value: parseInt(item.code) });
    });

    this.onSearch(settings).then((result) => {

      const products = (() => {

        let obj = {};

        $$(data).map((_, item) => {
          item.code = Utilities.prefixCode(item.code);
          obj[item.code] = item;
        });

        return obj;
      })();

      $$(result).map((_, item) => {

        const product = products[item.code];

        item.code = Utilities.prefixCode(item.code);
        item.costPrice = product.costPrice;
        item.selectedItems = product.quantity;
        item.unitaryPrice = product.unitaryPrice;
        item.salePrice = product.salePrice;

        this.onSelectProduct(item, true);
      });
    });
  }

  // MÉTODO NOVO - Limpa completamente a seleção de produtos
  public clearSelection() {
    // Limpa os arrays de produtos selecionados
    this.productsSelected = [];
    this.productsPreSelected = [];

    // Limpa a propriedade selected de todos os produtos na lista
    if (this.recordsData && this.recordsData.length > 0) {
      this.recordsData.forEach((product: any) => {
        if (product.selected) {
          product.selected = false;
        }
        if (product.selectedItems) {
          delete product.selectedItems;
        }
        if (product.reserve) {
          delete product.reserve;
        }
      });
    }

    // Limpa checkboxes e classes CSS via DOM
    setTimeout(() => {
      try {
        // Busca todos os checkboxes marcados no componente
        const checkboxes = document.querySelectorAll('products-selector input[type="checkbox"]:checked');
        checkboxes.forEach((checkbox: any) => {
          checkbox.checked = false;
          // Dispara evento de mudança para atualizar o estado visual
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // Remove classes de seleção das linhas da tabela
        const selectedRows = document.querySelectorAll('products-selector .selected, products-selector tr.active, products-selector tr.bg-light');
        selectedRows.forEach(row => {
          row.classList.remove('selected', 'active', 'bg-light');
        });

        // Remove qualquer outro indicador visual de seleção
        const selectedItems = document.querySelectorAll('products-selector .item-selected, products-selector .product-selected');
        selectedItems.forEach(item => {
          item.classList.remove('item-selected', 'product-selected');
        });

      } catch (e) {
        console.log('Erro ao limpar elementos DOM:', e);
      }
    }, 100);

    // Emite evento informando que a seleção foi completamente limpa
    this.callback.emit({ data: [] });
  }

  // Utility Methods - MÉTODO ATUALIZADO
  public reset() {
    // Chama o método clearSelection para limpar tudo
    this.clearSelection();

    // Limpa também os dados de busca se necessário
    this.recordsData = [];
    this.searchText = '';

    // Limpa o campo de busca
    if (this.searchBar && this.searchBar.nativeElement) {
      $$(this.searchBar.nativeElement).find('input').val('');
    }

    // Reseta configurações
    this.settings = {};
    this.filtersBadge = 0;
    this.loading = false;
  }

}