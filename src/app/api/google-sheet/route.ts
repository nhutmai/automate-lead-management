import { NextResponse } from "next/server";

function getSpreadsheetId() {
  const rawValue = process.env.GOOGLE_SHEET_ID?.trim();
  if (!rawValue) return "";

  const urlMatch = rawValue.match(/\/spreadsheets\/d\/([^/]+)/);
  if (urlMatch?.[1]) return urlMatch[1];

  return rawValue.replace(/\/+$/, "");
}

export async function GET() {
  const configuredUrl = process.env.GOOGLE_SHEET_URL?.trim();

  if (configuredUrl) {
    return NextResponse.redirect(configuredUrl);
  }

  const spreadsheetId = getSpreadsheetId();

  if (spreadsheetId) {
    return NextResponse.redirect(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    );
  }

  return NextResponse.json(
    { error: "Google Sheet URL is not configured." },
    { status: 404 },
  );
}
