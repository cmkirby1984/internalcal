# UI Component Implementation Details

## Overview
This document provides detailed pseudo-code for interactive UI components with specific event handlers, validation logic, state management, and responsive design patterns.

---

## 1. Suite Grid and Calendar Views

### 1.1 Suite Grid View Component

```typescript
// components/suites/SuitesGridView.tsx
COMPONENT SuitesGridView {
  PROPS:
    - suites: Suite[]
    - onSuiteClick: (suiteId: string) => void
    - onStatusChange: (suiteId: string, newStatus: SuiteStatus) => void
    - onFilterChange: (filters: SuiteFilters) => void

  STATE (local):
    - viewMode: 'grid' | 'list' | 'floor_plan' = 'grid'
    - gridColumns: number = 3
    - selectedSuiteIds: Set<string> = new Set()
    - draggedSuiteId: string | null = null
    - filterPanelOpen: boolean = false
    - sortBy: 'suiteNumber' | 'status' | 'floor' = 'suiteNumber'
    - sortOrder: 'asc' | 'desc' = 'asc'

  STATE (from store):
    - filters: SuiteFilters
    - isLoading: boolean
    - isMobile: boolean
    - currentUser: Employee

  COMPUTED:
    - groupedByFloor: Map<number, Suite[]> = groupSuitesByFloor(suites)
    - selectedCount: number = selectedSuiteIds.size
    - hasPermissionToEdit: boolean = checkPermission('update_suite')

  // Event Handlers
  METHOD handleSuiteClick(suiteId: string, event: MouseEvent) {
    // Handle multi-select with Ctrl/Cmd key
    IF event.ctrlKey OR event.metaKey {
      IF selectedSuiteIds.has(suiteId) {
        selectedSuiteIds.delete(suiteId)
      } ELSE {
        selectedSuiteIds.add(suiteId)
      }
      triggerRerender()
    } ELSE {
      // Single selection
      selectedSuiteIds.clear()
      onSuiteClick(suiteId)
    }
  }

  METHOD handleSuiteDoubleClick(suiteId: string) {
    // Open suite details in modal
    dispatch(openModal('suite-details', { suiteId }))
  }

  METHOD handleSuiteRightClick(suiteId: string, event: MouseEvent) {
    event.preventDefault()

    // Show context menu
    showContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'View Details',
          icon: 'visibility',
          onClick: () => onSuiteClick(suiteId)
        },
        {
          label: 'Edit Suite',
          icon: 'edit',
          onClick: () => dispatch(openModal('edit-suite', { suiteId })),
          disabled: !hasPermissionToEdit
        },
        { type: 'divider' },
        {
          label: 'Change Status',
          icon: 'sync',
          submenu: getStatusChangeSubmenu(suiteId)
        },
        {
          label: 'Create Task',
          icon: 'add_task',
          onClick: () => dispatch(openModal('create-task', {
            initialData: { suiteId }
          }))
        },
        { type: 'divider' },
        {
          label: 'View Tasks',
          icon: 'task_alt',
          onClick: () => navigateToTasks({ suiteId })
        },
        {
          label: 'View History',
          icon: 'history',
          onClick: () => showSuiteHistory(suiteId)
        }
      ]
    })
  }

  METHOD handleStatusChange(suiteId: string, newStatus: SuiteStatus, event: Event) {
    event.stopPropagation()

    // Optimistic update
    suite = suites.find(s => s.id === suiteId)
    IF !suite RETURN

    // Validate status transition
    IF !isValidStatusTransition(suite.status, newStatus) {
      dispatch(showToast({
        type: 'error',
        message: `Cannot change from ${suite.status} to ${newStatus}`
      }))
      RETURN
    }

    // Show confirmation for certain transitions
    IF newStatus === 'OUT_OF_ORDER' {
      confirmed = AWAIT showConfirmDialog({
        title: 'Mark Suite Out of Order?',
        message: `Suite ${suite.suiteNumber} will be unavailable. Create maintenance task?`,
        confirmText: 'Yes, Create Task',
        cancelText: 'Just Mark Out of Order'
      })

      IF confirmed === 'confirm' {
        // Create maintenance task
        dispatch(openModal('create-task', {
          initialData: {
            suiteId,
            type: 'MAINTENANCE',
            priority: 'HIGH'
          }
        }))
      }
    }

    // Update status
    onStatusChange(suiteId, newStatus)
  }

  METHOD handleBulkStatusChange(newStatus: SuiteStatus) {
    IF selectedSuiteIds.size === 0 {
      dispatch(showToast({
        type: 'warning',
        message: 'Please select suites first'
      }))
      RETURN
    }

    confirmed = AWAIT showConfirmDialog({
      title: `Update ${selectedSuiteIds.size} Suites?`,
      message: `Change status to ${newStatus} for selected suites?`,
      confirmText: 'Update All'
    })

    IF confirmed {
      FOR EACH suiteId IN selectedSuiteIds {
        onStatusChange(suiteId, newStatus)
      }
      selectedSuiteIds.clear()
      triggerRerender()
    }
  }

  METHOD handleDragStart(suiteId: string, event: DragEvent) {
    SET draggedSuiteId = suiteId
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', suiteId)

    // Add visual feedback
    event.currentTarget.classList.add('dragging')
  }

  METHOD handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  METHOD handleDrop(targetStatus: SuiteStatus, event: DragEvent) {
    event.preventDefault()

    IF !draggedSuiteId RETURN

    suite = suites.find(s => s.id === draggedSuiteId)
    IF !suite RETURN

    // Validate and change status
    IF isValidStatusTransition(suite.status, targetStatus) {
      handleStatusChange(draggedSuiteId, targetStatus, event)
    } ELSE {
      dispatch(showToast({
        type: 'error',
        message: `Cannot move suite to ${targetStatus}`
      }))
    }

    SET draggedSuiteId = null
  }

  METHOD handleDragEnd(event: DragEvent) {
    event.currentTarget.classList.remove('dragging')
    SET draggedSuiteId = null
  }

  METHOD handleKeyboardNavigation(event: KeyboardEvent) {
    // Arrow key navigation
    IF event.key === 'ArrowRight' OR event.key === 'ArrowLeft' OR
       event.key === 'ArrowUp' OR event.key === 'ArrowDown' {

      currentIndex = findSelectedSuiteIndex()
      IF currentIndex === -1 RETURN

      newIndex = calculateNewIndex(currentIndex, event.key, gridColumns)
      IF newIndex >= 0 AND newIndex < suites.length {
        onSuiteClick(suites[newIndex].id)
        event.preventDefault()
      }
    }

    // Select all (Ctrl/Cmd + A)
    IF (event.ctrlKey OR event.metaKey) AND event.key === 'a' {
      event.preventDefault()
      selectedSuiteIds = new Set(suites.map(s => s.id))
      triggerRerender()
    }
  }

  // Lifecycle
  METHOD onMount() {
    savedColumns = localStorage.getItem('suites_grid_columns')
    IF savedColumns {
      SET gridColumns = parseInt(savedColumns)
    }
    document.addEventListener('keydown', handleKeyboardNavigation)
  }

  METHOD onUnmount() {
    document.removeEventListener('keydown', handleKeyboardNavigation)
  }
}
```

### 1.2 Suite Calendar View

```typescript
// components/suites/SuiteCalendarView.tsx
COMPONENT SuiteCalendarView {
  PROPS:
    - suites: Suite[]
    - tasks: Task[]
    - onDateClick: (date: Date, suiteId?: string) => void
    - onTaskClick: (taskId: string) => void

  STATE:
    - currentDate: Date = new Date()
    - viewType: 'month' | 'week' | 'day' = 'month'
    - selectedSuiteId: string | null = null

  COMPUTED:
    - calendarDays: Date[] = generateCalendarDays(currentDate, viewType)
    - tasksGroupedByDate: Map<string, Task[]> = groupTasksByDate(tasks)
    - checkInsCheckOuts: Map<string, { checkIns: Suite[], checkOuts: Suite[] }> =
        groupCheckInsCheckOuts(suites)

  METHODS:
    METHOD handlePreviousPeriod() {
      SWITCH viewType {
        CASE 'month': SET currentDate = subMonths(currentDate, 1); BREAK
        CASE 'week': SET currentDate = subWeeks(currentDate, 1); BREAK
        CASE 'day': SET currentDate = subDays(currentDate, 1); BREAK
      }
    }

    METHOD handleNextPeriod() {
      SWITCH viewType {
        CASE 'month': SET currentDate = addMonths(currentDate, 1); BREAK
        CASE 'week': SET currentDate = addWeeks(currentDate, 1); BREAK
        CASE 'day': SET currentDate = addDays(currentDate, 1); BREAK
      }
    }

    METHOD handleDateClick(date: Date) {
      onDateClick(date, selectedSuiteId)
    }
}
```

---

## 2. Task Creation and Editing Forms

### 2.1 Task Form with Complete Validation

```typescript
// components/tasks/TaskFormModal.tsx
COMPONENT TaskFormModal {
  PROPS:
    - isOpen: boolean
    - onClose: () => void
    - taskId?: string
    - initialData?: Partial<Task>

  STATE (local):
    - formData: TaskFormData
    - errors: Record<string, string> = {}
    - touched: Record<string, boolean> = {}
    - isSubmitting: boolean = false
    - isDirty: boolean = false
    - validationMode: 'onChange' | 'onBlur' | 'onSubmit' = 'onBlur'

  // Validation Rules
  VALIDATION_RULES = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 255
    },
    type: {
      required: true,
      enum: TaskType
    },
    suiteId: {
      requiredIf: (data) => data.type IN ['CLEANING', 'MAINTENANCE', 'INSPECTION']
    },
    scheduledStart: {
      validate: (value) => value && new Date(value) < new Date()
        ? 'Cannot be in the past'
        : null
    },
    scheduledEnd: {
      validate: (value, data) =>
        value && data.scheduledStart && new Date(value) <= new Date(data.scheduledStart)
          ? 'Must be after start time'
          : null
    },
    assignedTo: {
      validate: (value) => {
        IF value {
          employee = employees.find(e => e.id === value)
          IF !employee RETURN 'Invalid employee'
          IF !employee.isOnDuty RETURN 'Employee not on duty'

          activeTasks = getTasksByEmployee(value).filter(t =>
            t.status IN ['ASSIGNED', 'IN_PROGRESS']
          )
          IF activeTasks.length >= 5 {
            RETURN `${employee.firstName} has ${activeTasks.length} active tasks`
          }
        }
        RETURN null
      }
    },
    estimatedDuration: {
      required: true,
      min: 5,
      max: 480
    }
  }

  // Field Validation
  METHOD validateField(fieldName: string, value: any): string | null {
    rule = VALIDATION_RULES[fieldName]
    IF !rule RETURN null

    IF rule.required && !value {
      RETURN `${fieldName} is required`
    }

    IF rule.minLength && typeof value === 'string' && value.length < rule.minLength {
      RETURN `Must be at least ${rule.minLength} characters`
    }

    IF rule.maxLength && typeof value === 'string' && value.length > rule.maxLength {
      RETURN `Must be at most ${rule.maxLength} characters`
    }

    IF rule.min && typeof value === 'number' && value < rule.min {
      RETURN `Must be at least ${rule.min}`
    }

    IF rule.max && typeof value === 'number' && value > rule.max {
      RETURN `Must be at most ${rule.max}`
    }

    IF rule.validate {
      error = rule.validate(value, formData)
      IF error RETURN error
    }

    RETURN null
  }

  // Form Validation
  METHOD validateForm(): boolean {
    newErrors = {}
    FOR EACH fieldName IN Object.keys(VALIDATION_RULES) {
      error = validateField(fieldName, formData[fieldName])
      IF error {
        newErrors[fieldName] = error
      }
    }
    SET errors = newErrors
    RETURN Object.keys(newErrors).length === 0
  }

  // Event Handlers
  METHOD handleFieldChange(fieldName: string, value: any) {
    SET formData = { ...formData, [fieldName]: value }
    SET isDirty = true
    SET touched = { ...touched, [fieldName]: true }

    IF validationMode === 'onChange' {
      error = validateField(fieldName, value)
      IF error {
        SET errors = { ...errors, [fieldName]: error }
      } ELSE {
        newErrors = { ...errors }
        DELETE newErrors[fieldName]
        SET errors = newErrors
      }
    }

    handleFieldSideEffects(fieldName, value)
  }

  METHOD handleFieldBlur(fieldName: string) {
    SET touched = { ...touched, [fieldName]: true }

    IF validationMode IN ['onBlur', 'onChange'] {
      error = validateField(fieldName, formData[fieldName])
      IF error {
        SET errors = { ...errors, [fieldName]: error }
      } ELSE {
        newErrors = { ...errors }
        DELETE newErrors[fieldName]
        SET errors = newErrors
      }
    }
  }

  METHOD handleFieldSideEffects(fieldName: string, value: any) {
    SWITCH fieldName {
      CASE 'type':
        IF value === 'EMERGENCY' {
          SET formData.priority = 'EMERGENCY'
        }
        IF value NOT IN ['CLEANING', 'MAINTENANCE', 'INSPECTION'] {
          SET formData.suiteId = ''
        }
        SET formData.customFields = getDefaultCustomFields(value)
        BREAK

      CASE 'suiteId':
        IF formData.type === 'CLEANING' && value {
          suite = suites.find(s => s.id === value)
          IF suite {
            SET formData.title = `Clean Suite ${suite.suiteNumber}`
          }
        }
        IF value {
          suite = suites.find(s => s.id === value)
          IF suite {
            SET formData.estimatedDuration = getEstimatedDuration(formData.type, suite.type)
          }
        }
        BREAK

      CASE 'scheduledStart':
        IF value && formData.estimatedDuration {
          endTime = addMinutes(new Date(value), formData.estimatedDuration)
          SET formData.scheduledEnd = endTime.toISOString()
        }
        BREAK

      CASE 'estimatedDuration':
        IF formData.scheduledStart && value {
          endTime = addMinutes(new Date(formData.scheduledStart), value)
          SET formData.scheduledEnd = endTime.toISOString()
        }
        BREAK

      CASE 'assignedTo':
        IF value {
          employee = employees.find(e => e.id === value)
          IF employee {
            activeTasks = getTasksByEmployee(value).filter(t =>
              t.status IN ['ASSIGNED', 'IN_PROGRESS']
            )
            IF activeTasks.length >= 3 {
              dispatch(showToast({
                type: 'warning',
                message: `${employee.firstName} currently has ${activeTasks.length} active tasks`,
                duration: 5000
              }))
            }
          }
        }
        BREAK
    }
  }

  METHOD handleSubmit(event: FormEvent) {
    event.preventDefault()

    IF !validateForm() {
      SET validationMode = 'onChange'
      allFieldsTouched = {}
      FOR EACH key IN Object.keys(formData) {
        allFieldsTouched[key] = true
      }
      SET touched = allFieldsTouched

      dispatch(showToast({
        type: 'error',
        message: 'Please fix validation errors'
      }))
      RETURN
    }

    SET isSubmitting = true

    TRY {
      IF isEditMode {
        AWAIT dispatch(updateTask({
          taskId: taskId,
          updates: formData
        })).unwrap()
        dispatch(showToast({ type: 'success', message: 'Task updated' }))
      } ELSE {
        AWAIT dispatch(createTask(formData)).unwrap()
        dispatch(showToast({ type: 'success', message: 'Task created' }))

        IF AWAIT showConfirmDialog({
          title: 'Task Created',
          message: 'Create another task?',
          confirmText: 'Yes',
          cancelText: 'No'
        }) {
          resetForm()
          RETURN
        }
      }
      onClose()
    } CATCH (error) {
      dispatch(showToast({ type: 'error', message: error.message }))
      SET errors = { ...errors, submit: error.message }
    } FINALLY {
      SET isSubmitting = false
    }
  }

  METHOD handleCancel() {
    IF isDirty {
      confirmed = AWAIT showConfirmDialog({
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Continue?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        variant: 'warning'
      })
      IF !confirmed RETURN
    }
    onClose()
  }

  METHOD handleQuickFill(template: string) {
    SWITCH template {
      CASE 'standard_cleaning':
        SET formData = {
          ...formData,
          type: 'CLEANING',
          priority: 'NORMAL',
          estimatedDuration: 30,
          customFields: { linensChanged: true, deepClean: false }
        }
        BREAK
      CASE 'deep_cleaning':
        SET formData = {
          ...formData,
          type: 'DEEP_CLEAN',
          priority: 'NORMAL',
          estimatedDuration: 90,
          customFields: { linensChanged: true, deepClean: true }
        }
        BREAK
    }
    SET isDirty = true
  }
}
```

---

## 3. Employee Assignment and Filters

### 3.1 Employee Assignment Dropdown

```typescript
// components/employees/EmployeeAssignmentDropdown.tsx
COMPONENT EmployeeAssignmentDropdown {
  PROPS:
    - value: string | null
    - onChange: (employeeId: string | null) => void
    - taskType?: TaskType
    - excludeEmployeeIds?: string[]
    - showWorkload?: boolean = true

  STATE (from store):
    - employees: Employee[]
    - tasks: Task[]

  STATE (local):
    - isOpen: boolean = false
    - searchQuery: string = ''
    - filterRole: EmployeeRole | null = null
    - filterDepartment: Department | null = null
    - sortBy: 'name' | 'workload' | 'rating' = 'workload'

  COMPUTED:
    - availableEmployees: Employee[] = employees.filter(emp => {
        // Must be on duty
        IF !emp.isOnDuty RETURN false

        // Exclude specified employees
        IF excludeEmployeeIds && excludeEmployeeIds.includes(emp.id) RETURN false

        // Filter by role if appropriate for task type
        IF taskType === 'CLEANING' && emp.role !== 'HOUSEKEEPER' RETURN false
        IF taskType === 'MAINTENANCE' && emp.role !== 'MAINTENANCE' RETURN false

        // Apply filters
        IF filterRole && emp.role !== filterRole RETURN false
        IF filterDepartment && emp.department !== filterDepartment RETURN false

        // Search
        IF searchQuery {
          query = searchQuery.toLowerCase()
          fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
          IF !fullName.includes(query) RETURN false
        }

        RETURN true
      })

    - sortedEmployees: Employee[] = [...availableEmployees].sort((a, b) => {
        SWITCH sortBy {
          CASE 'name':
            RETURN `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)

          CASE 'workload':
            aWorkload = getEmployeeWorkload(a.id)
            bWorkload = getEmployeeWorkload(b.id)
            RETURN aWorkload - bWorkload

          CASE 'rating':
            RETURN (b.performanceRating || 0) - (a.performanceRating || 0)

          DEFAULT:
            RETURN 0
        }
      })

    - selectedEmployee: Employee | null = value ? employees.find(e => e.id === value) : null

  METHODS:
    METHOD getEmployeeWorkload(employeeId: string): number {
      activeTasks = tasks.filter(t =>
        t.assignedTo === employeeId &&
        t.status IN ['ASSIGNED', 'IN_PROGRESS']
      )
      RETURN activeTasks.length
    }

    METHOD getWorkloadColor(workload: number): string {
      IF workload === 0 RETURN 'green'
      IF workload <= 2 RETURN 'blue'
      IF workload <= 4 RETURN 'orange'
      RETURN 'red'
    }

    METHOD handleSelect(employeeId: string) {
      onChange(employeeId)
      SET isOpen = false
      SET searchQuery = ''
    }

    METHOD handleClear() {
      onChange(null)
      SET isOpen = false
      SET searchQuery = ''
    }

    METHOD handleKeyDown(event: KeyboardEvent) {
      IF event.key === 'Escape' {
        SET isOpen = false
        SET searchQuery = ''
      }

      IF event.key === 'ArrowDown' {
        event.preventDefault()
        // Move focus to next employee
      }

      IF event.key === 'ArrowUp' {
        event.preventDefault()
        // Move focus to previous employee
      }

      IF event.key === 'Enter' {
        // Select focused employee
      }
    }

  RENDER:
    <Dropdown
      isOpen={isOpen}
      onToggle={() => SET isOpen = !isOpen}
      trigger={
        <Button variant="outline" className="employee-assignment-trigger">
          {selectedEmployee ? (
            <>
              <Avatar src={selectedEmployee.avatarUrl} size="small" />
              <span>{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
              {showWorkload && (
                <Badge color={getWorkloadColor(getEmployeeWorkload(selectedEmployee.id))}>
                  {getEmployeeWorkload(selectedEmployee.id)} tasks
                </Badge>
              )}
              <Icon name="expand_more" />
            </>
          ) : (
            <>
              <Icon name="person_add" />
              <span>Assign Employee</span>
              <Icon name="expand_more" />
            </>
          )}
        </Button>
      }
    >
      <div className="employee-dropdown-content">
        {/* Search */}
        <div className="dropdown-search">
          <Input
            value={searchQuery}
            onChange={(value) => SET searchQuery = value}
            onKeyDown={handleKeyDown}
            placeholder="Search employees..."
            icon="search"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="dropdown-filters">
          <Select
            value={filterRole || 'all'}
            onChange={(value) => SET filterRole = value === 'all' ? null : value}
            options={[
              { value: 'all', label: 'All Roles' },
              ...Object.values(EmployeeRole).map(role => ({
                value: role,
                label: role
              }))
            ]}
            size="small"
          />

          <Select
            value={sortBy}
            onChange={(value) => SET sortBy = value}
            options={[
              { value: 'workload', label: 'Sort by Workload' },
              { value: 'name', label: 'Sort by Name' },
              { value: 'rating', label: 'Sort by Rating' }
            ]}
            size="small"
          />
        </div>

        {/* Employee List */}
        <div className="employee-list">
          {sortedEmployees.length === 0 ? (
            <div className="empty-state">
              <Icon name="person_off" />
              <span>No employees available</span>
            </div>
          ) : (
            sortedEmployees.map(employee => {
              workload = getEmployeeWorkload(employee.id)

              RETURN (
                <div
                  key={employee.id}
                  className={`employee-item ${value === employee.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(employee.id)}
                >
                  <Avatar src={employee.avatarUrl} size="medium" />

                  <div className="employee-info">
                    <div className="employee-name">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="employee-meta">
                      <span className="role">{employee.role}</span>
                      {employee.performanceRating && (
                        <span className="rating">
                          <Icon name="star" size="tiny" />
                          {employee.performanceRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {showWorkload && (
                    <Badge color={getWorkloadColor(workload)}>
                      {workload} {workload === 1 ? 'task' : 'tasks'}
                    </Badge>
                  )}

                  {value === employee.id && (
                    <Icon name="check_circle" color="green" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Actions */}
        <div className="dropdown-actions">
          {value && (
            <Button
              variant="ghost"
              size="small"
              onClick={handleClear}
            >
              Clear Assignment
            </Button>
          )}

          <Button
            variant="ghost"
            size="small"
            onClick={() => SET isOpen = false}
          >
            Close
          </Button>
        </div>
      </div>
    </Dropdown>
}
```

### 3.2 Employee Filter Panel

```typescript
// components/employees/EmployeeFilterPanel.tsx
COMPONENT EmployeeFilterPanel {
  PROPS:
    - filters: EmployeeFilters
    - onFilterChange: (filters: EmployeeFilters) => void
    - onClear: () => void

  STATE (local):
    - localFilters: EmployeeFilters = filters
    - expandedSections: Set<string> = new Set(['status', 'role'])

  METHODS:
    METHOD handleFilterChange(key: string, value: any) {
      newFilters = { ...localFilters, [key]: value }
      SET localFilters = newFilters
      onFilterChange(newFilters)
    }

    METHOD handleArrayFilterToggle(key: string, value: any) {
      currentArray = localFilters[key] || []
      newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]

      handleFilterChange(key, newArray.length > 0 ? newArray : null)
    }

    METHOD toggleSection(section: string) {
      IF expandedSections.has(section) {
        expandedSections.delete(section)
      } ELSE {
        expandedSections.add(section)
      }
      triggerRerender()
    }

    METHOD handleClear() {
      SET localFilters = {}
      onClear()
    }

  COMPUTED:
    - activeFilterCount: number = Object.values(localFilters).filter(Boolean).length

  RENDER:
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>Filters</h3>
        {activeFilterCount > 0 && (
          <Badge color="blue">{activeFilterCount}</Badge>
        )}
        <Button
          variant="ghost"
          size="small"
          onClick={handleClear}
          disabled={activeFilterCount === 0}
        >
          Clear All
        </Button>
      </div>

      {/* Status Filter */}
      <FilterSection
        title="Status"
        isExpanded={expandedSections.has('status')}
        onToggle={() => toggleSection('status')}
      >
        <CheckboxGroup>
          {Object.values(EmployeeStatus).map(status => (
            <Checkbox
              key={status}
              checked={localFilters.status?.includes(status) || false}
              onChange={() => handleArrayFilterToggle('status', status)}
              label={status.replace('_', ' ')}
            />
          ))}
        </CheckboxGroup>
      </FilterSection>

      {/* Role Filter */}
      <FilterSection
        title="Role"
        isExpanded={expandedSections.has('role')}
        onToggle={() => toggleSection('role')}
      >
        <CheckboxGroup>
          {Object.values(EmployeeRole).map(role => (
            <Checkbox
              key={role}
              checked={localFilters.role?.includes(role) || false}
              onChange={() => handleArrayFilterToggle('role', role)}
              label={role}
            />
          ))}
        </CheckboxGroup>
      </FilterSection>

      {/* Department Filter */}
      <FilterSection
        title="Department"
        isExpanded={expandedSections.has('department')}
        onToggle={() => toggleSection('department')}
      >
        <CheckboxGroup>
          {Object.values(Department).map(dept => (
            <Checkbox
              key={dept}
              checked={localFilters.department?.includes(dept) || false}
              onChange={() => handleArrayFilterToggle('department', dept)}
              label={dept}
            />
          ))}
        </CheckboxGroup>
      </FilterSection>

      {/* On Duty Filter */}
      <FilterSection
        title="On Duty"
        isExpanded={expandedSections.has('onDuty')}
        onToggle={() => toggleSection('onDuty')}
      >
        <RadioGroup
          value={localFilters.isOnDuty === undefined ? 'all' : localFilters.isOnDuty.toString()}
          onChange={(value) => {
            IF value === 'all' {
              handleFilterChange('isOnDuty', undefined)
            } ELSE {
              handleFilterChange('isOnDuty', value === 'true')
            }
          }}
          options={[
            { value: 'all', label: 'All' },
            { value: 'true', label: 'On Duty Only' },
            { value: 'false', label: 'Off Duty Only' }
          ]}
        />
      </FilterSection>
    </div>
}
```

---

## 4. Dashboard Views

### 4.1 Manager Dashboard

```typescript
// components/dashboards/ManagerDashboard.tsx
COMPONENT ManagerDashboard {
  STATE (from store):
    - suites: Suite[]
    - tasks: Task[]
    - employees: Employee[]
    - metrics: DashboardMetrics

  STATE (local):
    - selectedDateRange: DateRange = { start: startOfDay(new Date()), end: endOfDay(new Date()) }
    - selectedFloor: number | null = null
    - refreshInterval: number = 30000 // 30 seconds
    - autoRefresh: boolean = true

  COMPUTED:
    - occupancyRate: number = calculateOccupancyRate(suites)
    - todaysTasks: Task[] = tasks.filter(t => isToday(t.scheduledStart))
    - pendingTasks: Task[] = todaysTasks.filter(t => t.status === 'PENDING')
    - activeTasks: Task[] = todaysTasks.filter(t => t.status === 'IN_PROGRESS')
    - completedTasks: Task[] = todaysTasks.filter(t => t.status === 'COMPLETED')
    - overdueTime: Task[] = tasks.filter(t =>
        t.status !== 'COMPLETED' &&
        t.scheduledEnd &&
        new Date(t.scheduledEnd) < new Date()
      )
    - employeesOnDuty: Employee[] = employees.filter(e => e.isOnDuty)
    - suitesByStatus: Map<SuiteStatus, number> = groupBy(suites, 'status').mapValues(arr => arr.length)

  METHODS:
    METHOD handleRefresh() {
      dispatch(fetchDashboardData({
        dateRange: selectedDateRange,
        floor: selectedFloor
      }))
    }

    METHOD handleDateRangeChange(range: DateRange) {
      SET selectedDateRange = range
      handleRefresh()
    }

    METHOD handleFloorFilter(floor: number | null) {
      SET selectedFloor = floor
      handleRefresh()
    }

    METHOD handleTaskClick(taskId: string) {
      dispatch(openModal('task-details', { taskId }))
    }

    METHOD handleSuiteClick(suiteId: string) {
      dispatch(openModal('suite-details', { suiteId }))
    }

    METHOD handleEmployeeClick(employeeId: string) {
      dispatch(openModal('employee-details', { employeeId }))
    }

  // Lifecycle - Auto-refresh
  METHOD onMount() {
    handleRefresh()

    IF autoRefresh {
      intervalId = setInterval(() => {
        IF !document.hidden {
          handleRefresh()
        }
      }, refreshInterval)

      storeIntervalId(intervalId)
    }
  }

  METHOD onUnmount() {
    IF intervalId {
      clearInterval(intervalId)
    }
  }

  RENDER:
    <div className="manager-dashboard">
      {/* Header with filters */}
      <DashboardHeader>
        <h1>Manager Dashboard</h1>
        <div className="dashboard-controls">
          <DateRangePicker
            value={selectedDateRange}
            onChange={handleDateRangeChange}
            presets={[
              { label: 'Today', range: getTodayRange() },
              { label: 'This Week', range: getThisWeekRange() },
              { label: 'This Month', range: getThisMonthRange() }
            ]}
          />

          <FloorFilter
            value={selectedFloor}
            onChange={handleFloorFilter}
            floors={getUniqueFloors(suites)}
          />

          <Button
            variant="ghost"
            icon="refresh"
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </DashboardHeader>

      {/* Key Metrics Row */}
      <div className="metrics-row">
        <MetricCard
          title="Occupancy Rate"
          value={`${occupancyRate.toFixed(1)}%`}
          trend={metrics.occupancyTrend}
          icon="hotel"
          color="blue"
          onClick={() => navigateTo('/suites?filter=occupied')}
        />

        <MetricCard
          title="Active Tasks"
          value={activeTasks.length}
          subtitle={`${pendingTasks.length} pending`}
          icon="task_alt"
          color="green"
          onClick={() => navigateTo('/tasks?status=in_progress')}
        />

        <MetricCard
          title="Completed Today"
          value={completedTasks.length}
          subtitle={`${((completedTasks.length / todaysTasks.length) * 100).toFixed(0)}% completion`}
          icon="check_circle"
          color="purple"
          onClick={() => navigateTo('/tasks?status=completed')}
        />

        <MetricCard
          title="Overdue"
          value={overdueTasks.length}
          icon="schedule"
          color={overdueTasks.length > 0 ? 'red' : 'gray'}
          alert={overdueTasks.length > 0}
          onClick={() => navigateTo('/tasks?filter=overdue')}
        />

        <MetricCard
          title="Staff On Duty"
          value={employeesOnDuty.length}
          subtitle={`${employees.length} total`}
          icon="people"
          color="orange"
          onClick={() => navigateTo('/employees?filter=onDuty')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Suite Status Overview */}
        <DashboardCard title="Suite Status" span={2}>
          <SuiteStatusChart
            data={suitesByStatus}
            onStatusClick={(status) => navigateTo(`/suites?status=${status}`)}
          />

          <div className="suite-status-list">
            {Object.entries(suitesByStatus).map(([status, count]) => (
              <div
                key={status}
                className="status-item"
                onClick={() => navigateTo(`/suites?status=${status}`)}
              >
                <StatusBadge status={status} />
                <span className="count">{count}</span>
                <Icon name="chevron_right" />
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Task Timeline */}
        <DashboardCard title="Today's Tasks" span={2}>
          <div className="task-timeline">
            {todaysTasks.length === 0 ? (
              <EmptyState
                icon="task_alt"
                message="No tasks scheduled for today"
                action={
                  <Button
                    variant="primary"
                    onClick={() => dispatch(openModal('create-task'))}
                  >
                    Create Task
                  </Button>
                }
              />
            ) : (
              <Timeline>
                {todaysTasks
                  .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
                  .map(task => (
                    <TimelineItem
                      key={task.id}
                      time={format(new Date(task.scheduledStart), 'HH:mm')}
                      status={task.status}
                      isOverdue={
                        task.scheduledEnd &&
                        new Date(task.scheduledEnd) < new Date() &&
                        task.status !== 'COMPLETED'
                      }
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div className="task-item">
                        <TaskStatusIcon status={task.status} />
                        <div className="task-info">
                          <div className="task-title">{task.title}</div>
                          <div className="task-meta">
                            {task.suite && (
                              <span className="suite-number">
                                Suite {task.suite.suiteNumber}
                              </span>
                            )}
                            {task.assignedTo && (
                              <span className="assignee">
                                <Avatar
                                  src={task.assignedToEmployee?.avatarUrl}
                                  size="tiny"
                                />
                                {task.assignedToEmployee?.firstName}
                              </span>
                            )}
                          </div>
                        </div>
                        <TaskPriorityBadge priority={task.priority} />
                      </div>
                    </TimelineItem>
                  ))
                }
              </Timeline>
            )}
          </div>
        </DashboardCard>

        {/* Employee Performance */}
        <DashboardCard title="Employee Performance">
          <div className="employee-performance-list">
            {employeesOnDuty
              .sort((a, b) => (b.performanceRating || 0) - (a.performanceRating || 0))
              .slice(0, 5)
              .map(employee => {
                employeeTasks = tasks.filter(t => t.assignedTo === employee.id)
                completedCount = employeeTasks.filter(t => t.status === 'COMPLETED').length

                RETURN (
                  <div
                    key={employee.id}
                    className="employee-item"
                    onClick={() => handleEmployeeClick(employee.id)}
                  >
                    <Avatar src={employee.avatarUrl} size="medium" />
                    <div className="employee-info">
                      <div className="name">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="stats">
                        <span>{completedCount} completed</span>
                        {employee.performanceRating && (
                          <span className="rating">
                            <Icon name="star" size="tiny" />
                            {employee.performanceRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="chevron_right" />
                  </div>
                )
              })
            }
          </div>
        </DashboardCard>

        {/* Recent Activity */}
        <DashboardCard title="Recent Activity">
          <ActivityFeed
            activities={metrics.recentActivities}
            onActivityClick={(activity) => {
              IF activity.type === 'task_completed' {
                handleTaskClick(activity.taskId)
              } ELSE IF activity.type === 'suite_status_changed' {
                handleSuiteClick(activity.suiteId)
              }
            }}
            maxItems={10}
          />
        </DashboardCard>
      </div>

      {/* Alerts Section */}
      {(overdueTasks.length > 0 || metrics.alerts.length > 0) && (
        <DashboardCard title="Alerts & Notifications" variant="alert">
          <div className="alerts-list">
            {overdueTasks.map(task => (
              <Alert
                key={task.id}
                type="error"
                icon="schedule"
                onClick={() => handleTaskClick(task.id)}
              >
                <strong>{task.title}</strong> is overdue
                {task.assignedToEmployee && (
                  <> - Assigned to {task.assignedToEmployee.firstName}</>
                )}
              </Alert>
            ))}

            {metrics.alerts.map(alert => (
              <Alert
                key={alert.id}
                type={alert.severity}
                icon={alert.icon}
                onClick={alert.onClick}
              >
                {alert.message}
              </Alert>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
}
```

### 4.2 Employee Dashboard

```typescript
// components/dashboards/EmployeeDashboard.tsx
COMPONENT EmployeeDashboard {
  STATE (from store):
    - currentUser: Employee
    - myTasks: Task[]
    - notifications: Notification[]

  STATE (local):
    - activeTaskId: string | null = null
    - showCompleted: boolean = false
    - sortBy: 'scheduledStart' | 'priority' | 'suite' = 'scheduledStart'

  COMPUTED:
    - todaysTasks: Task[] = myTasks.filter(t =>
        isToday(t.scheduledStart) ||
        (t.status === 'IN_PROGRESS' && !t.scheduledStart)
      )
    - pendingTasks: Task[] = todaysTasks.filter(t => t.status === 'PENDING')
    - inProgressTasks: Task[] = todaysTasks.filter(t => t.status === 'IN_PROGRESS')
    - completedToday: Task[] = myTasks.filter(t =>
        t.status === 'COMPLETED' &&
        isToday(t.completedAt)
      )
    - upcomingTasks: Task[] = myTasks.filter(t =>
        t.status === 'PENDING' &&
        t.scheduledStart &&
        isFuture(new Date(t.scheduledStart)) &&
        !isToday(t.scheduledStart)
      ).slice(0, 5)
    - currentTask: Task | null = activeTaskId ? myTasks.find(t => t.id === activeTaskId) : null
    - unreadNotifications: Notification[] = notifications.filter(n => !n.isRead)

  METHODS:
    METHOD handleStartTask(taskId: string) {
      TRY {
        AWAIT dispatch(updateTaskStatus({
          taskId,
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString()
        })).unwrap()

        SET activeTaskId = taskId

        dispatch(showToast({
          type: 'success',
          message: 'Task started'
        }))
      } CATCH (error) {
        dispatch(showToast({
          type: 'error',
          message: error.message
        }))
      }
    }

    METHOD handlePauseTask(taskId: string) {
      confirmed = AWAIT showConfirmDialog({
        title: 'Pause Task?',
        message: 'Do you need to pause this task?',
        confirmText: 'Pause'
      })

      IF confirmed {
        AWAIT dispatch(updateTaskStatus({
          taskId,
          status: 'ASSIGNED'
        })).unwrap()

        SET activeTaskId = null
      }
    }

    METHOD handleCompleteTask(taskId: string) {
      dispatch(openModal('complete-task', {
        taskId,
        onComplete: async (completionData) => {
          AWAIT dispatch(completeTask({
            taskId,
            ...completionData,
            completedAt: new Date().toISOString()
          })).unwrap()

          SET activeTaskId = null

          dispatch(showToast({
            type: 'success',
            message: 'Task completed successfully!',
            action: {
              label: 'View Next',
              onClick: () => {
                IF pendingTasks.length > 0 {
                  handleStartTask(pendingTasks[0].id)
                }
              }
            }
          }))
        }
      }))
    }

    METHOD handleTaskClick(taskId: string) {
      dispatch(openModal('task-details', { taskId }))
    }

    METHOD handleNotificationClick(notification: Notification) {
      dispatch(markNotificationAsRead(notification.id))

      IF notification.actionUrl {
        navigateTo(notification.actionUrl)
      }
    }

    METHOD handleCheckIn() {
      dispatch(openModal('check-in', {
        employeeId: currentUser.id
      }))
    }

    METHOD handleCheckOut() {
      dispatch(openModal('check-out', {
        employeeId: currentUser.id
      }))
    }

  // Lifecycle
  METHOD onMount() {
    dispatch(fetchMyTasks())
    dispatch(fetchNotifications())

    // Auto-refresh every 1 minute
    intervalId = setInterval(() => {
      IF !document.hidden {
        dispatch(fetchMyTasks())
      }
    }, 60000)

    storeIntervalId(intervalId)
  }

  METHOD onUnmount() {
    IF intervalId {
      clearInterval(intervalId)
    }
  }

  RENDER:
    <div className="employee-dashboard">
      {/* Header */}
      <DashboardHeader>
        <div className="user-welcome">
          <Avatar src={currentUser.avatarUrl} size="large" />
          <div>
            <h1>Welcome, {currentUser.firstName}!</h1>
            <div className="user-meta">
              <StatusBadge status={currentUser.isOnDuty ? 'ON_DUTY' : 'OFF_DUTY'} />
              <span className="role">{currentUser.role}</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              icon="notifications"
              badge={unreadNotifications.length}
              onClick={() => dispatch(openPanel('notifications'))}
            />
          )}

          {currentUser.isOnDuty ? (
            <Button
              variant="outline"
              onClick={handleCheckOut}
            >
              Check Out
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCheckIn}
            >
              Check In
            </Button>
          )}
        </div>
      </DashboardHeader>

      {/* Quick Stats */}
      <div className="quick-stats">
        <StatCard
          label="Pending"
          value={pendingTasks.length}
          icon="pending"
          color="orange"
        />
        <StatCard
          label="In Progress"
          value={inProgressTasks.length}
          icon="hourglass_empty"
          color="blue"
        />
        <StatCard
          label="Completed Today"
          value={completedToday.length}
          icon="check_circle"
          color="green"
        />
      </div>

      {/* Active Task Section */}
      {currentTask && (
        <DashboardCard className="active-task-card" variant="highlighted">
          <div className="active-task-header">
            <h2>Currently Working On</h2>
            <ElapsedTimer startTime={currentTask.startedAt} />
          </div>

          <div className="active-task-content">
            <div className="task-details">
              <h3>{currentTask.title}</h3>

              {currentTask.suite && (
                <div className="suite-info">
                  <Icon name="hotel" />
                  <span>Suite {currentTask.suite.suiteNumber}</span>
                  <StatusBadge status={currentTask.suite.status} />
                </div>
              )}

              {currentTask.description && (
                <p className="description">{currentTask.description}</p>
              )}

              <div className="task-metadata">
                <TaskPriorityBadge priority={currentTask.priority} />
                <span className="estimated-time">
                  <Icon name="schedule" />
                  {currentTask.estimatedDuration} minutes
                </span>
              </div>
            </div>

            <div className="task-actions">
              <Button
                variant="outline"
                onClick={() => handlePauseTask(currentTask.id)}
              >
                Pause
              </Button>
              <Button
                variant="primary"
                onClick={() => handleCompleteTask(currentTask.id)}
              >
                Complete Task
              </Button>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Task Lists */}
      <div className="task-sections">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <DashboardCard title={`My Tasks (${pendingTasks.length})`}>
            <div className="task-list">
              {pendingTasks
                .sort((a, b) => {
                  IF sortBy === 'priority' {
                    priorityOrder = { EMERGENCY: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
                    RETURN priorityOrder[a.priority] - priorityOrder[b.priority]
                  }
                  IF sortBy === 'scheduledStart' {
                    RETURN new Date(a.scheduledStart) - new Date(b.scheduledStart)
                  }
                  IF sortBy === 'suite' {
                    RETURN (a.suite?.suiteNumber || '').localeCompare(b.suite?.suiteNumber || '')
                  }
                })
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task.id)}
                    actions={
                      <Button
                        variant="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartTask(task.id)
                        }}
                      >
                        Start Task
                      </Button>
                    }
                  />
                ))
              }
            </div>
          </DashboardCard>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <DashboardCard title="Upcoming Tasks">
            <div className="upcoming-list">
              {upcomingTasks.map(task => (
                <div
                  key={task.id}
                  className="upcoming-task"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="task-time">
                    {format(new Date(task.scheduledStart), 'MMM dd, HH:mm')}
                  </div>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    {task.suite && (
                      <div className="task-suite">Suite {task.suite.suiteNumber}</div>
                    )}
                  </div>
                  <TaskPriorityBadge priority={task.priority} size="small" />
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Completed Tasks (collapsible) */}
        {completedToday.length > 0 && (
          <DashboardCard
            title={`Completed Today (${completedToday.length})`}
            collapsible
            defaultCollapsed={!showCompleted}
            onToggle={(expanded) => SET showCompleted = expanded}
          >
            <div className="completed-list">
              {completedToday.map(task => (
                <div
                  key={task.id}
                  className="completed-task"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <Icon name="check_circle" color="green" />
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="completion-time">
                      Completed at {format(new Date(task.completedAt), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Empty State */}
        {pendingTasks.length === 0 && inProgressTasks.length === 0 && (
          <DashboardCard>
            <EmptyState
              icon="task_alt"
              title="All Caught Up!"
              message="You have no pending tasks at the moment."
            />
          </DashboardCard>
        )}
      </div>
    </div>
}
```

---

## 5. Navigation and Routing

### 5.1 Main Navigation Component

```typescript
// components/navigation/MainNavigation.tsx
COMPONENT MainNavigation {
  STATE (from store):
    - currentUser: Employee
    - currentRoute: string
    - unreadNotificationsCount: number

  STATE (local):
    - isSidebarCollapsed: boolean = false
    - isMobileMenuOpen: boolean = false

  COMPUTED:
    - navigationItems: NavItem[] = getNavigationItemsForRole(currentUser.role)
    - activeSection: string = getActiveSectionFromRoute(currentRoute)

  METHODS:
    METHOD handleNavigate(path: string) {
      navigateTo(path)
      SET isMobileMenuOpen = false
    }

    METHOD toggleSidebar() {
      collapsed = !isSidebarCollapsed
      SET isSidebarCollapsed = collapsed
      localStorage.setItem('sidebar_collapsed', collapsed.toString())
    }

    METHOD toggleMobileMenu() {
      SET isMobileMenuOpen = !isMobileMenuOpen
    }

  // Navigation items based on role
  FUNCTION getNavigationItemsForRole(role: EmployeeRole): NavItem[] {
    baseItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/dashboard',
        badge: null
      }
    ]

    IF role IN ['MANAGER', 'SUPERVISOR'] {
      RETURN [
        ...baseItems,
        {
          id: 'suites',
          label: 'Suites',
          icon: 'hotel',
          path: '/suites',
          children: [
            { label: 'All Suites', path: '/suites' },
            { label: 'Floor Plan', path: '/suites/floor-plan' },
            { label: 'Availability', path: '/suites/availability' }
          ]
        },
        {
          id: 'tasks',
          label: 'Tasks',
          icon: 'task_alt',
          path: '/tasks',
          children: [
            { label: 'All Tasks', path: '/tasks' },
            { label: 'Calendar', path: '/tasks/calendar' },
            { label: 'Templates', path: '/tasks/templates' }
          ]
        },
        {
          id: 'employees',
          label: 'Employees',
          icon: 'people',
          path: '/employees',
          children: [
            { label: 'All Employees', path: '/employees' },
            { label: 'Schedules', path: '/employees/schedules' },
            { label: 'Performance', path: '/employees/performance' }
          ]
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'assessment',
          path: '/reports',
          children: [
            { label: 'Overview', path: '/reports' },
            { label: 'Task Analytics', path: '/reports/tasks' },
            { label: 'Suite Analytics', path: '/reports/suites' },
            { label: 'Employee Analytics', path: '/reports/employees' }
          ]
        },
        { type: 'divider' },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'settings',
          path: '/settings'
        }
      ]
    } ELSE {
      RETURN [
        ...baseItems,
        {
          id: 'my-tasks',
          label: 'My Tasks',
          icon: 'task_alt',
          path: '/my-tasks'
        },
        {
          id: 'schedule',
          label: 'My Schedule',
          icon: 'calendar_today',
          path: '/schedule'
        },
        { type: 'divider' },
        {
          id: 'profile',
          label: 'Profile',
          icon: 'person',
          path: '/profile'
        }
      ]
    }
  }

  // Lifecycle
  METHOD onMount() {
    savedState = localStorage.getItem('sidebar_collapsed')
    IF savedState {
      SET isSidebarCollapsed = savedState === 'true'
    }
  }

  RENDER:
    <>
      {/* Mobile Header */}
      <MobileHeader className="mobile-only">
        <Button
          variant="ghost"
          icon="menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        />

        <Logo size="small" />

        <div className="mobile-header-actions">
          <Button
            variant="ghost"
            icon="notifications"
            badge={unreadNotificationsCount}
            onClick={() => navigateTo('/notifications')}
          />
        </div>
      </MobileHeader>

      {/* Sidebar */}
      <aside
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div className="sidebar-header">
          <Logo collapsed={isSidebarCollapsed} />

          <Button
            variant="ghost"
            icon={isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            onClick={toggleSidebar}
            className="collapse-toggle desktop-only"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navigationItems.map(item => {
            IF item.type === 'divider' {
              RETURN <div key={item.id} className="nav-divider" />
            }

            isActive = currentRoute.startsWith(item.path)
            hasChildren = item.children && item.children.length > 0

            RETURN (
              <div key={item.id} className="nav-item-wrapper">
                <NavItem
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  isCollapsed={isSidebarCollapsed}
                  badge={item.badge}
                  onClick={() => {
                    IF hasChildren {
                      toggleNavSection(item.id)
                    } ELSE {
                      handleNavigate(item.path)
                    }
                  }}
                  hasChildren={hasChildren}
                />

                {hasChildren && isActive && !isSidebarCollapsed && (
                  <div className="nav-children">
                    {item.children.map(child => (
                      <NavChildItem
                        key={child.path}
                        label={child.label}
                        isActive={currentRoute === child.path}
                        onClick={() => handleNavigate(child.path)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="sidebar-footer">
          <UserProfileButton
            user={currentUser}
            isCollapsed={isSidebarCollapsed}
            onClick={() => dispatch(openPanel('user-menu'))}
          />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={toggleMobileMenu}
        />
      )}
    </>
}
```

### 5.2 Breadcrumb Navigation

```typescript
// components/navigation/Breadcrumbs.tsx
COMPONENT Breadcrumbs {
  STATE (from store):
    - currentRoute: string
    - routeParams: Record<string, string>

  COMPUTED:
    - breadcrumbItems: BreadcrumbItem[] = generateBreadcrumbs(currentRoute, routeParams)

  FUNCTION generateBreadcrumbs(route: string, params: Record<string, string>): BreadcrumbItem[] {
    segments = route.split('/').filter(Boolean)
    items = [{ label: 'Home', path: '/dashboard', icon: 'home' }]

    currentPath = ''
    FOR EACH segment IN segments {
      currentPath += '/' + segment

      IF segment.startsWith(':') {
        // Dynamic segment
        paramName = segment.slice(1)
        IF params[paramName] {
          label = getEntityLabel(paramName, params[paramName])
          items.push({ label, path: currentPath })
        }
      } ELSE {
        label = formatSegmentLabel(segment)
        items.push({ label, path: currentPath })
      }
    }

    RETURN items
  }

  FUNCTION getEntityLabel(type: string, id: string): string {
    SWITCH type {
      CASE 'suiteId':
        suite = getSuiteById(id)
        RETURN suite ? `Suite ${suite.suiteNumber}` : 'Suite'
      CASE 'taskId':
        task = getTaskById(id)
        RETURN task ? task.title : 'Task'
      CASE 'employeeId':
        employee = getEmployeeById(id)
        RETURN employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'
      DEFAULT:
        RETURN id
    }
  }

  FUNCTION formatSegmentLabel(segment: string): string {
    RETURN segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  RENDER:
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => {
          isLast = index === breadcrumbItems.length - 1

          RETURN (
            <li key={item.path} className="breadcrumb-item">
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.icon && <Icon name={item.icon} size="small" />}
                  {item.label}
                </span>
              ) : (
                <>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      navigateTo(item.path)
                    }}
                    className="breadcrumb-link"
                  >
                    {item.icon && <Icon name={item.icon} size="small" />}
                    {item.label}
                  </a>
                  <Icon name="chevron_right" className="breadcrumb-separator" size="small" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
}
```

### 5.3 Route Protection and Configuration

```typescript
// routing/ProtectedRoute.tsx
COMPONENT ProtectedRoute {
  PROPS:
    - path: string
    - component: ComponentType
    - requiredPermissions?: Permission[]
    - requiredRoles?: EmployeeRole[]

  STATE (from store):
    - currentUser: Employee | null
    - isAuthenticated: boolean

  COMPUTED:
    - hasAccess: boolean = checkAccess()

  FUNCTION checkAccess(): boolean {
    IF !isAuthenticated OR !currentUser {
      RETURN false
    }

    IF requiredRoles && requiredRoles.length > 0 {
      IF !requiredRoles.includes(currentUser.role) {
        RETURN false
      }
    }

    IF requiredPermissions && requiredPermissions.length > 0 {
      FOR EACH permission IN requiredPermissions {
        IF !currentUser.permissions.includes(permission) {
          RETURN false
        }
      }
    }

    RETURN true
  }

  RENDER:
    IF !isAuthenticated {
      RETURN <Redirect to="/login" />
    }

    IF !hasAccess {
      RETURN <Redirect to="/403" />
    }

    RETURN <Component />
}

// routing/routes.ts
ROUTES_CONFIG = [
  {
    path: '/login',
    component: LoginPage,
    isPublic: true
  },
  {
    path: '/dashboard',
    component: Dashboard,
    requiredRoles: ['MANAGER', 'SUPERVISOR', 'HOUSEKEEPER', 'MAINTENANCE']
  },
  {
    path: '/suites',
    component: SuitesPage,
    requiredPermissions: ['view_suites']
  },
  {
    path: '/suites/:suiteId',
    component: SuiteDetailsPage,
    requiredPermissions: ['view_suites']
  },
  {
    path: '/tasks',
    component: TasksPage,
    requiredPermissions: ['view_tasks']
  },
  {
    path: '/tasks/:taskId',
    component: TaskDetailsPage,
    requiredPermissions: ['view_tasks']
  },
  {
    path: '/employees',
    component: EmployeesPage,
    requiredRoles: ['MANAGER', 'SUPERVISOR'],
    requiredPermissions: ['view_employees']
  },
  {
    path: '/employees/:employeeId',
    component: EmployeeDetailsPage,
    requiredRoles: ['MANAGER', 'SUPERVISOR'],
    requiredPermissions: ['view_employees']
  },
  {
    path: '/reports',
    component: ReportsPage,
    requiredRoles: ['MANAGER', 'SUPERVISOR'],
    requiredPermissions: ['view_reports']
  },
  {
    path: '/my-tasks',
    component: MyTasksPage,
    requiredRoles: ['HOUSEKEEPER', 'MAINTENANCE']
  },
  {
    path: '/settings',
    component: SettingsPage,
    requiredRoles: ['MANAGER']
  },
  {
    path: '/403',
    component: ForbiddenPage,
    isPublic: true
  },
  {
    path: '/404',
    component: NotFoundPage,
    isPublic: true
  },
  {
    path: '*',
    component: NotFoundPage,
    isPublic: true
  }
]
```

---

## 6. Responsive Design Patterns

### 6.1 Responsive Grid System

```typescript
// components/layouts/ResponsiveGrid.tsx
COMPONENT ResponsiveGrid {
  PROPS:
    - children: ReactNode
    - columns?: ResponsiveValue<number> = { mobile: 1, tablet: 2, desktop: 3 }
    - gap?: ResponsiveValue<string> = { mobile: '16px', tablet: '20px', desktop: '24px' }
    - minColumnWidth?: string

  STATE (local):
    - currentBreakpoint: Breakpoint = 'desktop'

  BREAKPOINTS = {
    mobile: 767,
    tablet: 1023,
    desktop: 1439
  }

  FUNCTION getCurrentBreakpoint(): Breakpoint {
    width = window.innerWidth

    IF width <= BREAKPOINTS.mobile {
      RETURN 'mobile'
    } ELSE IF width <= BREAKPOINTS.tablet {
      RETURN 'tablet'
    } ELSE IF width <= BREAKPOINTS.desktop {
      RETURN 'desktop'
    } ELSE {
      RETURN 'wide'
    }
  }

  METHOD handleResize() {
    newBreakpoint = getCurrentBreakpoint()
    IF newBreakpoint !== currentBreakpoint {
      SET currentBreakpoint = newBreakpoint
    }
  }

  METHOD onMount() {
    SET currentBreakpoint = getCurrentBreakpoint()
    window.addEventListener('resize', debounce(handleResize, 150))
  }

  METHOD onUnmount() {
    window.removeEventListener('resize', handleResize)
  }

  COMPUTED:
    - gridColumns: number = getResponsiveValue(columns, currentBreakpoint)
    - gridGap: string = getResponsiveValue(gap, currentBreakpoint)
    - gridStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: minColumnWidth
          ? `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`
          : `repeat(${gridColumns}, 1fr)`,
        gap: gridGap
      }

  RENDER:
    <div className="responsive-grid" style={gridStyle}>
      {children}
    </div>
}
```

### 6.2 Mobile-Specific Adaptations

```typescript
// hooks/useResponsive.ts
HOOK useResponsive() {
  STATE:
    - windowWidth: number = window.innerWidth
    - windowHeight: number = window.innerHeight

  COMPUTED:
    - isMobile: boolean = windowWidth <= 767
    - isTablet: boolean = windowWidth > 767 && windowWidth <= 1023
    - isDesktop: boolean = windowWidth > 1023
    - isTouchDevice: boolean = 'ontouchstart' IN window
    - orientation: 'portrait' | 'landscape' = windowHeight > windowWidth ? 'portrait' : 'landscape'
    - breakpoint: Breakpoint = getCurrentBreakpoint(windowWidth)

  METHOD handleResize() {
    SET windowWidth = window.innerWidth
    SET windowHeight = window.innerHeight
  }

  METHOD onMount() {
    resizeHandler = debounce(handleResize, 150)
    window.addEventListener('resize', resizeHandler)

    RETURN () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }

  RETURN {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    orientation,
    breakpoint,
    windowWidth,
    windowHeight
  }
}

// components/adaptive/AdaptiveView.tsx
COMPONENT AdaptiveView {
  PROPS:
    - mobileComponent?: ComponentType
    - tabletComponent?: ComponentType
    - desktopComponent?: ComponentType
    - children?: ReactNode

  HOOKS:
    - { isMobile, isTablet, isDesktop } = useResponsive()

  RENDER:
    IF isMobile && mobileComponent {
      RETURN <mobileComponent />
    }

    IF isTablet && tabletComponent {
      RETURN <tabletComponent />
    }

    IF isDesktop && desktopComponent {
      RETURN <desktopComponent />
    }

    RETURN <>{children}</>
}
```

### 6.3 Touch Interactions

```typescript
// hooks/useTouchGestures.ts
HOOK useTouchGestures(options: TouchGestureOptions) {
  STATE:
    - touchStart: { x: number, y: number } | null = null
    - touchEnd: { x: number, y: number } | null = null
    - isSwiping: boolean = false

  CONST:
    - MIN_SWIPE_DISTANCE: number = options.minSwipeDistance || 50
    - MAX_SWIPE_TIME: number = options.maxSwipeTime || 300

  METHOD handleTouchStart(event: TouchEvent) {
    touch = event.touches[0]
    SET touchStart = { x: touch.clientX, y: touch.clientY }
    SET touchEnd = null
    SET isSwiping = false
    startTime = Date.now()
  }

  METHOD handleTouchMove(event: TouchEvent) {
    IF !touchStart RETURN

    touch = event.touches[0]
    SET touchEnd = { x: touch.clientX, y: touch.clientY }
    SET isSwiping = true

    IF options.preventDefault {
      event.preventDefault()
    }
  }

  METHOD handleTouchEnd(event: TouchEvent) {
    IF !touchStart OR !touchEnd RETURN

    deltaX = touchEnd.x - touchStart.x
    deltaY = touchEnd.y - touchStart.y
    elapsed = Date.now() - startTime

    IF elapsed > MAX_SWIPE_TIME {
      resetTouch()
      RETURN
    }

    IF Math.abs(deltaX) > Math.abs(deltaY) {
      // Horizontal swipe
      IF Math.abs(deltaX) >= MIN_SWIPE_DISTANCE {
        IF deltaX > 0 {
          options.onSwipeRight?.(deltaX)
        } ELSE {
          options.onSwipeLeft?.(Math.abs(deltaX))
        }
      }
    } ELSE {
      // Vertical swipe
      IF Math.abs(deltaY) >= MIN_SWIPE_DISTANCE {
        IF deltaY > 0 {
          options.onSwipeDown?.(deltaY)
        } ELSE {
          options.onSwipeUp?.(Math.abs(deltaY))
        }
      }
    }

    resetTouch()
  }

  METHOD resetTouch() {
    SET touchStart = null
    SET touchEnd = null
    SET isSwiping = false
  }

  RETURN {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwiping
  }
}

// Example: Mobile Suite Card with Swipe Actions
COMPONENT MobileSuiteCard {
  PROPS:
    - suite: Suite
    - onStatusChange: (status: SuiteStatus) => void
    - onViewDetails: () => void

  HOOKS:
    - touchGestures = useTouchGestures({
        onSwipeLeft: (distance) => {
          IF distance > 100 {
            setShowActions(true)
          }
        },
        onSwipeRight: () => {
          setShowActions(false)
        },
        minSwipeDistance: 50
      })

  STATE:
    - showActions: boolean = false

  RENDER:
    <div
      className={`mobile-suite-card ${showActions ? 'actions-visible' : ''}`}
      {...touchGestures}
    >
      <div className="card-content" onClick={onViewDetails}>
        <div className="suite-number">{suite.suiteNumber}</div>
        <StatusBadge status={suite.status} />
      </div>

      <div className="card-actions">
        <Button
          variant="ghost"
          icon="cleaning_services"
          onClick={() => onStatusChange('VACANT_CLEAN')}
        >
          Clean
        </Button>
        <Button
          variant="ghost"
          icon="build"
          onClick={() => onStatusChange('OUT_OF_ORDER')}
        >
          Maintenance
        </Button>
      </div>
    </div>
}
```

### 6.4 Responsive Modal Patterns

```typescript
// components/modals/ResponsiveModal.tsx
COMPONENT ResponsiveModal {
  PROPS:
    - isOpen: boolean
    - onClose: () => void
    - title: string
    - children: ReactNode
    - size?: 'small' | 'medium' | 'large' | 'fullscreen'
    - showFullscreenOnMobile?: boolean = true

  HOOKS:
    - { isMobile } = useResponsive()

  COMPUTED:
    - effectiveSize: string = (isMobile && showFullscreenOnMobile) ? 'fullscreen' : size

  METHOD handleBackdropClick(event: MouseEvent) {
    IF event.target === event.currentTarget {
      onClose()
    }
  }

  METHOD handleEscapeKey(event: KeyboardEvent) {
    IF event.key === 'Escape' {
      onClose()
    }
  }

  METHOD onMount() {
    IF isOpen {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscapeKey)
    }
  }

  METHOD onUpdate() {
    IF isOpen {
      document.body.style.overflow = 'hidden'
    } ELSE {
      document.body.style.overflow = ''
    }
  }

  METHOD onUnmount() {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleEscapeKey)
  }

  RENDER:
    IF !isOpen RETURN null

    <Portal targetId="modal-root">
      <div
        className={`modal-backdrop ${effectiveSize}`}
        onClick={handleBackdropClick}
      >
        <div className={`modal-container ${effectiveSize}`}>
          {/* Mobile: Full-screen with header */}
          {isMobile && showFullscreenOnMobile ? (
            <>
              <div className="modal-header-mobile">
                <Button
                  variant="ghost"
                  icon="arrow_back"
                  onClick={onClose}
                  aria-label="Close"
                />
                <h2>{title}</h2>
                <div className="header-spacer" />
              </div>
              <div className="modal-content-mobile">
                {children}
              </div>
            </>
          ) : (
            /* Desktop: Traditional modal */
            <>
              <div className="modal-header">
                <h2>{title}</h2>
                <Button
                  variant="ghost"
                  icon="close"
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>
              <div className="modal-content">
                {children}
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
}
```

### 6.5 Adaptive Data Table

```typescript
// components/tables/ResponsiveTable.tsx
COMPONENT ResponsiveTable {
  PROPS:
    - data: any[]
    - columns: Column[]
    - onRowClick?: (row: any) => void
    - mobileCardRenderer?: (row: any) => ReactNode

  HOOKS:
    - { isMobile } = useResponsive()

  RENDER:
    IF isMobile {
      // Mobile: Card-based layout
      RETURN (
        <div className="mobile-table">
          {data.map((row, index) => (
            <div
              key={row.id || index}
              className="mobile-table-card"
              onClick={() => onRowClick?.(row)}
            >
              {mobileCardRenderer ? (
                mobileCardRenderer(row)
              ) : (
                // Default mobile card rendering
                columns.map(column => (
                  <div key={column.key} className="mobile-table-row">
                    <div className="mobile-table-label">{column.label}</div>
                    <div className="mobile-table-value">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )
    }

    // Desktop: Traditional table
    RETURN (
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>
                {column.label}
                {column.sortable && (
                  <Button
                    variant="ghost"
                    icon="sort"
                    size="small"
                    onClick={() => handleSort(column.key)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map(column => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
}
```

---

## Summary

This document provides comprehensive pseudo-code for all major UI components in the motel management application, including:

1. **Suite Views**: Interactive grid and calendar views with drag-and-drop, context menus, and keyboard navigation
2. **Task Forms**: Complete form validation with field-level and form-level rules, side effects, and error handling
3. **Employee Components**: Assignment dropdowns with workload tracking and sophisticated filtering
4. **Dashboards**: Role-specific dashboards for managers (analytics, metrics, oversight) and employees (task management, personal view)
5. **Navigation**: Sidebar navigation with role-based items, breadcrumbs, and route protection
6. **Responsive Design**: Mobile-first patterns with touch gestures, adaptive layouts, and breakpoint-aware components

All components follow React/TypeScript best practices with:
- Clear separation of concerns
- Type safety
- Accessibility considerations
- Performance optimizations
- Real-time updates
- Offline support
- Responsive design patterns

These components can be implemented directly in a React application with appropriate styling and integration with the state management and API layers documented in previous files.