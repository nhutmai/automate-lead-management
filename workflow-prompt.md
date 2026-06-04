# Lead Management Automation MVP Workflow Prompt

# Role
You are a senior full-stack engineer. Build a complete MVP in this repository from scratch.

# Objective
Create a Lead Management Automation MVP using Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Groq AI classification, Telegram notifications, and a dashboard.

The repository has been initialized as a Next.js project. Continue from the existing project structure.

# Tech Stack
- Framework: Latest stable Next.js with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI style: Professional polished UI inspired by TypeUI artistic components
- TypeUI setup command: `npx typeui.sh pull artistic`
- Database: PostgreSQL
- Local database: Docker Compose PostgreSQL
- ORM: Prisma
- AI provider: Groq
- Notification: Telegram Bot API
- Deployment target: Vercel or another platform with PostgreSQL support
- Authentication: Not required for this MVP

# Implementation Rules
- Preserve `.git`.
- Use App Router, not Pages Router.
- Keep all API keys server-side only.
- Never expose `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, or database credentials to the frontend.
- Use simple, maintainable code over excessive abstraction.
- Validate request bodies.
- Add clear error handling and useful server logs.
- If Telegram notification fails, do not fail the lead creation request.
- If Groq classification fails, still create the lead with fallback classification.
- Before making edits, inspect the repository briefly and confirm the current state.

# Design Requirements
Build a polished, demo-friendly interface using TypeUI artistic styling as the visual direction.

The UI should feel:
- Clean
- Professional
- Responsive
- Modern
- Suitable for a clinic or healthcare lead-management workflow

Use:
- Metric cards
- Colored badges for lead temperature and status
- A clean responsive table
- Clear form states
- Loading states
- Success and error feedback
- Status dropdowns in the dashboard

Do not add authentication.

# System Flow
Lead Form
-> `/api/leads`
-> Groq AI classification
-> PostgreSQL via Prisma
-> Telegram Bot notification
-> Dashboard

# Pages

## `/`
Create a lead form with these fields:
- `name` required
- `phone` required
- `email` optional
- `source` required string, with UI options:
  - Facebook Ads
  - TikTok
  - Website
  - Referral
  - Other
- `serviceInterest` optional
- `message` required

On submit:
- Send data to `POST /api/leads`
- Show loading state
- Show success message after successful submission
- Show validation errors for missing required fields
- Reset the form after success if appropriate

## `/dashboard`
Create a dashboard that:
- Fetches leads from `GET /api/leads`
- Displays metrics:
  - Total leads
  - Hot leads
  - Warm leads
  - Cold leads
  - Booked leads
- Displays a lead table with:
  - `createdAt`
  - `name`
  - `phone`
  - `source`
  - `aiServiceInterest`
  - `leadTemperature`
  - `urgency`
  - `status`
  - `intentSummary`
  - `recommendedAction`
- Includes a dropdown/select to update each lead's status using `PATCH /api/leads/[id]`
- Updates the UI after a status change

# API Routes

## `POST /api/leads`
Processing flow:
1. Receive and validate form data.
2. Call Groq API to classify the lead.
3. Save the lead and AI classification result into PostgreSQL.
4. Send Telegram notification after successful creation.
5. Return JSON response to the frontend.

If Groq fails, use this fallback:

```json
{
  "leadTemperature": "Warm",
  "urgency": "Medium",
  "intentSummary": "AI classification failed. Manual review required.",
  "recommendedAction": "Review and contact customer manually."
}
```

## `GET /api/leads`
Requirements:
- Return newest leads first
- Limit to the latest 100 records
- Return summary metrics if convenient

## `PATCH /api/leads/[id]`
Allow updating status to:
- `New`
- `Contacted`
- `Booked`
- `Lost`

Validate status before updating.

# Groq AI Classification

Use these environment variables:

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

You may choose between the official Groq SDK or direct REST `fetch`.

Choose the approach that is simpler, reliable, and easy to maintain for this MVP. After implementation, briefly explain why you chose that approach.

The AI must return valid JSON with this structure:

```json
{
  "serviceInterest": "string",
  "leadTemperature": "Hot | Warm | Cold",
  "urgency": "High | Medium | Low",
  "intentSummary": "string",
  "recommendedAction": "string",
  "suggestedReply": "string",
  "assignedTeam": "string"
}
```

Use this AI prompt:

```text
You are an AI assistant that classifies leads for a clinic or healthcare service.

Classification criteria:
- Hot: the customer has a clear need, wants to book an appointment, wants consultation soon, or shows high purchase intent.
- Warm: the customer is interested but is still asking about pricing, comparing options, or has not decided yet.
- Cold: the customer asks general questions and does not show a clear need yet.

Based on the lead information, return valid JSON only. Do not use markdown. Do not add any explanation.

Lead information:
Name: {{name}}
Phone: {{phone}}
Email: {{email}}
Source: {{source}}
Service Interest: {{serviceInterest}}
Message: {{message}}

If uncertain, choose Warm.
```

Parse the response defensively. If the JSON is invalid or incomplete, use fallback values.

# Database

Use Prisma with PostgreSQL.

Create a `Lead` model with:
- `id`: string cuid
- `name`: string
- `phone`: string
- `email`: string optional
- `source`: string
- `originalServiceInterest`: string optional
- `message`: string
- `aiServiceInterest`: string optional
- `leadTemperature`: string
- `urgency`: string
- `intentSummary`: string optional
- `recommendedAction`: string optional
- `suggestedReply`: string optional
- `assignedTeam`: string optional
- `status`: string, default `New`
- `createdAt`
- `updatedAt`

Do not use Prisma enums. Use strings for `source`, `leadTemperature`, `urgency`, and `status`.

Add scripts for:
- `prisma generate`
- `prisma migrate dev`
- `prisma db push`

# Docker Compose

Create a `docker-compose.yml` for local PostgreSQL.

Use reasonable default local credentials:
- database: `lead_management`
- user: `postgres`
- password: `postgres`
- port: `5432`

Ensure `.env.example` includes a matching local `DATABASE_URL`.

# Telegram Notification

Use these environment variables:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

If Telegram env variables are missing, skip sending and log a warning.

After a lead is saved successfully, send this message:

```text
NEW {{leadTemperature}} LEAD

Name: {{name}}
Phone: {{phone}}
Source: {{source}}
Service: {{aiServiceInterest}}
Urgency: {{urgency}}

Summary:
{{intentSummary}}

Recommended Action:
{{recommendedAction}}

Dashboard:
{{APP_URL}}/dashboard
```

If Telegram fails, log the error and do not fail the main request.

# Environment Variables

Create `.env.example` with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_management
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
APP_URL=http://localhost:3000
```

# README

Write a clear `README.md` including:
- Project description
- System flow
- Tech stack
- Installation guide
- Docker PostgreSQL setup
- Environment variable setup
- How to run locally
- How to run Prisma generate/migrate/db push
- How to test the lead form and dashboard
- How to deploy
- Short demo script for interviews

# Verification

After implementation:
1. Install dependencies.
2. Run type checking or build.
3. Verify Prisma schema generation works.
4. Verify the app can start locally.
5. Report any commands that could not be completed and why.

# Final Report

When finished, report:
- Files created/changed
- Key implementation choices
- Why Groq SDK or direct REST was chosen
- How to run locally
- Any remaining manual steps, especially env keys and database migration
