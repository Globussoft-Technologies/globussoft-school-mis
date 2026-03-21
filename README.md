# Globussoft Open School MIS

**Open-source School Management & Learning Management System**

A comprehensive, production-ready platform for managing academics, admissions, fees, attendance, assessments, LMS, staff, transport, hostel, and parent communication — built for schools of all sizes.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why Globussoft Open School MIS?

Most school management software is either expensive, closed-source, or lacking in features. **Globussoft Open School MIS** is a fully open-source alternative that covers everything a school needs — from admission to alumni — in a single integrated platform.

- **85+ API Modules** covering every aspect of school operations
- **80+ Web Pages** with a modern, responsive dashboard
- **370+ API Endpoints** for complete programmatic control
- **150+ Database Tables** with a well-structured relational schema
- **11 User Roles** with fine-grained role-based access control
- **Built for Indian schools** with support for CBSE/ICSE grading, fee structures, and compliance

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | NestJS, TypeScript, Prisma ORM, MySQL 8.0 |
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Lucide Icons |
| **File Storage** | MinIO (S3-compatible object storage) |
| **Caching** | Redis 7 |
| **Email** | Nodemailer (SMTP) with HTML templates |
| **Auth** | JWT + Passport.js + RBAC (11 roles) |
| **Monorepo** | Turborepo with npm workspaces |
| **Infra** | Docker Compose |

---

## Quick Start

### Prerequisites

- **Node.js 20+** and **npm 10+**
- **Docker** and **Docker Compose**

### 1. Clone & Install

```bash
git clone https://github.com/sumitglobussoft/globussoft-school-mis.git
cd globussoft-school-mis
cp .env.example .env
npm install
```

### 2. Start Infrastructure

```bash
npm run docker:up    # Starts MySQL 8, Redis 7, MinIO
```

### 3. Set Up Database

```bash
cd packages/api
npx prisma db push
npx ts-node prisma/seed.ts
npx ts-node prisma/seed-data.ts
npx ts-node prisma/seed-comprehensive.ts
npx ts-node prisma/seed-new-modules.ts
npx ts-node prisma/seed-more.ts
npx ts-node prisma/seed-final.ts
```

### 4. Run the Application

```bash
# Terminal 1 — API Server (port 4002)
cd packages/api
npx nest build && node dist/main.js

# Terminal 2 — Web Dashboard (port 3001)
cd packages/web
npx next dev --port 3001
```

### 5. Access

| Service | URL |
|---|---|
| **Web Dashboard** | http://localhost:3001 |
| **API** | http://localhost:4002/api/v1 |
| **MinIO Console** | http://localhost:9001 |

### Default Login

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@school.edu.in | admin123 |
| Teacher | teacher@school.edu.in | teacher123 |

---

## Project Structure

```
globussoft-open-school-mis/
├── packages/
│   ├── shared/              # Shared types, constants, validators
│   ├── api/                 # NestJS backend (85+ modules)
│   │   ├── prisma/          # MySQL schema & seed scripts
│   │   ├── src/modules/     # Feature modules
│   │   └── test/            # E2E test suites
│   └── web/                 # Next.js 14 frontend (80+ pages)
│       └── src/app/
│           ├── login/       # Authentication pages
│           └── (dashboard)/ # Role-based dashboard
├── docker-compose.yml       # MySQL 8 + Redis 7 + MinIO
├── turbo.json               # Turborepo config
└── package.json             # Root workspace config
```

---

## Modules Overview

### Core Academics
- **Admission** — Full pipeline: Enquiry → Application → Test → Interview → Offer → Enrolled
- **Students** — CRUD, class/section filter, detailed profiles
- **Attendance** — Daily and period-wise (8 periods) marking with absent detection
- **Syllabus** — Chapters/topics hierarchy management
- **Timetable** — Weekly grid with class/section filtering
- **Timetable Generator** — Auto-generate timetables with constraint solving

### Learning Management (LMS)
- **LMS Content** — Video/document/presentation management with publish workflow
- **Course Modules** — Structured modules with prerequisites and sequential unlock
- **Assignments** — Homework with submission, grading, and late detection
- **Discussion Forums** — Threaded discussions with anonymous posting and moderation
- **Learning Paths** — Curated step-by-step learning journeys
- **Live Classes** — Schedule virtual classes with recording management
- **Speed Grader** — Canvas-style inline grading UI with keyboard shortcuts

### Assessments & Grading
- **Assessments** — 8-tier system (Micro Quiz → Annual Exam)
- **Question Bank** — 8 question types with difficulty levels
- **Grading** — Configurable grade scales with bulk grading
- **Report Cards** — Generate and publish per term
- **Result Workflow** — Teacher → Coordinator → Principal approval pipeline
- **Rubrics** — Criterion-based scoring with auto-calculated totals
- **Grace Marks** — Award by reason with adjusted score calculation
- **Remedial** — Auto-enroll students below threshold

### Analytics & Reports
- **Analytics** — Student/class performance, grade distribution, weak area detection
- **Performance Reports** — Comprehensive reports with strengths/weaknesses
- **Dashboard** — Role-aware views with 20+ stat cards and quick actions

### Finance
- **Fee Management** — Fee heads, payments, defaulter tracking
- **Fee Automation** — Auto-detect defaulters, reminders, class-wise breakdown
- **Concessions** — Scholarship/sibling/merit discounts with approval workflow
- **Expenses** — Budget vs actual tracking with approve/pay/reject workflow
- **Transport Billing** — Monthly billing per route with payment tracking

### Operations
- **Bus Management** — Vehicles, routes, stops, assignments, boarding logs
- **Discipline** — Incident logging, severity levels, red flags, actions
- **Hostel** — Room management, allocation/transfer, occupancy grid, monthly fees
- **Inventory** — Asset tracking, assign/return, barcode support, low stock alerts
- **Library** — Book catalog, issue/return, overdue tracking, fine calculation
- **Room Booking** — Conflict detection and availability search

### Staff & HR
- **Teacher Attendance** — Daily marking with leave applications
- **Payroll** — Salary structures, monthly generation, approve/pay, payslips
- **Staff Directory** — Profiles with department, designation, qualifications
- **Substitutes** — Auto-suggest free teachers, assign and track
- **Exam Schedules** — Schedule entries with room and invigilator assignment

### Communication
- **Communication** — PTM slots/booking, messaging, conversations
- **Notifications** — Multi-channel (SMS/Email/WhatsApp/Push), bulk send
- **Announcements** — Circulars/notices with audience targeting and priority
- **Message Logs** — Delivery status tracking with retry support

### Portal & Documents
- **Parent Portal** — Ward overview (attendance, grades, fees, bus, hobbies)
- **Student Leaves** — Parent applies, teacher approves/rejects
- **Document Management** — Upload, checklist (8 types), verification workflow
- **Transfer Certificates** — Auto TC number generation, printable layout
- **Certificates** — Merit/sports/attendance certs with bulk generation
- **ID Cards** — Auto card numbers, bulk generate by class, printable layout

### Admin & Tools
- **Audit Trail** — Activity logging with entity history
- **Bulk Operations** — Import students/payments, export to CSV
- **Settings** — System configuration by category
- **Global Search** — Cross-entity search
- **Calendar** — Month view with holidays, exams, and events
- **Academic Transition** — Year-end session promotion and retention

### Enrichment
- **Hobby Management** — 8 categories, enrollment, sessions, portfolio
- **Gamification** — Badges, points, leaderboard, level progression
- **Surveys** — Dynamic questions with aggregated results
- **Feedback** — Teacher/student/parent ratings
- **Gallery** — Photo albums by category
- **Alumni** — Directory with verification and decade stats
- **Grievances** — Ticket system with assignment and resolution tracking
- **Visitors** — Check-in/out with badge tracking
- **Events** — Event management with participant registration

---

## Role-Based Access Control (11 Roles)

| Role | Access Level |
|---|---|
| **Super Admin** | Full system access |
| **Director** | Reports, Analytics, Compliance, Fees, Payroll |
| **Academic Coordinator** | Syllabus, Assessments, Grading, Result Workflow |
| **Class Teacher** | Students, Attendance, Assignments, Grading, Leaves |
| **Subject Teacher** | Attendance, Grading, LMS, Question Bank |
| **Accountant** | Fees, Payments, Defaulters, Concessions, Payroll |
| **Transport Manager** | Bus, Routes, Boarding, Transport Billing |
| **Hobby Coordinator** | Hobbies, Sessions, Enrollment |
| **IT Admin** | Settings, Audit, Users, Bulk Operations |
| **Parent** | Ward data, Fees, Notifications, Grievances |
| **Student** | Timetable, Assignments, Grades, Feedback |

---

## Testing

```bash
cd packages/api
npx jest --config test/jest-e2e.json --runInBand
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql://mis_user:mis_password@localhost:3308/mis_ilsms` |
| `JWT_SECRET` | JWT signing secret | — (change this) |
| `JWT_REFRESH_SECRET` | Refresh token secret | — (change this) |
| `PORT` | API server port | `4000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `S3_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `S3_BUCKET` | Upload bucket name | `mis-uploads` |

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Areas Where You Can Contribute

- Adding new modules or features
- Improving the UI/UX
- Writing tests
- Documentation improvements
- Bug fixes
- Internationalization (i18n) support
- Performance optimizations

---

## Roadmap

- [ ] Multi-tenant (multi-school) support
- [ ] Mobile app (React Native)
- [ ] Internationalization (i18n)
- [ ] Advanced analytics with charts
- [ ] SMS/WhatsApp integration
- [ ] Online payment gateway integration
- [ ] Biometric attendance integration
- [ ] AI-powered insights and recommendations

---

## License

This project is open source and available under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

---

## Acknowledgments

Built with ❤️ by **Globussoft** — Technology Ahead of Time

If you find this project useful, please give it a ⭐ on GitHub!

---

**Globussoft Open School MIS** — Empowering schools with open-source technology.
