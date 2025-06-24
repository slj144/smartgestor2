import { ProjectSettings } from "@assets/settings/company-settings";
import { Utilities } from "@shared/utilities/utilities";

export class ProductsTranslate {

  private static obj = {
    'pt_BR': {
      pageTitle: 'Produtos',
      table: {
        label: {
          code: 'Código',
          name: 'Nome',
          category: 'Categoria',
          costPrice: `Custo (${Utilities.currencySymbol})`,
          salePrice: `Preço (${Utilities.currencySymbol})`,
          quantity: 'Quantidade',
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
          title: 'Filtros',
          field: {
            code: {
              label: 'Código'
            },
            name: {
              label: 'Nome'
            },
            serialNumber: {
              label: 'Número de série'
            },
            quantity: {
              label: 'Quantidade'
            },
            alert: {
              label: 'Alerta'
            },
            category: {
              label: 'Categoria',
              option: {
                code: {
                  label: 'Código',
                  path: 'Categoria/Código'
                },
                name: {
                  label: 'Nome',
                  path: 'Categoria/Nome'
                }
              }
            },
            commercialUnit: {
              label: 'Unidade Comercial',
              option: {
                code: {
                  label: 'Código',
                  path: 'Unidade Comercial/Código'
                },
                name: {
                  label: 'Nome',
                  path: 'Unidade Comercial/Nome'
                }
              }
            },
            provider: {
              label: 'Fornecedor',
              option: {
                code: {
                  label: 'Código',
                  path: 'Fornecedor/Código'
                },
                name: {
                  label: 'Nome',
                  path: 'Fornecedor/Nome'
                }
              }
            },
            costPrice: {
              label: 'Preço de Custo'
            },
            salePrice: {
              label: 'Preço de Venda'
            },
          }
        },
        action: {
          register: {
            type: {
              create: { title: 'Registro de Produto' },
              update: { title: 'Edição do Produto' }
            },
            details: {
              section: {
                image: {
                  title: 'Imagem do Produto',
                  limitSize: {
                    alert: 'A imagem deve possuir um tamanho menor que 2 MB. Por favor, escolha outra imagem.'
                  }
                },
                informations: {
                  title: 'Informações do Produto',
                  label: {
                    quantity: 'Quantidade',
                    costPrice: `Preço de Custo (${Utilities.currencySymbol})`,
                    salePrice: `Preço de Venda (${Utilities.currencySymbol})`
                  }
                }
              }
            },
            form: {
              code: {
                label: 'Código do Produto',
                info: 'Se não atribuido, será gerado automaticamente.'
              },
              barcode: {
                label: 'Código de Barras',
                info: 'Se não atribuido, será gerado automaticamente.'
              },
              name: { label: 'Nome' },
              serialNumber: { label: 'Número de Série' },
              costPrice: { label: `Preço de Custo (${Utilities.currencySymbol})` },
              salePrice: { label: `Preço de Venda (${Utilities.currencySymbol})` },
              quantity: { label: 'Quantidade em estoque' },
              alert: { label: 'Quantidade de alerta' },
              category: { label: 'Categoria' },
              commercialUnit: { label: 'Unidade Comercial' },
              provider: { label: 'Fornecedor' },
              messages: {
                notice: '* Os campos obrigatórios estão marcados em vermelho.'
              },
              buttons: {
                submit: 'Confirmar'
              }
            },
            layer: {
              commercialUnits: { title: 'Unidades Comerciais' },
              categories: { title: 'Categorias' },
              providers: { title: 'Fornecedores' }
            }
          },
          read: {
            title: 'Detalhes do Produto',
            section: {
              general: {
                title: 'Informações Gerais',
                label: {
                  code: 'Código do Produto',
                  barcode: 'Código de Barras',
                  serialNumber: 'Número de Série',
                }
              },
              pricing: {
                title: 'Precificação',
                label: {
                  salePrice: `Preço de Venda (${Utilities.currencySymbol})`,
                  costPrice: `Preço de Custo (${Utilities.currencySymbol})`,
                }
              },
              stock: {
                title: 'Estoque',
                label: {
                  quantity: 'Quantidade Disponível',
                  alert: 'Quantidade Mínima',
                }
              },
              classification: {
                title: 'Classificação',
                label: {
                  category: {
                    title: 'Categoria',
                    sub: {
                      code: 'Código',
                      name: 'Nome'
                    }
                  },
                  commercialUnit: {
                    title: 'Unidade Comercial', 
                    sub: {
                      code: 'Código',
                      name: 'Nome'
                    }
                  }
                }
              },
              supply: {
                title: 'Fornecimento',
                label: {
                  code: 'Código',
                  name: 'Nome',
                  address: 'Endereço',
                  phone: 'Telefone',
                  email: 'E-mail',
                  lastSupply: 'Último Fornecimento'
                }
              },
              historic: {
                title: 'Histórico de Vendas',
                label: {
                  code: 'Venda',
                  customer: "Cliente",
                  quantity: 'Quantidade',
                  price: `Preço (${Utilities.currencySymbol})`,
                  date: 'Data'
                }
              }
            }
          }, 
          delete: {
						title: 'Exclusão de Produto',
            notice: 'Você deseja realmente excluir este produto?',
            warning: 'Esteja ciente de que esta ação é irreversível, portanto, analise-a cuidadosamente antes de continuar.',
            option: {
              cancel: 'Cancelar',
              confirm: 'Confirmar'
            }
          },
          others: {
            stockAdjustment: {
              title: 'Ajuste de Estoque'
            },
            generateTickets: {
              title: 'Geração de Etiquetas'
            },
            xmlImport: {
              title: 'Importação de XML'
            },
            dataImport: {
              title: 'Importação de Dados'
            },
            XMLImport: {
              title: 'Importação de XML'
            },
            dataExport: {
              title: 'Exportação de Dados'
            }
          }
        }        
      },
      notification: {
        register: 'O produto foi registrado com sucesso.',
        update: 'O produto foi atualizado com sucesso.',
        delete: 'O produto foi deletado com sucesso.',
        error: 'Houve um erro inesperado. Por favor, tente novamente.'
      },
      stockLog: {
        adjustment: 'Movimentação de estoque com origem em atualização direta de produto.',
        transfer: 'Movimentação de estoque com origem em transferência.',
        purchase: 'Movimentação de estoque com origem em compra.',
        sale: 'Movimentação de estoque com origem em venda.',
        service: 'Movimentação de estoque com origem em serviço.',
        request: 'Movimentação de estoque com origem em pedido.',
        import: 'Movimentação de estoque com origem em importação de dados.'        
      },
      systemLog: {
        register: 'Registro de produto.',
        update: 'Atualização de produto.',
        delete: 'Exclusão de produto.'
      }
    },
    'en_US': {
      pageTitle: 'Products',
      table: {
        label: {
          code: 'Code',
          name: 'Name',
          category: 'Category',
          costPrice: `Cost (${Utilities.currencySymbol})`,
          salePrice: `Price (${Utilities.currencySymbol})`,
          quantity: 'Quantity',
          actions: 'Actions'
        },
        action: {
          read: { title: 'View' },
          update: { title: 'Update' },
          delete: { title: 'Delete' }
        }
      },
      modal: {
        filters: {
          title: 'Filters',
          field: {
            code: {
              label: 'Code'
            },
            name: {
              label: 'Name'
            },
            serialNumber: {
              label: 'Serial Number'
            },
            quantity: {
              label: 'Quantity'
            },
            alert: {
              label: 'Alert'
            },
            category: {
              label: 'Category',
              option: {
                code: {
                  label: 'Code',
                  path: 'Category/Code'
                },
                name: {
                  label: 'Name',
                  path: 'Category/Name'
                }
              }
            },
            commercialUnit: {
              label: 'Commercial Unit',
              option: {
                code: {
                  label: 'Code',
                  path: 'Commercial Unit/Code'
                },
                name: {
                  label: 'Name',
                  path: 'Commercial Unit/Name'
                }
              }
            },
            provider: {
              label: 'Provider',
              option: {
                code: {
                  label: 'Code',
                  path: 'Provider/Code'
                },
                name: {
                  label: 'Name',
                  path: 'Provider/Name'
                }
              }
            },
            costPrice: {
              label: 'Cost Price'
            },
            salePrice: {
              label: 'Sale Price'
            }
          }
        },
        action: {
          register: {
            type: {
              create: { title: 'Register Product' },
              update: { title: 'Product Editing' }
            },
            details: {
              section: {
                image: {
                  title: 'Product Image',
                  limitSize: {
                    alert: 'The image must be less than 2 MB in size. Please choose another image.'
                  }
                },
                informations: {
                  title: 'Product Information',
                  label: {
                    quantity: 'Quantity',
                    costPrice: `Cost Price (${Utilities.currencySymbol})`,
                    salePrice: `Sale Price (${Utilities.currencySymbol})`
                  }
                }
              }
            },
            form: {
              code: {
                label: 'Product Code',
                info: 'If not assigned, it will be generated automatically.'
              },
              barcode: {
                label: 'Barcode',
                info: 'If not assigned, it will be generated automatically.'
              },
              name: { label: 'Name' },
              serialNumber: { label: 'Serial Number' },
              costPrice: { label: `Cost Price (${Utilities.currencySymbol})` },
              salePrice: { label: `Sale Price (${Utilities.currencySymbol})` },
              quantity: { label: 'Available Quantity' },
              alert: { label: 'Minimum Quantity' },
              category: { label: 'Category' },
              commercialUnit: { label: 'Commercial Unit' },
              provider: { label: 'Provider' },
              messages: {
                notice: '* Mandatory fields are marked in red.'
              },
              buttons: {
                submit: 'Confirm'
              }
            },
            layer: {
              commercialUnits: { title: 'Commercial Units' },
              categories: { title: 'Categories' },
              providers: { title: 'Providers' }
            }
          },
          read: {
            title: 'Product Details',
            section: {
              general: {
                title: 'General Information',
                label: {
                  code: 'Product Code',
                  barcode: 'Barcode',
                  serialNumber: 'Serial Number'
                }
              },
              pricing: {
                title: 'Pricing',
                label: {
                  salePrice: `Sale Price (${Utilities.currencySymbol})`,
                  costPrice: `Cost Price (${Utilities.currencySymbol})`
                }
              },
              stock: {
                title: 'Stock',
                label: {
                  quantity: 'Available Quantity',
                  alert: 'Minimum Quantity'
                }
              },
              classification: {
                title: 'Classification',
                label: {
                  category: {
                    title: 'Category',
                    sub: {
                      code: 'Code',
                      name: 'Name'
                    }
                  },
                  commercialUnit: {
                    title: 'Commercial Unit', 
                    sub: {
                      code: 'Code',
                      name: 'Name'
                    }
                  }                  
                }
              },
              supply: {
                title: 'Supply',
                label: {
                  code: 'Code',
                  name: 'Name',
                  address: 'Address',
                  phone: 'Phone',
                  email: 'Email',                   
                  lastSupply: 'Last Supply'
                }
              },
              historic: {
                title: 'Sale Historic',
                label: {
                  code: 'Sale',
                  customer: "Customer",
                  quantity: 'Quantity',
                  price: `Price (${Utilities.currencySymbol})`,
                  date: 'Date'
                }
              }
            }           
          },
          delete: {
						title: 'Product Exclusion',
            notice: 'Do you really want to delete this product?',
            warning: 'Be aware that this action is irreversible, so please review it carefully before proceeding.',
            option: {
              cancel: 'Cancel',
              confirm: 'Confirm'
            }
          },
          others: {
            stockAdjustment: {
              title: 'Inventory Adjustment'
            },
            generateTickets: {
              title: 'Generation of Labels'
            },
            xmlImport: {
              title: 'XML Import'
            },
            dataImport: {
              title: 'Data Import' 
            },
            XMLImport: {
              title: 'XML Import'
            },
            dataExport: {
              title: 'Data Export'              
            }
          }
        }       
      },
      notification: {
        register: 'The product has been successfully registered.',
        update: 'The product has been successfully updated.',
        delete: 'The product has been successfully deleted.',
        error: 'There was an unexpected error. Please try again.'
      },
      stockLog: {
        adjustment: 'Stock movement with origin in direct product update.',
        transfer: 'Stock movement with origin in transfer.',
        purchase: 'Stock movement with origin in purchase.',
        sale: 'Stock movement with origin in sale.',
        service: 'Stock movement with origin in service.',
        request: 'Stock movement with origin in request.',
        import: 'Stock movement with origin in product data import.'
      },
      systemLog: {
        register: 'Product registration.',
        update: 'Product update.',
        delete: 'Product exclusion.'
      }
    }
  }

  public static get(language?: string) {
    return ProductsTranslate.obj[language ?? window.localStorage.getItem('Language') ?? ProjectSettings.companySettings().language];
  }

}
