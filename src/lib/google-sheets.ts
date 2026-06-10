import { createSign } from "node:crypto";
import type { Lead } from "@prisma/client";

const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleSheetsScope = "https://www.googleapis.com/auth/spreadsheets";

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function getPrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function getSpreadsheetId() {
  const rawValue = process.env.GOOGLE_SHEET_ID?.trim();
  if (!rawValue) return "";

  const urlMatch = rawValue.match(/\/spreadsheets\/d\/([^/]+)/);
  if (urlMatch?.[1]) return urlMatch[1];

  return rawValue.replace(/\/+$/, "");
}

function hasGoogleSheetsConfig() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      getPrivateKey() &&
      getSpreadsheetId(),
  );
}

async function getGoogleAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account env variables are missing.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: googleSheetsScope,
      aud: googleTokenUrl,
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(privateKey);
  const assertion = `${unsignedToken}.${base64UrlEncode(signature)}`;

  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payloadJson = await response.json();

  if (!response.ok || typeof payloadJson.access_token !== "string") {
    throw new Error(
      `Google access token request failed: ${response.status} ${JSON.stringify(
        payloadJson,
      )}`,
    );
  }

  return payloadJson.access_token as string;
}

function buildLeadSheetRow(lead: Lead) {
  return [
    lead.createdAt.toISOString(),
    lead.name,
    lead.phone,
    lead.source,
    lead.leadTemperature,
    lead.urgency,
    lead.status,
    lead.assignedTeam || "",
    lead.intentSummaryVi || lead.intentSummary || "",
    lead.recommendedActionVi || lead.recommendedAction || "",
    lead.suggestedReply || "",
  ];
}

export async function appendLeadToGoogleSheet(lead: Lead) {
  if (!hasGoogleSheetsConfig()) {
    console.warn("Google Sheets env variables are missing. Skipping sync.");
    return;
  }

  const sheetId = getSpreadsheetId();
  const tabName = process.env.GOOGLE_SHEET_TAB?.trim() || "Leads";

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is missing.");
  }

  const accessToken = await getGoogleAccessToken();
  const range = encodeURIComponent(`${tabName}!A:K`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [buildLeadSheetRow(lead)],
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Sheets append failed: ${response.status} ${details}`);
  }
}
