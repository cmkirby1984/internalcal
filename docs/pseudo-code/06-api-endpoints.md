# API Endpoints Specification

## Overview
This document defines all RESTful API endpoints with request/response formats, authentication requirements, and error handling patterns.

---

## 1. API Structure & Standards

### 1.1 Base URL

```
Production: https://api.motelmanager.com/v1
Development: http://localhost:3000/api/v1
```

### 1.2 Authentication

All endpoints (except `/auth/*`) require authentication via JWT token:

```http
Authorization: Bearer <jwt_token>
```

### 1.3 Standard Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... } | [ ... ],
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... } // Optional additional context
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}

// Paginated Response
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### 1.4 HTTP Status Codes

```
200 OK - Successful GET, PUT, PATCH
201 Created - Successful POST
204 No Content - Successful DELETE
400 Bad Request - Invalid input
401 Unauthorized - Missing or invalid authentication
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
409 Conflict - Resource conflict (e.g., duplicate)
422 Unprocessable Entity - Validation error
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
503 Service Unavailable - Temporary server issue
```

### 1.5 Error Codes

```typescript
ERROR_CODES = {
  // Authentication & Authorization
  "AUTH_INVALID_CREDENTIALS": "Invalid username or password",
  "AUTH_TOKEN_EXPIRED": "Authentication token has expired",
  "AUTH_TOKEN_INVALID": "Invalid authentication token",
  "AUTH_INSUFFICIENT_PERMISSIONS": "Insufficient permissions for this action",

  // Validation
  "VALIDATION_ERROR": "Input validation failed",
  "VALIDATION_REQUIRED_FIELD": "Required field is missing",
  "VALIDATION_INVALID_FORMAT": "Field has invalid format",

  // Resource Errors
  "RESOURCE_NOT_FOUND": "Requested resource not found",
  "RESOURCE_CONFLICT": "Resource already exists",
  "RESOURCE_LOCKED": "Resource is locked by another process",

  // Business Logic
  "BUSINESS_INVALID_STATUS_TRANSITION": "Invalid status transition",
  "BUSINESS_TASK_ALREADY_ASSIGNED": "Task is already assigned",
  "BUSINESS_EMPLOYEE_ON_LEAVE": "Employee is on leave",

  // System
  "SYSTEM_ERROR": "An unexpected error occurred",
  "SYSTEM_DATABASE_ERROR": "Database error",
  "SYSTEM_RATE_LIMIT": "Rate limit exceeded"
}
```

---

## 2. Authentication Endpoints

### 2.1 Login

```http
POST /auth/login
```

**Request:**
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "uuid",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "username": "john.doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "HOUSEKEEPER",
      "department": "HOUSEKEEPING",
      "permissions": ["view_assigned_tasks", "update_task_status"],
      "avatarUrl": "https://..."
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials

### 2.2 Refresh Token

```http
POST /auth/refresh
```

**Request:**
```json
{
  "refreshToken": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

### 2.3 Logout

```http
POST /auth/logout
```

**Request:**
```json
{
  "refreshToken": "uuid"
}
```

**Response (204):** No content

### 2.4 Change Password

```http
POST /auth/change-password
```

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

## 3. Suite Endpoints

### 3.1 List Suites

```http
GET /suites
```

**Query Parameters:**
```
?page=1
&perPage=20
&status=VACANT_CLEAN,VACANT_DIRTY
&floor=1,2
&type=STANDARD,DELUXE
&search=101
&sortBy=suiteNumber (suiteNumber|status|floor|lastCleaned)
&sortOrder=asc (asc|desc)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "suiteNumber": "101",
      "floor": 1,
      "type": "STANDARD",
      "status": "VACANT_CLEAN",
      "bedConfiguration": "QUEEN",
      "squareFeet": 300,
      "amenities": ["WiFi", "TV", "Mini-Fridge"],
      "currentGuest": null,
      "lastCleaned": "2024-01-15T08:30:00Z",
      "lastInspected": "2024-01-14T16:00:00Z",
      "nextScheduledMaintenance": null,
      "activeTasks": [],
      "notes": "",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3.2 Get Suite by ID

```http
GET /suites/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "suiteNumber": "101",
    "floor": 1,
    "type": "STANDARD",
    "status": "OCCUPIED_CLEAN",
    "bedConfiguration": "QUEEN",
    "squareFeet": 300,
    "amenities": ["WiFi", "TV", "Mini-Fridge"],
    "currentGuest": {
      "name": "Jane Smith",
      "checkInDate": "2024-01-14T15:00:00Z",
      "checkOutDate": "2024-01-17T11:00:00Z",
      "guestCount": 2,
      "specialRequests": "Extra towels"
    },
    "lastCleaned": "2024-01-15T08:30:00Z",
    "lastInspected": "2024-01-14T16:00:00Z",
    "nextScheduledMaintenance": null,
    "activeTasks": ["task-uuid-1", "task-uuid-2"],
    "notes": "Suite has new carpet",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T08:30:00Z"
  }
}
```

**Errors:**
- `404` - Suite not found

### 3.3 Create Suite

```http
POST /suites
```

**Required Permission:** `create_suite`

**Request:**
```json
{
  "suiteNumber": "305",
  "floor": 3,
  "type": "DELUXE",
  "bedConfiguration": "KING",
  "squareFeet": 400,
  "amenities": ["WiFi", "TV", "Mini-Fridge", "Ocean View"],
  "notes": "Renovated in 2023"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "suiteNumber": "305",
    "floor": 3,
    "type": "DELUXE",
    "status": "VACANT_DIRTY",
    "bedConfiguration": "KING",
    "squareFeet": 400,
    "amenities": ["WiFi", "TV", "Mini-Fridge", "Ocean View"],
    "currentGuest": null,
    "lastCleaned": null,
    "lastInspected": null,
    "nextScheduledMaintenance": null,
    "activeTasks": [],
    "notes": "Renovated in 2023",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid input
- `409` - Suite number already exists
- `422` - Validation error

### 3.4 Update Suite

```http
PATCH /suites/:id
```

**Required Permission:** `update_suite`

**Request:**
```json
{
  "status": "OCCUPIED_CLEAN",
  "currentGuest": {
    "name": "John Doe",
    "checkInDate": "2024-01-15T15:00:00Z",
    "checkOutDate": "2024-01-18T11:00:00Z",
    "guestCount": 2,
    "specialRequests": "Late checkout if possible"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated suite object
  }
}
```

**Errors:**
- `400` - Invalid status transition
- `404` - Suite not found
- `422` - Validation error

### 3.5 Update Suite Status

```http
PATCH /suites/:id/status
```

**Request:**
```json
{
  "status": "VACANT_CLEAN",
  "reason": "Cleaning completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated suite object
  }
}
```

### 3.6 Delete Suite

```http
DELETE /suites/:id
```

**Required Permission:** `delete_suite`

**Response (204):** No content

**Errors:**
- `404` - Suite not found
- `409` - Suite has active tasks or current guest

### 3.7 Get Suite Tasks

```http
GET /suites/:id/tasks
```

**Query Parameters:**
```
?status=PENDING,IN_PROGRESS
&type=CLEANING,MAINTENANCE
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      // Task objects
    }
  ]
}
```

### 3.8 Get Suite Maintenance History

```http
GET /suites/:id/maintenance-history
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "suiteId": "suite-uuid",
      "maintenanceType": "Plumbing",
      "description": "Fixed leaky faucet",
      "performedBy": "employee-uuid",
      "performedAt": "2024-01-10T14:00:00Z",
      "partsUsed": [
        {
          "partName": "Faucet washer",
          "quantity": 1,
          "cost": 5.99
        }
      ],
      "totalCost": 5.99,
      "beforePhotos": ["url1"],
      "afterPhotos": ["url2"]
    }
  ]
}
```

---

## 4. Task Endpoints

### 4.1 List Tasks

```http
GET /tasks
```

**Query Parameters:**
```
?page=1
&perPage=20
&status=PENDING,ASSIGNED,IN_PROGRESS
&type=CLEANING,MAINTENANCE
&priority=HIGH,URGENT
&assignedTo=employee-uuid
&suiteId=suite-uuid
&scheduledStart[gte]=2024-01-15T00:00:00Z
&scheduledStart[lte]=2024-01-16T00:00:00Z
&sortBy=priority (priority|scheduledStart|createdAt)
&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "CLEANING",
      "priority": "NORMAL",
      "status": "ASSIGNED",
      "title": "Clean Suite 101",
      "description": "Standard cleaning",
      "suiteId": "suite-uuid",
      "assignedTo": "employee-uuid",
      "assignedBy": "manager-uuid",
      "verifiedBy": null,
      "scheduledStart": "2024-01-15T09:00:00Z",
      "scheduledEnd": "2024-01-15T09:30:00Z",
      "estimatedDuration": 30,
      "actualStart": null,
      "actualEnd": null,
      "actualDuration": null,
      "completionNotes": null,
      "verificationNotes": null,
      "customFields": {
        "linensChanged": false,
        "deepClean": false
      },
      "recurring": false,
      "recurrencePattern": null,
      "attachments": [],
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z",
      "completedAt": null
    }
  ],
  "pagination": { ... }
}
```

### 4.2 Get Task by ID

```http
GET /tasks/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Complete task object
    // Includes populated references (suite, employee details)
    "suite": {
      "id": "uuid",
      "suiteNumber": "101",
      "floor": 1,
      "status": "VACANT_DIRTY"
    },
    "assignedToEmployee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "role": "HOUSEKEEPER"
    }
  }
}
```

### 4.3 Create Task

```http
POST /tasks
```

**Required Permission:** `create_task`

**Request:**
```json
{
  "type": "CLEANING",
  "priority": "NORMAL",
  "title": "Clean Suite 102",
  "description": "Standard cleaning after guest checkout",
  "suiteId": "suite-uuid",
  "assignedTo": "employee-uuid",
  "scheduledStart": "2024-01-15T10:00:00Z",
  "scheduledEnd": "2024-01-15T10:30:00Z",
  "estimatedDuration": 30,
  "customFields": {
    "linensChanged": true,
    "deepClean": false
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    // Created task object
  }
}
```

**Business Rules Applied:**
- If `type` is `EMERGENCY`, automatically set `priority` to `EMERGENCY`
- If `assignedTo` is provided, set status to `ASSIGNED`
- Create notification for assigned employee
- Log activity

### 4.4 Update Task

```http
PATCH /tasks/:id
```

**Request:**
```json
{
  "priority": "HIGH",
  "description": "Updated description",
  "scheduledStart": "2024-01-15T11:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated task object
  }
}
```

### 4.5 Update Task Status

```http
PATCH /tasks/:id/status
```

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "notes": "Starting task now"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated task object with actualStart timestamp
  }
}
```

**Business Rules Applied:**
- `ASSIGNED` → `IN_PROGRESS`: Set `actualStart` to current time
- `IN_PROGRESS` → `COMPLETED`: Set `actualEnd` to current time, calculate `actualDuration`
- `COMPLETED` (CLEANING) → Update related suite status
- `COMPLETED` (MAINTENANCE) → Update suite from OUT_OF_ORDER to VACANT_DIRTY

### 4.6 Assign Task

```http
POST /tasks/:id/assign
```

**Required Permission:** `assign_task`

**Request:**
```json
{
  "employeeId": "employee-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated task with new assignment
  }
}
```

**Business Rules:**
- Set `assignedTo` to specified employee
- Set `assignedBy` to current user
- Update status to `ASSIGNED` if currently `PENDING`
- Create notification for assigned employee
- Check employee availability/workload (optional warning)

### 4.7 Start Task

```http
POST /tasks/:id/start
```

**Request:** Empty body or:
```json
{
  "location": "Building A, Floor 1"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Task with status=IN_PROGRESS and actualStart timestamp
  }
}
```

**Business Rules:**
- Must be assigned to current user
- Set `actualStart` to current time
- Update status to `IN_PROGRESS`
- Update employee's `currentLocation` if provided

### 4.8 Complete Task

```http
POST /tasks/:id/complete
```

**Request:**
```json
{
  "completionNotes": "Cleaned thoroughly, linens changed",
  "customFields": {
    "linensChanged": true,
    "deepClean": false
  },
  "attachments": [
    {
      "url": "https://...",
      "fileName": "after-photo.jpg",
      "fileType": "image/jpeg"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Task with status=COMPLETED, actualEnd, actualDuration
  }
}
```

**Business Rules:**
- Set `actualEnd` to current time
- Calculate `actualDuration`
- Set `completedAt`
- Update status to `COMPLETED`
- Apply task type specific rules:
  - CLEANING: Update suite status (VACANT_DIRTY → VACANT_CLEAN, OCCUPIED_DIRTY → OCCUPIED_CLEAN)
  - MAINTENANCE: Update suite from OUT_OF_ORDER
- Increment employee's `tasksCompleted` counter
- Check for recurring task and create next instance if applicable

### 4.9 Verify Task

```http
POST /tasks/:id/verify
```

**Required Permission:** `verify_task`

**Request:**
```json
{
  "verificationNotes": "Verified - excellent work",
  "approved": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Task with status=VERIFIED
  }
}
```

### 4.10 Delete Task

```http
DELETE /tasks/:id
```

**Required Permission:** `delete_task`

**Response (204):** No content

**Business Rules:**
- Cannot delete tasks with status `IN_PROGRESS` or `COMPLETED`
- Removes task from suite's `activeTasks`

### 4.11 Bulk Assign Tasks

```http
POST /tasks/bulk-assign
```

**Request:**
```json
{
  "taskIds": ["uuid1", "uuid2", "uuid3"],
  "employeeId": "employee-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "assigned": 3,
    "failed": 0,
    "tasks": [
      // Updated task objects
    ]
  }
}
```

---

## 5. Employee Endpoints

### 5.1 List Employees

```http
GET /employees
```

**Query Parameters:**
```
?page=1
&perPage=20
&status=ACTIVE,ON_BREAK
&role=HOUSEKEEPER,MAINTENANCE
&department=HOUSEKEEPING
&isOnDuty=true
&search=john
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeNumber": "EMP001",
      "username": "john.doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "HOUSEKEEPER",
      "department": "HOUSEKEEPING",
      "status": "ACTIVE",
      "isOnDuty": true,
      "lastClockIn": "2024-01-15T08:00:00Z",
      "lastClockOut": null,
      "currentLocation": "Building A, Floor 2",
      "tasksCompleted": 150,
      "performanceRating": 4.5,
      "avatarUrl": "https://...",
      "hireDate": "2023-01-15",
      "createdAt": "2023-01-15T00:00:00Z",
      "lastActive": "2024-01-15T10:25:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Note:** Password hash and sensitive data excluded from response

### 5.2 Get Employee by ID

```http
GET /employees/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Complete employee object (except password)
    "currentShift": {
      "shiftType": "DAY",
      "startTime": "08:00",
      "endTime": "16:00",
      "daysOfWeek": [1, 2, 3, 4, 5]
    },
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1234567890"
    },
    "permissions": ["view_assigned_tasks", "update_task_status"],
    "stats": {
      "activeTasks": 2,
      "completedToday": 5,
      "averageTaskDuration": 28,
      "hoursWorkedToday": 2.5
    }
  }
}
```

### 5.3 Get Current User (Me)

```http
GET /employees/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Current logged-in employee's complete profile
  }
}
```

### 5.4 Create Employee

```http
POST /employees
```

**Required Permission:** `create_employee`

**Request:**
```json
{
  "employeeNumber": "EMP010",
  "username": "sarah.jones",
  "email": "sarah@example.com",
  "password": "temporaryPassword123",
  "firstName": "Sarah",
  "lastName": "Jones",
  "phone": "+1234567890",
  "role": "HOUSEKEEPER",
  "department": "HOUSEKEEPING",
  "hireDate": "2024-01-15",
  "currentShift": {
    "shiftType": "DAY",
    "startTime": "08:00",
    "endTime": "16:00",
    "daysOfWeek": [1, 2, 3, 4, 5]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    // Created employee object
    // Password should be changed on first login
  }
}
```

### 5.5 Update Employee

```http
PATCH /employees/:id
```

**Required Permission:** `update_employee` (or self-update for own profile)

**Request:**
```json
{
  "phone": "+1987654321",
  "currentShift": {
    "shiftType": "EVENING",
    "startTime": "16:00",
    "endTime": "00:00",
    "daysOfWeek": [1, 2, 3, 4, 5]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated employee object
  }
}
```

### 5.6 Clock In

```http
POST /employees/:id/clock-in
```

**Request:**
```json
{
  "location": "Front Desk"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isOnDuty": true,
    "lastClockIn": "2024-01-15T08:00:00Z",
    "status": "ACTIVE",
    "currentLocation": "Front Desk"
  }
}
```

**Business Rules:**
- Set `isOnDuty` to `true`
- Set `lastClockIn` to current time
- Update `status` to `ACTIVE`
- Update `currentLocation` if provided
- Update `lastActive`

### 5.7 Clock Out

```http
POST /employees/:id/clock-out
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isOnDuty": false,
    "lastClockOut": "2024-01-15T16:00:00Z",
    "status": "OFF_DUTY",
    "hoursWorked": 8.0
  }
}
```

**Business Rules:**
- Check for active tasks (warn if any)
- Set `isOnDuty` to `false`
- Set `lastClockOut` to current time
- Update `status` to `OFF_DUTY`
- Calculate hours worked for the day

### 5.8 Get Employee Tasks

```http
GET /employees/:id/tasks
```

**Query Parameters:**
```
?status=ASSIGNED,IN_PROGRESS
&dateFrom=2024-01-15
&dateTo=2024-01-16
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    // Tasks assigned to this employee
  ]
}
```

### 5.9 Get Employee Performance

```http
GET /employees/:id/performance
```

**Query Parameters:**
```
?period=week (day|week|month|year)
&date=2024-01-15
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2024-01-08",
    "endDate": "2024-01-14",
    "tasksCompleted": 35,
    "averageTaskDuration": 27,
    "hoursWorked": 40,
    "performanceRating": 4.5,
    "taskBreakdown": {
      "CLEANING": 30,
      "INSPECTION": 5
    },
    "completionRate": 0.97,
    "onTimeRate": 0.94
  }
}
```

### 5.10 Delete Employee

```http
DELETE /employees/:id
```

**Required Permission:** `delete_employee`

**Response (204):** No content

**Business Rules:**
- Soft delete (set `deletedAt`)
- Cannot delete employee with active tasks
- Reassign pending tasks to another employee (optional)

---

## 6. Note Endpoints

### 6.1 List Notes

```http
GET /notes
```

**Query Parameters:**
```
?page=1
&perPage=20
&type=GENERAL,INCIDENT
&priority=HIGH,URGENT
&relatedSuite=suite-uuid
&relatedTask=task-uuid
&pinned=true
&archived=false
&tags=urgent,maintenance
&search=plumbing
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "MAINTENANCE",
      "priority": "HIGH",
      "title": "Plumbing Issue",
      "content": "Suite 205 has a leaking pipe under the sink",
      "createdBy": "employee-uuid",
      "createdByEmployee": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "relatedSuiteId": "suite-uuid",
      "relatedTaskId": null,
      "visibility": "ALL_STAFF",
      "pinned": true,
      "archived": false,
      "tags": ["urgent", "plumbing"],
      "requiresFollowUp": true,
      "followUpDate": "2024-01-16T09:00:00Z",
      "followUpAssignedTo": "employee-uuid",
      "followUpCompleted": false,
      "attachments": [],
      "comments": [],
      "lastReadBy": [],
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 6.2 Get Note by ID

```http
GET /notes/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Complete note object with populated references
    "relatedSuite": {
      "id": "uuid",
      "suiteNumber": "205",
      "floor": 2
    },
    "comments": [
      {
        "commentId": "uuid",
        "commentBy": "employee-uuid",
        "commentByEmployee": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "commentText": "I'll handle this",
        "commentedAt": "2024-01-15T10:15:00Z"
      }
    ]
  }
}
```

### 6.3 Create Note

```http
POST /notes
```

**Request:**
```json
{
  "type": "MAINTENANCE",
  "priority": "HIGH",
  "title": "Plumbing Issue",
  "content": "Suite 205 has a leaking pipe under the sink. Needs immediate attention.",
  "relatedSuiteId": "suite-uuid",
  "visibility": "ALL_STAFF",
  "tags": ["urgent", "plumbing"],
  "requiresFollowUp": true,
  "followUpDate": "2024-01-16T09:00:00Z",
  "followUpAssignedTo": "employee-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    // Created note object
  }
}
```

**Business Rules:**
- Set `createdBy` to current user
- If type is `INCIDENT`, set priority to `HIGH` and visibility to `MANAGERS_ONLY`
- Create notifications for mentioned employees (if @username in content)
- If `requiresFollowUp`, create notification for assigned employee

### 6.4 Update Note

```http
PATCH /notes/:id
```

**Request:**
```json
{
  "content": "Updated content",
  "tags": ["urgent", "plumbing", "resolved"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Updated note object
  }
}
```

### 6.5 Add Comment

```http
POST /notes/:id/comments
```

**Request:**
```json
{
  "commentText": "I'll take care of this right away"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "commentId": "new-uuid",
    "commentBy": "current-employee-uuid",
    "commentText": "I'll take care of this right away",
    "commentedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Business Rules:**
- Add comment to note's `comments` array
- Create notification for note creator
- Mark note as having unread comments for other users

### 6.6 Pin/Unpin Note

```http
PATCH /notes/:id/pin
```

**Request:**
```json
{
  "pinned": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Note with updated pinned status
  }
}
```

### 6.7 Archive Note

```http
PATCH /notes/:id/archive
```

**Request:**
```json
{
  "archived": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Note with archived status
  }
}
```

### 6.8 Mark Note as Read

```http
POST /notes/:id/read
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marked": true
  }
}
```

**Business Rules:**
- Add current user to `lastReadBy` array with current timestamp
- Don't duplicate if already read

### 6.9 Delete Note

```http
DELETE /notes/:id
```

**Response (204):** No content

---

## 7. Notification Endpoints

### 7.1 List Notifications

```http
GET /notifications
```

**Query Parameters:**
```
?read=false
&type=TASK_ASSIGNED,EMERGENCY_TASK
&page=1
&perPage=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "TASK_ASSIGNED",
      "priority": "NORMAL",
      "title": "New Task Assigned",
      "message": "You have been assigned: Clean Suite 101",
      "read": false,
      "readAt": null,
      "actionRequired": true,
      "actionUrl": "/tasks/task-uuid",
      "relatedEntityType": "TASK",
      "relatedEntityId": "task-uuid",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "unreadCount": 5
  }
}
```

### 7.2 Mark Notification as Read

```http
PATCH /notifications/:id/read
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Notification with read=true and readAt timestamp
  }
}
```

### 7.3 Mark All as Read

```http
POST /notifications/mark-all-read
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "markedCount": 5
  }
}
```

### 7.4 Delete Notification

```http
DELETE /notifications/:id
```

**Response (204):** No content

---

## 8. Dashboard & Analytics Endpoints

### 8.1 Get Dashboard Stats

```http
GET /dashboard/stats
```

**Query Parameters:**
```
?date=2024-01-15 (default: today)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suites": {
      "total": 50,
      "vacantClean": 12,
      "vacantDirty": 5,
      "occupiedClean": 28,
      "occupiedDirty": 3,
      "outOfOrder": 2,
      "blocked": 0,
      "occupancyRate": 62.0
    },
    "tasks": {
      "total": 45,
      "pending": 8,
      "assigned": 12,
      "inProgress": 5,
      "completed": 18,
      "completedToday": 18,
      "overdue": 2
    },
    "employees": {
      "total": 25,
      "onDuty": 15,
      "available": 8,
      "onBreak": 2,
      "offDuty": 10
    },
    "performance": {
      "avgTaskDuration": 28,
      "completionRate": 0.95,
      "onTimeRate": 0.92
    }
  }
}
```

### 8.2 Get Recent Activity

```http
GET /dashboard/activity
```

**Query Parameters:**
```
?limit=20
&type=TASK,SUITE,NOTE (filter by activity type)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "TASK_COMPLETED",
      "entityType": "TASK",
      "entityId": "task-uuid",
      "employeeId": "employee-uuid",
      "employee": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "description": "John Doe completed: Clean Suite 101",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 9. File Upload Endpoint

### 9.1 Upload File

```http
POST /upload
```

**Request:** multipart/form-data
```
file: (binary)
type: "task_attachment" | "note_attachment" | "avatar" | "maintenance_photo"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/uploads/uuid.jpg",
    "fileName": "photo.jpg",
    "fileType": "image/jpeg",
    "size": 12345,
    "uploadedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Validation:**
- Max file size: 10MB
- Allowed types: images (jpg, png, gif), documents (pdf, doc, docx)
- Virus scan before storage

---

## 10. WebSocket Events

See separate document `07-real-time-sync.md` for WebSocket event specifications.

---

## 11. Rate Limiting

```
Authenticated requests: 1000 requests per hour per user
Unauthenticated requests: 100 requests per hour per IP
WebSocket connections: Max 5 concurrent connections per user
```

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1610712000
```

---

## 12. API Versioning

Versioning is handled via URL path:
- `/api/v1/*` - Current version
- `/api/v2/*` - Future version (when breaking changes needed)

Deprecated endpoints will include warning header:
```http
X-API-Deprecated: true
X-API-Sunset: 2024-12-31
```

This comprehensive API specification provides all necessary endpoints for implementing the motel management application.
