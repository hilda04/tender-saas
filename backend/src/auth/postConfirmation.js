const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo } = require("../lib/utils");

exports.handler = async (event) => {
  const userId = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;

  await dynamo.send(new PutCommand({
    TableName: process.env.USERS_TABLE,
    Item: {
      userId,
      email,
      subscriptionStatus: "free",
      freeGenerationsUsed: 0,
      freeGenerationsLimit: 2,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date().toISOString(),
    },
    ConditionExpression: "attribute_not_exists(userId)",
  }));

  return event;
};
