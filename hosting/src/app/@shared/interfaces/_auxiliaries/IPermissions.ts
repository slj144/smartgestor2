
export interface IPermissions {
  dashboard?: {
    counters?: {
      actions?: string[],
      fields?: string[]
    },
    cashierResume?: {
      actions?: string[],
      fields?: string[]
    },
    bestSellers?: {
      actions?: string[],
      fields?: string[]
    },
    stockAlert?: {
      actions?: string[],
      fields?: string[]
    },
    serviceOrders?: {
      actions?: string[],
      fields?: string[]
    },
    billsToPay?: {
      actions?: string[],
      fields?: string[]
    },
    requests?: {
      actions?: string[],
      fields?: string[]
    },
    billsToReceive?: {
      actions?: string[],
      fields?: string[]
    }
  };
  cashier?: {
    cashierFront: {
      actions: string[],
      fields: string[],
      sections?: {
        [key: string]: {
          actions?: string[];
          sections?: string[];
        }
      }
    },
    cashierRegisters: { actions: string[], fields: string[], sections: string[] }
  };
  requests?: { actions: string[], fields: string[] };
  kitchen?: { actions: string[], fields: string[] };
  menu?: { actions: string[], fields: string[] };
  serviceOrders?: { actions: string[], fields: string[] };
  socialDemands?: { actions: string[], fields: string[] };
  projects?: { actions: string[], fields: string[] };
  crafts?: { actions: string[], fields: string[] };
  requirements?: { actions: string[], fields: string[] };
  agenda?: { actions: string[], fields: string[] };
  events?: { actions: string[], fields: string[] };
  messages?: { actions: string[], fields: string[] };
  groups?: { actions: string[], fields: string[] };
  classrooms?: { actions: string[], fields: string[] };
  tithes?: { actions: string[], fields: string[] };
  donations?: { actions: string[], fields: string[] };
  stock?: {
    products?: { actions?: Array<string>, fields?: Array<string>, sections?: string[] },
    ingredients?: { actions?: Array<string>, fields?: Array<string> },
    transfers?: { actions?: Array<string>, fields?: Array<string> },
    purchases?: { actions?: Array<string>, fields?: Array<string> }
  };
  financial?: {
    billsToPay?: { actions?: Array<string>, fields?: Array<string> },
    billsToReceive?: { actions?: Array<string>, fields?: Array<string> },
    bankAccounts?: { actions?: Array<string>, fields?: Array<string> },
  };
  crm?: {
    actions: Array<'add' | 'edit' | 'delete' | 'view'>;
    modules: Array<'leads' | 'activities' | 'pipeline' | 'reports'>;
    fields?: Array<'value' | 'notes' | 'assignedTo'>;
  };
  registers?: {
    customers?: { actions?: Array<string>, fields?: Array<string> },
    members?: { actions?: Array<string>, fields?: Array<string> },
    voters?: { actions?: Array<string>, fields?: Array<string> },
    collaborators?: { actions?: Array<string>, fields?: Array<string>, sections?: string[] },
    providers?: { actions?: Array<string>, fields?: Array<string> };
    carriers?: { actions?: Array<string>, fields?: Array<string> };
    partners?: { actions?: Array<string>, fields?: Array<string> },
    services?: { actions?: Array<string>, fields?: Array<string> },
    vehicles?: { actions?: Array<string>, fields?: Array<string> },
    paymentMethods?: { actions?: Array<string>, fields?: Array<string> },
    branches?: { actions?: Array<string>, fields?: Array<string> }
  };
  reports?: {
    cashier?: {
      sections?: {
        resume?: {
          default?: { actions?: Array<string>, fields: string[] }
        },
        sales?: {
          salesReportSynthetic?: { actions?: Array<string>, fields: string[] },
          salesReportAnalytical?: { actions?: Array<string>, fields: string[] },
          paymentMethodsSynthetic?: { actions?: Array<string>, fields: string[] },
          paymentMethodsAnalytical?: { actions?: Array<string>, fields: string[] },
          salesPerUserSynthetic?: { actions?: Array<string>, fields: string[] },
          salesPerUserAnalytical?: { actions?: Array<string>, fields: string[] },
        },
        inflows?: {
          inflowsReportSynthetic?: { actions?: Array<string>, fields: string[] },
          inflowsReportAnalytical?: { actions?: Array<string>, fields: string[] }
        },
        outflows?: {
          outflowsReportSynthetic?: { actions?: Array<string>, fields: string[] },
          outflowsReportAnalytical?: { actions?: Array<string>, fields: string[] }
        },
        afterSales?: {
          default?: { actions?: Array<string>, fields: string[] }
        },
        historic?: {
          default?: { actions?: Array<string>, fields: string[] }
        }
      }
    },
    servicesOrders?: {
      sections?: {
        resume?: {
          default?: { actions?: Array<string>, fields: string[] }
        },
        internal?: {
          servicesInternalReportSynthetic?: { actions?: Array<string>, fields: string[] },
          servicesInternalReportAnalytical?: { actions?: Array<string>, fields: string[] }
        },
        external?: {
          servicesExternalReportSynthetic?: { actions?: Array<string>, fields: string[] },
          servicesExternalReportAnalytical?: { actions?: Array<string>, fields: string[] }
        },
        curveABC?: {
          default?: { actions?: Array<string>, fields: string[] }
        }
      }
    },
    stock?: {
      sections?: {
        products?: {
          default?: { fields: string[] }
        },
        purchases?: {
          completedPurchases?: { fields: string[] },
          pendingPurchases?: { fields: string[] },
          purchasedProducts?: { fields: string[] }
        },
        transfers?: {
          completedTransfers?: { fields: string[] },
          pendingTransfers?: { fields: string[] },
          transferedProducts?: { fields: string[] }
        },
        stockLogs?: {
          default?: { actions?: Array<string>, fields: string[] }
        },
        curveABC: {
          default?: { actions?: Array<string>, fields: string[] }
        }
      }
    },
    financial?: {
      sections?: {
        cashFlow?: {
          default?: { fields: string[] }
        },
        billsToPay?: {
          paidAccounts?: { fields: string[] },
          pendentAccounts?: { fields: string[] },
          expireAccounts?: { fields: string[] }
        },
        billsToReceive?: {
          receivedAccounts?: { fields: string[] },
          pendentAccounts?: { fields: string[] },
          expireAccounts?: { fields: string[] }
        },
        bankTransactions?: {
          default?: { fields: string[] }
        }
      }
    },
    several?: {
      sections?: {
        systemLogs?: { default?: { actions?: Array<string>, fields: string[] } },
      }
    }
  };
  messaging?: { actions?: Array<string>, fields?: Array<string> };
  fiscal?: { actions?: Array<string>, fields?: Array<string> };
  establishment?: { actions?: Array<string>, sections?: Array<string> }; // Remove this module
  informations?: { actions?: Array<string>, sections?: Array<string> };
  settings?: { actions?: Array<string>, sections?: Array<string> };
  support?: { actions?: Array<string>, sections?: Array<string> };
}
