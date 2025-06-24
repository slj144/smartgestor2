import { ProjectSettings } from "../../../../../../../assets/settings/company-settings";
import { Utilities } from "@shared/utilities/utilities";

export class ReportsFinancesTranslate {

  private static obj = {
    'pt_BR': {
      _general: {
        form: {
          store: {
            title: 'Loja'
          },
          period: {
            title: 'Período',
            label: {
              option: {
                today: 'Hoje',
                currentWeek: 'Esta semana',
                currentMonth: 'Este mês',
                lastMonth: "Mês anterior",
                custom: 'Personalizado'
              },
              start: 'Início',
              end: 'Fim'
            }
          },
          reportType: {
            title: 'Tipo de Relatório'
          },
          reportFields: {
            title: 'Campos do Relatório'
          },
          button: {
            generate: 'Gerar Relatório'
          },
          categories: {
            title: "Categoria",
            list: {
              all: "Todas"
            }
          },
          dateType: {
            title: "Filtrar Pela Data",
            list: {
              all: "Todas"
            }
          }
        },
        layer: {
          titleBar: {
            generated: [ 'Gerado em', 'às' ],
            button: {
              exportXLS: 'Exportar XLS'
            }
          },
          information: {
            label: {
              address: 'Endereço',
              phone: 'Telefone',
              period: [ 'Período', 'à' ]
            }
          },
          warning: {
            noData: 'Nenhum registro foi encontrado para o período selecionado.'
          }
        }
      },
      cashFlow: {
        fields: {
          default: {
            date: { external: 'Data', internal: 'Data' },
            cashierResult: { external: 'Caixa', internal: `Caixa (${Utilities.currencySymbol})` },
            servicesOrdersResults: { external: 'Ordens de Serviço', internal: `Ordens de Serviço (${Utilities.currencySymbol})` },
            billsToReceiveResult: { external: 'Contas a Receber', internal: `Contas a Receber (${Utilities.currencySymbol})` },
            billsToPayResult: { external: 'Contas a Pagar', internal: `Contas a Pagar (${Utilities.currencySymbol})` },
            costs: { external: 'Custos', internal: {
              label: `Custos`, 
              sub: {
                products: `Produtos (${Utilities.currencySymbol})`,
                services: `Serviços (${Utilities.currencySymbol})`,
                payments: `Pagamentos (${Utilities.currencySymbol})`,
                total: `Total (${Utilities.currencySymbol})`
              } 
            }},
            billing: { external: 'Faturamento', internal: `Faturamento (${Utilities.currencySymbol})` },
            grossProfit: { external: 'Lucro Bruto', internal: `Lucro Bruto (${Utilities.currencySymbol})` }
          }
        },
        label: {
          total: 'Total'
        }
      },
      billsToPay: {
        types: {
          paidAccounts: 'Contas Pagas',
          pendingAccounts: 'Contas Pendentes',
          overdueAccounts: 'Contas Vencidas',
          canceledAccounts: 'Contas Canceladas'
        },
        fields: {
          paidAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            beneficiary: { external: 'Beneficiário', internal: 'Beneficiário' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dischargeDate: { external: 'Data de Quitação', internal: 'Data de Quitação' },
            installments: { external: 'Parcelamento', internal: 'Parcelamento' },
            discount: { external: 'Desconto', internal: `Desconto (${Utilities.currencySymbol})` },
            interest: { external: 'Juros/Multa', internal: `Juros/Multa (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Valor Pago', internal: `Valor Pago (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          },
          pendingAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            beneficiary: { external: 'Beneficiário', internal: 'Beneficiário' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dueDate: { external: 'Data de Vencimento', internal: 'Data de Vencimento' },            
            installmentsState: { external: 'Parcelamento', internal: 'Parcelamento' },
            installmentValue: { external: 'Valor da Parcela', internal: `Valor da Parcela (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Valor Pago', internal: `Valor Pago (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Valor Pendente', internal: `Valor Pendente (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          },
          overdueAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            beneficiary: { external: 'Beneficiário', internal: 'Beneficiário' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dueDate: { external: 'Data de Vencimento', internal: 'Data de Vencimento' },            
            installmentsState: { external: 'Parcelamento', internal: 'Parcelamento' },
            installmentValue: { external: 'Valor da Parcela', internal: `Valor da Parcela (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Valor Pago', internal: `Valor Pago (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Valor Pendente', internal: `Valor Pendente (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          },
          canceledAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            beneficiary: { external: 'Beneficiário', internal: 'Beneficiário' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dueDate: { external: 'Data de Vencimento', internal: 'Data de Vencimento' },            
            installmentsState: { external: 'Parcelamento', internal: 'Parcelamento' },
            installmentValue: { external: 'Valor da Parcela', internal: `Valor da Parcela (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Valor Pago', internal: `Valor Pago (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Valor Pendente', internal: `Valor Pendente (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          }
        },
        label: {
          total: 'Total'
        }
      },
      billsToReceive: {
        types: {
          receivedAccounts: 'Contas Recebidas',
          pendingAccounts: 'Contas Pendentes',
          overdueAccounts: 'Contas Vencidas',
          canceledAccounts: 'Contas Canceladas'
        },
        fields: {
          receivedAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            debtor: { external: 'Devedor', internal: 'Devedor' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dischargeDate: { external: 'Data de Quitação', internal: 'Data de Quitação' },
            installments: { external: 'Parcelamento', internal: 'Parcelamento' },
            discount: { external: 'Desconto', internal: `Desconto (${Utilities.currencySymbol})` },
            interest: { external: 'Juros/Multa', internal: `Juros/Multa (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Valor Recebido', internal: `Valor Recebido (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          },
          pendingAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            debtor: { external: 'Devedor', internal: 'Devedor' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dueDate: { external: 'Data de Vencimento', internal: 'Data de Vencimento' },            
            installmentsState: { external: 'Parcelamento', internal: 'Parcelamento' },
            installmentValue: { external: 'Valor da Parcela', internal: `Valor da Parcela (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Valor Recebido', internal: `Valor Recebido (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Valor Pendente', internal: `Valor Pendente (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          },
          overdueAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            debtor: { external: 'Devedor', internal: 'Devedor' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dueDate: { external: 'Data de Vencimento', internal: 'Data de Vencimento' },            
            installmentsState: { external: 'Parcelamento', internal: 'Parcelamento' },
            installmentValue: { external: 'Valor da Parcela', internal: `Valor da Parcela (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Valor Recebido', internal: `Valor Recebido (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Valor Pendente', internal: `Valor Pendente (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          },
          canceledAccounts: {
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            debtor: { external: 'Devedor', internal: 'Devedor' },
            category: { external: 'Categoria', internal: 'Categoria' },
            registerDate: { external: 'Data de Registro', internal: 'Data de Registro' },
            dueDate: { external: 'Data de Vencimento', internal: 'Data de Vencimento' },            
            installmentsState: { external: 'Parcelamento', internal: 'Parcelamento' },
            installmentValue: { external: 'Valor da Parcela', internal: `Valor da Parcela (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Valor Recebido', internal: `Valor Recebido (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Valor Pendente', internal: `Valor Pendente (${Utilities.currencySymbol})` },
            accountValue: { external: 'Valor da Conta', internal: `Valor da Conta (${Utilities.currencySymbol})` }
          }
        },
        label: {
          total: 'Total'
        }
      },
      bankTransactions: {
        label: {
          total: "Total"
        },
        fields: {
          default: {
            date: { external: 'Data', internal: 'Data' },
            code: { external: 'Código', internal: 'Código' },
            referenceCode: { external: 'Código de Referência', internal: 'Código de Referência' },
            operator: { 
              label: { external: 'Operador', internal: 'Operador' },
              name: { external: 'Nome', internal: 'Nome' }
            },
            bankAccount: { 
              label: { external: 'Conta Bancária', internal: 'Conta Bancária' },
              name: { external: 'Nome', internal: 'Nome' }
            },
            type: {
              label: { external: 'TIPO', internal: 'TIPO' },
              WITHDRAW: { external: 'RETIRADA', internal: 'RETIRADA' },
              DEPOSIT: { external: 'DEPÓSITO', internal: 'DEPÓSITO' }
            },
            amount: { external: 'Valor', internal: 'Valor' },
          }
        }
      }
    },
    'en_US': {
      _general: {
        form: {
          store: {
            title: 'Store'
          },
          period: {
            title: 'Period',
            label: {
              option: {
                today: 'Today',
                currentWeek: 'Current Week',
                currentMonth: 'Current Month',
                lastMonth: "Last Month",
                custom: 'Personalizado'
              },
              start: 'Start',
              end: 'End'
            }
          },
          reportType: {
            title: 'Report Type'
          },
          categories: {
            title: "Category",
            list: {
              all: "All"
            }
          },
          dateType: {
            title: "Filter By Date",
            list: {
              all: "All"
            }
          },
          reportFields: {
            title: 'Report Fields'
          },
          button: {
            generate: 'Generate Report'
          }
        },
        layer: {
          titleBar: {
            generated: [ 'Generated on', 'at' ],
            button: {
              exportXLS: 'Export XLS'
            }
          },
          information: {
            label: {
              address: 'Address',
              phone: 'Phone',
              period: [ 'Period', 'to' ]
            }
          },
          warning: {
            noData: 'No records were found for the selected period.'
          }
        }
      },
      cashFlow: {
        fields: {
          default: {
            date: { external: 'Date', internal: 'Date' },
            cashierResult: { external: 'Cashier', internal: `Cashier (${Utilities.currencySymbol})` },
            servicesOrdersResults: { external: 'Service Orders', internal: `Service Orders (${Utilities.currencySymbol})` },
            billsToReceiveResult: { external: 'Bills to Receive', internal: `Bills to Receive (${Utilities.currencySymbol})` },
            billsToPayResult: { external: 'Bills to Pay', internal: `Bills to Pay (${Utilities.currencySymbol})` },
            costs: { external: 'Costs', internal: {
              label: `Costs`, 
              sub: {
                products: `Products (${Utilities.currencySymbol})`,
                services: `Services (${Utilities.currencySymbol})`,
                payments: `Payments (${Utilities.currencySymbol})`,
                total: `Total (${Utilities.currencySymbol})`
              } 
            }},
            billing: { external: 'Billing', internal: `Billing (${Utilities.currencySymbol})` },
            grossProfit: { external: 'Gross Profit', internal: `Gross Profit (${Utilities.currencySymbol})` }
          }
        },
        label: {
          total: 'Total'
        }
      },
      billsToPay: {
        types: {
          paidAccounts: 'Paid Accounts',
          pendingAccounts: 'Pending Accounts',
          overdueAccounts: 'Overdue Accounts',
          canceledAccounts: 'Canceled Accounts'
        },
        fields: {
          paidAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            beneficiary: { external: 'Beneficiary', internal: 'Beneficiary' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dischargeDate: { external: 'Discharge Date', internal: 'Discharge Date' },
            installments: { external: 'Installments', internal: 'Installments' },
            discount: { external: 'Discount', internal: `Discount (${Utilities.currencySymbol})` },
            interest: { external: 'Interest', internal: `Interest (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Amount Paid', internal: `Amount Paid (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          },
          pendingAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            beneficiary: { external: 'Beneficiary', internal: 'Beneficiary' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dueDate: { external: 'Due Date', internal: 'Due Date' },            
            installmentsState: { external: 'Installments', internal: 'Installments' },
            installmentValue: { external: 'Installment Value', internal: `Installment Value (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Amount Paid', internal: `Amount Paid (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Pending Amount', internal: `Pending Amount (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          },
          overdueAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            beneficiary: { external: 'Beneficiary', internal: 'Beneficiary' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dueDate: { external: 'Due Date', internal: 'Due Date' },            
            installmentsState: { external: 'Installments', internal: 'Installments' },
            installmentValue: { external: 'Installment Value', internal: `Installment Value (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Amount Paid', internal: `Amount Paid (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Pending Amount', internal: `Pending Amount (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          },
          canceledAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            beneficiary: { external: 'Beneficiary', internal: 'Beneficiary' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dueDate: { external: 'Due Date', internal: 'Due Date' },            
            installmentsState: { external: 'Installments', internal: 'Installments' },
            installmentValue: { external: 'Installment Value', internal: `Installment Value (${Utilities.currencySymbol})` },
            amountPaid: { external: 'Amount Paid', internal: `Amount Paid (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Pending Amount', internal: `Pending Amount (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          }
        },
        label: {
          total: 'Total'
        }
      },
      billsToReceive: {
        types: {
          receivedAccounts: 'Received Accounts',
          pendingAccounts: 'Pending Accounts',
          overdueAccounts: 'Overdue Accounts',
          canceledAccounts: 'Canceled Accounts'
        },
        fields: {
          receivedAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            debtor: { external: 'Debtor', internal: 'Debtor' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dischargeDate: { external: 'Discharge Date', internal: 'Discharge Date' },
            installments: { external: 'Installments', internal: 'Installments' },
            discount: { external: 'Discount', internal: `Discount (${Utilities.currencySymbol})` },
            interest: { external: 'Interest', internal: `Interest (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Amount Received', internal: `Amount Received (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          },
          pendingAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            debtor: { external: 'Debtor', internal: 'Debtor' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dueDate: { external: 'Due Date', internal: 'Due Date' },            
            installmentsState: { external: 'Installments', internal: 'Installments' },
            installmentValue: { external: 'Installment Value', internal: `Installment Value (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Amount Received', internal: `Amount Received (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Pending Amount', internal: `Pending Amount (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          },
          overdueAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            debtor: { external: 'Debtor', internal: 'Debtor' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dueDate: { external: 'Due Date', internal: 'Due Date' },            
            installmentsState: { external: 'Installments', internal: 'Installments' },
            installmentValue: { external: 'Installment Value', internal: `Installment Value (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Amount Received', internal: `Amount Received (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Pending Amount', internal: `Pending Amount (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          },
          canceledAccounts: {
            code: { external: 'Code', internal: 'Code' },
            referenceCode: { external: 'Reference Code', internal: 'Reference Code' },
            debtor: { external: 'Debtor', internal: 'Debtor' },
            category: { external: 'Category', internal: 'Category' },
            registerDate: { external: 'Register Date', internal: 'Register Date' },
            dueDate: { external: 'Due Date', internal: 'Due Date' },            
            installmentsState: { external: 'Installments', internal: 'Installments' },
            installmentValue: { external: 'Installment Value', internal: `Installment Value (${Utilities.currencySymbol})` },
            amountReceived: { external: 'Amount Received', internal: `Amount Received (${Utilities.currencySymbol})` },
            pendingAmount: { external: 'Pending Amount', internal: `Pending Amount (${Utilities.currencySymbol})` },
            accountValue: { external: 'Account Value', internal: `Account Value (${Utilities.currencySymbol})` }
          }
        },
        label: {
          total: 'Total'
        }
      },
      bankTransactions: {

      }
    }
  };

  public static get(language?: string) {
    return ReportsFinancesTranslate.obj[language ?? window.localStorage.getItem('Language') ?? ProjectSettings.companySettings().language];
  }

}
