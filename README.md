# 🚀 MLaku Mulu Backend

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <br>
  <strong>Modern Travel Management System Backend</strong>
</p>

<p align="center">
  <a href="https://nestjs.com/" target="blank">NestJS</a> framework for building efficient and scalable server-side applications.
</p>

## 📚 **API Documentation**

<div align="center">
  
  ### 🔗 **[View Complete API Documentation](https://documenter.getpostman.com/view/39299483/2sB3Hhs2Z3)**
  
  [![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://documenter.getpostman.com/view/39299483/2sB3Hhs2Z3)
  
  **Complete API reference with examples, request/response schemas, and testing endpoints**
  
</div>

## 🌍 Live Demo

<div align="center">

[🌍 **View Website Demo**](http://mlaku-mulu.surge.sh/)

</div>

---

## 🎯 **Project Overview**

MLaku Mulu is a comprehensive travel management system built with **NestJS** and **Prisma ORM**. The system provides role-based access control for travel agencies, staff, and travelers to manage trips, bookings, and user accounts efficiently.

### ✨ **Key Features**

- 🔐 **JWT Authentication** with refresh tokens
- 👥 **Role-Based Access Control** (Owner, Staff, Traveler)
- 🗺️ **Trip Management** with booking system
- 📧 **Email Verification** with OTP system
- 🗄️ **PostgreSQL Database** with Prisma ORM and Neon
- 🐳 **Docker Support** for easy deployment
- 🚀 **Auto-Migration & Seeding** on startup

## 🏗️ **Architecture**

### **Technology Stack**

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Database**: PostgreSQL with [Prisma](https://www.prisma.io/) v6
- **Authentication**: JWT with Passport
- **Email**: Nodemailer with Gmail SMTP
- **Container**: Docker with multi-stage builds
- **Language**: TypeScript

### **Database Schema**

The system uses three main models:

- **User**: Authentication and role management
- **Trip**: Travel itinerary management
- **Booking**: Trip reservation system

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 20+
- PostgreSQL database
- Docker (optional)

### **Environment Variables**

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mlaku_mulu_db"

# JWT
JWT_SECRET=your_jwt_secret_here

# Server
PORT=8086

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="MLaku Mulu <your_email@gmail.com>"

# App
APP_URL=http://localhost:3000
```

### **Installation & Setup**

```bash
# Clone repository
git clone <repository-url>
cd mlaku-mulu-backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

### **Available Scripts**

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug mode

# Production
npm run build              # Build application
npm run start:prod         # Start production server
npm run start:with-db      # Start with auto-migration & seed

# Database
npm run migrate            # Run migrations
npm run seed               # Seed database
npm run db:setup          # Setup database (migrate + seed)

# Testing
npm run test               # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## 🐳 **Docker Deployment**

### **Build & Run**

```bash
# Build Docker image
docker build -t mlaku-mulu-backend .

# Run container
docker run -d \
  --name mlaku-mulu-backend \
  -p 8086:8086 \
  --env-file .env \
  mlaku-mulu-backend
```

## 🔐 **Authentication & Authorization**

### **User Roles**

1. **👑 Owner**
   - Full system access
   - User management
   - Trip creation and management
   - System statistics

2. **👨‍💼 Staff (Pegawai)**
   - User viewing
   - Trip management
   - Booking management
   - Limited admin access

3. **🧳 Traveler (Turis)**
   - Personal trip booking
   - Profile management
   - Trip history

### **JWT Flow**

1. User login → Receive access & refresh tokens
2. Access token for API requests
3. Refresh token for new access tokens
4. Automatic token refresh handling

## 🗺️ **API Endpoints**

### **Core Modules**

- **Auth**: `/auth/*` - Authentication endpoints
- **Users**: `/users/*` - User management
- **Trips**: `/trips/*` - Trip operations
- **Owner**: `/owner/*` - Owner-specific features
- **Pegawai**: `/pegawai/*` - Staff features

### **Key Endpoints**

```
POST   /auth/register          # User registration
POST   /auth/login             # User login
POST   /auth/verify-otp        # OTP verification
POST   /auth/refresh           # Token refresh
POST   /auth/logout            # User logout

GET    /users                  # List users (staff/owner)
GET    /users/:id              # Get user details
PATCH  /users/:id              # Update user
DELETE /users/:id              # Delete user

GET    /trips                  # List trips
POST   /trips                  # Create trip
GET    /trips/:id              # Get trip details
PATCH  /trips/:id              # Update trip
DELETE /trips/:id              # Delete trip

GET    /owner/dashboard/stats  # Owner dashboard
GET    /pegawai/dashboard      # Staff dashboard
```

## 🗄️ **Database Management**

### **Prisma Commands**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev        # Development
npx prisma migrate deploy     # Production

# View database
npx prisma studio

# Reset database
npx prisma migrate reset
```

### **Auto-Setup Features**

The application automatically:
- ✅ Generates Prisma client on startup
- ✅ Runs pending migrations
- ✅ Seeds database if empty
- ✅ Handles database connection issues

## 🧪 **Testing**

### **Test Accounts**

The system comes with pre-seeded dummy accounts for testing different user roles:

#### **👑 Owner Account**
```
Email: admin@mlakumulu.com
Password: Owner123
Role: owner
Access: Full system access
```

#### **👨‍💼 Staff Accounts**
```
Email: pegawai1@mlakumulu.com
Password: Pegawai123
Role: pegawai
Access: Staff management features

Email: pegawai2@mlaku-mulu.com
Password: Pegawai123
Role: pegawai
Access: Staff management features

Email: pegawai3@mlaku-mulu.com
Password: Pegawai123
Role: pegawai
Access: Staff management features
```

#### **🧳 Traveler Accounts**
```
Email: turis1@example.com
Password: Turis123
Role: turis
Access: Personal trip booking

Email: turis2@example.com
Password: Turis123
Role: turis
Access: Personal trip booking

Email: turis3@example.com
Password: Turis123
Role: turis
Access: Personal trip booking
```

#### **⏳ Unverified Accounts (for OTP testing)**
```
Email: pending1@example.com
Password: Pending123
Role: turis
Status: Unverified (requires OTP)

Email: pending2@example.com
Password: Pending123
Role: pegawai
Status: Unverified (requires OTP)
```

### **Testing Scenarios**

1. **Owner Testing**: Use `admin@mlakumulu.com` to test full system access
2. **Staff Testing**: Use any pegawai account to test staff features
3. **Traveler Testing**: Use any turis account to test booking features
4. **OTP Testing**: Use pending accounts to test email verification flow

### **Test Structure**

```
test/
├── jest-e2e.json          # E2E test configuration
├── app.e2e-spec.ts        # Main app E2E tests
└── auth/                  # Authentication tests
    └── auth.e2e-spec.ts
```

### **Running Tests**

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```