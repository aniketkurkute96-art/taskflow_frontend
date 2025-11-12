# Nagrik TaskFlow - Task Management with Approval Workflows

A full-stack task management application with sophisticated approval workflows including 360° approval, specific approvers, and predefined templates.

## 🏗️ Architecture

- **Backend**: Node.js + TypeScript + Express + Prisma ORM + SQLite
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Auth**: JWT-based authentication
- **Database**: SQLite (easy to switch to PostgreSQL)

## 📋 Features

### Authentication & Users
- JWT signup & login endpoints
- 5 pre-seeded users with different roles
- Admin-only endpoints for user management

### Task Management
- Create tasks with assignees and departments
- Forward tasks to other users (creates audit trail)
- Complete tasks to trigger approval workflow
- Three approval types:
  - **360°**: Builds backward queue from forward path
  - **Specific**: Manual approver selection
  - **Predefined**: Template-based with auto-matching

### Approval Workflows
- Multi-level approval queues
- Approve/Reject actions
- Forward during approval
- Automatic template matching based on department and amount
- Dynamic role resolution (HOD, CFO)

### Admin Features
- Approval template builder
- User management
- Template conditions (department, amount thresholds)
- Multi-stage approval configurations

### Dashboard & UI
- Personal task dashboard
- Approval bucket (pending approvals)
- Overdue task tracking
- Task detail with forward path and approval queue
- Comments and attachments support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install backend dependencies**
```bash
cd backend
npm install
```

2. **Setup Prisma and seed database**
```bash
# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# Seed database with test data
npm run seed
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### Access the Application

Open http://localhost:5173 in your browser.

### Optional EagleEye UI (Feature Flag)

A new experimental workspace with enhanced task management features can be enabled for early testing. The feature is _disabled_ by default to guarantee the classic UI remains unchanged.

1. Create a `.env.local` file inside the `frontend` directory.
2. Add the flag:

```bash
VITE_ENABLE_EAGLEEYE_UI=true
```

3. Restart `npm run dev` in the frontend terminal.

When the flag is `true`, the app boots into the new EagleEye workspace with two-pane shell. Set the flag to `false` (or remove it) to return to the existing experience.

#### ✨ What's Included in EagleEye UI

**PR 1 — Foundation (Complete)**
- Feature flag system (`VITE_ENABLE_EAGLEEYE_UI`)
- Two-pane shell layout (projects sidebar + content area)
- Type definitions for tasks, projects, and filters
- Authentication preserved from classic UI

**PR 2 — Projects Sidebar (Complete)**
- Projects list with color indicators
- Search and filter projects
- "+ New Project" button (admin-only)
- Local persistence (localStorage)
- Project selection state management (Zustand)

**PR 3 — Enhanced Task List (Complete)**
- **Virtualized table** for performance with large task lists
- **Powerful filters:**
  - Search by task name, description, or assignee
  - Status filter (open, in progress, pending approval, approved, rejected)
  - Assignee multi-select filter
  - Flag filter (high priority, blocked, client wait, internal wait)
  - Date range filters (start date, due date)
- **Column management:**
  - Show/hide columns (title, status, assignee, flag, start date, end date, project, updated)
  - Adjustable column widths
  - Persistent column configuration (localStorage)
- **Smart UI:**
  - Active filter count badge
  - Clear all filters button
  - Empty states with helpful messages
  - Click row to view task details
  - Real-time task count display
- **Responsive design** with dark mode support

**PR 4 — Task Workspace (Complete)**
- **Mobile-first creation form** with sections for details, schedule, approvals, and attachments
- Priority flags, notes, recurrence setup, and kickoff comment captured at creation time
- Attachment drag & drop with previews, dedupe, and upload progress
- Approval bucket column and sidebar navigation (All Tasks / Approval Bucket / Waiting On)
- Unified activity timeline including field edits, approvals, comments, and attachment events
- Modern timeline styling for attachments, priority changes, and real-time refresh after actions
- Responsive task detail layout with quick actions, recurrence summary, and attachment management

## 👤 Test Accounts

All users have password: `password`

| Email | Role | Purpose |
|-------|------|---------|
| admin@example.com | admin | Full system access, template management |
| creator@example.com | creator | Create and manage tasks |
| hod@example.com | hod | Head of Department, approver |
| cfo@example.com | cfo | Chief Financial Officer, approver |
| assignee@example.com | assignee | Task assignee, can complete tasks |

## 📚 API Documentation

Swagger UI available at: http://localhost:3001/api/docs

## 🧪 Testing

```bash
cd backend
npm test
```

Tests include:
- Auth flow (login, signup)
- Task creation with different approval types
- Forward → Complete → Approve workflow
- Predefined template matching
- Approval bucket listing
- Reject flow

## 📖 Key Workflows

### 1. Create → Forward → Complete → Approve (360°)

```javascript
// 1. Creator creates task
POST /api/tasks
{
  "title": "Task",
  "approvalType": "360",
  "assigneeId": "user-id"
}

// 2. Assignee forwards to colleague
POST /api/tasks/:id/forward
{ "toUserId": "colleague-id" }

// 3. Colleague completes task
POST /api/tasks/:id/complete
// → Triggers 360° approval engine
// → Builds backward queue from forward path

// 4. Each approver approves in order
POST /api/tasks/:id/approve

// 5. After all approve, task status → approved
```

### 2. Predefined Template Flow

```javascript
// 1. Create task with amount and department
POST /api/tasks
{
  "title": "Vendor Payment",
  "departmentId": "accounts-dept-id",
  "amount": 150000,
  "approvalType": "predefined"
}

// 2. Complete task
POST /api/tasks/:id/complete
// → Matches "Vendor Bill Approval" template
// → amount >= 100000 && department = "Accounts"
// → Creates approvers: HOD → CFO

// 3. Approvers approve sequentially
```

### 3. Reject and Request Changes

```javascript
POST /api/tasks/:id/reject
{
  "forwardToUserId": "assignee-id" // optional
}
// → Marks approver rejected
// → Creates forward node back to assignee
// → Clears approval queue
// → Task status → rejected
```

## 🏗️ Project Structure

```
TaskFlow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic (approval engine)
│   │   ├── middleware/            # Auth middleware
│   │   ├── utils/                 # JWT utilities
│   │   ├── scripts/
│   │   │   └── seed.ts            # Database seeding
│   │   ├── __tests__/             # Integration tests
│   │   ├── database.ts            # Prisma client
│   │   └── server.ts              # Express app
│   ├── swagger.yaml               # OpenAPI specification
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 # React pages
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ApprovalBucket.tsx
│   │   │   ├── TaskCreate.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   └── AdminTemplates.tsx
│   │   ├── components/            # Shared components
│   │   │   └── Layout.tsx
│   │   ├── contexts/              # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── services/              # API client
│   │   │   └── api.ts
│   │   ├── types/                 # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Database Configuration

**SQLite (Default):**
- Database file: `backend/prisma/data/taskflow.db`
- No setup required, created automatically

**Switch to PostgreSQL:**

1. Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Add to `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
```

3. Run migrations:
```bash
npm run prisma:migrate
```

## 🔐 Security Notes

### ⚠️ IMPORTANT FOR PRODUCTION

1. **Passwords**: Seeded users use plaintext password `"password"`. In production:
   - Use `bcrypt.hash(password, 10)` for all passwords
   - See `backend/src/scripts/seed.ts` for TODO comments

2. **JWT Secret**: Change `JWT_SECRET` in `.env` to a strong random string

3. **Database**: 
   - Use PostgreSQL or MySQL instead of SQLite
   - Enable SSL connections
   - Set `synchronize: false` in Prisma config

4. **Rate Limiting**: Configured at 100 requests/15min. Adjust for production.

5. **CORS**: Currently allows `localhost:5173`. Update for production domain.

## 🎯 Approval Engine Logic

### 360° Approval
1. User forwards task creating TaskNode entries
2. On complete, engine:
   - Queries all TaskNode for this task
   - Extracts unique user IDs from forward path
   - Deduplicates and reverses order
   - Excludes completer
   - Creates TaskApprover entries in backward order

### Predefined Templates
1. On complete, engine:
   - Fetches active templates
   - Checks conditionJson matching (department, amount_min)
   - Resolves approvers from stages (user, role, dynamic_role)
   - Creates TaskApprover entries
   - Dynamic roles (HOD, CFO) resolved via department/role lookup

### Specific Approvers
1. Manual approvers added during task creation
2. On complete, engine validates approvers exist
3. Processes existing TaskApprover entries

## 📡 Realtime / Notifications

Currently uses polling. For Socket.IO realtime updates:

```javascript
// backend/src/server.ts has TODO comments
// Add socket.io server setup
// Emit events on: task created, forwarded, approved, rejected

// frontend can add socket.io-client
// Listen for events and update UI
```

## 🐛 Development

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ for efficient task management and approval workflows**
