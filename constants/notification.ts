import { ISODateString } from "../utils/notification";

export type UnifiedInsider = {
  exchange: "BSE" | "NSE";
  scripCode: string;
  companyName: string;
  personName?: string | null;
  category?: string | null;
  securityType: string;
  numberOfSecurities: number;
  transactionType: string;
  transactionDate: string; 
  xbrlLink?: string | null;
};

export type UnifiedInsiderNormalized = {
  exchange: string;
  scripCode: string;
  companyName: string;
  personName: string | null;
  category: string | null;
  securityType: string | null;
  numberOfSecurities: number | null;
  transactionType: string | null;
  transactionDate: ISODateString | null;
  xbrlLink: string | null;
};