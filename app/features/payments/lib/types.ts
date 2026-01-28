/**
 * Payments domain types
 *
 * NOTE:
 * - 通貨定義はこのファイルを単一ソース（SSOT）にする
 * - アプリ側からは `app/core/prompts/types.ts` 経由で参照する
 */

export const CURRENCY_VALUES = ["USD", "KRW", "JPY"] as const;
export type Currency = (typeof CURRENCY_VALUES)[number];

export const ZERO_DECIMAL_CURRENCY_VALUES = ["JPY", "KRW"] as const satisfies readonly Currency[];
export type ZeroDecimalCurrency = (typeof ZERO_DECIMAL_CURRENCY_VALUES)[number];

export function isZeroDecimalCurrency(currency: string): currency is ZeroDecimalCurrency {
  return (ZERO_DECIMAL_CURRENCY_VALUES as readonly string[]).includes(currency);
}
