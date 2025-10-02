export type CompanyRow = {
  scripCode: string | null;
  companyName: string | null;
  personName: string | null;
  category: string | null;
  securitiesHeldPreTransaction: number | null;
  securitiesHeldPrePercentage: number | null;
  securityType: string | null;
  numberOfSecurities: number | null;
  valuePerSecurity: number | null;
  transactionType: string | null;
  securitiesHeldPostTransaction: number | null;
  securitiesHeldPostPercentage: number | null;
  dateOfAllotmentOrTransaction: string | null;
  dateOfAllotmentOrTransactionText: string | null;
  modeOfAcquisition: string | null;
  derivativeType: string | null;
  buyValueUnits: string | null;
  sellValueUnits: string | null;
  dateOfIntimation: string | null;
  dateOfIntimationText: string | null;
};

export type BseInsiderTrade = {
  _id: string;
  _creationTime: number;
  scripCode: string | null;
  companyName: string | null;
  personName: string | null;
  category: string | null;
  securitiesHeldPreTransaction: number | null;
  securitiesHeldPrePercentage: number | null;
  securityType: string | null;
  numberOfSecurities: number | null;
  valuePerSecurity: number | null;
  transactionType: string | null;
  securitiesHeldPostTransaction: number | null;
  securitiesHeldPostPercentage: number | null;
  dateOfAllotmentOrTransaction: string | null;
  dateOfAllotmentOrTransactionText: string | null;
  modeOfAcquisition: string | null;
  derivativeType: string | null;
  buyValueUnits: string | null;
  sellValueUnits: string | null;
  dateOfIntimation: string | null;
  dateOfIntimationText: string | null;
  createdAt: number;
};

export type BseBulkDeals = {
  _id: string;
  _creationTime: number;
  scripCode: string;
  companyName: string;
  createdAt: number;
  quantity: number;
  clientName: string;
  dealType: string;
  price: number;
  totalValue: number;
  date: string | null;
  dateText: string;
};

export type NseInsiderTrade = {
  _id: string;
  _creationTime: number;
  symbol: string;
  companyName: string;
  acquirerOrDisposer: string;
  regulation: string;
  securityType: string;
  quantity: number;
  transactionType: string;
  disclosedAt: string;
  xbrlLink?: string;
};

export type NseTransformedTrade = {
  _id: string;
  _creationTime: number;
  scripCode: string;
  companyName: string;
  personName: string;
  category: string;
  securitiesHeldPreTransaction: null;
  securitiesHeldPrePercentage: null;
  securityType: string;
  numberOfSecurities: number;
  valuePerSecurity: null;
  transactionType: string;
  securitiesHeldPostTransaction: null;
  securitiesHeldPostPercentage: null;
  dateOfAllotmentOrTransaction: string;
  dateOfAllotmentOrTransactionText: string;
  modeOfAcquisition: null;
  derivativeType: null;
  buyValueUnits: null;
  sellValueUnits: null;
  dateOfIntimation: string;
  dateOfIntimationText: string;
  createdAt: number;
  xbrlLink?: string;
};

export type BulkDealRow = {
  date: string | null;
  dateText: string;
  scripCode: string;
  companyName: string;
  clientName: string;
  dealType: "B" | "S" | "";
  quantity: number;
  price: number;
  totalValue: number;
};

export type CorporateActionRow = {
  scripCode: string | null;
  companyName: string | null;
  field2: string | null;
  purpose: string | null;
  exDate: string | null;
  exDateText: string | null;
  recordDate: string | null;
  bcStartDate: string | null;
  bcEndDate: string | null;
  ndStartDate: string | null;
  ndEndDate: string | null;
};
