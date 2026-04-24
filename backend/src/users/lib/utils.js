const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const CORS = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const ok = (body, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...CORS },
  body: JSON.stringify(body),
});

const err = (message, statusCode = 400) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...CORS },
  body: JSON.stringify({ error: message }),
});

const getUserId = (event) => {
  try {
    return event.requestContext.authorizer.claims.sub;
  } catch {
    return null;
  }
};

const getSubscriptionStatus = (event) => {
  try {
    return event.requestContext.authorizer.claims["custom:subscription_status"] || "free";
  } catch {
    return "free";
  }
};

module.exports = { dynamo, s3, ok, err, getUserId, getSubscriptionStatus };
