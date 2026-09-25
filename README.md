\# 🚀 Nexora Cloud Platform



\### Multi-Tenant SaaS Project Management System



\*\*Think: "Jira + Notion + Admin SaaS system hybrid"\*\*



Built for \*\*Saudi and Middle Eastern enterprises\*\* with Arabic (RTL) support, SAR currency, and NCA compliance.



\---



\## 📖 Overview



\*\*Nexora Cloud Platform\*\* is a production-ready, multi-tenant SaaS project management system designed for enterprises. It combines the best of Jira, Notion, and a full Admin System into one powerful platform.



\### 🎯 Why This Project Stands Out



\- ✅ \*\*Multi-Tenant Architecture\*\* — Complete company isolation

\- ✅ \*\*Role-Based Access Control (RBAC)\*\* — Super Admin, Company Admin, Team Member

\- ✅ \*\*Enterprise-Grade Security\*\* — JWT + Refresh Tokens + Audit Trail

\- ✅ \*\*Real Business Logic\*\* — Not a student CRUD project

\- ✅ \*\*Scalable System Design\*\* — Production-ready architecture



\---



\## ✨ Features



\### 🔐 Authentication \& Security

\- JWT Authentication with Access Tokens

\- Refresh Token rotation mechanism

\- Bcrypt password hashing

\- Audit logging with IP address + User Agent tracking

\- API Keys management for programmatic access

\- Two-Factor Authentication (2FA) toggle



\### 🏢 Multi-Tenant Architecture

\- Complete company isolation (data segregation)

\- Company-wise user management

\- Role-based permission system

\- Subscription-based limits (Free, Pro, Enterprise)

\- Team invitation system with secure tokens



\### 📊 Project \& Task Management

\- Create, Update, Delete Projects

\- Kanban board with \*\*HTML5 Drag \& Drop\*\*

\- Task status workflow: TODO → IN\_PROGRESS → DONE

\- Priority system: LOW / MEDIUM / HIGH

\- Task assignment to team members

\- Search \& advanced filtering



\### 💬 Collaboration

\- Task comments with real-time updates

\- File attachments via \*\*Cloudinary\*\*

\- Activity timeline per task

\- Real-time notifications

\- Team member mentions



\### 📈 Analytics Dashboard

\- Task completion rate (interactive pie chart)

\- User growth metrics (line chart)

\- Project progress tracking (bar chart)

\- Company usage statistics

\- Monthly trends (Recharts)



\### 💳 Subscription Management

\- 3-tier pricing model (Free / Pro / Enterprise)

\- Company-wise plan assignment

\- Billing history with invoice generation

\- Plan limits (max users, max projects)

\- Subscription status tracking



\### 🛠 Admin Panel

\- Super Admin dashboard with live stats

\- Companies management (CRUD)

\- Users management with role change

\- Audit logs with full trail

\- Subscription \& billing overview



\---



\## 🧱 Tech Stack



\### Backend

| Technology | Purpose |

|------------|---------|

| Node.js | Runtime environment |

| Express.js | Web framework |

| TypeScript | Type safety |

| PostgreSQL | Relational database |

| JWT | Authentication tokens |

| Bcrypt | Password hashing |

| Multer | File upload handling |

| Cloudinary | Cloud storage |

| Crypto | API key generation |



\### Frontend

| Technology | Purpose |

|------------|---------|

| React 18 | UI library |

| Vite | Build tool |

| TypeScript | Type safety |

| Tailwind CSS | Styling |

| React Router v6 | Navigation |

| Axios | HTTP client |

| Recharts | Data visualization |

| React Hot Toast | Notifications |



\### DevOps

| Technology | Purpose |

|------------|---------|

| Docker | Containerization |

| Docker Compose | Multi-container orchestration |

| AWS EC2 | Cloud deployment |

| Nginx | Reverse proxy |



\---



\## 📁 Project Structure



```

Nexora-Platform/

├── backend/

│   ├── src/

│   │   ├── config/

│   │   │   ├── database.ts

│   │   │   └── cloudinary.ts

│   │   ├── helpers/

│   │   │   └── auditLog.ts

│   │   └── index.ts

│   ├── .env

│   ├── package.json

│   └── tsconfig.json

│

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   │   ├── AdminLayout.tsx

│   │   │   ├── NotificationBell.tsx

│   │   │   ├── CreateTaskModal.tsx

│   │   │   └── ProtectedRoute.tsx

│   │   ├── pages/

│   │   │   ├── LandingPage.tsx

│   │   │   ├── LoginPage.tsx

│   │   │   ├── RegisterPage.tsx

│   │   │   ├── DashboardPage.tsx

│   │   │   ├── SettingsPage.tsx

│   │   │   ├── TeamPage.tsx

│   │   │   ├── AcceptInvitePage.tsx

│   │   │   └── admin/

│   │   │       ├── AdminDashboard.tsx

│   │   │       ├── CompaniesPage.tsx

│   │   │       ├── UsersPage.tsx

│   │   │       ├── SubscriptionsPage.tsx

│   │   │       └── AuditLogsPage.tsx

│   │   ├── services/

│   │   │   ├── axios.config.ts

│   │   │   └── auth.service.ts

│   │   └── App.tsx

│   └── package.json

│

└── README.md

```



\---



\## 🚀 Getting Started



\### Prerequisites

\- Node.js v18+

\- PostgreSQL v14+

\- npm or yarn

\- Cloudinary account (free tier)



\### 1. Clone the Repository



```bash

git clone https://github.com/YOUR\_USERNAME/nexora-platform.git

cd nexora-platform

```



\### 2. Backend Setup



```bash

cd backend

npm install

```



Create `.env` file:



```env

PORT=5000

DB\_USER=postgres

DB\_PASSWORD=your\_password

DB\_HOST=localhost

DB\_PORT=5432

DB\_NAME=nexora\_db

JWT\_SECRET=nexora\_super\_secret\_key

CLOUDINARY\_CLOUD\_NAME=your\_cloud\_name

CLOUDINARY\_API\_KEY=your\_api\_key

CLOUDINARY\_API\_SECRET=your\_api\_secret

```



Create database:



```bash

psql -U postgres -c "CREATE DATABASE nexora\_db;"

```



Run backend:



```bash

npm run dev

```



Backend runs on: `http://localhost:5000`



\### 3. Frontend Setup



```bash

cd frontend

npm install

npm run dev

```



Frontend runs on: `http://localhost:5173`



\---



\## 🔌 API Endpoints



\### Authentication

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | /api/auth/register | Register new user |

| POST | /api/auth/login | Login and get JWT token |

| POST | /api/auth/logout | Logout user |

| GET | /api/auth/me | Get current user |



\### Projects

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/projects | Get all projects |

| POST | /api/projects | Create project |

| DELETE | /api/projects/:id | Delete project |



\### Tasks

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/tasks | Get all tasks |

| POST | /api/tasks | Create task |

| PUT | /api/tasks/:id/status | Update task status |



\### Comments

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/tasks/:taskId/comments | Get task comments |

| POST | /api/tasks/:taskId/comments | Add comment |

| DELETE | /api/comments/:id | Delete comment |



\### File Upload

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | /api/tasks/:taskId/attachments | Upload file |

| GET | /api/tasks/:taskId/attachments | Get attachments |

| DELETE | /api/attachments/:id | Delete attachment |



\### Notifications

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/notifications | Get notifications |

| GET | /api/notifications/unread-count | Get unread count |

| PUT | /api/notifications/:id/read | Mark as read |

| PUT | /api/notifications/read-all | Mark all read |



\### Settings

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/settings/profile | Get profile |

| PUT | /api/settings/profile | Update profile |

| PUT | /api/settings/password | Change password |

| GET | /api/settings/api-keys | Get API keys |

| POST | /api/settings/api-keys | Create API key |

| DELETE | /api/settings/api-keys/:id | Revoke API key |

| GET | /api/settings/preferences | Get preferences |

| PUT | /api/settings/preferences | Update preferences |



\### Team Invitations

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/invitations | Get invitations |

| POST | /api/invitations | Send invitation |

| DELETE | /api/invitations/:id | Cancel invitation |

| GET | /api/invitations/verify/:token | Verify invitation |

| POST | /api/invitations/accept/:token | Accept invitation |



\### Admin Panel

| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | /api/admin/stats | Platform statistics |

| GET | /api/admin/analytics | Analytics data |

| GET | /api/admin/companies | All companies |

| POST | /api/admin/companies | Create company |

| GET | /api/admin/users | All users |

| PUT | /api/admin/users/:id/role | Change role |

| GET | /api/admin/logs | Audit logs |

| GET | /api/admin/plans | Subscription plans |

| GET | /api/admin/subscriptions | All subscriptions |

| POST | /api/admin/subscriptions | Assign subscription |

| GET | /api/admin/billing | Billing history |



\---



\## 🗄️ Database Schema



| Table | Purpose |

|-------|---------|

| users | User accounts with role and company |

| companies | Tenant/company records |

| projects | Projects per company |

| tasks | Tasks per project |

| comments | Task comments |

| notifications | User notifications |

| audit\_logs | Full activity trail with IP |

| attachments | Task file uploads |

| invitations | Team invitation tokens |

| subscription\_plans | Plan definitions |

| company\_subscriptions | Active subscriptions |

| billing\_history | Invoices |

| api\_keys | User API keys |

| user\_settings | User preferences |



\---



\## 🔒 Security Features



\- JWT-based authentication

\- Bcrypt password hashing (10 rounds)

\- Role-Based Access Control (RBAC)

\- SQL injection prevention

\- CORS protection

\- Helmet.js security headers

\- Audit trail with IP + User Agent

\- API key generation with crypto

\- Secure invitation tokens



\---



\## 🌍 Saudi-Focused Features



\- Arabic (RTL) Support in landing page and UI

\- SAR Currency in pricing

\- Saudi Enterprise References (Aramco, STC, SABIC)

\- NCA Compliance mentioned

\- Vision 2030 digital transformation ready

\- Bilingual English + Arabic



\---



\## 📌 Resume Highlights



```

Nexora Cloud Platform – Multi-Tenant SaaS Project Management System



• Built a multi-tenant SaaS platform with role-based access control and complete company isolation

• Designed and implemented project and task management system with real-time status tracking

• Developed secure authentication system with JWT and refresh tokens

• Created analytics engine for tracking user and project performance metrics

• Implemented activity logging and audit trail system for system transparency

• Integrated Cloudinary for secure file attachments in tasks

• Built Kanban board with HTML5 drag-and-drop functionality

• Implemented team invitation system with token-based authentication

• Designed 14-table PostgreSQL database with proper relationships

• Deployed full-stack application using Docker and AWS EC2

```



\---



\## 👨‍💻 Author



\*\*Your Name\*\*

\- GitHub: @YOUR\_USERNAME

\- Email: your.email@example.com



\---



\*\*⭐ Star this repository if you found it helpful!\*\*



Made with ❤️ for Saudi Enterprises

