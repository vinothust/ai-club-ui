# AI Idea Hub - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Backend Implementation Guide](#backend-implementation-guide)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Usage Examples](#usage-examples)

---

## Overview

This document provides complete specifications for building a backend API to support the AI Idea Hub application. The frontend has been implemented with a comprehensive service layer that communicates with RESTful API endpoints.

### Base URL
```
http://localhost:3000/api
```

### Technology Stack (Frontend)
- React 18 with TypeScript
- TanStack Query (React Query) for data fetching
- Axios/Fetch for HTTP requests

### Recommended Backend Stack
- **Node.js**: Express.js, NestJS, or Fastify
- **Python**: FastAPI, Django REST, or Flask
- **Database**: PostgreSQL, MongoDB, or MySQL
- **Authentication**: JWT (JSON Web Tokens)

---

## Architecture

### Service Layer Structure

```
src/services/
├── api.config.ts          # API configuration and endpoints
├── api.client.ts          # HTTP client with interceptors
├── useCases.service.ts    # Use case operations
├── users.service.ts       # User management operations
├── auth.service.ts        # Authentication operations
├── dashboard.service.ts   # Dashboard statistics
└── index.ts              # Service exports
```

### React Hooks Structure

```
src/hooks/
├── useUseCases.ts        # Use case data fetching hooks
├── useUsers.ts           # User data fetching hooks
├── useDashboard.ts       # Dashboard data hooks
└── useAuth.ts            # Authentication hooks
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login user with credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u-001",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin",
      "status": "Active",
      "dateAdded": "2025-01-01"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/logout
Logout current user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /api/auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "status": "Active",
    "dateAdded": "2025-01-01"
  }
}
```

#### GET /api/auth/windows-login
Login using Windows Authentication. Automatically detects the current Windows user via OS credentials and Active Directory lookup.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u-001",
      "name": "Vinoth Sasikumar",
      "email": "vinoth.sasikumar@ust.com",
      "role": "admin",
      "status": "Active",
      "dateAdded": "2026-02-11"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "authMethod": "windows"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found"
}
```

> **Note:** This endpoint requires the user to already exist in the database. It does not auto-provision new users.

---

### Health Check

#### GET /api/health
Check API server status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-13T10:30:00.000Z"
}
```

---

### Use Cases Endpoints

#### GET /api/use-cases
Get all use cases with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status (Draft, Active, In Review, Completed, Archived)
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `owner` (optional): Filter by owner name
- `department` (optional): Filter by department
- `search` (optional): Search across all fields

**Example:**
```
GET /api/use-cases?status=Active&priority=High
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uc-001",
      "title": "AI-Powered Customer Ticket Routing",
      "description": "Automatically classify and route incoming support tickets...",
      "category": "Customer Service",
      "status": "Active",
      "priority": "High",
      "owner": "Sarah Chen",
      "department": "Customer Support",
      "estimatedImpact": "30% reduction in resolution time",
      "dateCreated": "2025-11-15"
    }
  ]
}
```

#### GET /api/use-cases/:id
Get a single use case by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uc-001",
    "title": "AI-Powered Customer Ticket Routing",
    "description": "Automatically classify and route incoming support tickets...",
    "category": "Customer Service",
    "status": "Active",
    "priority": "High",
    "owner": "Sarah Chen",
    "department": "Customer Support",
    "estimatedImpact": "30% reduction in resolution time",
    "dateCreated": "2025-11-15"
  }
}
```

#### POST /api/use-cases
Create a new use case.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New AI Use Case",
  "description": "Description of the use case",
  "category": "Marketing",
  "status": "Draft",
  "priority": "Medium",
  "owner": "Jane Smith",
  "department": "Marketing",
  "estimatedImpact": "20% improvement"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uc-011",
    "title": "New AI Use Case",
    "description": "Description of the use case",
    "category": "Marketing",
    "status": "Draft",
    "priority": "Medium",
    "owner": "Jane Smith",
    "department": "Marketing",
    "estimatedImpact": "20% improvement",
    "dateCreated": "2026-02-11"
  }
}
```

#### PUT /api/use-cases/:id
Update an entire use case.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Use Case Title",
  "description": "Updated description",
  "category": "Operations",
  "status": "Active",
  "priority": "High",
  "owner": "John Doe",
  "department": "Operations",
  "estimatedImpact": "25% improvement"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uc-001",
    "title": "Updated Use Case Title",
    "description": "Updated description",
    "category": "Operations",
    "status": "Active",
    "priority": "High",
    "owner": "John Doe",
    "department": "Operations",
    "estimatedImpact": "25% improvement",
    "dateCreated": "2025-11-15"
  }
}
```

#### PATCH /api/use-cases/:id
Partially update a use case.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Completed",
  "priority": "Low"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uc-001",
    "title": "AI-Powered Customer Ticket Routing",
    "description": "Automatically classify and route incoming support tickets...",
    "category": "Customer Service",
    "status": "Completed",
    "priority": "Low",
    "owner": "Sarah Chen",
    "department": "Customer Support",
    "estimatedImpact": "30% reduction in resolution time",
    "dateCreated": "2025-11-15"
  }
}
```

#### DELETE /api/use-cases/:id
Delete a use case.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Use case deleted successfully"
}
```

#### GET /api/use-cases/stats
Get use case statistics.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "Draft": 10,
      "Active": 20,
      "In Review": 8,
      "Completed": 10,
      "Archived": 2
    },
    "byCategory": {
      "Customer Service": 15,
      "Operations": 12,
      "Marketing": 8,
      "Finance": 5,
      "HR": 10
    },
    "byPriority": {
      "Low": 10,
      "Medium": 20,
      "High": 15,
      "Critical": 5
    },
    "recentlyCreated": 5
  }
}
```

#### POST /api/use-cases/bulk-update
Bulk update multiple use cases.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": ["uc-001", "uc-002", "uc-003"],
  "data": {
    "status": "Active",
    "priority": "High"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": "uc-001", "title": "...", "status": "Active", "priority": "High" },
    { "id": "uc-002", "title": "...", "status": "Active", "priority": "High" },
    { "id": "uc-003", "title": "...", "status": "Active", "priority": "High" }
  ]
}
```

#### POST /api/use-cases/bulk-delete
Bulk delete multiple use cases.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": ["uc-001", "uc-002", "uc-003"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "3 use cases deleted successfully"
}
```

---

### Users Endpoints

#### GET /api/users
Get all users with optional filters.

**Query Parameters:**
- `role` (optional): Filter by role (viewer, editor, admin)
- `status` (optional): Filter by status (Active, Inactive)
- `search` (optional): Search across all fields

**Example:**
```
GET /api/users?role=admin&status=Active
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "u-001",
      "name": "Admin User",
      "email": "admin@company.com",
      "role": "admin",
      "status": "Active",
      "dateAdded": "2025-01-01"
    }
  ]
}
```

#### GET /api/users/:id
Get a single user by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "name": "Admin User",
    "email": "admin@company.com",
    "role": "admin",
    "status": "Active",
    "dateAdded": "2025-01-01"
  }
}
```

#### POST /api/users
Create a new user.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@company.com",
  "role": "viewer",
  "status": "Active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "u-006",
    "name": "New User",
    "email": "newuser@company.com",
    "role": "viewer",
    "status": "Active",
    "dateAdded": "2026-02-11"
  }
}
```

#### PUT /api/users/:id
Update an entire user.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@company.com",
  "role": "editor",
  "status": "Active"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "name": "Updated Name",
    "email": "updated@company.com",
    "role": "editor",
    "status": "Active",
    "dateAdded": "2025-01-01"
  }
}
```

#### PATCH /api/users/:id
Partially update a user.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "admin",
  "status": "Active"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "name": "Admin User",
    "email": "admin@company.com",
    "role": "admin",
    "status": "Active",
    "dateAdded": "2025-01-01"
  }
}
```

#### DELETE /api/users/:id
Delete a user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### PATCH /api/users/me/profile
Update the current authenticated user's own profile (name, email).

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "new.email@ust.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-001",
    "name": "Updated Name",
    "email": "new.email@ust.com",
    "role": "admin",
    "status": "Active",
    "dateAdded": "2026-02-11"
  }
}
```

> **Note:** Any authenticated user can update their own profile. Admin permissions are not required.

#### POST /api/users/bulk-update
Bulk update multiple users.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": ["u-001", "u-002"],
  "data": {
    "status": "Active"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": "u-001", "name": "...", "status": "Active" },
    { "id": "u-002", "name": "...", "status": "Active" }
  ]
}
```

#### POST /api/users/bulk-delete
Bulk delete multiple users.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": ["u-001", "u-002"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2 users deleted successfully"
}
```

---

### Dashboard Endpoints

#### GET /api/dashboard/stats
Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalUseCases": 50,
    "activeUseCases": 20,
    "inReviewUseCases": 8,
    "completedUseCases": 10,
    "draftUseCases": 10,
    "archivedUseCases": 2,
    "totalUsers": 25,
    "activeUsers": 22,
    "recentActivity": [
      {
        "id": "act-001",
        "type": "created",
        "entityType": "useCase",
        "entityId": "uc-011",
        "entityTitle": "New AI Use Case",
        "performedBy": "John Doe",
        "timestamp": "2026-02-11T10:30:00Z"
      }
    ]
  }
}
```

#### GET /api/dashboard/charts
Get dashboard chart data.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "statusDistribution": [
      { "name": "Draft", "value": 10 },
      { "name": "Active", "value": 20 },
      { "name": "In Review", "value": 8 },
      { "name": "Completed", "value": 10 },
      { "name": "Archived", "value": 2 }
    ],
    "categoryDistribution": [
      { "name": "Customer Service", "count": 15 },
      { "name": "Operations", "count": 12 },
      { "name": "Marketing", "count": 8 },
      { "name": "Finance", "count": 5 },
      { "name": "HR", "count": 10 }
    ],
    "priorityDistribution": [
      { "name": "Low", "count": 10 },
      { "name": "Medium", "count": 20 },
      { "name": "High", "count": 15 },
      { "name": "Critical", "count": 5 }
    ],
    "monthlyTrends": [
      { "month": "Jan", "created": 5, "completed": 3 },
      { "month": "Feb", "created": 8, "completed": 5 }
    ]
  }
}
```

#### GET /api/dashboard/stats/activity
Get recent activity.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `limit` (optional, default: 10): Number of activities to return

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "act-001",
      "type": "created",
      "entityType": "useCase",
      "entityId": "uc-011",
      "entityTitle": "New AI Use Case",
      "performedBy": "John Doe",
      "timestamp": "2026-02-11T10:30:00Z"
    },
    {
      "id": "act-002",
      "type": "updated",
      "entityType": "useCase",
      "entityId": "uc-005",
      "entityTitle": "Resume Screening Assistant",
      "performedBy": "Jane Smith",
      "timestamp": "2026-02-11T09:15:00Z"
    }
  ]
}
```

---

## Data Models

### UseCase

```typescript
interface UseCase {
  id: string;
  title: string;
  description: string;
  category: UseCaseCategory;
  status: UseCaseStatus;
  priority: UseCasePriority;
  owner: string;
  department: string;
  estimatedImpact: string;
  dateCreated: string; // ISO date format (YYYY-MM-DD)
}

type UseCaseStatus = "Draft" | "Active" | "In Review" | "Completed" | "Archived";
type UseCasePriority = "Low" | "Medium" | "High" | "Critical";
type UseCaseCategory = 
  | "Customer Service"
  | "Operations"
  | "Marketing"
  | "Finance"
  | "HR"
  | "IT"
  | "Sales"
  | "Product"
  | "Legal";
```

### AppUser

```typescript
interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  dateAdded: string; // ISO date format (YYYY-MM-DD)
}

type Role = "viewer" | "editor" | "admin";
type UserStatus = "Active" | "Inactive";
```

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
```

---

## Backend Implementation Guide

### Node.js with Express.js Example

#### 1. Project Setup

```bash
mkdir ai-idea-hub-api
cd ai-idea-hub-api
npm init -y
npm install express cors dotenv jsonwebtoken bcryptjs
npm install --save-dev typescript @types/node @types/express @types/cors @types/jsonwebtoken ts-node nodemon
```

#### 2. Project Structure

```
ai-idea-hub-api/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── useCases.controller.ts
│   │   ├── users.controller.ts
│   │   └── dashboard.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── UseCase.model.ts
│   │   └── User.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── useCases.routes.ts
│   │   ├── users.routes.ts
│   │   └── dashboard.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── useCases.service.ts
│   │   ├── users.service.ts
│   │   └── dashboard.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── validators.ts
│   └── app.ts
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

#### 3. Basic Express Setup (src/app.ts)

```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import useCasesRoutes from './routes/useCases.routes';
import usersRoutes from './routes/users.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/use-cases', useCasesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

#### 4. Authentication Middleware (src/middleware/auth.middleware.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    next();
  };
};
```

#### 5. Error Handler (src/middleware/errorHandler.ts)

```typescript
import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]>;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(`[Error] ${status} - ${message}`, err);

  res.status(status).json({
    success: false,
    message,
    errors: err.errors,
  });
};
```

#### 6. Use Cases Routes (src/routes/useCases.routes.ts)

```typescript
import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import * as useCasesController from '../controllers/useCases.controller';

const router = Router();

// Public routes (or authenticated based on requirements)
router.get('/', authenticateToken, useCasesController.getAllUseCases);
router.get('/stats', authenticateToken, useCasesController.getUseCaseStats);
router.get('/:id', authenticateToken, useCasesController.getUseCaseById);

// Protected routes (editor and admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('editor', 'admin'),
  useCasesController.createUseCase
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('editor', 'admin'),
  useCasesController.updateUseCase
);

router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles('editor', 'admin'),
  useCasesController.patchUseCase
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('editor', 'admin'),
  useCasesController.deleteUseCase
);

router.post(
  '/bulk-update',
  authenticateToken,
  authorizeRoles('editor', 'admin'),
  useCasesController.bulkUpdateUseCases
);

router.post(
  '/bulk-delete',
  authenticateToken,
  authorizeRoles('editor', 'admin'),
  useCasesController.bulkDeleteUseCases
);

export default router;
```

#### 7. Use Cases Controller (src/controllers/useCases.controller.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import * as useCasesService from '../services/useCases.service';

export const getAllUseCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      priority: req.query.priority as string,
      owner: req.query.owner as string,
      department: req.query.department as string,
      search: req.query.search as string,
    };

    const useCases = await useCasesService.getUseCases(filters);

    res.json({
      success: true,
      data: useCases,
    });
  } catch (error) {
    next(error);
  }
};

export const getUseCaseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const useCase = await useCasesService.getUseCaseById(id);

    if (!useCase) {
      return res.status(404).json({
        success: false,
        message: 'Use case not found',
      });
    }

    res.json({
      success: true,
      data: useCase,
    });
  } catch (error) {
    next(error);
  }
};

export const createUseCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const useCase = await useCasesService.createUseCase(req.body);

    res.status(201).json({
      success: true,
      data: useCase,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUseCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const useCase = await useCasesService.updateUseCase(id, req.body);

    if (!useCase) {
      return res.status(404).json({
        success: false,
        message: 'Use case not found',
      });
    }

    res.json({
      success: true,
      data: useCase,
    });
  } catch (error) {
    next(error);
  }
};

export const patchUseCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const useCase = await useCasesService.patchUseCase(id, req.body);

    if (!useCase) {
      return res.status(404).json({
        success: false,
        message: 'Use case not found',
      });
    }

    res.json({
      success: true,
      data: useCase,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUseCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await useCasesService.deleteUseCase(id);

    res.json({
      success: true,
      message: 'Use case deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUseCaseStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await useCasesService.getUseCaseStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateUseCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, data } = req.body;
    const useCases = await useCasesService.bulkUpdateUseCases(ids, data);

    res.json({
      success: true,
      data: useCases,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteUseCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;
    await useCasesService.bulkDeleteUseCases(ids);

    res.json({
      success: true,
      message: `${ids.length} use cases deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
```

#### 8. Environment Variables (.env.example)

```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_idea_hub

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8080
```

---

### Python with FastAPI Example

#### 1. Project Setup

```bash
mkdir ai-idea-hub-api
cd ai-idea-hub-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy pydantic python-jose passlib python-multipart
```

#### 2. Main Application (main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, use_cases, users, dashboard

app = FastAPI(title="AI Idea Hub API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(use_cases.router, prefix="/api/use-cases", tags=["use-cases"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": "2026-02-11T10:00:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
```

#### 3. Use Cases Router (routers/use_cases.py)

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from models import UseCase, CreateUseCaseDto, UpdateUseCaseDto
from dependencies import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[UseCase])
async def get_use_cases(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    # Implementation here
    pass

@router.get("/{id}", response_model=UseCase)
async def get_use_case(
    id: str,
    current_user = Depends(get_current_user)
):
    # Implementation here
    pass

@router.post("/", response_model=UseCase, status_code=201)
async def create_use_case(
    use_case: CreateUseCaseDto,
    current_user = Depends(require_role(["editor", "admin"]))
):
    # Implementation here
    pass

@router.put("/{id}", response_model=UseCase)
async def update_use_case(
    id: str,
    use_case: UpdateUseCaseDto,
    current_user = Depends(require_role(["editor", "admin"]))
):
    # Implementation here
    pass

@router.delete("/{id}")
async def delete_use_case(
    id: str,
    current_user = Depends(require_role(["editor", "admin"]))
):
    # Implementation here
    pass
```

---

## Authentication

### JWT Token Structure

**Access Token Payload:**
```json
{
  "userId": "u-001",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1707646800,
  "exp": 1707650400
}
```

**Refresh Token Payload:**
```json
{
  "userId": "u-001",
  "type": "refresh",
  "iat": 1707646800,
  "exp": 1708251600
}
```

### Token Expiry
- Access Token: 1 hour
- Refresh Token: 7 days

### Authorization Header Format
```
Authorization: Bearer <access_token>
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field1": ["Error message 1", "Error message 2"],
    "field2": ["Error message 3"]
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful GET, PUT, PATCH requests
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

---

## Usage Examples

### Frontend Usage with React Hooks

#### Example 1: Fetching Use Cases

```typescript
import { useUseCases } from '@/hooks/useUseCases';

function UseCasesPage() {
  const { data, isLoading, error } = useUseCases({ status: 'Active' });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map(useCase => (
        <div key={useCase.id}>{useCase.title}</div>
      ))}
    </div>
  );
}
```

#### Example 2: Creating a Use Case

```typescript
import { useCreateUseCase } from '@/hooks/useUseCases';
import { toast } from 'sonner';

function CreateUseCaseForm() {
  const createMutation = useCreateUseCase({
    onSuccess: () => {
      toast.success('Use case created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### Example 3: Authentication

```typescript
import { useLogin } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin({
    onSuccess: (response) => {
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error.message);
    },
  });

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin('user@example.com', 'password');
    }}>
      {/* Login form */}
    </form>
  );
}
```

---

## Database Schema

### PostgreSQL Example

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive')),
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Use Cases table
CREATE TABLE use_cases (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Draft', 'Active', 'In Review', 'Completed', 'Archived')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  owner VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  estimated_impact TEXT NOT NULL,
  date_created DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE activity_log (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('created', 'updated', 'completed', 'deleted')),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('useCase', 'user')),
  entity_id VARCHAR(50) NOT NULL,
  entity_title VARCHAR(255) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_use_cases_status ON use_cases(status);
CREATE INDEX idx_use_cases_category ON use_cases(category);
CREATE INDEX idx_use_cases_priority ON use_cases(priority);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
```

---

## Testing the API

### Swagger UI

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

You can test all endpoints directly from the Swagger UI after authenticating.

### Default User Credentials

All users share the default password: `password123`

| Email | Role |
|-------|------|
| `vinoth.sasikumar@ust.com` | admin |
| `Naseer.Abida@ust.com` | editor |
| `Neeta.Kuriakose@ust.com` | editor |
| `Sundeep.Vijayanathan@ust.com` | editor |

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vinoth.sasikumar@ust.com","password":"password123"}'

# Get all use cases
curl -X GET http://localhost:3000/api/use-cases \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a use case
curl -X POST http://localhost:3000/api/use-cases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Use Case",
    "description": "Description",
    "category": "IT",
    "status": "Draft",
    "priority": "Medium",
    "owner": "John Doe",
    "department": "IT",
    "estimatedImpact": "10% improvement"
  }'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for `baseUrl` and `token`
3. Create a collection for each endpoint group
4. Add pre-request scripts for authentication

---

## Deployment

### Environment-Specific Configuration

**Development:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### CORS Configuration

Ensure your backend CORS settings match your frontend domain:

```javascript
// Express.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
```

---

## Security Best Practices

1. **Use HTTPS** in production
2. **Implement rate limiting** to prevent abuse
3. **Validate all input** data
4. **Use parameterized queries** to prevent SQL injection
5. **Store passwords** using bcrypt or similar
6. **Implement CSRF protection** for state-changing operations
7. **Set secure HTTP headers** (helmet.js for Express)
8. **Implement proper logging** and monitoring
9. **Regular security audits** and dependency updates

---

## Conclusion

This documentation provides a complete specification for building the backend API for the AI Idea Hub application. The frontend service layer is ready and will seamlessly integrate with any backend that implements these endpoints correctly.

For questions or clarifications, refer to the source code in the `src/services/` and `src/hooks/` directories.
