// company-profiles.ts
// ARQUIVO: src/functions/project-instance/company-profiles.ts
// FUNÇÃO: Define os módulos disponíveis para cada tipo de empresa

export const CompanyProfile = {
  'Commerce': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    serviceOrders: { active: true },
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
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
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },
  'Distributor': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
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
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
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
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
    registers: {
      active: true,
      components: {
        voters: { active: true },
        collaborators: { active: true }
      }
    },
    messages: { active: true },
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
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
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
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
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
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },
  'Mechanics': {
    dashboard: { active: true },
    cashier: { active: true },
    requests: { active: true },
    serviceOrders: { active: true },
    // ADICIONAR CRM AQUI
    crm: {
      active: true,
      components: {
        dashboard: { active: true },
        leads: { active: true },
        pipeline: { active: true },
        activities: { active: true }
      }
    },
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
    reports: { active: true },
    informations: { active: true },
    settings: { active: true }
  },
}

// ADICIONAR CRM NOS PERFIS COM FISCAL
CompanyProfile['Commerce/Fiscal'] = {
  ...CompanyProfile['Commerce'],
  fiscal: { active: true },
  // GARANTIR QUE O CRM ESTÁ INCLUÍDO
  crm: {
    active: true,
    components: {
      dashboard: { active: true },
      leads: { active: true },
      pipeline: { active: true },
      activities: { active: true }
    }
  }
};

CompanyProfile['Distributor/Fiscal'] = {
  ...CompanyProfile['Distributor'],
  fiscal: { active: true },
  // GARANTIR QUE O CRM ESTÁ INCLUÍDO
  crm: {
    active: true,
    components: {
      dashboard: { active: true },
      leads: { active: true },
      pipeline: { active: true },
      activities: { active: true }
    }
  }
};

CompanyProfile['Mechanics/Fiscal'] = {
  ...CompanyProfile['Mechanics'],
  fiscal: { active: true },
  // GARANTIR QUE O CRM ESTÁ INCLUÍDO
  crm: {
    active: true,
    components: {
      dashboard: { active: true },
      leads: { active: true },
      pipeline: { active: true },
      activities: { active: true }
    }
  }
};