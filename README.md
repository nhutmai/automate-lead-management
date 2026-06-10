# PulseLead AI - Automate Lead Management

PulseLead AI là MVP quản lý lead cho phòng khám/dịch vụ chăm sóc sức khỏe. Ứng dụng nhận thông tin khách hàng từ form, dùng AI để phân loại mức độ quan tâm, lưu vào PostgreSQL, gửi thông báo Telegram cho đội ngũ và hiển thị dashboard để theo dõi xử lý.

## Data Flow

```text
Lead Form (/)
  -> POST /api/leads
  -> Zod validate request body
  -> Groq AI classification
  -> Prisma save to PostgreSQL
  -> Telegram notification
  -> Google Sheets append
  -> Dashboard (/dashboard)
```

Chat intake demo:

```text
AI Chat Intake (/chat)
  -> POST /api/chat/intake
  -> Extract name, phone, and service interest
  -> Shared lead creation pipeline
  -> Groq AI classification
  -> Prisma save to PostgreSQL
  -> Telegram notification
  -> Google Sheets append
  -> Dashboard (/dashboard)
```

Luồng chi tiết:

1. Người dùng nhập lead ở trang `/` gồm tên, số điện thoại, email, nguồn, dịch vụ quan tâm và nội dung tư vấn.
2. Frontend gửi dữ liệu đến `POST /api/leads`.
3. API kiểm tra dữ liệu bằng Zod trong `src/lib/validation.ts`.
4. `src/lib/ai.ts` gửi prompt đến Groq Chat Completions API để phân loại lead.
5. Kết quả AI được chuẩn hóa thành JSON rồi lưu cùng lead vào bảng `Lead` qua Prisma.
6. Sau khi lưu thành công, `src/lib/telegram.ts` gửi thông báo Telegram nếu có `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`.
7. `src/lib/google-sheets.ts` append lead mới vào Google Sheet nếu có cấu hình Service Account.
8. Dashboard gọi `GET /api/leads` để lấy 100 lead mới nhất và metrics tổng quan.
9. Dashboard cập nhật trạng thái lead qua `PATCH /api/leads/[id]`.

Nếu Groq lỗi hoặc thiếu `GROQ_API_KEY`, hệ thống vẫn tạo lead bằng fallback classification: `Warm`, `Medium`, yêu cầu kiểm tra thủ công. Nếu Telegram hoặc Google Sheets lỗi/thiếu biến môi trường, lead vẫn được tạo thành công trong database.

## Prompt AI

Prompt chính nằm trong `src/lib/ai.ts`, hàm `buildPrompt`. AI được yêu cầu đóng vai assistant phân loại lead cho phòng khám/dịch vụ sức khỏe, trả về JSON hợp lệ, không markdown, không giải thích thêm.

Tiêu chí phân loại:

- `Hot`: khách có nhu cầu rõ, muốn đặt lịch, muốn tư vấn sớm hoặc thể hiện ý định mua cao.
- `Warm`: khách quan tâm nhưng còn hỏi giá, so sánh lựa chọn hoặc chưa quyết định.
- `Cold`: khách hỏi thông tin chung, chưa thể hiện nhu cầu rõ.

JSON AI phải trả về đủ các field:

```json
{
  "serviceInterest": "string",
  "leadTemperature": "Hot | Warm | Cold",
  "urgency": "High | Medium | Low",
  "intentSummary": "English summary string",
  "intentSummaryVi": "Vietnamese summary string",
  "recommendedAction": "English recommended action string",
  "recommendedActionVi": "Vietnamese recommended action string",
  "suggestedReply": "string",
  "assignedTeam": "string"
}
```

Input đưa vào prompt:

```text
Name: {{name}}
Phone: {{phone}}
Email: {{email}}
Source: {{source}}
Service Interest: {{serviceInterest}}
Message: {{message}}
```

Cấu hình gọi Groq hiện tại:

- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model mặc định: `llama-3.1-8b-instant`
- `temperature`: `0.1`
- `response_format`: `{ "type": "json_object" }`

## Tính năng chính

- Form tạo lead song ngữ Anh/Vi.
- AI Chat Intake Widget mô phỏng luồng chat website kiểu Messenger.
- Validate required fields ở frontend và backend.
- AI phân loại dịch vụ, nhiệt độ lead, mức độ khẩn cấp, tóm tắt nhu cầu và hành động đề xuất.
- Lưu lead vào PostgreSQL bằng Prisma.
- Gửi Telegram alert sau khi tạo lead.
- Ghi lead mới vào Google Sheets bằng Service Account nếu được cấu hình.
- Dashboard xem 100 lead mới nhất.
- Metrics: tổng lead, Hot, Warm, Cold, Booked.
- Cập nhật trạng thái lead: `New`, `Contacted`, `Booked`, `Lost`.

## AI Chat Intake Widget

Trang `/chat` mô phỏng một Messenger-like lead intake flow ngay trong website. Đây không phải tích hợp Messenger thật; widget được trình bày là kênh `Website Chat` để demo cách khách hàng phòng khám có thể trò chuyện với AI assistant, để lại nhu cầu, tên và số điện thoại, rồi được chuyển thành lead CRM.

Luồng này dùng cùng core pipeline như Messenger hoặc các kênh chat khác:

```text
message intake -> AI triage -> CRM save -> team notification -> dashboard tracking
```

API `POST /api/chat/intake` nhận mảng `messages`, trích xuất đơn giản bằng regex/heuristics, hỏi tiếp nếu thiếu `name`, `phone`, hoặc `serviceInterest`, và khi đủ thông tin sẽ tạo lead với `source = "Website Chat"`. Real Messenger integration có thể được thêm sau qua Meta Webhooks như một channel adapter khác. Zalo OA hoặc các kênh khác cũng có thể đi vào cùng pipeline bằng adapter tương tự.

## Tech Stack

- Next.js `16.2.7` App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- Prisma `7.8.0`
- PostgreSQL
- Groq Chat Completions API
- Telegram Bot API
- Google Sheets API
- Zod
- Lucide React icons

## Cấu trúc thư mục

```text
src/app/page.tsx                  Lead form
src/app/chat/page.tsx             AI Chat Intake Widget
src/app/dashboard/page.tsx        Dashboard quản lý lead
src/app/api/leads/route.ts        GET/POST lead API
src/app/api/leads/[id]/route.ts   PATCH status API
src/app/api/chat/intake/route.ts  Chat intake API
src/lib/ai.ts                     Prompt + Groq classification
src/lib/chat-intake.ts            Chat extraction and reply logic
src/lib/leads.ts                  Shared lead creation pipeline
src/lib/google-sheets.ts          Google Sheets append integration
src/lib/telegram.ts               Telegram notification
src/lib/validation.ts             Zod schemas
src/lib/prisma.ts                 Prisma client
src/lib/i18n.ts                   Nội dung song ngữ
prisma/schema.prisma              Lead data model
docker-compose.yml                PostgreSQL local
workflow-prompt.md                Prompt/spec ban đầu để build MVP
```

## Database Model

Model chính là `Lead` trong `prisma/schema.prisma`.

Các nhóm dữ liệu quan trọng:

- Thông tin khách: `name`, `phone`, `email`, `source`, `originalServiceInterest`, `message`.
- Kết quả AI: `aiServiceInterest`, `leadTemperature`, `urgency`, `intentSummary`, `intentSummaryVi`, `recommendedAction`, `recommendedActionVi`, `suggestedReply`, `assignedTeam`.
- Quy trình xử lý: `status`, mặc định `New`.
- Metadata: `createdAt`, `updatedAt`.

Các field phân loại dùng string thay vì enum để MVP dễ thay đổi tiêu chí.

## Cài đặt local

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo file môi trường

```bash
cp .env.example .env
```

Nội dung mẫu:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lead_management?schema=public"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.1-8b-instant"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_PRIVATE_KEY=""
GOOGLE_SHEET_ID=""
GOOGLE_SHEET_TAB="Leads"
GOOGLE_SHEET_URL=""
```

Ghi chú:

- `GROQ_API_KEY` cần có để AI phân loại thật.
- Nếu không có `GROQ_API_KEY`, app dùng fallback classification.
- `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` là tùy chọn cho local demo.
- Google Sheets env là tùy chọn. Nếu thiếu hoặc gọi API lỗi, lead vẫn được lưu vào PostgreSQL.

### Google Sheets integration

Ứng dụng dùng Service Account để append lead mới vào Google Sheet sau khi tạo lead thành công. Đây là luồng backend-to-backend, không cần người dùng login Google.

Thứ tự cột được ghi giống dashboard:

```text
THỜI GIAN
HỌ TÊN
SỐ ĐIỆN THOẠI
NGUỒN
MỨC ĐỘ
ƯU TIÊN
TRẠNG THÁI
ASSIGNED TEAM
TÓM TẮT NHU CẦU
HÀNH ĐỘNG ĐỀ XUẤT
SUGGESTED REPLY
```

Các bước lấy credentials:

1. Vào [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo project mới hoặc chọn project hiện có.
3. Vào `APIs & Services` -> `Library`, tìm và enable `Google Sheets API`.
4. Vào `APIs & Services` -> `Credentials`.
5. Chọn `Create credentials` -> `Service account`.
6. Tạo service account, ví dụ `pulselead-sheets-writer`.
7. Sau khi tạo xong, mở service account đó -> tab `Keys`.
8. Chọn `Add key` -> `Create new key` -> `JSON`.
9. Tải file JSON về máy. Trong file này cần 2 giá trị:
   - `client_email` -> copy vào `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` -> copy vào `GOOGLE_PRIVATE_KEY`
10. Tạo Google Sheet để lưu danh sách lead.
11. Share Google Sheet đó cho email service account ở bước 9 với quyền `Editor`.
12. Copy Spreadsheet ID từ URL Google Sheet:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

13. Tạo tab trong Sheet, ví dụ `Leads`, rồi điền:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL="pulselead-sheets-writer@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="SPREADSHEET_ID"
GOOGLE_SHEET_TAB="Leads"
GOOGLE_SHEET_URL="https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit"
```

Lưu ý:

- Khi copy `private_key` vào `.env`, giữ `\n` trong chuỗi hoặc dùng dạng một dòng có `\n`.
- Không commit `.env` hoặc file JSON credentials lên git.
- App chỉ append lead mới. Các lead cũ trong database sẽ không tự sync lên Sheet.
- Dashboard có nút `Google Sheet` trỏ đến `GOOGLE_SHEET_URL`. Nếu thiếu URL này, app tự dựng link từ `GOOGLE_SHEET_ID`.
- Nếu Google Sheets API lỗi, app log lỗi `Google Sheets sync failed after lead creation.` và vẫn trả kết quả tạo lead thành công.
- Trên Vercel, sau khi thêm hoặc sửa env variables cần redeploy để function nhận cấu hình mới. Log thành công sẽ có dạng `Google Sheets sync succeeded for lead ...`.

### 3. Chạy PostgreSQL bằng Docker

```bash
docker compose up -d
```

Database local:

- Host: `localhost`
- Port: `5432`
- Database: `lead_management`
- User: `postgres`
- Password: `postgres`

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Chạy migration

```bash
npm run prisma:migrate
```

Nếu chỉ muốn đồng bộ schema nhanh cho môi trường demo:

```bash
npm run prisma:push
```

### 6. Chạy app

```bash
npm run dev
```

Mở:

- Lead form: http://localhost:3000
- AI Chat Intake: http://localhost:3000/chat
- Dashboard: http://localhost:3000/dashboard

## API

### `POST /api/leads`

Tạo lead mới.

Body:

```json
{
  "name": "Mai Nguyen",
  "phone": "+84 901 234 567",
  "email": "patient@example.com",
  "source": "Website",
  "serviceInterest": "Dental implant consultation",
  "message": "I want to book an appointment this week and need pricing details."
}
```

Kết quả: lưu lead kèm phân loại AI và trả về `{ "lead": ... }`.

### `POST /api/chat/intake`

Xử lý một cuộc trò chuyện intake và tạo lead khi đủ thông tin.

Body:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "I want a dental implant consultation. My name is Mai Nguyen."
    },
    {
      "role": "assistant",
      "content": "What phone number should the clinic team use to follow up?"
    },
    {
      "role": "user",
      "content": "+84 901 234 567"
    }
  ]
}
```

Kết quả khi còn thiếu thông tin: `{ "reply": "...", "leadCreated": false }`.

Kết quả khi đủ thông tin: `{ "reply": "...", "leadCreated": true, "lead": ... }`.

### `GET /api/leads`

Trả về:

- `leads`: 100 lead mới nhất, sắp xếp theo `createdAt desc`.
- `metrics`: tổng lead, Hot, Warm, Cold, Booked.

### `PATCH /api/leads/[id]`

Cập nhật trạng thái lead.

```json
{
  "status": "Booked"
}
```

Status hợp lệ: `New`, `Contacted`, `Booked`, `Lost`.

## Kiểm thử demo thủ công

1. Mở http://localhost:3000.
2. Gửi một lead có nhu cầu rõ, ví dụ muốn đặt lịch trong tuần này.
3. Kiểm tra form báo thành công.
4. Mở http://localhost:3000/dashboard.
5. Xác nhận lead mới xuất hiện với `leadTemperature`, `urgency`, tóm tắt nhu cầu và hành động đề xuất.
6. Đổi status sang `Contacted` hoặc `Booked`.
7. Refresh dashboard và kiểm tra metrics được cập nhật.
8. Nếu đã cấu hình Telegram, kiểm tra tin nhắn trong chat.

## Scripts

```bash
npm run dev              # chạy dev server
npm run build            # build production
npm run start            # chạy production server sau khi build
npm run lint             # chạy ESLint
npm run prisma:generate  # generate Prisma Client
npm run prisma:migrate   # tạo/chạy migration dev
npm run prisma:push      # đẩy schema lên database không tạo migration
```

## Deploy

Có thể deploy lên Vercel hoặc nền tảng Node.js bất kỳ có PostgreSQL.

Checklist deploy:

1. Tạo PostgreSQL database production.
2. Set `DATABASE_URL` production.
3. Set `GROQ_API_KEY` và `GROQ_MODEL`.
4. Set `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` nếu muốn nhận alert.
5. Chạy Prisma migration trên database production.
6. Build bằng `npm run build`.

## Demo Script Ngắn

"Đây là PulseLead AI, một MVP tự động hóa lead cho phòng khám. Khi khách gửi thông tin, hệ thống validate dữ liệu, gọi Groq để đọc nội dung và phân loại lead thành Hot, Warm hoặc Cold, đồng thời đánh giá urgency và đề xuất hành động tiếp theo. Lead được lưu vào PostgreSQL qua Prisma, đội ngũ có thể nhận Telegram alert, sau đó dashboard hiển thị danh sách lead mới nhất, metrics và cho phép cập nhật trạng thái chăm sóc như Contacted hoặc Booked. Nếu AI hoặc Telegram gặp lỗi, app vẫn không mất lead vì có fallback và xử lý lỗi riêng."
