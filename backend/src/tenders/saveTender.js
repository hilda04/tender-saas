const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err, getUserId } = require("../lib/utils");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const body = JSON.parse(event.body || "{}");
  const {
    tenderTitle, tenderNumber, issuingAuthority, closingDate,
    description, requirements, evaluationCriteria, budgetRange,
    deliverables, submissionFormat,
  } = body;

  if (!tenderTitle || !issuingAuthority) {
    return err("tenderTitle and issuingAuthority are required");
  }

  const tenderId = uuidv4();
  const now = new Date().toISOString();

  await dynamo.send(new PutCommand({
    TableName: process.env.TENDERS_TABLE,
    Item: {
      tenderId, userId,
      tenderTitle, tenderNumber, issuingAuthority, closingDate,
      description, requirements: requirements || [],
      evaluationCriteria: evaluationCriteria || [],
      budgetRange, deliverables: deliverables || [],
      submissionFormat,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
  }));

  return ok({ tenderId, message: "Tender saved" }, 201);
};
