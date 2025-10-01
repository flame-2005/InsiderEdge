// utils/notification.ts

import { UnifiedInsiderNormalized } from "../constants/notification";

export type ISODateString = string;

// Union-ish input surface covering both NSE & BSE and your unified fields
export type RawInsiderRecord = {
  exchange?: string;
  scripCode?: string;
  companyName?: string;
  personName?: string | null;
  category?: string | null;
  securityType?: string | null;
  numberOfSecurities?: number | string | null;
  transactionType?: string | null;
  transactionDate?: ISODateString | null;
  xbrlLink?: string | null;
  symbol?: string;
  companySymbol?: string;
  quantity?: number | string | null;
  disclosedAt?: ISODateString | null;
  acquirerOrDisposer?: string | null;
  regulation?: string | null;
  dateOfAllotmentOrTransaction?: ISODateString | null;
}

function fmtNum(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "N/A";
  try {
    return new Intl.NumberFormat("en-IN").format(n);
  } catch {
    return String(n);
  }
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function coalesceDate(
  ...dates: Array<ISODateString | null | undefined>
): ISODateString | null {
  const d = dates.find((v) => v != null && String(v).trim() !== "");
  return d ?? null;
}

export function normalizeInsider(record: RawInsiderRecord): UnifiedInsiderNormalized {
  // Exchange inference: prefer explicit, else presence of NSE-ish fields
  const exchange: string =
    record.exchange ??
    (record.symbol || record.companySymbol ? "NSE" : "BSE");

  const scripCode: string =
    record.scripCode ??
    record.symbol ??
    record.companySymbol ??
    "-";

  const numberOfSecurities: number | null = toNumber(
    record.numberOfSecurities ?? record.quantity ?? null
  );

  const transactionDate: ISODateString | null = coalesceDate(
    record.transactionDate,
    record.disclosedAt,
    record.dateOfAllotmentOrTransaction
  );

  return {
    exchange,
    scripCode,
    companyName: record.companyName ?? "-",
    personName: record.personName ?? record.acquirerOrDisposer ?? null,
    category: record.category ?? record.regulation ?? null,
    securityType: record.securityType ?? null,
    numberOfSecurities,
    transactionType: record.transactionType ?? null,
    transactionDate,
    xbrlLink: record.xbrlLink ?? null,
  };
}

export function buildInsiderEmail(
  raw: RawInsiderRecord
): { subject: string; text: string; html: string } {
  const r = normalizeInsider(raw);

  const qty = fmtNum(r.numberOfSecurities);
  const subject = `[${r.exchange}] ${r.companyName} – ${
    r.transactionType ?? "Transaction"
  } of ${qty} ${r.securityType ?? ""}`.trim();

  const textLines: Array<string> = [
    `Exchange: ${r.exchange}`,
    `Symbol: ${r.scripCode}`,
    `Company: ${r.companyName}`,
    `Person: ${r.personName ?? "-"}`,
    `Category: ${r.category ?? "-"}`,
    `Type: ${r.transactionType ?? "-"}`,
    `Qty: ${r.numberOfSecurities ?? "-"}`,
    `Security: ${r.securityType ?? "-"}`,
    `Date: ${r.transactionDate ?? "-"}`,
  ];

  if (r.xbrlLink) textLines.push(`XBRL: ${r.xbrlLink}`);

  const text = textLines.join("\n");

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">${r.companyName} (${r.scripCode})</h2>
      <p style="margin:0 0 12px">
        <strong>${r.transactionType ?? "Transaction"}</strong> of
        <strong>${qty}</strong> ${r.securityType ?? ""}
        on <strong>${r.transactionDate ?? "-"}</strong> via <strong>${r.exchange}</strong>.
      </p>
      <table style="border-collapse:collapse">
        <tbody>
          <tr><td style="padding:4px 8px;color:#555">Person</td><td style="padding:4px 8px">${r.personName ?? "-"}</td></tr>
          <tr><td style="padding:4px 8px;color:#555">Category</td><td style="padding:4px 8px">${r.category ?? "-"}</td></tr>
          <tr><td style="padding:4px 8px;color:#555">XBRL</td><td style="padding:4px 8px">${r.xbrlLink ? `<a href="${r.xbrlLink}">View filing</a>` : "-"}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  return { subject, text, html };
}
