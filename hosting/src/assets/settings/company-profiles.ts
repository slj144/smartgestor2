// Arquivo: company-profiles.ts
// Localização: src/assets/settings/company-profiles.ts
// Componente: Perfis de Empresa com CRM opcional

export const CompanyProfile = {
  'Commerce': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    serviceOrders: { active: true },
    stock: {
      active: true,
      components: {
        products: { active: true },
        purchases: { active: true },
        transfers: { active: true }
      }
    },
    financial: {
      active: true,
      components: {
        billsToPay: { active: true },
        billsToReceive: { active: true },
        bankAccounts: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        customers: { active: true },
        collaborators: { active: true },
        providers: { active: true },
        carriers: { active: true },
        partners: { active: true },
        paymentMethods: { active: true },
        services: { active: true },
        branches: { active: true }
      }
    },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },

  'Distributor': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    stock: {
      active: true,
      components: {
        products: { active: true },
        purchases: { active: true },
        transfers: { active: true }
      }
    },
    financial: {
      active: true,
      components: {
        billsToPay: { active: true },
        billsToReceive: { active: true },
        bankAccounts: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        customers: { active: true },
        collaborators: { active: true },
        providers: { active: true },
        carriers: { active: true },
        partners: { active: true },
        paymentMethods: { active: true },
        services: { active: true },
        branches: { active: true }
      }
    },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },

  'Church': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    agenda: { active: true },
    events: { active: true },
    groups: { active: true },
    classrooms: { active: false },
    tithes: { active: true },
    donations: { active: true },
    stock: {
      active: true,
      components: {
        products: { active: true },
        purchases: { active: true }
      }
    },
    financial: {
      active: true,
      components: {
        billsToPay: { active: true },
        billsToReceive: { active: true },
        bankAccounts: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        members: { active: true },
        collaborators: { active: true },
        providers: { active: true },
        paymentMethods: { active: true }
      }
    },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },

  'Cabinet': {
    dashboard: { active: true },
    socialDemands: { active: true },
    projects: { active: true },
    crafts: { active: true },
    requirements: { active: true },
    agenda: { active: true },
    events: { active: true },
    registers: {
      active: true,
      components: {
        voters: { active: true },
        collaborators: { active: true }
      }
    },
    messages: { active: true },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },

  'Restaurant': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    kitchen: { active: true },
    menu: { active: true },
    events: { active: true },
    stock: {
      active: true,
      components: {
        products: { active: true },
        ingredients: { active: true },
        purchases: { active: true },
        transfers: { active: true }
      }
    },
    financial: {
      active: true,
      components: {
        billsToPay: { active: true },
        billsToReceive: { active: true },
        bankAccounts: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        customers: { active: true },
        collaborators: { active: true },
        providers: { active: true },
        carriers: { active: true },
        paymentMethods: { active: true },
        services: { active: true },
        branches: { active: true }
      }
    },
    fiscal: { active: true },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },

  'School': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    agenda: { active: true },
    events: { active: true },
    stock: {
      active: true,
      components: {
        products: { active: true },
        purchases: { active: true },
        transfers: { active: true }
      }
    },
    financial: {
      active: true,
      components: {
        billsToPay: { active: true },
        billsToReceive: { active: true },
        bankAccounts: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        students: { active: true },
        collaborators: { active: true },
        providers: { active: true },
        carriers: { active: true },
        partners: { active: true },
        paymentMethods: { active: true },
        branches: { active: true }
      }
    },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },

  'Mechanics': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    serviceOrders: { active: true },
    stock: {
      active: true,
      components: {
        products: { active: true },
        purchases: { active: true },
        transfers: { active: true }
      }
    },
    financial: {
      active: true,
      components: {
        billsToPay: { active: true },
        billsToReceive: { active: true },
        bankAccounts: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        customers: { active: true },
        collaborators: { active: true },
        providers: { active: true },
        carriers: { active: true },
        partners: { active: true },
        paymentMethods: { active: true },
        services: { active: true },
        vehicles: { active: true },
        branches: { active: true }
      }
    },
    // CRM removido - agora é opcional
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  }
};

// Adicionar perfis com Fiscal (sem CRM por padrão)
CompanyProfile['Commerce/Fiscal'] = {
  ...CompanyProfile['Commerce'],
  fiscal: { active: true }
};

CompanyProfile['Distributor/Fiscal'] = {
  ...CompanyProfile['Distributor'],
  fiscal: { active: true }
};

CompanyProfile['Mechanics/Fiscal'] = {
  ...CompanyProfile['Mechanics'],
  fiscal: { active: true }
};

// ⭐ CÓDIGO QUE FORÇAVA CRM EM TODOS OS PERFIS FOI REMOVIDO ⭐
// CRM agora é opcional e controlado pelo Super Admin