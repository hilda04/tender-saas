const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err, getUserId } = require("../lib/utils");

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const result = await dynamo.send(new GetCommand({
    TableName: process.env.USERS_TABLE,
    Key: { userId },
  }));

  if (!result.Item) return err("User not found", 404);

  const { stripeCustomerId, ...safeUser } = result.Item;
  return ok(safeUser);
};
