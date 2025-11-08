# State Management Pseudo-Code

## Overview
This document defines the state management architecture for the motel management application using a centralized state pattern (similar to Redux/Zustand/Context API).

---

## 1. Global State Structure

```pseudo
GLOBAL_STATE {
  // Authentication & User
  auth: {
    currentUser: Employee | null
    isAuthenticated: Boolean
    token: String | null
    permissions: Array<String>
    lastActivity: DateTime
  }

  // Suites State
  suites: {
    items: Map<Suite.id, Suite> // Normalized by ID
    allIds: Array<Suite.id>

    // Filtering & View State
    filters: {
      status: Array<SuiteStatus> | null
      floor: Array<Integer> | null
      type: Array<SuiteType> | null
      searchQuery: String
    }

    // Sorting
    sortBy: Enum { SUITE_NUMBER, STATUS, FLOOR, LAST_CLEANED }
    sortOrder: Enum { ASC, DESC }

    // Selected Suite
    selectedSuiteId: Suite.id | null

    // Loading States
    isLoading: Boolean
    error: String | null

    // Cache Management
    lastFetched: DateTime | null
    needsRefresh: Boolean
  }

  // Tasks State
  tasks: {
    items: Map<Task.id, Task>
    allIds: Array<Task.id>

    // Grouped Views (for performance)
    bySuite: Map<Suite.id, Array<Task.id>>
    byEmployee: Map<Employee.id, Array<Task.id>>
    byStatus: Map<TaskStatus, Array<Task.id>>
    byPriority: Map<TaskPriority, Array<Task.id>>

    // Filtering
    filters: {
      status: Array<TaskStatus> | null
      type: Array<TaskType> | null
      priority: Array<TaskPriority> | null
      assignedTo: Employee.id | null
      suiteId: Suite.id | null
      dateRange: { start: Date, end: Date } | null
    }

    // View Mode
    viewMode: Enum { LIST, KANBAN, CALENDAR }

    // Selected Task
    selectedTaskId: Task.id | null

    // Active Task (for time tracking)
    activeTaskId: Task.id | null
    activeTaskStartTime: DateTime | null

    // Loading States
    isLoading: Boolean
    error: String | null
    lastFetched: DateTime | null
  }

  // Employees State
  employees: {
    items: Map<Employee.id, Employee>
    allIds: Array<Employee.id>

    // Filtered Views
    onDuty: Array<Employee.id>
    available: Array<Employee.id> // On duty with no active tasks
    byDepartment: Map<Department, Array<Employee.id>>
    byRole: Map<Role, Array<Employee.id>>

    // Filtering
    filters: {
      status: Array<EmployeeStatus> | null
      role: Array<Role> | null
      department: Array<Department> | null
    }

    // Loading States
    isLoading: Boolean
    error: String | null
    lastFetched: DateTime | null
  }

  // Notes State
  notes: {
    items: Map<Note.id, Note>
    allIds: Array<Note.id>

    // Grouped Views
    bySuite: Map<Suite.id, Array<Note.id>>
    byTask: Map<Task.id, Array<Note.id>>
    pinned: Array<Note.id>

    // Filtering
    filters: {
      type: Array<NoteType> | null
      priority: Array<NotePriority> | null
      relatedSuite: Suite.id | null
      relatedTask: Task.id | null
      showArchived: Boolean
      dateRange: { start: Date, end: Date } | null
    }

    // Selected Note
    selectedNoteId: Note.id | null

    // Loading States
    isLoading: Boolean
    error: String | null
    lastFetched: DateTime | null
  }

  // Notifications State
  notifications: {
    items: Map<Notification.id, Notification>
    allIds: Array<Notification.id>
    unreadCount: Integer
    unreadIds: Array<Notification.id>

    // Loading States
    isLoading: Boolean
    error: String | null
  }

  // UI State
  ui: {
    // Navigation
    currentView: Enum {
      DASHBOARD,
      SUITES,
      TASKS,
      EMPLOYEES,
      NOTES,
      REPORTS,
      SETTINGS
    }

    // Sidebar
    sidebarOpen: Boolean
    sidebarCollapsed: Boolean

    // Modals
    activeModal: String | null // "create-task", "edit-suite", etc.
    modalData: Object | null

    // Mobile
    isMobileView: Boolean
    bottomSheetOpen: Boolean

    // Theme
    theme: Enum { LIGHT, DARK, AUTO }

    // Layout Preferences
    suitesGridColumns: Integer // 2, 3, 4
    tasksViewDensity: Enum { COMPACT, COMFORTABLE, SPACIOUS }

    // Toast/Snackbar Notifications
    toasts: Array<{
      id: String
      type: Enum { SUCCESS, ERROR, WARNING, INFO }
      message: String
      duration: Integer
    }>
  }

  // Real-time & Sync
  sync: {
    isOnline: Boolean
    lastSyncTime: DateTime | null
    pendingChanges: Array<{
      entityType: String
      entityId: String
      operation: Enum { CREATE, UPDATE, DELETE }
      data: Object
      timestamp: DateTime
    }>
    syncInProgress: Boolean
    syncError: String | null
  }

  // Cache & Performance
  cache: {
    dashboardStats: Object | null
    recentActivity: Array<Object>
    quickAccessSuites: Array<Suite.id>
    lastFetchedTimestamps: Map<String, DateTime>
  }
}
```

---

## 2. State Actions/Mutations

### 2.1 Suite Actions

```pseudo
ACTIONS Suites {

  // Fetch Operations
  ASYNC fetchAllSuites() {
    SET suites.isLoading = true
    SET suites.error = null

    TRY {
      suites_data = AWAIT API.get("/suites")

      DISPATCH normalizeSuites(suites_data)
      SET suites.lastFetched = NOW()
      SET suites.needsRefresh = false

    } CATCH (error) {
      SET suites.error = error.message
      DISPATCH showToast({ type: ERROR, message: "Failed to load suites" })
    } FINALLY {
      SET suites.isLoading = false
    }
  }

  ASYNC fetchSuiteById(suiteId) {
    TRY {
      suite_data = AWAIT API.get("/suites/" + suiteId)
      DISPATCH updateSuite(suite_data)
    } CATCH (error) {
      DISPATCH showToast({ type: ERROR, message: "Failed to load suite" })
    }
  }

  // Create, Update, Delete
  ASYNC createSuite(suiteData) {
    TRY {
      new_suite = AWAIT API.post("/suites", suiteData)
      DISPATCH addSuite(new_suite)
      DISPATCH showToast({ type: SUCCESS, message: "Suite created successfully" })
      RETURN new_suite
    } CATCH (error) {
      DISPATCH showToast({ type: ERROR, message: "Failed to create suite" })
      THROW error
    }
  }

  ASYNC updateSuite(suiteId, updates) {
    // Optimistic update
    original_suite = suites.items[suiteId]
    DISPATCH updateSuiteLocal(suiteId, updates)

    TRY {
      updated_suite = AWAIT API.patch("/suites/" + suiteId, updates)
      DISPATCH updateSuite(updated_suite)
      DISPATCH showToast({ type: SUCCESS, message: "Suite updated" })

      // Trigger related updates
      IF updates.status != original_suite.status {
        DISPATCH handleSuiteStatusChange(suiteId, original_suite.status, updates.status)
      }

    } CATCH (error) {
      // Rollback on error
      DISPATCH updateSuiteLocal(suiteId, original_suite)
      DISPATCH showToast({ type: ERROR, message: "Failed to update suite" })
    }
  }

  ASYNC updateSuiteStatus(suiteId, newStatus) {
    AWAIT updateSuite(suiteId, { status: newStatus })
  }

  ASYNC deleteSuite(suiteId) {
    IF CONFIRM("Are you sure you want to delete this suite?") {
      TRY {
        AWAIT API.delete("/suites/" + suiteId)
        DISPATCH removeSuite(suiteId)
        DISPATCH showToast({ type: SUCCESS, message: "Suite deleted" })
      } CATCH (error) {
        DISPATCH showToast({ type: ERROR, message: "Failed to delete suite" })
      }
    }
  }

  // Local State Updates
  normalizeSuites(suites_array) {
    FOR EACH suite IN suites_array {
      SET suites.items[suite.id] = suite
      ADD suite.id TO suites.allIds (if not exists)
    }
  }

  addSuite(suite) {
    SET suites.items[suite.id] = suite
    ADD suite.id TO suites.allIds
  }

  updateSuiteLocal(suiteId, updates) {
    MERGE updates INTO suites.items[suiteId]
    SET suites.items[suiteId].updatedAt = NOW()
  }

  removeSuite(suiteId) {
    DELETE suites.items[suiteId]
    REMOVE suiteId FROM suites.allIds

    // Cleanup related data
    IF suites.selectedSuiteId == suiteId {
      SET suites.selectedSuiteId = null
    }
  }

  // Filtering & Sorting
  setSuiteFilters(filters) {
    SET suites.filters = { ...suites.filters, ...filters }
  }

  clearSuiteFilters() {
    SET suites.filters = {
      status: null,
      floor: null,
      type: null,
      searchQuery: ""
    }
  }

  setSuiteSorting(sortBy, sortOrder) {
    SET suites.sortBy = sortBy
    SET suites.sortOrder = sortOrder
  }

  // Selection
  selectSuite(suiteId) {
    SET suites.selectedSuiteId = suiteId

    // Fetch related data if needed
    DISPATCH fetchTasksBySuite(suiteId)
    DISPATCH fetchNotesBySuite(suiteId)
  }

  deselectSuite() {
    SET suites.selectedSuiteId = null
  }

  // Business Logic
  handleSuiteStatusChange(suiteId, oldStatus, newStatus) {
    // When suite becomes vacant/dirty, create cleaning task
    IF newStatus == VACANT_DIRTY {
      DISPATCH createTask({
        type: CLEANING,
        title: "Clean Suite " + suites.items[suiteId].suiteNumber,
        suiteId: suiteId,
        priority: NORMAL
      })
    }

    // When suite goes out of order, notify maintenance
    IF newStatus == OUT_OF_ORDER {
      DISPATCH createNotification({
        type: SYSTEM_ALERT,
        message: "Suite " + suites.items[suiteId].suiteNumber + " is out of order",
        recipients: GET_EMPLOYEES_BY_ROLE(MAINTENANCE)
      })
    }
  }
}
```

### 2.2 Task Actions

```pseudo
ACTIONS Tasks {

  // Fetch Operations
  ASYNC fetchAllTasks(options = {}) {
    SET tasks.isLoading = true
    SET tasks.error = null

    TRY {
      tasks_data = AWAIT API.get("/tasks", options)

      DISPATCH normalizeTasks(tasks_data)
      DISPATCH updateTaskGroupings()
      SET tasks.lastFetched = NOW()

    } CATCH (error) {
      SET tasks.error = error.message
      DISPATCH showToast({ type: ERROR, message: "Failed to load tasks" })
    } FINALLY {
      SET tasks.isLoading = false
    }
  }

  ASYNC fetchTasksBySuite(suiteId) {
    TRY {
      tasks_data = AWAIT API.get("/tasks?suiteId=" + suiteId)
      DISPATCH normalizeTasks(tasks_data)
      DISPATCH updateTaskGroupings()
    } CATCH (error) {
      // Silent fail or show minimal error
    }
  }

  ASYNC fetchTasksByEmployee(employeeId) {
    TRY {
      tasks_data = AWAIT API.get("/tasks?assignedTo=" + employeeId)
      DISPATCH normalizeTasks(tasks_data)
      DISPATCH updateTaskGroupings()
    } CATCH (error) {
      // Silent fail
    }
  }

  // Create, Update, Delete
  ASYNC createTask(taskData) {
    TRY {
      // Validate required fields
      IF !taskData.title OR !taskData.type {
        THROW "Title and type are required"
      }

      new_task = AWAIT API.post("/tasks", taskData)
      DISPATCH addTask(new_task)
      DISPATCH updateTaskGroupings()

      // Notify assigned employee
      IF new_task.assignedTo {
        DISPATCH createNotification({
          recipientId: new_task.assignedTo,
          type: TASK_ASSIGNED,
          title: "New Task Assigned",
          message: new_task.title,
          relatedEntityId: new_task.id
        })
      }

      DISPATCH showToast({ type: SUCCESS, message: "Task created" })
      RETURN new_task

    } CATCH (error) {
      DISPATCH showToast({ type: ERROR, message: error.message })
      THROW error
    }
  }

  ASYNC updateTask(taskId, updates) {
    original_task = tasks.items[taskId]
    DISPATCH updateTaskLocal(taskId, updates)

    TRY {
      updated_task = AWAIT API.patch("/tasks/" + taskId, updates)
      DISPATCH updateTask(updated_task)
      DISPATCH updateTaskGroupings()

      // Handle status changes
      IF updates.status != original_task.status {
        DISPATCH handleTaskStatusChange(taskId, original_task.status, updates.status)
      }

      // Handle reassignment
      IF updates.assignedTo AND updates.assignedTo != original_task.assignedTo {
        DISPATCH handleTaskReassignment(taskId, original_task.assignedTo, updates.assignedTo)
      }

    } CATCH (error) {
      DISPATCH updateTaskLocal(taskId, original_task) // Rollback
      DISPATCH showToast({ type: ERROR, message: "Failed to update task" })
    }
  }

  ASYNC updateTaskStatus(taskId, newStatus) {
    task = tasks.items[taskId]
    timestamp = NOW()
    updates = { status: newStatus }

    // Add appropriate timestamps
    SWITCH newStatus {
      CASE IN_PROGRESS:
        IF !task.actualStart {
          updates.actualStart = timestamp
        }
        BREAK

      CASE COMPLETED:
        updates.actualEnd = timestamp
        updates.completedAt = timestamp

        // Calculate duration
        IF task.actualStart {
          updates.actualDuration = CALCULATE_MINUTES(task.actualStart, timestamp)
        }
        BREAK

      CASE PAUSED:
        // Could track pause time for analytics
        BREAK
    }

    AWAIT updateTask(taskId, updates)
  }

  ASYNC assignTask(taskId, employeeId) {
    AWAIT updateTask(taskId, {
      assignedTo: employeeId,
      status: ASSIGNED,
      assignedBy: auth.currentUser.id
    })
  }

  ASYNC startTask(taskId) {
    // Stop any currently active task
    IF tasks.activeTaskId {
      AWAIT pauseTask(tasks.activeTaskId)
    }

    AWAIT updateTaskStatus(taskId, IN_PROGRESS)

    SET tasks.activeTaskId = taskId
    SET tasks.activeTaskStartTime = NOW()

    DISPATCH showToast({ type: INFO, message: "Task started" })
  }

  ASYNC pauseTask(taskId) {
    AWAIT updateTaskStatus(taskId, PAUSED)

    IF tasks.activeTaskId == taskId {
      SET tasks.activeTaskId = null
      SET tasks.activeTaskStartTime = null
    }
  }

  ASYNC completeTask(taskId, completionNotes = "") {
    task = tasks.items[taskId]

    AWAIT updateTask(taskId, {
      status: COMPLETED,
      completionNotes: completionNotes,
      actualEnd: NOW(),
      completedAt: NOW()
    })

    // Clear active task
    IF tasks.activeTaskId == taskId {
      SET tasks.activeTaskId = null
      SET tasks.activeTaskStartTime = null
    }

    // Apply business rules
    DISPATCH applyTaskCompletionRules(task)

    DISPATCH showToast({ type: SUCCESS, message: "Task completed!" })
  }

  ASYNC deleteTask(taskId) {
    IF CONFIRM("Delete this task?") {
      TRY {
        AWAIT API.delete("/tasks/" + taskId)
        DISPATCH removeTask(taskId)
        DISPATCH updateTaskGroupings()
        DISPATCH showToast({ type: SUCCESS, message: "Task deleted" })
      } CATCH (error) {
        DISPATCH showToast({ type: ERROR, message: "Failed to delete task" })
      }
    }
  }

  // Local State Updates
  normalizeTasks(tasks_array) {
    FOR EACH task IN tasks_array {
      SET tasks.items[task.id] = task
      ADD task.id TO tasks.allIds (if not exists)
    }
  }

  addTask(task) {
    SET tasks.items[task.id] = task
    ADD task.id TO tasks.allIds
  }

  updateTaskLocal(taskId, updates) {
    MERGE updates INTO tasks.items[taskId]
    SET tasks.items[taskId].updatedAt = NOW()
  }

  removeTask(taskId) {
    DELETE tasks.items[taskId]
    REMOVE taskId FROM tasks.allIds

    IF tasks.selectedTaskId == taskId {
      SET tasks.selectedTaskId = null
    }
    IF tasks.activeTaskId == taskId {
      SET tasks.activeTaskId = null
      SET tasks.activeTaskStartTime = null
    }
  }

  // Grouping for performance
  updateTaskGroupings() {
    CLEAR tasks.bySuite
    CLEAR tasks.byEmployee
    CLEAR tasks.byStatus
    CLEAR tasks.byPriority

    FOR EACH taskId IN tasks.allIds {
      task = tasks.items[taskId]

      // Group by suite
      IF task.suiteId {
        APPEND taskId TO tasks.bySuite[task.suiteId]
      }

      // Group by employee
      IF task.assignedTo {
        APPEND taskId TO tasks.byEmployee[task.assignedTo]
      }

      // Group by status
      APPEND taskId TO tasks.byStatus[task.status]

      // Group by priority
      APPEND taskId TO tasks.byPriority[task.priority]
    }
  }

  // Business Logic
  handleTaskStatusChange(taskId, oldStatus, newStatus) {
    task = tasks.items[taskId]

    // When cleaning task is completed, update suite status
    IF newStatus == COMPLETED AND task.type == CLEANING {
      suite = suites.items[task.suiteId]

      IF suite.status == VACANT_DIRTY {
        DISPATCH updateSuiteStatus(task.suiteId, VACANT_CLEAN)
      } ELSE IF suite.status == OCCUPIED_DIRTY {
        DISPATCH updateSuiteStatus(task.suiteId, OCCUPIED_CLEAN)
      }

      DISPATCH updateSuite(task.suiteId, { lastCleaned: NOW() })
    }

    // When maintenance task is completed
    IF newStatus == COMPLETED AND task.type == MAINTENANCE {
      suite = suites.items[task.suiteId]

      IF suite.status == OUT_OF_ORDER {
        DISPATCH updateSuiteStatus(task.suiteId, VACANT_DIRTY)
      }
    }
  }

  handleTaskReassignment(taskId, oldEmployeeId, newEmployeeId) {
    task = tasks.items[taskId]

    // Notify new employee
    IF newEmployeeId {
      DISPATCH createNotification({
        recipientId: newEmployeeId,
        type: TASK_ASSIGNED,
        title: "Task Assigned to You",
        message: task.title,
        relatedEntityId: taskId
      })
    }

    // Update employee task counts
    DISPATCH updateTaskGroupings()
  }

  applyTaskCompletionRules(task) {
    // Implemented in handleTaskStatusChange above
    // Could also trigger recurring task creation, etc.
  }

  // Filtering
  setTaskFilters(filters) {
    SET tasks.filters = { ...tasks.filters, ...filters }
  }

  clearTaskFilters() {
    SET tasks.filters = {
      status: null,
      type: null,
      priority: null,
      assignedTo: null,
      suiteId: null,
      dateRange: null
    }
  }

  // View Management
  setTaskViewMode(viewMode) {
    SET tasks.viewMode = viewMode
  }

  selectTask(taskId) {
    SET tasks.selectedTaskId = taskId
  }
}
```

### 2.3 Employee Actions

```pseudo
ACTIONS Employees {

  // Fetch Operations
  ASYNC fetchAllEmployees() {
    SET employees.isLoading = true

    TRY {
      employees_data = AWAIT API.get("/employees")
      DISPATCH normalizeEmployees(employees_data)
      DISPATCH updateEmployeeGroupings()
      SET employees.lastFetched = NOW()
    } CATCH (error) {
      SET employees.error = error.message
    } FINALLY {
      SET employees.isLoading = false
    }
  }

  // CRUD Operations
  ASYNC createEmployee(employeeData) {
    TRY {
      new_employee = AWAIT API.post("/employees", employeeData)
      DISPATCH addEmployee(new_employee)
      DISPATCH updateEmployeeGroupings()
      DISPATCH showToast({ type: SUCCESS, message: "Employee created" })
      RETURN new_employee
    } CATCH (error) {
      DISPATCH showToast({ type: ERROR, message: error.message })
      THROW error
    }
  }

  ASYNC updateEmployee(employeeId, updates) {
    original = employees.items[employeeId]
    DISPATCH updateEmployeeLocal(employeeId, updates)

    TRY {
      updated = AWAIT API.patch("/employees/" + employeeId, updates)
      DISPATCH updateEmployee(updated)
      DISPATCH updateEmployeeGroupings()
    } CATCH (error) {
      DISPATCH updateEmployeeLocal(employeeId, original)
      DISPATCH showToast({ type: ERROR, message: "Failed to update employee" })
    }
  }

  // Clock In/Out
  ASYNC clockIn(employeeId) {
    AWAIT updateEmployee(employeeId, {
      isOnDuty: true,
      lastClockIn: NOW(),
      status: ACTIVE
    })

    DISPATCH showToast({ type: SUCCESS, message: "Clocked in successfully" })
  }

  ASYNC clockOut(employeeId) {
    employee = employees.items[employeeId]

    // Check for active tasks
    active_tasks = GET_TASKS_BY_EMPLOYEE(employeeId, [IN_PROGRESS])

    IF active_tasks.length > 0 {
      IF !CONFIRM("You have active tasks. Clock out anyway?") {
        RETURN
      }
    }

    AWAIT updateEmployee(employeeId, {
      isOnDuty: false,
      lastClockOut: NOW(),
      status: OFF_DUTY
    })

    DISPATCH showToast({ type: SUCCESS, message: "Clocked out successfully" })
  }

  // Local Updates
  normalizeEmployees(employees_array) {
    FOR EACH employee IN employees_array {
      SET employees.items[employee.id] = employee
      ADD employee.id TO employees.allIds (if not exists)
    }
  }

  addEmployee(employee) {
    SET employees.items[employee.id] = employee
    ADD employee.id TO employees.allIds
  }

  updateEmployeeLocal(employeeId, updates) {
    MERGE updates INTO employees.items[employeeId]
  }

  // Grouping
  updateEmployeeGroupings() {
    CLEAR employees.onDuty
    CLEAR employees.available
    CLEAR employees.byDepartment
    CLEAR employees.byRole

    FOR EACH employeeId IN employees.allIds {
      employee = employees.items[employeeId]

      IF employee.isOnDuty {
        ADD employeeId TO employees.onDuty

        // Check if available (no active tasks)
        active_tasks = tasks.byEmployee[employeeId] OR []
        has_active_task = false

        FOR EACH taskId IN active_tasks {
          IF tasks.items[taskId].status IN [ASSIGNED, IN_PROGRESS] {
            has_active_task = true
            BREAK
          }
        }

        IF !has_active_task {
          ADD employeeId TO employees.available
        }
      }

      // Group by department
      APPEND employeeId TO employees.byDepartment[employee.department]

      // Group by role
      APPEND employeeId TO employees.byRole[employee.role]
    }
  }

  // Filtering
  setEmployeeFilters(filters) {
    SET employees.filters = { ...employees.filters, ...filters }
  }
}
```

### 2.4 Note Actions

```pseudo
ACTIONS Notes {

  // Fetch Operations
  ASYNC fetchAllNotes(options = {}) {
    SET notes.isLoading = true

    TRY {
      notes_data = AWAIT API.get("/notes", options)
      DISPATCH normalizeNotes(notes_data)
      DISPATCH updateNoteGroupings()
      SET notes.lastFetched = NOW()
    } CATCH (error) {
      SET notes.error = error.message
    } FINALLY {
      SET notes.isLoading = false
    }
  }

  // CRUD Operations
  ASYNC createNote(noteData) {
    TRY {
      new_note = AWAIT API.post("/notes", {
        ...noteData,
        createdBy: auth.currentUser.id
      })

      DISPATCH addNote(new_note)
      DISPATCH updateNoteGroupings()
      DISPATCH showToast({ type: SUCCESS, message: "Note created" })

      RETURN new_note
    } CATCH (error) {
      DISPATCH showToast({ type: ERROR, message: "Failed to create note" })
      THROW error
    }
  }

  ASYNC updateNote(noteId, updates) {
    original = notes.items[noteId]
    DISPATCH updateNoteLocal(noteId, updates)

    TRY {
      updated = AWAIT API.patch("/notes/" + noteId, updates)
      DISPATCH updateNote(updated)
      DISPATCH updateNoteGroupings()
    } CATCH (error) {
      DISPATCH updateNoteLocal(noteId, original)
      DISPATCH showToast({ type: ERROR, message: "Failed to update note" })
    }
  }

  ASYNC deleteNote(noteId) {
    IF CONFIRM("Delete this note?") {
      TRY {
        AWAIT API.delete("/notes/" + noteId)
        DISPATCH removeNote(noteId)
        DISPATCH updateNoteGroupings()
      } CATCH (error) {
        DISPATCH showToast({ type: ERROR, message: "Failed to delete note" })
      }
    }
  }

  // Pin/Archive
  ASYNC togglePinNote(noteId) {
    note = notes.items[noteId]
    AWAIT updateNote(noteId, { pinned: !note.pinned })
  }

  ASYNC archiveNote(noteId) {
    AWAIT updateNote(noteId, { archived: true })
    DISPATCH showToast({ type: SUCCESS, message: "Note archived" })
  }

  // Comments
  ASYNC addComment(noteId, commentText) {
    note = notes.items[noteId]
    new_comment = {
      commentId: GENERATE_UUID(),
      commentBy: auth.currentUser.id,
      commentText: commentText,
      commentedAt: NOW()
    }

    updated_comments = [...note.comments, new_comment]
    AWAIT updateNote(noteId, { comments: updated_comments })
  }

  // Mark as Read
  ASYNC markNoteAsRead(noteId) {
    note = notes.items[noteId]

    // Check if already read by current user
    already_read = note.lastReadBy.find(r => r.employeeId == auth.currentUser.id)

    IF !already_read {
      updated_read_by = [
        ...note.lastReadBy,
        { employeeId: auth.currentUser.id, readAt: NOW() }
      ]

      // Update locally immediately
      DISPATCH updateNoteLocal(noteId, { lastReadBy: updated_read_by })

      // Update server in background
      API.patch("/notes/" + noteId, { lastReadBy: updated_read_by })
        .catch(() => {}) // Silent fail
    }
  }

  // Local Updates
  normalizeNotes(notes_array) {
    FOR EACH note IN notes_array {
      SET notes.items[note.id] = note
      ADD note.id TO notes.allIds (if not exists)
    }
  }

  addNote(note) {
    SET notes.items[note.id] = note
    ADD note.id TO notes.allIds
  }

  updateNoteLocal(noteId, updates) {
    MERGE updates INTO notes.items[noteId]
  }

  removeNote(noteId) {
    DELETE notes.items[noteId]
    REMOVE noteId FROM notes.allIds

    IF notes.selectedNoteId == noteId {
      SET notes.selectedNoteId = null
    }
  }

  // Grouping
  updateNoteGroupings() {
    CLEAR notes.bySuite
    CLEAR notes.byTask
    CLEAR notes.pinned

    FOR EACH noteId IN notes.allIds {
      note = notes.items[noteId]

      IF note.relatedSuite {
        APPEND noteId TO notes.bySuite[note.relatedSuite]
      }

      IF note.relatedTask {
        APPEND noteId TO notes.byTask[note.relatedTask]
      }

      IF note.pinned AND !note.archived {
        ADD noteId TO notes.pinned
      }
    }
  }
}
```

### 2.5 Authentication Actions

```pseudo
ACTIONS Auth {

  ASYNC login(username, password) {
    TRY {
      response = AWAIT API.post("/auth/login", { username, password })

      SET auth.currentUser = response.user
      SET auth.token = response.token
      SET auth.isAuthenticated = true
      SET auth.permissions = response.user.permissions
      SET auth.lastActivity = NOW()

      // Store token
      LOCAL_STORAGE.set("auth_token", response.token)

      // Fetch initial data
      DISPATCH fetchAllSuites()
      DISPATCH fetchAllTasks()
      DISPATCH fetchAllEmployees()
      DISPATCH fetchNotifications()

      DISPATCH showToast({ type: SUCCESS, message: "Welcome back!" })

    } CATCH (error) {
      DISPATCH showToast({ type: ERROR, message: "Login failed" })
      THROW error
    }
  }

  ASYNC logout() {
    TRY {
      AWAIT API.post("/auth/logout")
    } CATCH (error) {
      // Logout locally even if API fails
    } FINALLY {
      SET auth.currentUser = null
      SET auth.token = null
      SET auth.isAuthenticated = false
      SET auth.permissions = []

      LOCAL_STORAGE.remove("auth_token")

      // Clear all state
      DISPATCH clearAllData()

      NAVIGATE_TO("/login")
    }
  }

  ASYNC refreshToken() {
    TRY {
      response = AWAIT API.post("/auth/refresh")
      SET auth.token = response.token
      LOCAL_STORAGE.set("auth_token", response.token)
    } CATCH (error) {
      // Token refresh failed, logout
      DISPATCH logout()
    }
  }

  updateLastActivity() {
    SET auth.lastActivity = NOW()
  }

  checkPermission(permission) {
    RETURN auth.permissions.includes(permission) OR auth.permissions.includes("*")
  }
}
```

### 2.6 UI Actions

```pseudo
ACTIONS UI {

  setCurrentView(view) {
    SET ui.currentView = view
  }

  toggleSidebar() {
    SET ui.sidebarOpen = !ui.sidebarOpen
  }

  collapseSidebar(collapsed) {
    SET ui.sidebarCollapsed = collapsed
  }

  openModal(modalName, data = null) {
    SET ui.activeModal = modalName
    SET ui.modalData = data
  }

  closeModal() {
    SET ui.activeModal = null
    SET ui.modalData = null
  }

  showToast(toast) {
    toast_with_id = {
      id: GENERATE_UUID(),
      ...toast,
      duration: toast.duration OR 3000
    }

    ADD toast_with_id TO ui.toasts

    // Auto-remove after duration
    SCHEDULE_TIMEOUT(() => {
      DISPATCH removeToast(toast_with_id.id)
    }, toast_with_id.duration)
  }

  removeToast(toastId) {
    REMOVE toastId FROM ui.toasts
  }

  setTheme(theme) {
    SET ui.theme = theme
    LOCAL_STORAGE.set("theme", theme)
    APPLY_THEME_TO_DOM(theme)
  }

  updateLayoutPreference(key, value) {
    SET ui[key] = value
    LOCAL_STORAGE.set("layout_" + key, value)
  }
}
```

---

## 3. Selectors (Computed State)

```pseudo
SELECTORS {

  // Suites
  getFilteredSuites(state) {
    all_suites = state.suites.allIds.map(id => state.suites.items[id])
    filters = state.suites.filters

    filtered = all_suites

    IF filters.status {
      filtered = filtered.filter(s => filters.status.includes(s.status))
    }

    IF filters.floor {
      filtered = filtered.filter(s => filters.floor.includes(s.floor))
    }

    IF filters.type {
      filtered = filtered.filter(s => filters.type.includes(s.type))
    }

    IF filters.searchQuery {
      query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.suiteNumber.toLowerCase().includes(query) OR
        s.currentGuest.name?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered = SORT(filtered, state.suites.sortBy, state.suites.sortOrder)

    RETURN filtered
  }

  getSuitesByStatus(state, status) {
    RETURN state.suites.allIds
      .map(id => state.suites.items[id])
      .filter(s => s.status == status)
  }

  getVacantCleanSuites(state) {
    RETURN getSuitesByStatus(state, VACANT_CLEAN)
  }

  getSuitesNeedingCleaning(state) {
    RETURN state.suites.allIds
      .map(id => state.suites.items[id])
      .filter(s => s.status IN [VACANT_DIRTY, OCCUPIED_DIRTY])
  }

  // Tasks
  getFilteredTasks(state) {
    all_tasks = state.tasks.allIds.map(id => state.tasks.items[id])
    filters = state.tasks.filters

    filtered = all_tasks

    IF filters.status {
      filtered = filtered.filter(t => filters.status.includes(t.status))
    }

    IF filters.type {
      filtered = filtered.filter(t => filters.type.includes(t.type))
    }

    IF filters.priority {
      filtered = filtered.filter(t => filters.priority.includes(t.priority))
    }

    IF filters.assignedTo {
      filtered = filtered.filter(t => t.assignedTo == filters.assignedTo)
    }

    IF filters.suiteId {
      filtered = filtered.filter(t => t.suiteId == filters.suiteId)
    }

    IF filters.dateRange {
      filtered = filtered.filter(t =>
        t.scheduledStart >= filters.dateRange.start AND
        t.scheduledStart <= filters.dateRange.end
      )
    }

    RETURN filtered
  }

  getTasksBySuite(state, suiteId) {
    task_ids = state.tasks.bySuite[suiteId] OR []
    RETURN task_ids.map(id => state.tasks.items[id])
  }

  getTasksByEmployee(state, employeeId) {
    task_ids = state.tasks.byEmployee[employeeId] OR []
    RETURN task_ids.map(id => state.tasks.items[id])
  }

  getActiveTasksForCurrentUser(state) {
    IF !state.auth.currentUser {
      RETURN []
    }

    RETURN getTasksByEmployee(state, state.auth.currentUser.id)
      .filter(t => t.status IN [ASSIGNED, IN_PROGRESS])
  }

  getOverdueTasks(state) {
    now = NOW()
    RETURN state.tasks.allIds
      .map(id => state.tasks.items[id])
      .filter(t =>
        t.scheduledEnd < now AND
        t.status NOT IN [COMPLETED, CANCELLED, VERIFIED]
      )
  }

  // Employees
  getAvailableEmployees(state) {
    RETURN state.employees.available
      .map(id => state.employees.items[id])
  }

  getEmployeesByRole(state, role) {
    employee_ids = state.employees.byRole[role] OR []
    RETURN employee_ids.map(id => state.employees.items[id])
  }

  getOnDutyEmployees(state) {
    RETURN state.employees.onDuty
      .map(id => state.employees.items[id])
  }

  // Dashboard Stats
  getDashboardStats(state) {
    RETURN {
      totalSuites: state.suites.allIds.length,
      vacantClean: getSuitesByStatus(state, VACANT_CLEAN).length,
      needsCleaning: getSuitesNeedingCleaning(state).length,
      outOfOrder: getSuitesByStatus(state, OUT_OF_ORDER).length,
      occupancyRate: CALCULATE_OCCUPANCY(state),

      totalTasks: state.tasks.allIds.length,
      pendingTasks: state.tasks.byStatus[PENDING]?.length OR 0,
      inProgressTasks: state.tasks.byStatus[IN_PROGRESS]?.length OR 0,
      completedToday: CALCULATE_COMPLETED_TODAY(state),
      overdueTasks: getOverdueTasks(state).length,

      employeesOnDuty: state.employees.onDuty.length,
      availableEmployees: state.employees.available.length
    }
  }
}
```

---

## 4. Middleware & Side Effects

```pseudo
MIDDLEWARE {

  // Logging Middleware
  loggingMiddleware(action, state) {
    IF DEVELOPMENT_MODE {
      CONSOLE.log("Action:", action.type)
      CONSOLE.log("Payload:", action.payload)
      CONSOLE.log("State before:", state)
    }
  }

  // Auto-save Middleware
  autoSaveMiddleware(action, state) {
    // Save certain state to localStorage
    IF action.type IN ["UPDATE_UI_PREFERENCE", "SET_THEME"] {
      LOCAL_STORAGE.set("ui_state", state.ui)
    }
  }

  // Sync Middleware (for offline support)
  syncMiddleware(action, state) {
    IF !state.sync.isOnline {
      // Queue action for later sync
      IF action.type IN ["CREATE_TASK", "UPDATE_SUITE", "UPDATE_TASK"] {
        ADD {
          action: action,
          timestamp: NOW()
        } TO state.sync.pendingChanges

        LOCAL_STORAGE.set("pending_changes", state.sync.pendingChanges)
      }
    }
  }

  // Analytics Middleware
  analyticsMiddleware(action, state) {
    IF action.type IN ["COMPLETE_TASK", "CREATE_SUITE", "ASSIGN_TASK"] {
      SEND_ANALYTICS_EVENT(action.type, action.payload)
    }
  }

  // Permission Middleware
  permissionMiddleware(action, state) {
    required_permission = ACTION_PERMISSIONS[action.type]

    IF required_permission AND !checkPermission(state, required_permission) {
      THROW "Insufficient permissions"
      RETURN // Block action
    }
  }
}

ACTION_PERMISSIONS = {
  "CREATE_SUITE": "create_suite",
  "DELETE_SUITE": "delete_suite",
  "CREATE_EMPLOYEE": "manage_employees",
  "DELETE_EMPLOYEE": "manage_employees",
  "ASSIGN_TASK": "assign_tasks"
}
```

---

## 5. Real-time Updates & WebSocket Integration

```pseudo
WEBSOCKET_HANDLERS {

  onConnect() {
    CONSOLE.log("Connected to real-time updates")
    SET sync.isOnline = true

    // Sync any pending changes
    IF sync.pendingChanges.length > 0 {
      DISPATCH syncPendingChanges()
    }
  }

  onDisconnect() {
    CONSOLE.log("Disconnected from real-time updates")
    SET sync.isOnline = false

    DISPATCH showToast({
      type: WARNING,
      message: "Connection lost. Changes will sync when reconnected."
    })
  }

  onMessage(message) {
    SWITCH message.type {
      CASE "suite_updated":
        IF message.data.updatedBy != auth.currentUser.id {
          DISPATCH updateSuiteLocal(message.data.suiteId, message.data.updates)
        }
        BREAK

      CASE "task_updated":
        IF message.data.updatedBy != auth.currentUser.id {
          DISPATCH updateTaskLocal(message.data.taskId, message.data.updates)
          DISPATCH updateTaskGroupings()
        }
        BREAK

      CASE "task_assigned":
        IF message.data.assignedTo == auth.currentUser.id {
          DISPATCH fetchTaskById(message.data.taskId)
          DISPATCH createNotificationLocal(message.data.notification)
        }
        BREAK

      CASE "employee_status_changed":
        DISPATCH updateEmployeeLocal(message.data.employeeId, message.data.updates)
        DISPATCH updateEmployeeGroupings()
        BREAK

      CASE "new_note":
        // Only fetch if user has access
        IF checkNoteVisibility(message.data.noteId, auth.currentUser) {
          DISPATCH fetchNoteById(message.data.noteId)
        }
        BREAK

      CASE "emergency_task":
        // Always fetch and notify for emergency tasks
        DISPATCH fetchTaskById(message.data.taskId)
        DISPATCH showToast({
          type: ERROR,
          message: "EMERGENCY: " + message.data.title,
          duration: 10000
        })
        BREAK
    }
  }
}
```

This comprehensive state management pseudo-code provides a solid foundation for implementing the motel management app with proper data flow, business logic, and real-time capabilities.
