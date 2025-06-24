/*
  📁 ARQUIVO: cashier-pdv.translate.ts
  📂 LOCALIZAÇÃO: src/app/pages/cashier/cashier-front/components/cashier-pdv/
  🎯 FUNÇÃO: Arquivo de traduções do componente PDV (Português e Inglês)
  ✨ MODIFICAÇÃO: Adicionado traduções para o campo de garantia
*/

import { ProjectSettings } from "../../../../../../assets/settings/company-settings";
import { Utilities } from "@shared/utilities/utilities";

export class CashierFrontPDVTranslate {

  private static obj = {
    'pt_BR': {
      componentTitle: 'Ponto de Venda',
      panel: {
        customer: {
          title: 'Cliente',
          label: {
            name: 'Nome',
            address: 'Endereço',
            phone: 'Telefone'
          }
        },
        member: {
          title: 'Membro',
          label: {
            name: 'Nome',
            address: 'Endereço',
            phone: 'Telefone'
          }
        },
        services: {
          title: 'Serviços',
          label: {
            code: 'Código',
            name: 'Nome',
            price: `Price (${Utilities.currencySymbol})`
          }
        },
        products: {
          title: 'Produtos',
          quickSearch: {
            placeholder: 'Código'
          },
          label: {
            code: 'Código',
            name: 'Nome',
            quantity: 'Quantidade',
            price: `Preço (${Utilities.currencySymbol})`,
            total: `Total (${Utilities.currencySymbol})`
          }
        },
        paymentMethods: {
          title: 'Meios de Pagamento',
          label: {
            value: `Valor (${Utilities.currencySymbol})`,
            parcels: 'Parcelas',
            note: 'Observação',
            info: {
              received: 'Valor recebido',
              pendent: "Valor pendente",
              allPaid: "O(s) valor(es) correspondem exatamente ao total da venda.",
              overplus: (value: number) => { return "O valor está incorreto. Por favor, retire " + value + " do(s) métodos."; }
            },

          }
        },
        settings: {
          title: 'Configurações',
          option: {
            fee: {
              label: 'Taxa'
            },
            // 🆕 TRADUÇÕES ADICIONADAS PARA GARANTIA
            warranty: {
              label: 'Garantia',
              placeholder: 'Ex: 6 meses, 1 ano, 10.000 km'
            }
          }
        },
        balance: {
          label: {
            subtotal: {
              title: 'Subtotal',
              integrant: {
                products: 'Produtos',
                services: 'Serviços',
                discount: 'Desconto',
                fee: "Taxa"
              }
            },
            total: 'Total'
          }
        },
        button: {
          register: 'Registrar'
        }
      },
      layer: {
        members: { title: 'Membros' },
        customers: { title: 'Clientes' },
        products: { title: 'Produtos' },
        paymentMethods: { title: 'Meios de Pagamento' }
      },
      notification: {
        register: 'A venda foi registrada com sucesso.',
        update: 'A venda foi atualizada com sucesso.',
        delete: 'A venda foi excluída com sucesso.',
        error: 'Houve um erro inesperado. Por favor, tente novamente.'
      },
      systemLog: {
        register: 'Registro de venda.',
        update: 'Atualização de venda.',
        delete: 'Exclusão de venda.'
      }
    },
    'en_US': {
      componentTitle: 'Point of Sale',
      panel: {
        customer: {
          title: 'Customer',
          label: {
            name: 'Name',
            address: 'Address',
            personalDocument: 'SSN',
            businessDocument: 'CNPJ',
            phone: 'Phone'
          }
        },
        member: {
          title: 'Member',
          label: {
            name: 'Name',
            address: 'Address',
            personalDocument: 'SSN',
            businessDocument: 'CNPJ',
            phone: 'Phone'
          }
        },
        services: {
          title: 'Services',
          label: {
            code: 'Código',
            name: 'Nome',
            price: `Price (${Utilities.currencySymbol})`
          }
        },
        products: {
          title: 'Products',
          quickSearch: {
            placeholder: 'Code'
          },
          label: {
            code: 'Code',
            name: 'Name',
            quantity: 'Quantity',
            price: `Price (${Utilities.currencySymbol})`,
            total: `Total (${Utilities.currencySymbol})`
          }
        },
        paymentMethods: {
          title: 'Payment Methods',
          label: {
            value: `Value (${Utilities.currencySymbol})`,
            parcels: 'Parcels',
            note: 'Note',
            info: {
              received: 'Amount received',
              pendent: "Amount pendent",
              allPaid: "O(s) valor(es) correspondem exatamente ao total da venda.",
              overplus: (value: number) => { return "O valor está incorreto. Por favor, retire " + value + " do(s) métodos."; }
            }
          }
        },
        settings: {
          title: 'Settings',
          option: {
            fee: {
              label: 'Fee'
            },
            // 🆕 TRADUÇÕES EM INGLÊS PARA GARANTIA
            warranty: {
              label: 'Warranty',
              placeholder: 'Ex: 6 months, 1 year, 10,000 km'
            }
          }
        },
        balance: {
          label: {
            subtotal: {
              title: 'Subtotal',
              integrant: {
                products: 'Products',
                services: 'Services',
                discount: 'Discount',
                fee: "Fee"
              }
            },
            total: 'Total'
          }
        },
        button: {
          register: 'Register'
        }
      },
      layer: {
        members: { title: 'Members' },
        customers: { title: 'Customers' },
        products: { title: 'Products' },
        paymentMethods: { title: 'Payment Methods' }
      },
      notification: {
        register: 'The sale was successfully registered.',
        update: 'The sale was successfully updated.',
        delete: 'The sale was successfully deleted.',
        error: 'There was an unexpected error. Please try again.'
      },
      systemLog: {
        register: 'Sale registration.',
        update: 'Sale update.',
        delete: 'Sale exclusion.'
      }
    }
  }

  public static get(language?: string) {
    return CashierFrontPDVTranslate.obj[language ?? window.localStorage.getItem('Language') ?? ProjectSettings.companySettings().language];
  }

}