const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err, getUserId } = require("../lib/utils");

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const result = await dynamo.send(new QueryCommand({
    TableName: process.env.COMPANIES_TABLE,
    IndexName: "userId-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    Limit: 1,
  }));

  if (!result.Items?.length) return ok(null);
  return ok(result.Items[0]);
};
