const Anthropic = require("@anthropic-ai/sdk");
const { GetCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} = require("docx");
const { dynamo, s3, ok, err, getUserId } = require("../lib/utils");

const anthropic = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const checkAccess = async (userId) => {
  const result = await dynamo.send(new GetCommand({
    TableName: process.env.USERS_TABLE,
    Key: { userId },
  }));
  const user = result.Item;
  if (!user) return { allowed: false, reason: "User not found" };
  if (user.subscriptionStatus === "active") return { allowed: true, user };
  if (user.freeGenerationsUsed < user.freeGenerationsLimit) {
    return { allowed: true, user, isFree: true };
  }
  return { allowed: false, reason: "free_limit_reached", user };
};

const buildPrompt = (company, tender) => `
You are an expert at writing winning tender/RFP responses for Zimbabwean government and corporate procurement.
You write in formal, professional English appropriate for Zimbabwean public sector submissions.

COMPANY PROFILE:
- Name: ${company.companyName}
- Registration No: ${company.registrationNumber || "N/A"}
- Address: ${company.address}, ${company.city}
- Directors: ${(company.directors || []).join(", ")}
- Years in operation: ${company.yearsExperience || "N/A"}
- Sectors: ${(company.sectors || []).join(", ")}
- Certifications: ${(company.certifications || []).join(", ")}
- Past Projects: ${(company.pastProjects || []).map(p => `${p.name} (${p.value || ""})`).join("; ")}
- Tax Number: ${company.taxNumber || "N/A"}

TENDER DETAILS:
- Title: ${tender.tenderTitle}
- Tender Number: ${tender.tenderNumber || "N/A"}
- Issuing Authority: ${tender.issuingAuthority}
- Closing Date: ${tender.closingDate || "N/A"}
- Description: ${tender.description}
- Requirements: ${(tender.requirements || []).join("; ")}
- Evaluation Criteria: ${(tender.evaluationCriteria || []).join("; ")}
- Budget Range: ${tender.budgetRange || "As per schedule of rates"}
- Deliverables: ${(tender.deliverables || []).join("; ")}

Generate a complete, professional tender response document with these EXACT sections in this order:

1. COVER LETTER
   Formal letter addressed to the procurement officer of ${tender.issuingAuthority}. Reference the tender number, express interest, confirm compliance. Close with contact details.

2. COMPANY OVERVIEW
   Professional introduction of ${company.companyName}: history, legal status, core competencies, geographic coverage, company vision.

3. UNDERSTANDING OF REQUIREMENTS
   Demonstrate thorough understanding of what is being procured. Paraphrase the scope back to show comprehension.

4. TECHNICAL APPROACH AND METHODOLOGY
   Detailed, credible approach to delivering this specific tender. Include phases, timelines, quality assurance measures. Reference Zimbabwean standards where applicable (ZERA, ZINARA, ZIMRA, Standards Association of Zimbabwe, etc.).

5. RELEVANT EXPERIENCE AND PAST PERFORMANCE
   Present past projects as evidence of capability. If limited, frame what experience exists positively and emphasise commitment.

6. TEAM AND KEY PERSONNEL
   Describe the team structure. If specific names not provided, describe roles and qualifications required.

7. COMPLIANCE AND LEGAL STANDING
   State compliance with: Companies and Other Business Entities Act (Chapter 24:31), ZIMRA tax clearance, NSSA registration, relevant sector licences.

8. DECLARATION
   Formal declaration that information is accurate, company is not blacklisted, no conflict of interest.

Write each section with proper formal Zimbabwe procurement language. Be specific and confident. Avoid vague filler.
Return ONLY the document content — no meta-commentary. Use markdown headings (## for sections) for structure.
`;

const buildDocx = async (company, tender, content) => {
  const sections = content.split(/^## /m).filter(Boolean);

  const children = [
    new Paragraph({
      text: `TENDER RESPONSE`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: tender.tenderTitle.toUpperCase(),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Tender Reference: ${tender.tenderNumber || "N/A"}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Submitted by: ${company.companyName}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Date: ${new Date().toLocaleDateString("en-ZW", { year: "numeric", month: "long", day: "numeric" })}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
  ];

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const heading = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();

    children.push(new Paragraph({
      text: heading,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }));

    for (const para of body.split("\n\n")) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("- ")) {
        for (const bullet of trimmed.split("\n").filter(l => l.startsWith("- "))) {
          children.push(new Paragraph({
            text: bullet.replace(/^- /, ""),
            bullet: { level: 0 },
          }));
        }
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 24 })],
          spacing: { after: 160 },
        }));
      }
    }
  }

  const doc = new Document({
    creator: company.companyName,
    title: `Tender Response - ${tender.tenderTitle}`,
    description: `Tender response for ${tender.tenderNumber || tender.tenderTitle}`,
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
};

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return err("Unauthorized", 401);

  const body = JSON.parse(event.body || "{}");
  const { tenderId, companyId } = body;
  if (!tenderId || !companyId) return err("tenderId and companyId are required");

  const access = await checkAccess(userId);
  if (!access.allowed) {
    return err(
      access.reason === "free_limit_reached"
        ? "You have used your 2 free generations. Please subscribe to continue."
        : access.reason,
      403
    );
  }

  const [tenderResult, companyResult] = await Promise.all([
    dynamo.send(new GetCommand({ TableName: process.env.TENDERS_TABLE, Key: { tenderId } })),
    dynamo.send(new GetCommand({ TableName: process.env.COMPANIES_TABLE, Key: { companyId } })),
  ]);

  const tender = tenderResult.Item;
  const company = companyResult.Item;

  if (!tender || tender.userId !== userId) return err("Tender not found", 404);
  if (!company || company.userId !== userId) return err("Company not found", 404);

  await dynamo.send(new UpdateCommand({
    TableName: process.env.TENDERS_TABLE,
    Key: { tenderId },
    UpdateExpression: "SET #s = :s, updatedAt = :t",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":s": "generating", ":t": new Date().toISOString() },
  }));

  const prompt = buildPrompt(company, tender);
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20251022",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0].text;

  const docBuffer = await buildDocx(company, tender, content);
  const documentKey = `documents/${userId}/${tenderId}/response_${Date.now()}.docx`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.DOCUMENTS_BUCKET,
    Key: documentKey,
    Body: docBuffer,
    ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }));

  if (access.isFree) {
    await dynamo.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET freeGenerationsUsed = freeGenerationsUsed + :one",
      ExpressionAttributeValues: { ":one": 1 },
    }));
  }

  await dynamo.send(new UpdateCommand({
    TableName: process.env.TENDERS_TABLE,
    Key: { tenderId },
    UpdateExpression: "SET #s = :s, documentKey = :dk, generatedAt = :t, updatedAt = :t",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: {
      ":s": "completed",
      ":dk": documentKey,
      ":t": new Date().toISOString(),
    },
  }));

  return ok({ tenderId, status: "completed", message: "Tender response generated successfully" });
};
