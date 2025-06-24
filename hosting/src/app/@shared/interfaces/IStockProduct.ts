import { IStockLog } from './IStockLog';

export interface IStockProduct {
  _id?: string;
  _isDisabled?: boolean;
  code?: (string | number);
  barcode: string;
  name: string;
  internalCode?: string;
  description?: string;
  serialNumber?: string;
  thumbnail?: {
    url: (string | { newFile: File, oldFile: string });
    type: string;
    size: number;
  };
  commercialUnit: {
    _id: string;
    code: string;
    name: string;
    symbol: string;
  };
  category: {
    _id: string;
    code: string;
    name: string;
  };
  provider?: {
    _id: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    lastSupply?: string;
  };
  costPrice: number;
  salePrice: number;
  alert: number;
  quantity: (number | string); // String: Database | File: Database
  ncm?: string;
  cest?: string;
  nve?: string;
  codigoBeneficioFiscal?: string;
  tributes?: any;
  specialization?: string;
  fuel?:{
    codigoAnp: string;
    descricaoAnp: string;
  };
  remedy?: {
    codigoAnvisa: string,
    valorMaximo: number,
    motivoInsencaoAnvisa?: string;
  }
  branches?: {
    [key: string]: {
      tributes?: any;
      costPrice?: number;
      salePrice?: number;
      alert?: number;
      quantity: number;
      modifiedDate?: string;
    }
  };
  priceList?: {
    [key: string]: {
      costPrice?: number;
      salePrice?: number;
    }
  };
  stockAdjustment?: IStockLog;
  selected?: boolean; // Code use
  selectedItems?: number; // Code use
  registerDate?: string;
  modifiedDate?: string;  
}
