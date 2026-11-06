import { pathToFileURL } from "node:url";

type PeriodSource = {
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> | null } | null;
};

type InvoiceSource = {
  subscription?: string | { id: string } | null;
  parent?: {
    subscription_details?: { subscription?: string | { id: string } | null } | null;
  } | null;
};

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** Clover puts the period on the item. Older webhook payloads still send it on the subscription. */
export function stripePeriodEnd(subscription: PeriodSource): number | null {
  const end = subscription.items?.data?.[0]?.current_period_end ?? subscription.current_period_end;
  return end && end > 0 ? end : null;
}

export function stripeEndsAt(subscription: PeriodSource, fallback: Date): string {
  const end = stripePeriodEnd(subscription);
  return (end ? new Date(end * 1000) : fallback).toISOString();
}

/** Clover puts the subscription on invoice.parent. Older payloads still send invoice.subscription. */
export function stripeInvoiceSubscriptionId(invoice: InvoiceSource): string | null {
  return idOf(invoice.parent?.subscription_details?.subscription) ?? idOf(invoice.subscription);
}

function selfCheck() {
  if (stripePeriodEnd({ items: { data: [{ current_period_end: 100 }] } }) !== 100) {
    throw new Error("item period");
  }
  if (stripePeriodEnd({ current_period_end: 50, items: { data: [] } }) !== 50) {
    throw new Error("legacy period");
  }
  if (stripePeriodEnd({ items: { data: [{ current_period_end: 100 }] }, current_period_end: 50 }) !== 100) {
    throw new Error("item wins");
  }
  const fallback = new Date("2026-01-01T00:00:00.000Z");
  if (stripeEndsAt({ items: { data: [{ current_period_end: 1_700_000_000 }] } }, fallback) !== "2023-11-14T22:13:20.000Z") {
    throw new Error("ends at from item");
  }
  if (stripeEndsAt({ items: { data: [] } }, fallback) !== fallback.toISOString()) {
    throw new Error("ends at fallback");
  }
  if (stripeInvoiceSubscriptionId({ parent: { subscription_details: { subscription: "sub_new" } } }) !== "sub_new") {
    throw new Error("parent sub");
  }
  if (stripeInvoiceSubscriptionId({ subscription: "sub_old", parent: null }) !== "sub_old") {
    throw new Error("legacy invoice");
  }
  if (
    stripeInvoiceSubscriptionId({
      subscription: "sub_old",
      parent: { subscription_details: { subscription: { id: "sub_new" } } },
    }) !== "sub_new"
  ) {
    throw new Error("parent wins");
  }
  console.log("ok");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  selfCheck();
}
