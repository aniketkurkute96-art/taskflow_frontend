# Cheque Management with OTP Handover - Setup Guide

## 📋 Overview

This feature implements a complete **Cheque Management workflow** with OTP-based handover verification. It includes custody tracking, photo/signature capture, role-based access control, and comprehensive audit trails.

## 🏗️ Architecture

### Backend Components

- **Database Models**: `cheques`, `custody_logs`, `otps`, `handover_records`, `audit_logs`, `handover_overrides`
- **Services**: 
  - `OtpService`: OTP generation, hashing, verification, rate-limiting
  - `ChequeService`: Cheque lifecycle management
  - `HandoverOverrideService`: Manual override workflow
- **Controller**: `DocumentController` with 14 endpoints
- **Middleware**: Enhanced RBAC with new roles (reception, accounts, director)

### Frontend Components

- **Pages**: `ReceptionDashboard`
- **Modals**: `GenerateOtpModal`, `VerifyOtpModal`, `ChequeDetailModal`
- **Components**: `PhotoCapture`, `SignaturePad`
- **Service**: `chequeService` with full API integration

## 🔧 Environment Variables

### Backend `.env`

```env
# OTP Configuration
OTP_SECRET=your-secret-key-change-in-production-use-32-chars
OTP_EXPIRY_MINS=10

# SMS/WhatsApp/Email Configuration (optional - for actual sending)
SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://sms-provider.com/api/send
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_API_URL=https://whatsapp-provider.com/api/send
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@taskflow.com

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🗄️ Database Setup

### Run Migrations

```bash
cd backend
npx prisma migrate dev --name add_cheque_management
npx prisma generate
```

### Seed Test Users

Create test users with new roles:

```bash
npm run seed
```

Or manually create users:

```sql
INSERT INTO users (id, name, email, password, role, active, createdAt, updatedAt)
VALUES 
  ('director-1', 'Director User', 'director@taskflow.com', 'password123', 'director', 1, datetime('now'), datetime('now')),
  ('accounts-1', 'Accounts User', 'accounts@taskflow.com', 'password123', 'accounts', 1, datetime('now'), datetime('now')),
  ('reception-1', 'Reception User', 'reception@taskflow.com', 'password123', 'reception', 1, datetime('now'), datetime('now'));
```

## 🚀 Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:3001`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📡 API Endpoints

### Cheque Management

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/api/documents/cheques` | Create cheque | director, accounts, admin |
| `GET` | `/api/documents/cheques` | List cheques | All authenticated |
| `GET` | `/api/documents/cheques/:id` | Get cheque details | All authenticated |
| `POST` | `/api/documents/cheques/:id/mark-ready` | Mark ready for dispatch | accounts, admin |
| `POST` | `/api/documents/cheques/:id/forward-to-reception` | Forward to reception | accounts, admin |
| `POST` | `/api/documents/cheques/:id/generate-otp` | Generate OTP | reception, admin |
| `POST` | `/api/documents/cheques/:id/verify-otp` | Verify OTP & handover | reception, admin |
| `POST` | `/api/documents/cheques/:id/handover-override` | Request override | reception, admin |
| `POST` | `/api/documents/cheques/:id/cancel` | Cancel cheque | director, accounts, admin |
| `GET` | `/api/documents/cheques/:id/audit` | Get audit trail | All authenticated |
| `GET` | `/api/documents/cheques/:id/overrides` | Get override history | All authenticated |

### Override Management

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/documents/handover-override/pending` | Get pending overrides | hod, admin |
| `POST` | `/api/documents/handover-override/:id/approve` | Approve override | hod, admin |
| `POST` | `/api/documents/handover-override/:id/reject` | Reject override | hod, admin |

## 🔐 OTP Security

### Features

- **Hashing**: HMAC-SHA256 with secret key
- **Expiry**: Default 10 minutes (configurable)
- **Rate Limiting**: Max 3 OTPs per cheque per day
- **Attempt Tracking**: Max 3 verification attempts
- **Auto-Lock**: Locks after 3 failed attempts
- **Single-Use**: OTP marked as USED after success
- **Audit Trail**: All OTP operations logged

### OTP Flow

1. **Generation**
   - Reception generates OTP for a cheque
   - OTP is hashed and stored
   - Sent via SMS/WhatsApp/Email
   - Expires in 10 minutes

2. **Verification**
   - Reception enters OTP + recipient details
   - Captures photo and signature
   - System verifies OTP hash
   - On success: marks cheque as ISSUED
   - On failure: increments attempts, locks at 3

3. **Override**
   - If locked, reception requests manual override
   - HOD approves/rejects
   - On approval: can proceed without OTP

## 🖼️ File Upload

### Photo & Signature Handling

Photos and signatures are uploaded to the server:

```typescript
// Upload endpoint (needs to be implemented)
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "path": "uploads/cheques/photo-123456.jpg"
}
```

### Storage Structure

```
uploads/
  cheques/
    CHQ001_recipient.jpg
    CHQ001_signature.png
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

Test files:
- `src/__tests__/otpService.test.ts`

### Manual Testing Flow

1. **Login as Director/Accounts**
   ```
   POST /api/auth/login
   {
     "email": "accounts@taskflow.com",
     "password": "password123"
   }
   ```

2. **Create Cheque**
   ```
   POST /api/documents/cheques
   {
     "chequeNo": "CHQ001",
     "amount": 50000,
     "bank": "State Bank",
     "branch": "Main Branch",
     "payerName": "Company Pvt Ltd",
     "payeeName": "Vendor Inc",
     "dueDate": "2025-12-31"
   }
   ```

3. **Forward to Reception**
   ```
   POST /api/documents/cheques/{id}/mark-ready
   POST /api/documents/cheques/{id}/forward-to-reception
   {
     "notes": "Urgent - Due today"
   }
   ```

4. **Login as Reception**
   ```
   POST /api/auth/login
   {
     "email": "reception@taskflow.com",
     "password": "password123"
   }
   ```

5. **Generate OTP**
   ```
   POST /api/documents/cheques/{id}/generate-otp
   {
     "channel": "sms",
     "toContact": "+911234567890"
   }
   ```

6. **Verify OTP & Handover**
   ```
   POST /api/documents/cheques/{id}/verify-otp
   {
     "otp": "123456",
     "recipientName": "John Doe",
     "idType": "Aadhaar",
     "idNumber": "1234-5678-9012",
     "recipientPhotoPath": "uploads/photo.jpg",
     "signaturePath": "uploads/signature.png"
   }
   ```

## 🎨 Frontend Usage

### Reception Dashboard

Navigate to: `/reception/cheques`

Features:
- List all cheques WITH_RECEPTION status
- Search by cheque no, payee, bank
- Filter by status, due date
- Generate OTP button
- Verify OTP button
- View cheque details

### OTP Generation Modal

- Select delivery channel (SMS/WhatsApp/Email)
- Enter recipient contact
- Shows countdown timer
- In dev mode: displays OTP in UI

### OTP Verification Modal

Multi-step process:
1. Enter 6-digit OTP
2. Enter recipient details (name, ID type, ID number)
3. Capture photo (camera or upload)
4. Capture signature (canvas)
5. Submit for verification

## 📊 Audit Trail

All actions are logged in `audit_logs`:

- `CHEQUE_CREATED`
- `STATUS_CHANGED`
- `FORWARDED_TO_RECEPTION`
- `OTP_GENERATED`
- `OTP_SENT`
- `OTP_VERIFIED`
- `OTP_FAILED`
- `OTP_EXPIRED`
- `OVERRIDE_REQUESTED`
- `OVERRIDE_APPROVED`
- `OVERRIDE_REJECTED`
- `HANDOVER_COMPLETED`
- `CHEQUE_CANCELLED`

Query audit trail:
```
GET /api/documents/cheques/{id}/audit
```

## 🔄 Cheque Status Flow

```
SIGNED
  ↓ (mark-ready)
READY_FOR_DISPATCH
  ↓ (forward-to-reception)
WITH_RECEPTION
  ↓ (verify-otp)
ISSUED

(can be CANCELLED at any stage before ISSUED)
```

## 🚨 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `OTP generation rate limit exceeded` | More than 3 OTPs in 24h | Wait or use override |
| `An active OTP already exists` | Previous OTP not expired | Wait for expiry or verify existing |
| `Invalid OTP` | Wrong OTP entered | Check OTP, {remaining} attempts left |
| `OTP has expired` | OTP older than 10 mins | Generate new OTP |
| `OTP is locked` | 3 failed attempts | Request manual override |
| `Insufficient permissions` | Wrong role | Login with correct role |

## 🔧 Configuration & Customization

### Adjust OTP Expiry

```typescript
// backend/src/services/otpService.ts
const OTP_EXPIRY_MINS = parseInt(process.env.OTP_EXPIRY_MINS || '10');
```

### Adjust Rate Limits

```typescript
// backend/src/services/otpService.ts
const MAX_OTPS_PER_DAY = 3;
const MAX_OTP_ATTEMPTS = 3;
```

### Customize OTP Delivery

Implement adapters in `otpService.ts`:

```typescript
case 'sms':
  // Integrate with Twilio, AWS SNS, etc.
  await smsAdapter.send(toContact, message);
  break;

case 'whatsapp':
  // Integrate with WhatsApp Business API
  await whatsappAdapter.send(toContact, message);
  break;

case 'email':
  // Integrate with SendGrid, AWS SES, etc.
  await emailAdapter.send(toContact, 'Cheque OTP', message);
  break;
```

## 📦 Dependencies

### Backend

- `crypto` (built-in): OTP hashing
- `@prisma/client`: Database ORM
- `express`: HTTP server
- `jsonwebtoken`: Authentication
- `multer`: File uploads (for photos/signatures)

### Frontend

- `react`: UI framework
- `axios`: HTTP client
- `date-fns`: Date formatting
- `react-router-dom`: Navigation

## 🐛 Troubleshooting

### Camera Not Working

- Check browser permissions
- Use HTTPS in production
- Fallback to file upload

### OTP Not Sending

- Check environment variables
- Verify API keys
- Check console logs in dev mode

### Database Errors

```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma generate
npm run seed
```

## 📝 TODO / Future Enhancements

- [ ] Add WhatsApp/SMS integration
- [ ] Add PDF receipt generation
- [ ] Add email notifications
- [ ] Add bulk cheque operations
- [ ] Add cheque return flow
- [ ] Add advanced reporting
- [ ] Add mobile app
- [ ] Add biometric verification

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Author**: TaskFlow Team

