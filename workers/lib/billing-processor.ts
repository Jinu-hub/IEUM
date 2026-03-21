/**
 * Billing Processor
 * 
 * Core functions for processing recurring billing payments using Toss Payments API.
 * Handles subscription renewals, payment execution, and failure management.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlanType } from "~/core/lib/constants";
import { calculatePrice } from "~/features/payments/lib/utils";
import { logger } from './logger';

type BillingInterval = 'monthly' | 'yearly';

export interface BillingResult {
  success: boolean;
  subscriptionId: string;
  paymentId?: number;
  error?: string;
  nextBillingDate?: string;
}

export interface SubscriptionForRenewal {
  subscription_id: string;
  user_id: string;
  plan_type: PlanType;
  billing_interval: BillingInterval;
  ends_at: string;
  payment_method_id: string;
  payment_methods: {
    method_id: string;
    billing_key: string;
    customer_key: string;
    status: string;
  };
  users: {
    email: string;
    user_metadata: {
      name?: string;
    };
  };
}

/**
 * Execute billing payment using Toss Payments API
 */
export async function executeBillingPayment(
  billingKey: string,
  customerKey: string,
  amount: number,
  orderId: string,
  orderName: string,
  customerEmail: string,
  customerName: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!secretKey) {
    throw new Error('TOSS_PAYMENTS_SECRET_KEY is not configured');
  }

  const encryptedSecretKey = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

  try {
    const response = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: encryptedSecretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey,
          amount,
          orderId,
          orderName,
          customerEmail,
          customerName,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Payment failed with status ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process a single subscription renewal
 */
export async function processSubscriptionRenewal(
  subscription: SubscriptionForRenewal,
  supabase: SupabaseClient
): Promise<BillingResult> {
  const {
    subscription_id,
    user_id,
    plan_type,
    billing_interval,
    payment_method_id,
    payment_methods,
    users,
  } = subscription;

  logger.info(`Processing subscription renewal`, {
    subscriptionId: subscription_id,
    userId: user_id,
    planType: plan_type,
    billingInterval: billing_interval,
  });

  // Check if payment method is valid
  if (!payment_methods || payment_methods.status !== 'active') {
    logger.warn(`Payment method not active`, {
      subscriptionId: subscription_id,
      paymentMethodStatus: payment_methods?.status,
    });

    // Update subscription status to expired
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscription_id);

    return {
      success: false,
      subscriptionId: subscription_id,
      error: 'Payment method not active',
    };
  }

  // Calculate amount
  const amount =
    plan_type === 'trial'
      ? 0
      : calculatePrice(plan_type, billing_interval as BillingInterval, 'KRW');
  if (amount === 0) {
    logger.info(`Skipping renewal for free plan`, { subscriptionId: subscription_id });
    return {
      success: true,
      subscriptionId: subscription_id,
    };
  }

  // Generate order details
  const orderId = `renewal-${subscription_id}-${Date.now()}`;
  const orderName = `${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} Plan (${billing_interval === 'yearly' ? 'Annual' : 'Monthly'}) Renewal`;

  // Execute payment
  const paymentResult = await executeBillingPayment(
    payment_methods.billing_key,
    payment_methods.customer_key,
    amount,
    orderId,
    orderName,
    users.email,
    users.user_metadata?.name || users.email
  );

  if (!paymentResult.success) {
    logger.error(`Payment failed for subscription renewal`, {
      subscriptionId: subscription_id,
      error: paymentResult.error,
    });

    // Mark subscription as payment failed (but don't immediately expire)
    // You might want to implement retry logic here
    await supabase
      .from('subscriptions')
      .update({
        status: 'paused', // Paused due to payment failure
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscription_id);

    return {
      success: false,
      subscriptionId: subscription_id,
      error: paymentResult.error,
    };
  }

  const paymentData = paymentResult.data;

  // Record payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      payment_key: paymentData.paymentKey,
      order_id: paymentData.orderId,
      order_name: paymentData.orderName,
      total_amount: paymentData.totalAmount,
      receipt_url: paymentData.receipt?.url || '',
      status: paymentData.status,
      approved_at: paymentData.approvedAt,
      requested_at: paymentData.requestedAt,
      metadata: {
        plan: plan_type,
        interval: billing_interval,
        subscriptionType: 'renewal',
        subscriptionId: subscription_id,
      },
      raw_data: paymentData,
      user_id,
    })
    .select()
    .single();

  if (paymentError) {
    logger.error(`Failed to record payment`, {
      subscriptionId: subscription_id,
      error: paymentError.message,
    });
  }

  // Calculate next billing date
  const now = new Date();
  const nextEndsAt = new Date(now);
  if (billing_interval === 'yearly') {
    nextEndsAt.setFullYear(nextEndsAt.getFullYear() + 1);
  } else {
    nextEndsAt.setMonth(nextEndsAt.getMonth() + 1);
  }

  // Update subscription
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      ends_at: nextEndsAt.toISOString(),
      latest_payment_id: payment?.payment_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_id', subscription_id);

  if (subscriptionError) {
    logger.error(`Failed to update subscription`, {
      subscriptionId: subscription_id,
      error: subscriptionError.message,
    });
  }

  logger.info(`Subscription renewed successfully`, {
    subscriptionId: subscription_id,
    nextBillingDate: nextEndsAt.toISOString(),
    paymentId: payment?.payment_id,
  });

  return {
    success: true,
    subscriptionId: subscription_id,
    paymentId: payment?.payment_id,
    nextBillingDate: nextEndsAt.toISOString(),
  };
}

/**
 * Get subscriptions that need renewal
 * 
 * Fetches active subscriptions where ends_at is within the next N days
 */
export async function getSubscriptionsForRenewal(
  supabase: SupabaseClient,
  daysAhead: number = 1
): Promise<SubscriptionForRenewal[]> {
  const renewalCutoff = new Date();
  renewalCutoff.setDate(renewalCutoff.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      subscription_id,
      user_id,
      plan_type,
      billing_interval,
      ends_at,
      payment_method_id,
      payment_methods!inner (
        method_id,
        billing_key,
        customer_key,
        status
      ),
      users:user_id (
        email,
        user_metadata
      )
    `)
    .eq('status', 'active')
    .eq('mode', 'paid')
    .not('payment_method_id', 'is', null)
    .lte('ends_at', renewalCutoff.toISOString())
    .gt('ends_at', new Date().toISOString()); // Not already expired

  if (error) {
    logger.error(`Failed to fetch subscriptions for renewal`, {
      error: error.message,
    });
    return [];
  }

  return (data || []) as unknown as SubscriptionForRenewal[];
}

/**
 * Process all pending subscription renewals
 */
export async function processAllRenewals(
  supabase: SupabaseClient,
  daysAhead: number = 1
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: BillingResult[];
}> {
  const subscriptions = await getSubscriptionsForRenewal(supabase, daysAhead);

  logger.info(`Found ${subscriptions.length} subscriptions for renewal`);

  const results: BillingResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      const result = await processSubscriptionRenewal(subscription, supabase);
      results.push(result);

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    } catch (error: any) {
      logger.error(`Unexpected error processing subscription`, {
        subscriptionId: subscription.subscription_id,
        error: error.message,
      });
      results.push({
        success: false,
        subscriptionId: subscription.subscription_id,
        error: error.message,
      });
      failed++;
    }
  }

  logger.info(`Renewal processing complete`, {
    processed: subscriptions.length,
    succeeded,
    failed,
  });

  return {
    processed: subscriptions.length,
    succeeded,
    failed,
    results,
  };
}
