const Stripe = require("stripe");
const { QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err } = require("../lib/utils");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getUserByStripeId = async (stripeCustomerId) => {
  const result = await dynamo.send(new QueryCommand({
    TableName: process.env.USERS_TABLE,
    IndexName: "stripeCustomerId-index",
    KeyConditionExpression: "stripeCustomerId = :cid",
    ExpressionAttributeValues: { ":cid": stripeCustomerId },
  }));
  return result.Items?.[0] || null;
};

const setSubscription = async (userId, status, subscriptionId = null) => {
  await dynamo.send(new UpdateCommand({
    TableName: process.env.USERS_TABLE,
    Key: { userId },
    UpdateExpression: "SET subscriptionStatus = :s, stripeSubscriptionId = :sid, updatedAt = :t",
    ExpressionAttributeValues: {
      ":s": status,
      ":sid": subscriptionId,
      ":t": new Date().toISOString(),
    },
  }));
};

exports.handler = async (event) => {
  const sig = event.headers["Stripe-Signature"] || event.headers["stripe-signature"];
  const rawBody = event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature failed:", e.message);
    return err(`Webhook error: ${e.message}`, 400);
  }

  const obj = stripeEvent.data.object;

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const userId = obj.metadata?.userId;
      if (userId) {
        await setSubscription(userId, "active", obj.subscription);
      }
      break;
    }

    case "customer.subscription.updated": {
      const user = await getUserByStripeId(obj.customer);
      if (user) {
        const status = obj.status === "active" ? "active" : "inactive";
        await setSubscription(user.userId, status, obj.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const user = await getUserByStripeId(obj.customer);
      if (user) {
        await setSubscription(user.userId, "cancelled", null);
      }
      break;
    }

    case "invoice.payment_failed": {
      const user = await getUserByStripeId(obj.customer);
      if (user) {
        await setSubscription(user.userId, "past_due", user.stripeSubscriptionId);
      }
      break;
    }
  }

  return ok({ received: true });
};
