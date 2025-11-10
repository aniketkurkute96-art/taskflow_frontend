# TaskFlow - Task Management Application

A comprehensive task management application with advanced approval workflows, real-time collaboration, and organizational hierarchy support.

## Features

### Core Functionality
- ✅ **User Management** - Complete user CRUD operations with role-based access control
- ✅ **Authentication** - JWT-based authentication with secure token management
- ✅ **Task Management** - Create, update, and manage tasks with comprehensive fields
- ✅ **Approval Workflows** - Multi-level approval system with customizable templates
- ✅ **Department Hierarchy** - Organizational structure with department management
- ✅ **Real-time Updates** - WebSocket integration for live notifications
- ✅ **Dashboard Analytics** - Comprehensive statistics and reporting

### Advanced Features
- ✅ **Backward 360 Approval** - Flexible approval workflow for complex scenarios
- ✅ **Approval Templates** - Configurable approval workflows with conditions
- ✅ **Approval Bucket** - Centralized view for pending approvals
- ✅ **Task Forwarding** - Track task movement through the organization
- ✅ **Role-based Access** - Admin, HOD, CFO, and regular user roles
- ✅ **File Attachments** - Support for task attachments and documents
- ✅ **Comments System** - Collaborative discussion on tasks
- ✅ **Checklist Items** - Sub-tasks and progress tracking

## Technology Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** - Web framework
- **TypeORM** - Object-Relational Mapping
- **SQLite** - Database (easily configurable for PostgreSQL/MySQL)
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Swagger** - API documentation

### Security Features
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Data sanitization
- **JWT Tokens** - Secure authentication

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/         # Database entities
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── scripts/        # Database scripts
│   ├── database.ts     # Database configuration
│   └── server.ts       # Application entry point
├── swagger.yaml        # API documentation
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy the example environment file and configure:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```
   NODE_ENV=development
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   DATABASE_URL=sqlite:./database.sqlite
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   The application uses SQLite by default. The database will be automatically created on first run.

5. **Seed Sample Data**
   ```bash
   npm run seed
   ```

   This creates:
   - 4 departments (HR, Finance, IT, Operations)
   - 9 sample users with different roles
   - 3 approval templates (Simple, Financial, High-Value)

6. **Start the Server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

7. **Access the Application**
   - API Server: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs

## Sample Users

After running the seed script, you can log in with these test accounts:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| admin@taskflow.com | admin123 | Admin | - |
| hr.manager@taskflow.com | hr123 | HOD | HR |
| finance.manager@taskflow.com | finance123 | HOD | Finance |
| cfo@taskflow.com | cfo123 | CFO | Finance |
| it.manager@taskflow.com | it123 | HOD | IT |
| operations.manager@taskflow.com | ops123 | HOD | Operations |
| hr.employee@taskflow.com | employee123 | User | HR |
| finance.employee@taskflow.com | employee123 | User | Finance |
| it.employee@taskflow.com | employee123 | User | IT |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Departments (Admin only)
- `GET /api/departments` - List all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Tasks
- `GET /api/tasks` - Get user's tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Approvals
- `GET /api/approvals/bucket` - Get approval bucket
- `GET /api/approvals/tasks/:taskId/approvers` - Get task approvers
- `POST /api/approvals/tasks/:taskId/submit` - Submit for approval
- `POST /api/approvals/tasks/:taskId/approve` - Approve/reject task

### Approval Templates (Admin only)
- `GET /api/approval-templates` - List all templates
- `GET /api/approval-templates/:id` - Get template by ID
- `POST /api/approval-templates` - Create new template
- `PUT /api/approval-templates/:id` - Update template
- `DELETE /api/approval-templates/:id` - Delete template

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-tasks` - Get recent tasks
- `GET /api/dashboard/pending-approvals` - Get pending approvals

## Approval Workflow System

### Approval Types
1. **Simple Approval** - Single level (HOD approval)
2. **Financial Approval** - Two levels (HOD → CFO)
3. **High-Value Approval** - Three levels (HOD → CFO → Admin)

### Approval Process
1. User creates task in DRAFT status
2. User submits task for approval
3. System selects appropriate template based on criteria
4. Approvers are notified and can approve/reject
5. Task status updates based on approval decisions
6. All approvers must approve for final approval

### Backward 360 Approval
Special approval workflow that allows:
- Circular approval paths
- Dynamic approver selection
- Role-based routing
- Conditional logic

## Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database seeder
npm run seed

# Run tests
npm test

# Lint code
npm run lint

# TypeORM CLI
npm run typeorm -- migration:run
npm run typeorm -- migration:revert
```

## Security Considerations

### Production Deployment
- Change all default passwords and secrets
- Use environment variables for sensitive data
- Enable HTTPS
- Configure proper CORS settings
- Set up rate limiting
- Use a production-grade database (PostgreSQL recommended)
- Implement proper logging and monitoring

### Password Security
- Currently using plain text passwords for prototype
- **IMPORTANT**: Implement bcrypt hashing for production
- Add password complexity requirements
- Implement password reset functionality

## Database Configuration

### SQLite (Development)
```env
DATABASE_URL=sqlite:./database.sqlite
```

### PostgreSQL (Production)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/taskflow
```

### MySQL (Alternative)
```env
DATABASE_URL=mysql://username:password@localhost:3306/taskflow
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the API documentation at `/api-docs`
- Review the error logs
- Ensure all environment variables are properly configured
- Verify database connectivity

## Roadmap

### Frontend (Next Phase)
- React-based admin dashboard
- User-friendly task creation interface
- Real-time notifications
- Mobile-responsive design
- Advanced filtering and search

### Advanced Features
- Email notifications
- SMS notifications
- Advanced reporting
- Integration with external systems
- Mobile applications
- Advanced analytics and ML insights