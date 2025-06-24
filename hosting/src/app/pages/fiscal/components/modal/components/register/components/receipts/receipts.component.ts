import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef } from '@angular/core';

// Translate
import { ServiceOrdersReceiptsTranslate } from './receipts.translate';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { FiscalService } from '../../../../../../fiscal.service';

@Component({
  selector: 'nf-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.scss']
})
export class NfReceiptsComponent implements OnInit {

  @Output() callback: EventEmitter<any> = new EventEmitter();
  @ViewChild('modal', { static: true }) modal: ElementRef;

  public static shared: NfReceiptsComponent;

  public translate = ServiceOrdersReceiptsTranslate.get();

  public loading: any = true;
  public settings: any = {};

  private receiptPrintComponent: any;

  constructor(
    private fiscalServicce: FiscalService
  ) {
    NfReceiptsComponent.shared = this;
  }

  public ngOnInit() {
    this.callback.emit({ instance: this });
  }

  // User Interface Actions 

  public onDownload(ftype, nftype) {

    this.fiscalServicce.downloadNote(this.settings.data.nf.type[nftype], ftype, this.settings.data.nf.id[nftype]).then((res) => { }).catch((error) => {
      console.log("error: ", error);
    });

    this.onClose();
  }
  public onShareWhatsApp() {
    const phone = this.settings?.data?.customer?.phone?.replace(/\D/g, '');
    if (!phone) {
      console.warn('Cliente sem telefone para WhatsApp');
      return;
    }
    const message = encodeURIComponent('Segue seu comprovante.');
    const url = `https://wa.me/55${phone}?text=${message}`;
    window.open(url, '_blank');
    this.onClose();
  }

  // Modal Actions

  public onOpen(settings: any = {}) {

    this.settings = settings;
    $$(this.modal.nativeElement).css({ display: 'block' });
  }

  public onClose() {

    this.loading = true;
    $$(this.modal.nativeElement).css({ display: 'none' });
  }

}
