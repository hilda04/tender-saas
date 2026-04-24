const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err, getUserId } = require("../lib/utils");

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const result = await dynamo.send(new QueryCommand({
    TableName: process.env.TENDERS_TABLE,
    IndexName: "userId-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
  }));

  return ok({ tenders: result.Items || [] });
};
