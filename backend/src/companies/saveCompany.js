const { PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamo, ok, err, getUserId } = require("../lib/utils");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const body = JSON.parse(event.body || "{}");
  const {
    companyName, registrationNumber, address, city, phone, email,
    website, directors, yearsExperience, sectors, certifications,
    pastProjects, bankDetails, taxNumber,
  } = body;

  if (!companyName) return err("companyName is required");

  const companyId = event.pathParameters?.companyId || uuidv4();
  const now = new Date().toISOString();

  await dynamo.send(new PutCommand({
    TableName: process.env.COMPANIES_TABLE,
    Item: {
      companyId,
      userId,
      companyName, registrationNumber, address, city,
      phone, email, website, directors,
      yearsExperience, sectors: sectors || [],
      certifications: certifications || [],
      pastProjects: pastProjects || [],
      bankDetails, taxNumber,
      createdAt: now,
      updatedAt: now,
    },
  }));

  return ok({ companyId, message: "Company profile saved" });
};
