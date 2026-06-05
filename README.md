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
  -> Dashboard (/dashboard)
```

Luồng chi tiết:

1. Người dùng nhập lead ở trang `/` gồm tên, số điện thoại, email, nguồn, dịch vụ quan tâm và nội dung tư vấn.
2. Frontend gửi dữ liệu đến `POST /api/leads`.
3. API kiểm tra dữ liệu bằng Zod trong `src/lib/validation.ts`.
4. `src/lib/ai.ts` gửi prompt đến Groq Chat Completions API để phân loại lead.
5. Kết quả AI được chuẩn hóa thành JSON rồi lưu cùng lead vào bảng `Lead` qua Prisma.
6. Sau khi lưu thành công, `src/lib/telegram.ts` gửi thông báo Telegram nếu có `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`.
7. Dashboard gọi `GET /api/leads` để lấy 100 lead mới nhất và metrics tổng quan.
8. Dashboard cập nhật trạng thái lead qua `PATCH /api/leads/[id]`.

Nếu Groq lỗi hoặc thiếu `GROQ_API_KEY`, hệ thống vẫn tạo lead bằng fallback classification: `Warm`, `Medium`, yêu cầu kiểm tra thủ công. Nếu Telegram lỗi hoặc thiếu biến môi trường, lead vẫn được tạo thành công.

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
- Validate required fields ở frontend và backend.
- AI phân loại dịch vụ, nhiệt độ lead, mức độ khẩn cấp, tóm tắt nhu cầu và hành động đề xuất.
- Lưu lead vào PostgreSQL bằng Prisma.
- Gửi Telegram alert sau khi tạo lead.
- Dashboard xem 100 lead mới nhất.
- Metrics: tổng lead, Hot, Warm, Cold, Booked.
- Cập nhật trạng thái lead: `New`, `Contacted`, `Booked`, `Lost`.

## Tech Stack

- Next.js `16.2.7` App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- Prisma `7.8.0`
- PostgreSQL
- Groq Chat Completions API
- Telegram Bot API
- Zod
- Lucide React icons

## Cấu trúc thư mục

```text
src/app/page.tsx                  Lead form
src/app/dashboard/page.tsx        Dashboard quản lý lead
src/app/api/leads/route.ts        GET/POST lead API
src/app/api/leads/[id]/route.ts   PATCH status API
src/lib/ai.ts                     Prompt + Groq classification
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
```

Ghi chú:

- `GROQ_API_KEY` cần có để AI phân loại thật.
- Nếu không có `GROQ_API_KEY`, app dùng fallback classification.
- `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` là tùy chọn cho local demo.

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
