import { Component, Output, EventEmitter, OnInit } from '@angular/core';

// Utilities
import { $$ } from '@shared/utilities/essential';
import { Utilities } from '@shared/utilities/utilities';
import { DateTime } from '@shared/utilities/dateTime';

// Tools
import * as pdf from 'html2pdf.js';

@Component({
  selector: 'generate-tickets-print',
  templateUrl: './print.component.html'
})
export class GenerateTicketsPrintComponent implements OnInit {

  @Output() callback: EventEmitter<any> = new EventEmitter();

  public settings: any = {};

  public ngOnInit() {
    this.callback.emit({ instance: this });  
  }

  // User Interface Actions

  public onLaunchPrint(settings: any = {}): Promise<void> {

    Utilities.loading();

    this.settings = settings;

    return (new Promise((resolve, reject) => {

      setTimeout(() => {
        
        const newWin = window.frames['printingFrame'];

        if (newWin) {
          newWin.document.write($$('#printingFrame').html());
          newWin.document.close();
        }

        const handler = () => {
          
          const container: Element = newWin.document.getElementById('container');
          const id = ((settings.fileIndex + 1) < 9) ? ('0' + (settings.fileIndex + 1)) : (settings.fileIndex + 1);

          const options = {
            filename: `Etiquetas-${id}-(${DateTime.formatDate(DateTime.getDate()).date}).pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {},
            jsPdf: { 
              format: 'A4',
              orientation: 'portrait',
              compressPDF: true,
              quality: 100
            },
            pagebreak: { 
              mode: '',
              before: '.before',
              after: '.after',
              avoid: '.avoid'
            }
          };
    
          pdf().from(container).set(options).save().then(() => {            
            Utilities.loading(false);
            resolve();              
          }).catch((e) => {
            Utilities.loading(false);
            reject(e);
          });

          $$(newWin.frameElement).off('load', handler);
        }

        $$(newWin.frameElement).on('load', handler);
      }, 500);
    }));       
  }
  
}
