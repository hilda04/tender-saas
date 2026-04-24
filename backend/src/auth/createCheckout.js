const Stripe = require("stripe");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err, getUserId } = require("../lib/utils");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const { data: user } = await dynamo.send(new GetCommand({
    TableName: process.env.USERS_TABLE,
    Key: { userId },
  })).catch(() => ({ data: null }));

  if (!user) return err("User not found", 404);

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    customerId = customer.id;

    await dynamo.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET stripeCustomerId = :cid",
      ExpressionAttributeValues: { ":cid": customerId },
    }));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1,
    }],
    mode: "subscription",
    success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId },
  });

  return ok({ url: session.url });
};
