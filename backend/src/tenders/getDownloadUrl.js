const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { dynamo, s3, ok, err, getUserId } = require("../lib/utils");

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const { tenderId } = event.pathParameters;

  const result = await dynamo.send(new GetCommand({
    TableName: process.env.TENDERS_TABLE,
    Key: { tenderId },
  }));

  const tender = result.Item;
  if (!tender || tender.userId !== userId) return err("Not found", 404);
  if (!tender.documentKey) return err("Document not yet generated", 404);

  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.DOCUMENTS_BUCKET,
    Key: tender.documentKey,
    ResponseContentDisposition: `attachment; filename="${tender.tenderTitle.replace(/[^a-z0-9]/gi, '_')}_response.docx"`,
  }), { expiresIn: 300 });

  return ok({ url });
};
