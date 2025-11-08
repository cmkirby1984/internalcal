# Database Schema Specifications

## Overview
This document provides detailed database schema definitions for both SQL and NoSQL implementations, including indexes, constraints, and migration strategies.

---

## 1. SQL Schema (PostgreSQL)

### 1.1 Suites Table

```sql
CREATE TABLE suites (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  suite_number VARCHAR(10) NOT NULL UNIQUE,
  floor INTEGER NOT NULL CHECK (floor > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('STANDARD', 'DELUXE', 'SUITE', 'ACCESSIBLE')),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'VACANT_DIRTY'
    CHECK (status IN (
      'VACANT_CLEAN',
      'VACANT_DIRTY',
      'OCCUPIED_CLEAN',
      'OCCUPIED_DIRTY',
      'OUT_OF_ORDER',
      'BLOCKED'
    )),

  -- Physical Attributes
  bed_configuration VARCHAR(30) NOT NULL
    CHECK (bed_configuration IN (
      'SINGLE',
      'DOUBLE',
      'QUEEN',
      'KING',
      'TWIN_BEDS',
      'QUEEN_PLUS_SOFA'
    )),
  square_feet INTEGER,
  amenities JSONB DEFAULT '[]'::jsonb,

  -- Guest Information (embedded JSON)
  current_guest JSONB DEFAULT '{}'::jsonb,
  /* Structure of current_guest:
  {
    "name": "string",
    "checkInDate": "ISO8601 datetime",
    "checkOutDate": "ISO8601 datetime",
    "guestCount": number,
    "specialRequests": "string"
  }
  */

  -- Maintenance & Cleaning
  last_cleaned TIMESTAMP WITH TIME ZONE,
  last_inspected TIMESTAMP WITH TIME ZONE,
  next_scheduled_maintenance TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_suites_status ON suites(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_suites_floor ON suites(floor) WHERE deleted_at IS NULL;
CREATE INDEX idx_suites_status_floor ON suites(status, floor) WHERE deleted_at IS NULL;
CREATE INDEX idx_suites_last_cleaned ON suites(last_cleaned) WHERE deleted_at IS NULL;
CREATE INDEX idx_suites_current_guest ON suites USING GIN(current_guest) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_suites_updated_at
  BEFORE UPDATE ON suites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Tasks Table

```sql
CREATE TABLE tasks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task Classification
  type VARCHAR(20) NOT NULL
    CHECK (type IN (
      'CLEANING',
      'MAINTENANCE',
      'INSPECTION',
      'LINEN_CHANGE',
      'DEEP_CLEAN',
      'EMERGENCY',
      'CUSTOM'
    )),
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN (
      'PENDING',
      'ASSIGNED',
      'IN_PROGRESS',
      'PAUSED',
      'COMPLETED',
      'CANCELLED',
      'VERIFIED'
    )),

  -- Task Details
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Relationships
  suite_id UUID REFERENCES suites(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- in minutes

  -- Actual Timing
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN actual_start IS NOT NULL AND actual_end IS NOT NULL
      THEN EXTRACT(EPOCH FROM (actual_end - actual_start)) / 60
      ELSE NULL
    END
  ) STORED,

  -- Completion Details
  completion_notes TEXT,
  verification_notes TEXT,

  -- Task-specific Data
  custom_fields JSONB DEFAULT '{}'::jsonb,
  /* Structure varies by type:
  For CLEANING:
  {
    "linensChanged": boolean,
    "deepClean": boolean
  }
  For MAINTENANCE:
  {
    "maintenanceType": "string",
    "partsNeeded": ["string"],
    "estimatedCost": number
  }
  For INSPECTION:
  {
    "inspectionChecklist": [ChecklistItem],
    "passed": boolean
  }
  */

  -- Recurrence
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  /* Structure:
  {
    "frequency": "DAILY" | "WEEKLY" | "MONTHLY",
    "interval": number,
    "endDate": "ISO8601 datetime"
  }
  */

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  /* Array of:
  {
    "url": "string",
    "fileName": "string",
    "fileType": "string",
    "uploadedAt": "ISO8601 datetime"
  }
  */

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_schedule CHECK (scheduled_end IS NULL OR scheduled_start IS NULL OR scheduled_end > scheduled_start),
  CONSTRAINT valid_actual_time CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end > actual_start)
);

-- Indexes
CREATE INDEX idx_tasks_suite_id ON tasks(suite_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_type ON tasks(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status_priority_scheduled ON tasks(status, priority, scheduled_start) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_scheduled_start ON tasks(scheduled_start) WHERE deleted_at IS NULL AND scheduled_start IS NOT NULL;
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.3 Employees Table

```sql
CREATE TABLE employees (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique Identifiers
  employee_number VARCHAR(20) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),

  -- Authentication
  password_hash VARCHAR(255) NOT NULL,

  -- Employment Details
  role VARCHAR(20) NOT NULL
    CHECK (role IN (
      'HOUSEKEEPER',
      'MAINTENANCE',
      'FRONT_DESK',
      'SUPERVISOR',
      'MANAGER',
      'ADMIN'
    )),
  department VARCHAR(20) NOT NULL
    CHECK (department IN (
      'HOUSEKEEPING',
      'MAINTENANCE',
      'FRONT_OFFICE',
      'MANAGEMENT'
    )),
  status VARCHAR(20) NOT NULL DEFAULT 'OFF_DUTY'
    CHECK (status IN (
      'ACTIVE',
      'ON_BREAK',
      'OFF_DUTY',
      'ON_LEAVE',
      'INACTIVE'
    )),

  -- Permissions (stored as array)
  permissions TEXT[] DEFAULT '{}',

  -- Shift Information
  current_shift JSONB,
  /* Structure:
  {
    "shiftType": "DAY" | "EVENING" | "NIGHT",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "daysOfWeek": [0-6]
  }
  */

  -- Current Status
  is_on_duty BOOLEAN DEFAULT FALSE,
  last_clock_in TIMESTAMP WITH TIME ZONE,
  last_clock_out TIMESTAMP WITH TIME ZONE,
  current_location VARCHAR(100),

  -- Performance Tracking
  tasks_completed INTEGER DEFAULT 0,
  performance_rating DECIMAL(3, 2) CHECK (performance_rating >= 0 AND performance_rating <= 5),

  -- Contact Preferences
  preferred_contact_method VARCHAR(20) DEFAULT 'EMAIL'
    CHECK (preferred_contact_method IN ('EMAIL', 'SMS', 'PHONE', 'IN_APP')),

  -- Emergency Contact
  emergency_contact JSONB,
  /* Structure:
  {
    "name": "string",
    "relationship": "string",
    "phone": "string"
  }
  */

  -- Profile
  avatar_url TEXT,

  -- Metadata
  hire_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_employees_username ON employees(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_email ON employees(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_employee_number ON employees(employee_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status ON employees(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_role ON employees(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department ON employees(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_is_on_duty ON employees(is_on_duty) WHERE deleted_at IS NULL AND is_on_duty = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.4 Notes Table

```sql
CREATE TABLE notes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  type VARCHAR(20) NOT NULL DEFAULT 'GENERAL'
    CHECK (type IN (
      'GENERAL',
      'MAINTENANCE',
      'GUEST_REQUEST',
      'INCIDENT',
      'REMINDER',
      'HANDOFF'
    )),
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),

  -- Content
  title VARCHAR(255),
  content TEXT NOT NULL,

  -- Author
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Relationships
  related_suite_id UUID REFERENCES suites(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  related_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,

  -- Visibility
  visibility VARCHAR(20) NOT NULL DEFAULT 'ALL_STAFF'
    CHECK (visibility IN (
      'PRIVATE',
      'DEPARTMENT',
      'ALL_STAFF',
      'MANAGERS_ONLY'
    )),
  pinned BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  follow_up_assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  follow_up_completed BOOLEAN DEFAULT FALSE,

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  /* Array of:
  {
    "fileUrl": "string",
    "fileName": "string",
    "fileType": "string",
    "uploadedAt": "ISO8601 datetime"
  }
  */

  -- Comments (denormalized for performance)
  comments JSONB DEFAULT '[]'::jsonb,
  /* Array of:
  {
    "commentId": "uuid",
    "commentBy": "uuid",
    "commentText": "string",
    "commentedAt": "ISO8601 datetime"
  }
  */

  -- Read Tracking
  last_read_by JSONB DEFAULT '[]'::jsonb,
  /* Array of:
  {
    "employeeId": "uuid",
    "readAt": "ISO8601 datetime"
  }
  */

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_notes_created_by ON notes(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_related_suite_id ON notes(related_suite_id) WHERE deleted_at IS NULL AND related_suite_id IS NOT NULL;
CREATE INDEX idx_notes_related_task_id ON notes(related_task_id) WHERE deleted_at IS NULL AND related_task_id IS NOT NULL;
CREATE INDEX idx_notes_type ON notes(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_visibility_archived ON notes(visibility, archived, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_pinned ON notes(pinned) WHERE deleted_at IS NULL AND pinned = TRUE;
CREATE INDEX idx_notes_tags ON notes USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_expires_at ON notes(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.5 Notifications Table

```sql
CREATE TABLE notifications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  recipient_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Classification
  type VARCHAR(30) NOT NULL
    CHECK (type IN (
      'TASK_ASSIGNED',
      'TASK_OVERDUE',
      'SUITE_STATUS_CHANGE',
      'EMERGENCY_TASK',
      'SHIFT_REMINDER',
      'NOTE_MENTION',
      'SYSTEM_ALERT'
    )),
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Read Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Action
  action_required BOOLEAN DEFAULT FALSE,
  action_url TEXT,

  -- Related Entity
  related_entity_type VARCHAR(20),
  related_entity_id UUID,

  -- Metadata
  data JSONB DEFAULT '{}'::jsonb, -- Additional context data
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;
```

### 1.6 Maintenance Records Table

```sql
CREATE TABLE maintenance_records (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  suite_id UUID NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  performed_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Details
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,

  -- Parts & Cost
  parts_used JSONB DEFAULT '[]'::jsonb,
  /* Array of:
  {
    "partName": "string",
    "quantity": number,
    "cost": number
  }
  */
  total_cost DECIMAL(10, 2),

  -- Warranty
  warranty_info TEXT,
  next_scheduled_service TIMESTAMP WITH TIME ZONE,

  -- Photos
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',

  -- Metadata
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_maintenance_records_suite_id ON maintenance_records(suite_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_records_task_id ON maintenance_records(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_records_performed_by ON maintenance_records(performed_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_records_performed_at ON maintenance_records(performed_at DESC) WHERE deleted_at IS NULL;
```

### 1.7 Activity Log Table

```sql
CREATE TABLE activity_log (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,

  -- Action
  action VARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'SUITE', 'TASK', 'EMPLOYEE', 'NOTE'
  entity_id UUID NOT NULL,

  -- Changes
  changes JSONB, -- Store before/after values
  /* Structure:
  {
    "before": { ... },
    "after": { ... }
  }
  */

  -- Context
  description TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_employee_id ON activity_log(employee_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action);

-- Partition by month for performance
CREATE TABLE activity_log_y2024m01 PARTITION OF activity_log
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- Continue for each month...
```

### 1.8 Utility Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average task duration
CREATE OR REPLACE FUNCTION calculate_avg_task_duration(emp_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(AVG(actual_duration)::INTEGER, 0)
  FROM tasks
  WHERE assigned_to = emp_id
    AND status = 'COMPLETED'
    AND actual_duration IS NOT NULL
    AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE;

-- Function to get suite occupancy rate
CREATE OR REPLACE FUNCTION get_occupancy_rate()
RETURNS DECIMAL AS $$
  SELECT
    ROUND(
      (COUNT(*) FILTER (WHERE status IN ('OCCUPIED_CLEAN', 'OCCUPIED_DIRTY'))::DECIMAL /
       NULLIF(COUNT(*), 0)) * 100,
      2
    )
  FROM suites
  WHERE deleted_at IS NULL;
$$ LANGUAGE sql STABLE;
```

---

## 2. NoSQL Schema (MongoDB)

### 2.1 Suites Collection

```javascript
{
  _id: ObjectId,

  // Basic Information
  suiteNumber: String, // indexed, unique
  floor: Number, // indexed
  type: String, // enum: STANDARD, DELUXE, SUITE, ACCESSIBLE

  // Status
  status: String, // indexed, enum: VACANT_CLEAN, VACANT_DIRTY, etc.

  // Physical Attributes
  bedConfiguration: String, // enum: SINGLE, DOUBLE, QUEEN, etc.
  squareFeet: Number,
  amenities: [String],

  // Guest Information (embedded document)
  currentGuest: {
    name: String,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: Number,
    specialRequests: String
  },

  // Maintenance & Cleaning
  lastCleaned: Date, // indexed
  lastInspected: Date,
  nextScheduledMaintenance: Date,

  // Active Tasks (denormalized for quick access)
  activeTasks: [ObjectId], // references to tasks

  // Metadata
  notes: String,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}

// Indexes
db.suites.createIndex({ suiteNumber: 1 }, { unique: true });
db.suites.createIndex({ status: 1 });
db.suites.createIndex({ floor: 1 });
db.suites.createIndex({ status: 1, floor: 1 });
db.suites.createIndex({ lastCleaned: 1 });
db.suites.createIndex({ deletedAt: 1 });
```

### 2.2 Tasks Collection

```javascript
{
  _id: ObjectId,

  // Task Classification
  type: String, // indexed, enum: CLEANING, MAINTENANCE, etc.
  priority: String, // indexed, enum: LOW, NORMAL, HIGH, etc.
  status: String, // indexed, enum: PENDING, ASSIGNED, etc.

  // Task Details
  title: String,
  description: String,

  // Relationships (references)
  suiteId: ObjectId, // indexed
  assignedTo: ObjectId, // indexed (employee)
  assignedBy: ObjectId, // (employee)
  verifiedBy: ObjectId, // (employee)
  parentTaskId: ObjectId,

  // Scheduling
  scheduledStart: Date, // indexed
  scheduledEnd: Date,
  estimatedDuration: Number, // minutes

  // Actual Timing
  actualStart: Date,
  actualEnd: Date,
  actualDuration: Number, // computed in minutes

  // Completion Details
  completionNotes: String,
  verificationNotes: String,

  // Task-specific Data (flexible schema)
  customFields: {
    // For CLEANING
    linensChanged: Boolean,
    deepClean: Boolean,

    // For MAINTENANCE
    maintenanceType: String,
    partsNeeded: [String],
    estimatedCost: Number,

    // For INSPECTION
    inspectionChecklist: [{
      id: String,
      label: String,
      completed: Boolean,
      required: Boolean,
      notes: String,
      completedAt: Date,
      completedBy: ObjectId
    }],
    passed: Boolean
  },

  // Recurrence
  recurring: Boolean,
  recurrencePattern: {
    frequency: String, // DAILY, WEEKLY, MONTHLY
    interval: Number,
    endDate: Date
  },

  // Attachments
  attachments: [{
    url: String,
    fileName: String,
    fileType: String,
    uploadedAt: Date
  }],

  // Subtasks (denormalized)
  subtasks: [ObjectId],

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date,
  deletedAt: Date
}

// Indexes
db.tasks.createIndex({ suiteId: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ type: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ status: 1, priority: 1, scheduledStart: 1 });
db.tasks.createIndex({ scheduledStart: 1 });
db.tasks.createIndex({ deletedAt: 1 });
db.tasks.createIndex({ createdAt: -1 });
```

### 2.3 Employees Collection

```javascript
{
  _id: ObjectId,

  // Unique Identifiers
  employeeNumber: String, // indexed, unique
  username: String, // indexed, unique
  email: String, // indexed, unique

  // Personal Information
  firstName: String,
  lastName: String,
  phone: String,

  // Authentication
  passwordHash: String,

  // Employment Details
  role: String, // indexed, enum: HOUSEKEEPER, MAINTENANCE, etc.
  department: String, // indexed, enum: HOUSEKEEPING, MAINTENANCE, etc.
  status: String, // indexed, enum: ACTIVE, ON_BREAK, etc.

  // Permissions
  permissions: [String],

  // Shift Information (embedded)
  currentShift: {
    shiftType: String, // DAY, EVENING, NIGHT
    startTime: String, // HH:MM
    endTime: String, // HH:MM
    daysOfWeek: [Number] // 0-6
  },

  // Current Status
  isOnDuty: Boolean, // indexed
  lastClockIn: Date,
  lastClockOut: Date,
  currentLocation: String,

  // Performance Tracking
  tasksCompleted: Number,
  performanceRating: Number, // 0-5

  // Contact Preferences
  preferredContactMethod: String, // EMAIL, SMS, PHONE, IN_APP

  // Emergency Contact (embedded)
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  // Profile
  avatarUrl: String,

  // Metadata
  hireDate: Date,
  createdAt: Date,
  updatedAt: Date,
  lastActive: Date,
  deletedAt: Date
}

// Indexes
db.employees.createIndex({ employeeNumber: 1 }, { unique: true });
db.employees.createIndex({ username: 1 }, { unique: true });
db.employees.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ status: 1 });
db.employees.createIndex({ role: 1 });
db.employees.createIndex({ department: 1 });
db.employees.createIndex({ isOnDuty: 1 });
db.employees.createIndex({ deletedAt: 1 });
```

### 2.4 Notes Collection

```javascript
{
  _id: ObjectId,

  // Classification
  type: String, // indexed, enum: GENERAL, MAINTENANCE, etc.
  priority: String, // enum: LOW, NORMAL, HIGH, URGENT

  // Content
  title: String,
  content: String,

  // Author
  createdBy: ObjectId, // indexed (employee)

  // Relationships
  relatedSuiteId: ObjectId, // indexed
  relatedTaskId: ObjectId, // indexed
  relatedEmployeeId: ObjectId,

  // Visibility
  visibility: String, // enum: PRIVATE, DEPARTMENT, etc.
  pinned: Boolean, // indexed
  archived: Boolean, // indexed

  // Tags
  tags: [String], // indexed

  // Follow-up
  requiresFollowUp: Boolean,
  followUpDate: Date,
  followUpAssignedTo: ObjectId,
  followUpCompleted: Boolean,

  // Attachments (embedded)
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String,
    uploadedAt: Date
  }],

  // Comments (embedded for performance)
  comments: [{
    commentId: ObjectId,
    commentBy: ObjectId,
    commentText: String,
    commentedAt: Date
  }],

  // Read Tracking (embedded)
  lastReadBy: [{
    employeeId: ObjectId,
    readAt: Date
  }],

  // Expiration
  expiresAt: Date,

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}

// Indexes
db.notes.createIndex({ createdBy: 1 });
db.notes.createIndex({ relatedSuiteId: 1 });
db.notes.createIndex({ relatedTaskId: 1 });
db.notes.createIndex({ type: 1 });
db.notes.createIndex({ visibility: 1, archived: 1, createdAt: -1 });
db.notes.createIndex({ pinned: 1 });
db.notes.createIndex({ tags: 1 });
db.notes.createIndex({ expiresAt: 1 });
db.notes.createIndex({ deletedAt: 1 });
```

---

## 3. Data Validation Rules

### 3.1 Suite Validation

```javascript
VALIDATION SuiteSchema {
  suiteNumber: {
    required: true,
    type: String,
    pattern: /^[A-Z0-9]{1,10}$/,
    unique: true
  },

  floor: {
    required: true,
    type: Number,
    min: 1,
    max: 100
  },

  type: {
    required: true,
    type: String,
    enum: ['STANDARD', 'DELUXE', 'SUITE', 'ACCESSIBLE']
  },

  status: {
    required: true,
    type: String,
    enum: ['VACANT_CLEAN', 'VACANT_DIRTY', 'OCCUPIED_CLEAN', 'OCCUPIED_DIRTY', 'OUT_OF_ORDER', 'BLOCKED'],
    validate: validateStatusTransition
  },

  bedConfiguration: {
    required: true,
    type: String,
    enum: ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN_BEDS', 'QUEEN_PLUS_SOFA']
  },

  currentGuest: {
    type: Object,
    properties: {
      name: { type: String, maxLength: 255 },
      checkInDate: { type: Date },
      checkOutDate: {
        type: Date,
        validate: function(value) {
          return !this.currentGuest.checkInDate || value > this.currentGuest.checkInDate;
        }
      },
      guestCount: { type: Number, min: 1, max: 10 }
    }
  }
}

FUNCTION validateStatusTransition(newStatus, oldStatus) {
  validTransitions = {
    'VACANT_DIRTY': ['VACANT_CLEAN', 'OUT_OF_ORDER'],
    'VACANT_CLEAN': ['OCCUPIED_CLEAN', 'BLOCKED', 'OUT_OF_ORDER'],
    'OCCUPIED_CLEAN': ['OCCUPIED_DIRTY', 'VACANT_DIRTY', 'OUT_OF_ORDER'],
    'OCCUPIED_DIRTY': ['OCCUPIED_CLEAN', 'VACANT_DIRTY', 'OUT_OF_ORDER'],
    'OUT_OF_ORDER': ['VACANT_DIRTY'],
    'BLOCKED': ['VACANT_CLEAN', 'VACANT_DIRTY']
  }

  IF oldStatus == null {
    RETURN true // New record
  }

  RETURN newStatus IN validTransitions[oldStatus]
}
```

### 3.2 Task Validation

```javascript
VALIDATION TaskSchema {
  title: {
    required: true,
    type: String,
    minLength: 1,
    maxLength: 255
  },

  type: {
    required: true,
    type: String,
    enum: ['CLEANING', 'MAINTENANCE', 'INSPECTION', 'LINEN_CHANGE', 'DEEP_CLEAN', 'EMERGENCY', 'CUSTOM']
  },

  priority: {
    required: true,
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY'],
    default: 'NORMAL'
  },

  status: {
    required: true,
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED', 'VERIFIED'],
    validate: validateTaskStatusTransition
  },

  scheduledEnd: {
    type: Date,
    validate: function(value) {
      return !this.scheduledStart || !value || value > this.scheduledStart;
    }
  },

  actualEnd: {
    type: Date,
    validate: function(value) {
      return !this.actualStart || !value || value > this.actualStart;
    }
  },

  assignedTo: {
    type: ObjectId,
    validate: validateEmployeeActive
  }
}

FUNCTION validateTaskStatusTransition(newStatus, oldStatus, task) {
  validTransitions = {
    'PENDING': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
    'IN_PROGRESS': ['PAUSED', 'COMPLETED', 'CANCELLED'],
    'PAUSED': ['IN_PROGRESS', 'CANCELLED'],
    'COMPLETED': ['VERIFIED'],
    'CANCELLED': [],
    'VERIFIED': []
  }

  IF oldStatus == null {
    RETURN true
  }

  IF newStatus NOT IN validTransitions[oldStatus] {
    RETURN false
  }

  // Additional validations
  IF newStatus == 'IN_PROGRESS' AND !task.actualStart {
    THROW "actualStart required for IN_PROGRESS status"
  }

  IF newStatus == 'COMPLETED' AND !task.actualEnd {
    THROW "actualEnd required for COMPLETED status"
  }

  RETURN true
}
```

---

## 4. Migration Scripts

### 4.1 Initial Migration (SQL)

```sql
-- V1__initial_schema.sql

BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables
\i create_tables/01_suites.sql
\i create_tables/02_employees.sql
\i create_tables/03_tasks.sql
\i create_tables/04_notes.sql
\i create_tables/05_notifications.sql
\i create_tables/06_maintenance_records.sql
\i create_tables/07_activity_log.sql

-- Create functions
\i functions/update_updated_at.sql
\i functions/calculate_metrics.sql

-- Create triggers
\i triggers/suite_triggers.sql
\i triggers/task_triggers.sql
\i triggers/employee_triggers.sql

-- Insert default data
\i seeds/01_default_admin.sql
\i seeds/02_default_permissions.sql

COMMIT;
```

### 4.2 Seed Data (SQL)

```sql
-- seeds/01_default_admin.sql

-- Insert default admin user
INSERT INTO employees (
  employee_number,
  username,
  email,
  first_name,
  last_name,
  password_hash,
  role,
  department,
  status,
  permissions,
  hire_date
) VALUES (
  'EMP001',
  'admin',
  'admin@motelmanager.com',
  'System',
  'Administrator',
  crypt('admin123', gen_salt('bf')), -- Change in production!
  'ADMIN',
  'MANAGEMENT',
  'ACTIVE',
  ARRAY['*'], -- All permissions
  CURRENT_DATE
);

-- Insert sample employees
INSERT INTO employees (employee_number, username, email, first_name, last_name, password_hash, role, department, status, permissions, hire_date)
VALUES
  ('EMP002', 'john.housekeeper', 'john@example.com', 'John', 'Doe', crypt('password', gen_salt('bf')), 'HOUSEKEEPER', 'HOUSEKEEPING', 'ACTIVE', ARRAY['view_assigned_tasks', 'update_task_status', 'add_notes'], CURRENT_DATE),
  ('EMP003', 'jane.maintenance', 'jane@example.com', 'Jane', 'Smith', crypt('password', gen_salt('bf')), 'MAINTENANCE', 'MAINTENANCE', 'ACTIVE', ARRAY['view_assigned_tasks', 'update_task_status', 'update_suite_status', 'add_maintenance_notes'], CURRENT_DATE),
  ('EMP004', 'bob.supervisor', 'bob@example.com', 'Bob', 'Johnson', crypt('password', gen_salt('bf')), 'SUPERVISOR', 'HOUSEKEEPING', 'ACTIVE', ARRAY['view_all_tasks', 'assign_tasks', 'view_all_suites', 'add_tasks', 'view_employees'], CURRENT_DATE);

-- Insert sample suites
INSERT INTO suites (suite_number, floor, type, status, bed_configuration, square_feet, amenities)
VALUES
  ('101', 1, 'STANDARD', 'VACANT_CLEAN', 'QUEEN', 300, '["WiFi", "TV", "Mini-Fridge"]'),
  ('102', 1, 'STANDARD', 'VACANT_DIRTY', 'QUEEN', 300, '["WiFi", "TV", "Mini-Fridge"]'),
  ('103', 1, 'DELUXE', 'OCCUPIED_CLEAN', 'KING', 400, '["WiFi", "TV", "Mini-Fridge", "Microwave", "Ocean View"]'),
  ('201', 2, 'SUITE', 'VACANT_CLEAN', 'KING', 600, '["WiFi", "TV", "Mini-Fridge", "Microwave", "Kitchen", "Ocean View"]'),
  ('202', 2, 'ACCESSIBLE', 'VACANT_CLEAN', 'QUEEN', 350, '["WiFi", "TV", "Mini-Fridge", "Wheelchair Accessible"]');
```

---

## 5. Backup & Recovery Strategies

### 5.1 Backup Strategy (PostgreSQL)

```bash
#!/bin/bash
# backup.sh - Daily backup script

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/postgresql"
DB_NAME="motel_manager"

# Full backup
pg_dump -U postgres -F c -b -v -f "${BACKUP_DIR}/full_backup_${TIMESTAMP}.dump" ${DB_NAME}

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "full_backup_*.dump" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp "${BACKUP_DIR}/full_backup_${TIMESTAMP}.dump" s3://my-backups/postgresql/
```

### 5.2 Point-in-Time Recovery

```sql
-- Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'

-- Create base backup
SELECT pg_start_backup('label');
-- Copy data directory
SELECT pg_stop_backup();

-- Restore to specific time
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
```

This comprehensive database schema provides a solid foundation for implementation with proper indexing, constraints, and validation rules.
