import { ProjectSettings } from "@assets/settings/company-settings";
import { Utilities } from "@shared/utilities/utilities";

export class ServicesTranslate{

	private static obj = {
    'pt_BR': {
      pageTitle: 'Serviços',
      table: {
        label: {
					code: 'Código',
					name: 'Nome',
					costPrice: `Custo (${Utilities.currencySymbol})`,
					finalPrice: `Preço (${Utilities.currencySymbol})`,
					actions: 'Ações'
        },
        action: {
          read: { title: 'Visualizar' },
          update: { title: 'Editar' },
          delete: { title: 'Excluir' }
        }
      },
      modal: {
        filters: {
          title: 'Filtros'
        },
        action: {
          register: {
            type: {
              create: { title: 'Registro de Serviço' },
              update: { title: 'Edição de Serviço' }
            },
            form: {
              label: {
                name: 'Nome',
                description: 'Descrição',
                costPrice: `Preço de Custo (${Utilities.currencySymbol})`,
                executionPrice: `Preço de Execução (${Utilities.currencySymbol})`
              },
              notice: '* Os campos obrigatórios estão marcados em vermelho.',
              button: {
                submit: 'Confirmar'
              }
            }
          },
          read: {
						title: 'Detalhes do Serviço',
            section: {
              informations: {
                title: 'Informações',
                label: {
                  code: 'Código',
                  name: 'Nome',
                  description: 'Descrição',
                  costPrice: `Preço de Custo (${Utilities.currencySymbol})`,
                  executionPrice: `Preço de Execução (${Utilities.currencySymbol})`
                }
              },
              description: {
                title: 'Descrição'
              }
            }					
          },
          delete: {
						title: 'Exclusão de Serviço',
            notice: 'Você deseja realmente excluir este serviço?',
            warning: 'Esteja ciente de que esta ação é irreversível, portanto, analise-a cuidadosamente antes de continuar.',
            option: {
              cancel: 'Cancelar',
              confirm: 'Confirmar'
            }
          },
          others: {
            dataExport: {
              title: 'Exportação de Dados',
              fileName: 'Serviços',
              label: {
                title: 'Assistente de Exportação',
                info: [
                  'O assistente de exportação deve ser utilizado quando há a necessidade de obter os dados brutos dos serviços.',
                  'O processo de exportação pode demorar alguns minutos, tudo depende da sua conexão com a internet e também a quantidade de dados a serem baixados do banco de dados.'
                ],
                table: {
                  code: 'Código',
                  name: 'Nome',
                  costPrice: `Preço de Custo (${Utilities.currencySymbol})`,
                  finalPrice: `Preço Final (${Utilities.currencySymbol})`,
                },
                button: 'Iniciar Exportação'
              }
            }
          }
        }
      },
      notification: {
        register: 'O serviço foi registrado com sucesso.',
        update: 'O serviço foi atualizado com sucesso.',
        delete: 'O serviço foi excluído com sucesso.',
        error: 'Houve um erro inesperado. Por favor, tente novamente.'
      },
      systemLog: {
        register: 'Registro de serviço.',
        update: 'Edição de serviço.',
        delete: 'Exclusão de serviço.'
      }
    },
    'en_US': {
      pageTitle: 'Services',
      table: {
        label: {
					code: 'Code',
					name: 'Name',
					costPrice: `Cost (${Utilities.currencySymbol})`,
					finalPrice: `Price (${Utilities.currencySymbol})`,
					actions: 'Actions'
        },
        action: {
					read: { title: 'View' },
          update: { title: 'Edit' },
          delete: { title: 'Delete' }
        }
      },
      modal: {
        filters: {
          title: 'Filters'
        },
        action: {
          register: {
            type: {
              create: { title: 'Registrer Service' },
              update: { title: 'Service Editing' }
            },
            form: {
              label: {
                name: 'Name',
                description: 'Description',
                costPrice: `Cost Price (${Utilities.currencySymbol})`,
                executionPrice: `Execution Price (${Utilities.currencySymbol})`
              },
              notice: '* Mandatory fields are marked in red.',
              button: {
                submit: 'Confirm'
              }
            }
          },
          read: {
						title: 'Service Details',
            section: {
              informations: {
                title: 'Informations',
                label: {
                  code: 'Code',
                  name: 'Name',
                  description: 'Description',
                  costPrice: `Cost Price (${Utilities.currencySymbol})`,
                  executionPrice: `Execution Price (${Utilities.currencySymbol})`
                }
              },
              description: {
                title: 'Description'
              }
            }
          },          
          delete: {
						title: 'Service Exclusion',
            notice: 'Do you really want to delete this service?',
            warning: 'Be aware that this action is irreversible, so please review it carefully before proceeding.',
            option: {
              cancel: 'Cancel',
              confirm: 'Confirm'
            }
          },
          others: {
            dataExport: { 
              title: 'Data Export',
              fileName: 'Services',
              label: {
                title: 'Export Assistant',
                info: [
                  'The export wizard should be used when there is a need to obtain raw service data.',
                  'The export process can take a few minutes, it all depends on your internet connection and also the amount of data to be downloaded from the database.'
                ],
                table: {
                  code: 'Code',
                  name: 'Name',
                  costPrice: `Cost Price (${Utilities.currencySymbol})`,
                  finalPrice: `Final Price (${Utilities.currencySymbol})`,
                },
                button: 'Start Export'
              }
            }
          }
        }
      },
      notification: {
        register: 'The service was registered successfully.',
        update: 'The service was updated successfully.',
        delete: 'The service was deleted successfully.',
        error: 'There was an unexpected error. Please try again.'
      },
      systemLog: {
        register: 'Service registration.',
        update: 'Service update.',
        delete: 'Service exclusion.'
      }      
    }
  }

  public static get(language?: string) {
    return ServicesTranslate.obj[language ?? window.localStorage.getItem('Language') ?? ProjectSettings.companySettings().language];
  }

}