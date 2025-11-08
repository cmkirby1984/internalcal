# Data Models Pseudo-Code

## Overview
This document defines the core data models for the motel management application.

---

## 1. Suite Model

```pseudo
MODEL Suite {
  // Primary Identification
  id: String (UUID, primary key)
  suiteNumber: String (unique, required) // e.g., "101", "102A"

  // Suite Details
  floor: Integer (required) // 1, 2, 3, etc.
  type: Enum {
    STANDARD,
    DELUXE,
    SUITE,
    ACCESSIBLE
  }

  // Occupancy Status
  status: Enum {
    VACANT_CLEAN,      // Ready for new guest
    VACANT_DIRTY,      // Needs cleaning
    OCCUPIED_CLEAN,    // Guest checked in, room cleaned
    OCCUPIED_DIRTY,    // Guest checked in, needs cleaning
    OUT_OF_ORDER,      // Maintenance required
    BLOCKED            // Reserved/unavailable
  }

  // Guest Information
  currentGuest: Object {
    name: String (optional)
    checkInDate: DateTime (optional)
    checkOutDate: DateTime (optional)
    guestCount: Integer (optional)
    specialRequests: String (optional)
  }

  // Physical Attributes
  bedConfiguration: Enum {
    SINGLE,
    DOUBLE,
    QUEEN,
    KING,
    TWIN_BEDS,
    QUEEN_PLUS_SOFA
  }
  amenities: Array<String> // ["WiFi", "Microwave", "Mini-Fridge", "Ocean View"]
  squareFeet: Integer (optional)

  // Maintenance & Cleaning
  lastCleaned: DateTime (optional)
  lastInspected: DateTime (optional)
  nextScheduledMaintenance: DateTime (optional)

  // Metadata
  createdAt: DateTime (auto-generated)
  updatedAt: DateTime (auto-generated)
  notes: String (optional) // General notes about the suite

  // Relationships
  activeTasks: Array<Task.id> // References to active tasks
  maintenanceHistory: Array<MaintenanceRecord.id>
}

VALIDATION_RULES Suite {
  suiteNumber: MUST be unique across all suites
  floor: MUST be positive integer
  status: MUST transition according to StatusTransitionRules
  currentGuest.checkOutDate: MUST be after checkInDate
}

STATUS_TRANSITION_RULES {
  VACANT_DIRTY -> VACANT_CLEAN: Requires cleaning task completion
  OCCUPIED_DIRTY -> OCCUPIED_CLEAN: Requires cleaning task completion
  ANY_STATUS -> OUT_OF_ORDER: Requires maintenance task creation
  OUT_OF_ORDER -> VACANT_DIRTY: Requires maintenance task completion
}
```

---

## 2. Task Model

```pseudo
MODEL Task {
  // Primary Identification
  id: String (UUID, primary key)

  // Task Classification
  type: Enum {
    CLEANING,
    MAINTENANCE,
    INSPECTION,
    LINEN_CHANGE,
    DEEP_CLEAN,
    EMERGENCY,
    CUSTOM
  }

  priority: Enum {
    LOW,      // Can be done during normal schedule
    NORMAL,   // Standard priority
    HIGH,     // Should be done soon
    URGENT,   // Immediate attention required
    EMERGENCY // Drop everything
  }

  status: Enum {
    PENDING,      // Created but not assigned
    ASSIGNED,     // Assigned to employee
    IN_PROGRESS,  // Employee working on it
    PAUSED,       // Temporarily stopped
    COMPLETED,    // Finished successfully
    CANCELLED,    // No longer needed
    VERIFIED      // Completed and verified by supervisor
  }

  // Task Details
  title: String (required) // "Clean Suite 101"
  description: String (optional) // Detailed instructions

  // Assignment
  assignedTo: Employee.id (optional) // Who is responsible
  assignedBy: Employee.id (optional) // Who created/assigned the task

  // Suite Relationship
  suiteId: Suite.id (required for most types)

  // Scheduling
  scheduledStart: DateTime (optional)
  scheduledEnd: DateTime (optional)
  estimatedDuration: Integer (minutes, optional)

  // Actual Timing
  actualStart: DateTime (optional)
  actualEnd: DateTime (optional)
  actualDuration: Integer (minutes, computed)

  // Completion Details
  completionNotes: String (optional)
  verifiedBy: Employee.id (optional)
  verificationNotes: String (optional)

  // Task-specific Data
  customFields: Object {
    // For CLEANING tasks
    linensChanged: Boolean (optional)
    deepClean: Boolean (optional)

    // For MAINTENANCE tasks
    maintenanceType: String (optional) // "Plumbing", "Electrical", etc.
    partsNeeded: Array<String> (optional)
    estimatedCost: Decimal (optional)

    // For INSPECTION tasks
    inspectionChecklist: Array<ChecklistItem> (optional)
    passed: Boolean (optional)
  }

  // Recurrence (for scheduled tasks)
  recurring: Boolean (default: false)
  recurrencePattern: Object {
    frequency: Enum { DAILY, WEEKLY, MONTHLY }
    interval: Integer // Every X days/weeks/months
    endDate: DateTime (optional)
  } (optional)

  // Metadata
  createdAt: DateTime (auto-generated)
  updatedAt: DateTime (auto-generated)
  completedAt: DateTime (optional)

  // Relationships
  attachedPhotos: Array<String> // URLs or file references
  relatedNotes: Array<Note.id>
  parentTask: Task.id (optional) // For subtasks
  subtasks: Array<Task.id>
}

VALIDATION_RULES Task {
  title: MUST NOT be empty
  type: MUST be valid enum value
  scheduledEnd: MUST be after scheduledStart
  assignedTo: MUST reference valid active Employee
  status: MUST follow StatusTransitionRules
}

STATUS_TRANSITION_RULES Task {
  PENDING -> ASSIGNED: Requires assignedTo to be set
  ASSIGNED -> IN_PROGRESS: Requires actualStart timestamp
  IN_PROGRESS -> COMPLETED: Requires actualEnd timestamp
  COMPLETED -> VERIFIED: Requires verifiedBy to be set
  IN_PROGRESS -> PAUSED: Allowed
  PAUSED -> IN_PROGRESS: Allowed
}

BUSINESS_RULES Task {
  WHEN Task.status == COMPLETED AND Task.type == CLEANING {
    IF Task.suiteId.status == VACANT_DIRTY {
      SET Suite.status = VACANT_CLEAN
    }
    IF Task.suiteId.status == OCCUPIED_DIRTY {
      SET Suite.status = OCCUPIED_CLEAN
    }
    UPDATE Suite.lastCleaned = Task.completedAt
  }

  WHEN Task.type == EMERGENCY {
    SET Task.priority = EMERGENCY
    NOTIFY all active supervisors
  }
}
```

---

## 3. Employee Model

```pseudo
MODEL Employee {
  // Primary Identification
  id: String (UUID, primary key)
  employeeNumber: String (unique, required)

  // Personal Information
  firstName: String (required)
  lastName: String (required)
  email: String (unique, required, validated)
  phone: String (optional, validated)

  // Employment Details
  role: Enum {
    HOUSEKEEPER,
    MAINTENANCE,
    FRONT_DESK,
    SUPERVISOR,
    MANAGER,
    ADMIN
  }

  department: Enum {
    HOUSEKEEPING,
    MAINTENANCE,
    FRONT_OFFICE,
    MANAGEMENT
  }

  status: Enum {
    ACTIVE,
    ON_BREAK,
    OFF_DUTY,
    ON_LEAVE,
    INACTIVE
  }

  // Authentication & Authorization
  username: String (unique, required)
  passwordHash: String (required, hashed)
  permissions: Array<String> // ["view_all_suites", "assign_tasks", "edit_employees"]

  // Shift Information
  currentShift: Object {
    shiftType: Enum { DAY, EVENING, NIGHT }
    startTime: Time
    endTime: Time
    daysOfWeek: Array<Integer> // [1, 2, 3, 4, 5] for Mon-Fri
  } (optional)

  // Current Status
  isOnDuty: Boolean (default: false)
  lastClockIn: DateTime (optional)
  lastClockOut: DateTime (optional)
  currentLocation: String (optional) // "Building A, Floor 2"

  // Performance Tracking
  tasksCompleted: Integer (default: 0)
  averageTaskDuration: Integer (minutes, computed)
  performanceRating: Decimal (0-5, optional)

  // Contact Preferences
  preferredContactMethod: Enum {
    EMAIL,
    SMS,
    PHONE,
    IN_APP
  }

  // Emergency Contact
  emergencyContact: Object {
    name: String
    relationship: String
    phone: String
  } (optional)

  // Metadata
  hireDate: Date (required)
  createdAt: DateTime (auto-generated)
  updatedAt: DateTime (auto-generated)
  lastActive: DateTime (optional)

  // Relationships
  assignedTasks: Array<Task.id> // Currently assigned tasks
  completedTasks: Array<Task.id> // Historical completed tasks
  createdNotes: Array<Note.id>
}

VALIDATION_RULES Employee {
  email: MUST match email regex pattern
  phone: MUST match phone number pattern (if provided)
  employeeNumber: MUST be unique
  username: MUST be unique and alphanumeric
  passwordHash: MUST be hashed using secure algorithm (bcrypt, argon2)
}

COMPUTED_PROPERTIES Employee {
  fullName: CONCATENATE(firstName, " ", lastName)
  activeTaskCount: COUNT(assignedTasks WHERE status IN [ASSIGNED, IN_PROGRESS])
  hoursWorkedToday: CALCULATE_HOURS(lastClockIn, currentTime OR lastClockOut)
}

PERMISSIONS_MATRIX {
  HOUSEKEEPER: ["view_assigned_tasks", "update_task_status", "add_notes"]
  MAINTENANCE: ["view_assigned_tasks", "update_task_status", "add_maintenance_notes", "update_suite_status"]
  SUPERVISOR: ["view_all_tasks", "assign_tasks", "view_all_suites", "add_tasks", "view_employees"]
  MANAGER: ["*"] // All permissions
  ADMIN: ["*"] // All permissions including employee management
}
```

---

## 4. Note Model

```pseudo
MODEL Note {
  // Primary Identification
  id: String (UUID, primary key)

  // Note Classification
  type: Enum {
    GENERAL,
    MAINTENANCE,
    GUEST_REQUEST,
    INCIDENT,
    REMINDER,
    HANDOFF        // Shift handoff notes
  }

  priority: Enum {
    LOW,
    NORMAL,
    HIGH,
    URGENT
  }

  // Content
  title: String (optional)
  content: String (required) // Main note text

  // Author Information
  createdBy: Employee.id (required)
  createdByName: String (computed from Employee)

  // Relationships
  relatedSuite: Suite.id (optional)
  relatedTask: Task.id (optional)
  relatedEmployee: Employee.id (optional)

  // Visibility & Permissions
  visibility: Enum {
    PRIVATE,           // Only creator can see
    DEPARTMENT,        // Only department members can see
    ALL_STAFF,         // All employees can see
    MANAGERS_ONLY      // Only managers and above
  }

  pinned: Boolean (default: false) // Pin to top of lists
  archived: Boolean (default: false)

  // Tags for organization
  tags: Array<String> // ["urgent", "plumbing", "floor-2"]

  // Follow-up
  requiresFollowUp: Boolean (default: false)
  followUpDate: DateTime (optional)
  followUpAssignedTo: Employee.id (optional)
  followUpCompleted: Boolean (default: false)

  // Attachments
  attachments: Array<Object> {
    fileUrl: String
    fileName: String
    fileType: String
    uploadedAt: DateTime
  }

  // Thread/Comments
  comments: Array<Object> {
    commentId: String (UUID)
    commentBy: Employee.id
    commentText: String
    commentedAt: DateTime
  }

  // Metadata
  createdAt: DateTime (auto-generated)
  updatedAt: DateTime (auto-generated)
  lastReadBy: Array<Object> {
    employeeId: Employee.id
    readAt: DateTime
  }

  // Expiration (for temporary notes)
  expiresAt: DateTime (optional)
}

VALIDATION_RULES Note {
  content: MUST NOT be empty
  content: MAX length 5000 characters
  createdBy: MUST reference valid Employee
  visibility: MUST be valid enum value

  IF requiresFollowUp == true {
    followUpDate: MUST NOT be null
  }
}

COMPUTED_PROPERTIES Note {
  isExpired: IF expiresAt < currentTime THEN true ELSE false
  unreadCount: COUNT(Employees) - COUNT(lastReadBy)
  hasUnreadComments: CHECK if new comments since last read
}

BUSINESS_RULES Note {
  WHEN Note.type == INCIDENT {
    SET Note.priority = HIGH
    SET Note.visibility = MANAGERS_ONLY
    NOTIFY all managers
  }

  WHEN Note.requiresFollowUp == true AND followUpDate < currentTime {
    NOTIFY followUpAssignedTo
    FLAG note as "Overdue Follow-up"
  }

  WHEN Note.pinned == true {
    DISPLAY at top of note lists for applicable users
  }

  WHEN Note.archived == true {
    HIDE from default views
    STILL searchable in archive
  }
}
```

---

## 5. Additional Supporting Models

### 5.1 MaintenanceRecord

```pseudo
MODEL MaintenanceRecord {
  id: String (UUID, primary key)
  suiteId: Suite.id (required)
  taskId: Task.id (optional)

  maintenanceType: String // "Plumbing", "HVAC", "Electrical"
  description: String

  performedBy: Employee.id
  performedAt: DateTime

  partsUsed: Array<Object> {
    partName: String
    quantity: Integer
    cost: Decimal
  }

  totalCost: Decimal (computed)
  warrantyInfo: String (optional)
  nextScheduledService: DateTime (optional)

  beforePhotos: Array<String>
  afterPhotos: Array<String>

  createdAt: DateTime
  updatedAt: DateTime
}
```

### 5.2 ChecklistItem

```pseudo
MODEL ChecklistItem {
  id: String (UUID)
  label: String // "Check thermostat"
  completed: Boolean (default: false)
  required: Boolean (default: true)
  notes: String (optional)
  completedAt: DateTime (optional)
  completedBy: Employee.id (optional)
}
```

### 5.3 Notification

```pseudo
MODEL Notification {
  id: String (UUID, primary key)

  recipientId: Employee.id (required)
  type: Enum {
    TASK_ASSIGNED,
    TASK_OVERDUE,
    SUITE_STATUS_CHANGE,
    EMERGENCY_TASK,
    SHIFT_REMINDER,
    NOTE_MENTION,
    SYSTEM_ALERT
  }

  title: String
  message: String

  priority: Enum { LOW, NORMAL, HIGH, URGENT }

  read: Boolean (default: false)
  readAt: DateTime (optional)

  actionRequired: Boolean (default: false)
  actionUrl: String (optional) // Deep link to relevant screen

  relatedEntityType: String (optional) // "Task", "Suite", "Note"
  relatedEntityId: String (optional)

  expiresAt: DateTime (optional)
  createdAt: DateTime
}
```

---

## 6. Data Relationships Summary

```pseudo
RELATIONSHIPS {
  Suite:
    - HAS_MANY Tasks
    - HAS_MANY MaintenanceRecords
    - HAS_MANY Notes (via relatedSuite)

  Task:
    - BELONGS_TO Suite
    - BELONGS_TO Employee (assignedTo)
    - BELONGS_TO Employee (assignedBy)
    - BELONGS_TO Employee (verifiedBy)
    - HAS_MANY Notes (via relatedTask)
    - HAS_ONE ParentTask (optional)
    - HAS_MANY Subtasks

  Employee:
    - HAS_MANY Tasks (assignedTasks)
    - HAS_MANY Notes (createdNotes)
    - HAS_MANY Notifications

  Note:
    - BELONGS_TO Employee (createdBy)
    - BELONGS_TO Suite (optional)
    - BELONGS_TO Task (optional)
    - BELONGS_TO Employee (relatedEmployee, optional)

  MaintenanceRecord:
    - BELONGS_TO Suite
    - BELONGS_TO Task (optional)
    - BELONGS_TO Employee (performedBy)
}
```

---

## 7. Database Indexes (Performance Optimization)

```pseudo
INDEXES {
  Suite:
    - PRIMARY KEY: id
    - UNIQUE INDEX: suiteNumber
    - INDEX: status
    - INDEX: floor
    - INDEX: (status, floor) // Composite for common queries

  Task:
    - PRIMARY KEY: id
    - INDEX: suiteId
    - INDEX: assignedTo
    - INDEX: status
    - INDEX: type
    - INDEX: (status, priority, scheduledStart) // For task queues

  Employee:
    - PRIMARY KEY: id
    - UNIQUE INDEX: employeeNumber
    - UNIQUE INDEX: username
    - UNIQUE INDEX: email
    - INDEX: status
    - INDEX: role

  Note:
    - PRIMARY KEY: id
    - INDEX: createdBy
    - INDEX: relatedSuite
    - INDEX: relatedTask
    - INDEX: type
    - INDEX: (visibility, archived, createdAt) // For filtered lists

  Notification:
    - PRIMARY KEY: id
    - INDEX: recipientId
    - INDEX: (recipientId, read, createdAt) // For unread notifications
}
```
