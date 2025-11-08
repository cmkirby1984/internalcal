# Component Hierarchy Pseudo-Code

## Overview
This document defines the component structure and hierarchy for the motel management application, following a modern component-based architecture.

---

## 1. Application Root Structure

```pseudo
COMPONENT App {
  STRUCTURE:
    App
    ├── Providers
    │   ├── StateProvider (Global state context)
    │   ├── AuthProvider (Authentication context)
    │   ├── ThemeProvider (Theme/styling)
    │   └── WebSocketProvider (Real-time updates)
    │
    └── Router
        ├── PublicRoutes
        │   ├── LoginPage
        │   └── ForgotPasswordPage
        │
        └── ProtectedRoutes
            └── MainLayout
                ├── Sidebar
                ├── Header
                ├── MainContent (route-specific)
                └── NotificationCenter

  STATE:
    - isLoading: Boolean
    - isInitialized: Boolean

  LIFECYCLE:
    onMount() {
      DISPATCH initializeApp()

      // Check for stored auth token
      token = LOCAL_STORAGE.get("auth_token")
      IF token {
        DISPATCH verifyToken(token)
      }

      // Load user preferences
      theme = LOCAL_STORAGE.get("theme") OR "light"
      DISPATCH setTheme(theme)

      SET isInitialized = true
    }

  RENDER:
    IF !isInitialized {
      RETURN <LoadingScreen />
    }

    RETURN (
      <Providers>
        <Router>
          <Routes />
        </Router>
      </Providers>
    )
}
```

---

## 2. Layout Components

### 2.1 MainLayout

```pseudo
COMPONENT MainLayout {
  PROPS:
    - None (uses global state)

  STATE:
    - sidebarOpen: Boolean (from global state)
    - isMobile: Boolean (from viewport detection)

  COMPUTED:
    - showMobileMenu: Boolean = isMobile AND sidebarOpen

  METHODS:
    toggleSidebar() {
      DISPATCH toggleSidebar()
    }

    handleResize() {
      SET isMobile = window.width < 768
      IF isMobile AND sidebarOpen {
        DISPATCH closeSidebar()
      }
    }

  LIFECYCLE:
    onMount() {
      WINDOW.addEventListener("resize", handleResize)
      CALL handleResize()
    }

    onUnmount() {
      WINDOW.removeEventListener("resize", handleResize)
    }

  RENDER:
    <Container className="main-layout">
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={toggleSidebar}
      />

      <MainContainer>
        <Header
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
        />

        <ContentArea>
          <Outlet /> {/* Route content renders here */}
        </ContentArea>
      </MainContainer>

      <NotificationCenter />
      <ModalContainer />
      <ToastContainer />
    </Container>
}
```

### 2.2 Sidebar

```pseudo
COMPONENT Sidebar {
  PROPS:
    - isOpen: Boolean
    - isMobile: Boolean
    - onClose: Function

  STATE (from global):
    - currentUser: Employee
    - currentView: String

  COMPUTED:
    - navigationItems: Array = buildNavigationItems(currentUser.role)
    - unreadNotificationsCount: Integer (from state)

  METHODS:
    buildNavigationItems(role) {
      base_items = [
        { label: "Dashboard", icon: "dashboard", path: "/", permission: null },
        { label: "Suites", icon: "room", path: "/suites", permission: "view_suites" },
        { label: "Tasks", icon: "checklist", path: "/tasks", permission: "view_tasks" },
        { label: "Notes", icon: "note", path: "/notes", permission: "view_notes" }
      ]

      IF hasPermission("view_employees") {
        ADD { label: "Employees", icon: "people", path: "/employees" }
      }

      IF hasPermission("view_reports") {
        ADD { label: "Reports", icon: "analytics", path: "/reports" }
      }

      IF hasPermission("manage_settings") {
        ADD { label: "Settings", icon: "settings", path: "/settings" }
      }

      RETURN base_items
    }

    handleNavigate(path) {
      NAVIGATE_TO(path)
      IF isMobile {
        CALL onClose()
      }
    }

  RENDER:
    <SidebarContainer
      isOpen={isOpen}
      isMobile={isMobile}
    >
      {/* User Profile Section */}
      <UserProfile>
        <Avatar src={currentUser.avatar} />
        <UserInfo>
          <UserName>{currentUser.fullName}</UserName>
          <UserRole>{currentUser.role}</UserRole>
        </UserInfo>
      </UserProfile>

      {/* Navigation Items */}
      <NavigationList>
        FOR EACH item IN navigationItems {
          IF !item.permission OR hasPermission(item.permission) {
            <NavigationItem
              key={item.path}
              active={currentView == item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <Icon name={item.icon} />
              <Label>{item.label}</Label>

              {/* Show badge for notifications on Dashboard */}
              IF item.path == "/" AND unreadNotificationsCount > 0 {
                <Badge>{unreadNotificationsCount}</Badge>
              }
            </NavigationItem>
          }
        }
      </NavigationList>

      {/* Clock In/Out Section */}
      <ClockInOutSection>
        <ClockInOutButton employee={currentUser} />
      </ClockInOutSection>

      {/* Logout */}
      <LogoutButton onClick={handleLogout} />

      {/* Mobile Overlay */}
      IF isMobile AND isOpen {
        <Overlay onClick={onClose} />
      }
    </SidebarContainer>
}
```

### 2.3 Header

```pseudo
COMPONENT Header {
  PROPS:
    - onMenuClick: Function
    - isMobile: Boolean

  STATE (from global):
    - currentUser: Employee
    - notifications: Array<Notification>

  COMPUTED:
    - unreadCount: Integer = notifications.filter(n => !n.read).length
    - pageTitle: String = getPageTitle(currentRoute)

  STATE (local):
    - notificationDropdownOpen: Boolean = false
    - userMenuOpen: Boolean = false

  METHODS:
    toggleNotifications() {
      SET notificationDropdownOpen = !notificationDropdownOpen
      SET userMenuOpen = false
    }

    toggleUserMenu() {
      SET userMenuOpen = !userMenuOpen
      SET notificationDropdownOpen = false
    }

  RENDER:
    <HeaderContainer>
      {/* Mobile Menu Button */}
      IF isMobile {
        <MenuButton onClick={onMenuClick}>
          <Icon name="menu" />
        </MenuButton>
      }

      {/* Page Title */}
      <PageTitle>{pageTitle}</PageTitle>

      {/* Quick Actions */}
      <QuickActions>
        <QuickActionButton
          icon="add_task"
          label="New Task"
          onClick={() => openModal("create-task")}
        />
      </QuickActions>

      {/* Right Section */}
      <HeaderRight>
        {/* Search */}
        <SearchBar placeholder="Search suites, tasks..." />

        {/* Notifications */}
        <NotificationButton
          onClick={toggleNotifications}
          unreadCount={unreadCount}
        />

        IF notificationDropdownOpen {
          <NotificationDropdown
            notifications={notifications}
            onClose={() => SET notificationDropdownOpen = false}
          />
        }

        {/* User Menu */}
        <UserMenuButton onClick={toggleUserMenu}>
          <Avatar src={currentUser.avatar} size="small" />
        </UserMenuButton>

        IF userMenuOpen {
          <UserMenuDropdown
            user={currentUser}
            onClose={() => SET userMenuOpen = false}
          />
        }
      </HeaderRight>
    </HeaderContainer>
}
```

---

## 3. Page Components

### 3.1 DashboardPage

```pseudo
COMPONENT DashboardPage {
  STATE (from global):
    - dashboardStats: Object
    - recentActivity: Array
    - currentUser: Employee

  STATE (local):
    - isLoading: Boolean = true
    - selectedDateRange: DateRange = "today"

  LIFECYCLE:
    onMount() {
      DISPATCH fetchDashboardData()
      SET isLoading = false

      // Set up auto-refresh every 30 seconds
      interval = INTERVAL(() => {
        DISPATCH refreshDashboardStats()
      }, 30000)

      RETURN () => CLEAR_INTERVAL(interval)
    }

  COMPUTED:
    - myActiveTasks: Array = getActiveTasksForCurrentUser()
    - urgentTasks: Array = getTasks({ priority: URGENT })
    - suitesNeedingAttention: Array = getSuitesNeedingCleaning()

  RENDER:
    <DashboardContainer>
      {/* Stats Overview */}
      <StatsGrid>
        <StatCard
          title="Total Suites"
          value={dashboardStats.totalSuites}
          icon="room"
          color="blue"
        />
        <StatCard
          title="Available"
          value={dashboardStats.vacantClean}
          icon="check_circle"
          color="green"
          onClick={() => navigateToSuites({ status: VACANT_CLEAN })}
        />
        <StatCard
          title="Needs Cleaning"
          value={dashboardStats.needsCleaning}
          icon="cleaning"
          color="orange"
          onClick={() => navigateToSuites({ needsCleaning: true })}
        />
        <StatCard
          title="Out of Order"
          value={dashboardStats.outOfOrder}
          icon="warning"
          color="red"
          onClick={() => navigateToSuites({ status: OUT_OF_ORDER })}
        />
      </StatsGrid>

      <StatsGrid>
        <StatCard
          title="Active Tasks"
          value={dashboardStats.inProgressTasks}
          icon="task_alt"
          color="blue"
        />
        <StatCard
          title="Completed Today"
          value={dashboardStats.completedToday}
          icon="done_all"
          color="green"
        />
        <StatCard
          title="Overdue"
          value={dashboardStats.overdueTasks}
          icon="schedule"
          color="red"
          onClick={() => navigateToTasks({ overdue: true })}
        />
        <StatCard
          title="On Duty"
          value={dashboardStats.employeesOnDuty}
          icon="people"
          color="purple"
        />
      </StatsGrid>

      <ContentGrid>
        {/* Left Column */}
        <LeftColumn>
          {/* My Active Tasks */}
          <DashboardCard title="My Tasks">
            <TaskList
              tasks={myActiveTasks}
              compact={true}
              onTaskClick={(task) => openTaskDetails(task)}
            />
          </DashboardCard>

          {/* Urgent Items */}
          IF urgentTasks.length > 0 {
            <DashboardCard
              title="Urgent Tasks"
              headerColor="red"
            >
              <TaskList
                tasks={urgentTasks}
                compact={true}
                showAssignee={true}
              />
            </DashboardCard>
          }
        </LeftColumn>

        {/* Right Column */}
        <RightColumn>
          {/* Suites Status Overview */}
          <DashboardCard title="Suite Status">
            <SuiteStatusChart data={dashboardStats} />
          </DashboardCard>

          {/* Recent Activity */}
          <DashboardCard title="Recent Activity">
            <ActivityFeed
              activities={recentActivity}
              limit={10}
            />
          </DashboardCard>

          {/* Pinned Notes */}
          <DashboardCard title="Pinned Notes">
            <NotesList
              notes={getPinnedNotes()}
              compact={true}
              limit={5}
            />
          </DashboardCard>
        </RightColumn>
      </ContentGrid>
    </DashboardContainer>
}
```

### 3.2 SuitesPage

```pseudo
COMPONENT SuitesPage {
  STATE (from global):
    - suites: Map<id, Suite>
    - filters: Object
    - isLoading: Boolean

  STATE (local):
    - viewMode: Enum { GRID, LIST, FLOOR_PLAN } = "grid"
    - selectedSuiteId: String | null = null
    - showFilters: Boolean = false

  COMPUTED:
    - filteredSuites: Array = getFilteredSuites()
    - suitesByFloor: Map = groupSuitesByFloor(filteredSuites)

  LIFECYCLE:
    onMount() {
      DISPATCH fetchAllSuites()

      // Load view preference
      saved_view = LOCAL_STORAGE.get("suites_view_mode")
      IF saved_view {
        SET viewMode = saved_view
      }
    }

  METHODS:
    handleSuiteClick(suiteId) {
      SET selectedSuiteId = suiteId
      DISPATCH selectSuite(suiteId)
      OPEN_SIDEBAR_PANEL("suite-details")
    }

    handleStatusChange(suiteId, newStatus) {
      DISPATCH updateSuiteStatus(suiteId, newStatus)
    }

    handleViewModeChange(mode) {
      SET viewMode = mode
      LOCAL_STORAGE.set("suites_view_mode", mode)
    }

    handleFilterChange(filterKey, value) {
      DISPATCH setSuiteFilters({ [filterKey]: value })
    }

  RENDER:
    <SuitesPageContainer>
      {/* Header with Actions */}
      <PageHeader>
        <Title>Suites</Title>

        <HeaderActions>
          {/* View Mode Toggle */}
          <ViewModeToggle
            value={viewMode}
            options={["grid", "list", "floor_plan"]}
            onChange={handleViewModeChange}
          />

          {/* Filter Toggle */}
          <FilterButton
            active={showFilters}
            onClick={() => SET showFilters = !showFilters}
          />

          {/* Add Suite */}
          IF hasPermission("create_suite") {
            <Button
              variant="primary"
              icon="add"
              onClick={() => openModal("create-suite")}
            >
              Add Suite
            </Button>
          }
        </HeaderActions>
      </PageHeader>

      {/* Filters Panel */}
      IF showFilters {
        <FiltersPanel>
          <FilterGroup label="Status">
            <MultiSelect
              options={SUITE_STATUSES}
              value={filters.status}
              onChange={(val) => handleFilterChange("status", val)}
            />
          </FilterGroup>

          <FilterGroup label="Floor">
            <MultiSelect
              options={[1, 2, 3, 4]}
              value={filters.floor}
              onChange={(val) => handleFilterChange("floor", val)}
            />
          </FilterGroup>

          <FilterGroup label="Type">
            <MultiSelect
              options={SUITE_TYPES}
              value={filters.type}
              onChange={(val) => handleFilterChange("type", val)}
            />
          </FilterGroup>

          <Button
            variant="text"
            onClick={() => DISPATCH clearSuiteFilters()}
          >
            Clear All
          </Button>
        </FiltersPanel>
      }

      {/* Content */}
      <SuitesContent>
        IF isLoading {
          <LoadingSpinner />
        } ELSE IF filteredSuites.length == 0 {
          <EmptyState
            icon="room"
            title="No suites found"
            description="Try adjusting your filters"
          />
        } ELSE {
          SWITCH viewMode {
            CASE "grid":
              <SuitesGrid
                suites={filteredSuites}
                onSuiteClick={handleSuiteClick}
                onStatusChange={handleStatusChange}
              />
              BREAK

            CASE "list":
              <SuitesList
                suites={filteredSuites}
                onSuiteClick={handleSuiteClick}
                onStatusChange={handleStatusChange}
              />
              BREAK

            CASE "floor_plan":
              <FloorPlanView
                suitesByFloor={suitesByFloor}
                onSuiteClick={handleSuiteClick}
              />
              BREAK
          }
        }
      </SuitesContent>

      {/* Details Sidebar */}
      IF selectedSuiteId {
        <SuiteDetailsSidebar
          suiteId={selectedSuiteId}
          onClose={() => SET selectedSuiteId = null}
        />
      }
    </SuitesPageContainer>
}
```

### 3.3 TasksPage

```pseudo
COMPONENT TasksPage {
  STATE (from global):
    - tasks: Map<id, Task>
    - filters: Object
    - viewMode: Enum { LIST, KANBAN, CALENDAR }
    - isLoading: Boolean

  STATE (local):
    - selectedTaskId: String | null = null
    - showFilters: Boolean = false

  COMPUTED:
    - filteredTasks: Array = getFilteredTasks()
    - tasksByStatus: Map = groupTasksByStatus(filteredTasks)
    - myTasks: Array = getTasksByEmployee(currentUser.id)

  LIFECYCLE:
    onMount() {
      DISPATCH fetchAllTasks()
      DISPATCH fetchAllEmployees() // For assignment
    }

  METHODS:
    handleTaskClick(taskId) {
      SET selectedTaskId = taskId
      DISPATCH selectTask(taskId)
    }

    handleCreateTask() {
      OPEN_MODAL("create-task")
    }

    handleTaskStatusChange(taskId, newStatus) {
      DISPATCH updateTaskStatus(taskId, newStatus)
    }

    handleTaskAssign(taskId, employeeId) {
      DISPATCH assignTask(taskId, employeeId)
    }

    handleViewModeChange(mode) {
      DISPATCH setTaskViewMode(mode)
    }

  RENDER:
    <TasksPageContainer>
      {/* Header */}
      <PageHeader>
        <Title>Tasks</Title>

        <HeaderActions>
          {/* Quick Filters */}
          <QuickFilterChips>
            <Chip
              label="My Tasks"
              active={filters.assignedTo == currentUser.id}
              onClick={() => handleFilterChange("assignedTo", currentUser.id)}
            />
            <Chip
              label="Unassigned"
              active={filters.status == PENDING}
              onClick={() => handleFilterChange("status", PENDING)}
            />
            <Chip
              label="Overdue"
              active={filters.overdue == true}
              onClick={() => handleFilterChange("overdue", true)}
            />
          </QuickFilterChips>

          {/* View Mode */}
          <ViewModeToggle
            value={viewMode}
            options={["list", "kanban", "calendar"]}
            onChange={handleViewModeChange}
          />

          {/* Filter Button */}
          <FilterButton
            active={showFilters}
            onClick={() => SET showFilters = !showFilters}
          />

          {/* Create Task */}
          IF hasPermission("create_task") {
            <Button
              variant="primary"
              icon="add"
              onClick={handleCreateTask}
            >
              New Task
            </Button>
          }
        </HeaderActions>
      </PageHeader>

      {/* Filters Panel */}
      IF showFilters {
        <TaskFiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={() => DISPATCH clearTaskFilters()}
        />
      }

      {/* Content */}
      <TasksContent>
        IF isLoading {
          <LoadingSpinner />
        } ELSE IF filteredTasks.length == 0 {
          <EmptyState
            icon="task"
            title="No tasks found"
            description="Create a new task to get started"
            action={
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            }
          />
        } ELSE {
          SWITCH viewMode {
            CASE "list":
              <TasksList
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onStatusChange={handleTaskStatusChange}
                onAssign={handleTaskAssign}
              />
              BREAK

            CASE "kanban":
              <TasksKanbanBoard
                tasksByStatus={tasksByStatus}
                onTaskClick={handleTaskClick}
                onTaskMove={handleTaskStatusChange}
              />
              BREAK

            CASE "calendar":
              <TasksCalendar
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onDateChange={(taskId, date) => {
                  DISPATCH updateTask(taskId, { scheduledStart: date })
                }}
              />
              BREAK
          }
        }
      </TasksContent>

      {/* Task Details Modal */}
      IF selectedTaskId {
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => SET selectedTaskId = null}
        />
      }
    </TasksPageContainer>
}
```

---

## 4. Shared/Reusable Components

### 4.1 SuiteCard

```pseudo
COMPONENT SuiteCard {
  PROPS:
    - suite: Suite
    - onClick: Function
    - onStatusChange: Function
    - compact: Boolean = false

  STATE (local):
    - showStatusMenu: Boolean = false

  COMPUTED:
    - statusColor: String = getStatusColor(suite.status)
    - hasActiveTasks: Boolean = suite.activeTasks.length > 0
    - isOverdue: Boolean = checkIfOverdue(suite)

  METHODS:
    handleStatusChange(newStatus) {
      CALL onStatusChange(suite.id, newStatus)
      SET showStatusMenu = false
    }

    handleCardClick(event) {
      // Don't trigger if clicking on status menu
      IF !event.target.closest(".status-menu") {
        CALL onClick(suite.id)
      }
    }

  RENDER:
    <Card
      onClick={handleCardClick}
      className={compact ? "compact" : "normal"}
    >
      {/* Header */}
      <CardHeader>
        <SuiteNumber>{suite.suiteNumber}</SuiteNumber>

        <StatusBadge
          status={suite.status}
          color={statusColor}
          onClick={(e) => {
            e.stopPropagation()
            SET showStatusMenu = !showStatusMenu
          }}
        />

        IF showStatusMenu {
          <StatusMenu
            currentStatus={suite.status}
            onSelect={handleStatusChange}
            onClose={() => SET showStatusMenu = false}
          />
        }
      </CardHeader>

      {/* Body */}
      <CardBody>
        <SuiteInfo>
          <InfoRow>
            <Icon name="layers" size="small" />
            <Text>Floor {suite.floor}</Text>
          </InfoRow>

          <InfoRow>
            <Icon name="bed" size="small" />
            <Text>{suite.bedConfiguration}</Text>
          </InfoRow>

          IF suite.currentGuest.name {
            <InfoRow>
              <Icon name="person" size="small" />
              <Text>{suite.currentGuest.name}</Text>
            </InfoRow>
          }
        </SuiteInfo>

        {/* Active Tasks Indicator */}
        IF hasActiveTasks {
          <TasksIndicator>
            <Icon name="task" size="small" />
            <Text>{suite.activeTasks.length} active tasks</Text>
          </TasksIndicator>
        }

        {/* Overdue Indicator */}
        IF isOverdue {
          <OverdueIndicator>
            <Icon name="warning" color="red" />
            <Text color="red">Needs attention</Text>
          </OverdueIndicator>
        }
      </CardBody>

      {/* Footer - Last Cleaned */}
      IF !compact AND suite.lastCleaned {
        <CardFooter>
          <Text size="small" color="gray">
            Cleaned {formatRelativeTime(suite.lastCleaned)}
          </Text>
        </CardFooter>
      }
    </Card>
}
```

### 4.2 TaskCard

```pseudo
COMPONENT TaskCard {
  PROPS:
    - task: Task
    - onClick: Function
    - onStatusChange: Function
    - onAssign: Function
    - showSuite: Boolean = true
    - showAssignee: Boolean = true
    - compact: Boolean = false

  STATE (from global):
    - employees: Map<id, Employee>
    - suites: Map<id, Suite>

  COMPUTED:
    - priorityColor: String = getPriorityColor(task.priority)
    - assignee: Employee | null = task.assignedTo ? employees[task.assignedTo] : null
    - suite: Suite | null = task.suiteId ? suites[task.suiteId] : null
    - isOverdue: Boolean = task.scheduledEnd < NOW() AND task.status NOT IN [COMPLETED, CANCELLED]

  METHODS:
    handleStartTask() {
      DISPATCH startTask(task.id)
    }

    handleCompleteTask() {
      OPEN_MODAL("complete-task", { taskId: task.id })
    }

    handleStatusClick(event) {
      event.stopPropagation()
      // Show status change menu
    }

  RENDER:
    <TaskCardContainer
      onClick={() => onClick(task.id)}
      className={compact ? "compact" : "normal"}
      priority={task.priority}
    >
      {/* Left Edge - Priority Indicator */}
      <PriorityIndicator color={priorityColor} />

      <CardContent>
        {/* Header */}
        <TaskHeader>
          <TaskTitle>{task.title}</TaskTitle>

          <TaskActions>
            {/* Quick Action Buttons */}
            IF task.status == ASSIGNED AND task.assignedTo == currentUser.id {
              <IconButton
                icon="play_arrow"
                tooltip="Start Task"
                onClick={handleStartTask}
              />
            }

            IF task.status == IN_PROGRESS AND task.assignedTo == currentUser.id {
              <IconButton
                icon="check"
                tooltip="Complete Task"
                onClick={handleCompleteTask}
              />
            }
          </TaskActions>
        </TaskHeader>

        {/* Meta Information */}
        <TaskMeta>
          {/* Type Badge */}
          <Badge color="blue">{task.type}</Badge>

          {/* Priority Badge */}
          IF task.priority IN [HIGH, URGENT, EMERGENCY] {
            <Badge color={priorityColor}>
              {task.priority}
            </Badge>
          }

          {/* Overdue */}
          IF isOverdue {
            <Badge color="red">
              <Icon name="schedule" size="tiny" />
              Overdue
            </Badge>
          }
        </TaskMeta>

        {/* Suite & Assignee Info */}
        <TaskInfo>
          IF showSuite AND suite {
            <InfoChip>
              <Icon name="room" size="small" />
              <Text>Suite {suite.suiteNumber}</Text>
            </InfoChip>
          }

          IF showAssignee {
            IF assignee {
              <InfoChip>
                <Avatar
                  src={assignee.avatar}
                  size="tiny"
                />
                <Text>{assignee.fullName}</Text>
              </InfoChip>
            } ELSE {
              <InfoChip onClick={(e) => {
                e.stopPropagation()
                OPEN_ASSIGN_MENU(task.id)
              }}>
                <Icon name="person_add" size="small" />
                <Text color="gray">Unassigned</Text>
              </InfoChip>
            }
          }
        </TaskInfo>

        {/* Description (if not compact) */}
        IF !compact AND task.description {
          <TaskDescription>
            {truncate(task.description, 100)}
          </TaskDescription>
        }

        {/* Footer - Timing */}
        IF task.scheduledStart OR task.estimatedDuration {
          <TaskFooter>
            IF task.scheduledStart {
              <Text size="small" color="gray">
                <Icon name="schedule" size="tiny" />
                {formatDateTime(task.scheduledStart)}
              </Text>
            }

            IF task.estimatedDuration {
              <Text size="small" color="gray">
                <Icon name="timer" size="tiny" />
                {task.estimatedDuration} min
              </Text>
            }
          </TaskFooter>
        }
      </CardContent>

      {/* Status Indicator */}
      <StatusIndicator
        status={task.status}
        onClick={handleStatusClick}
      />
    </TaskCardContainer>
}
```

### 4.3 EmployeeCard

```pseudo
COMPONENT EmployeeCard {
  PROPS:
    - employee: Employee
    - onClick: Function
    - showTasks: Boolean = true

  STATE (from global):
    - tasks: Map<id, Task>

  COMPUTED:
    - activeTasks: Array = getTasksByEmployee(employee.id)
      .filter(t => t.status IN [ASSIGNED, IN_PROGRESS])
    - statusColor: String = getEmployeeStatusColor(employee.status)

  RENDER:
    <Card onClick={() => onClick(employee.id)}>
      <CardHeader>
        <Avatar
          src={employee.avatar}
          size="medium"
          status={employee.isOnDuty ? "online" : "offline"}
        />

        <EmployeeInfo>
          <EmployeeName>{employee.fullName}</EmployeeName>
          <EmployeeRole>{employee.role}</EmployeeRole>
        </EmployeeInfo>

        <StatusBadge color={statusColor}>
          {employee.status}
        </StatusBadge>
      </CardHeader>

      <CardBody>
        {/* Contact Info */}
        <ContactInfo>
          <InfoRow>
            <Icon name="email" size="small" />
            <Text>{employee.email}</Text>
          </InfoRow>

          IF employee.phone {
            <InfoRow>
              <Icon name="phone" size="small" />
              <Text>{employee.phone}</Text>
            </InfoRow>
          }
        </ContactInfo>

        {/* Active Tasks */}
        IF showTasks AND activeTasks.length > 0 {
          <ActiveTasksSection>
            <SectionTitle>Active Tasks</SectionTitle>
            <TasksList>
              FOR EACH task IN activeTasks.slice(0, 3) {
                <TaskItem key={task.id}>
                  <TaskTitle>{task.title}</TaskTitle>
                  <TaskStatus>{task.status}</TaskStatus>
                </TaskItem>
              }
            </TasksList>

            IF activeTasks.length > 3 {
              <Text size="small">
                +{activeTasks.length - 3} more
              </Text>
            }
          </ActiveTasksSection>
        } ELSE IF showTasks {
          <EmptyState
            size="small"
            message="No active tasks"
          />
        }
      </CardBody>

      <CardFooter>
        IF employee.isOnDuty {
          <Text size="small" color="green">
            <Icon name="schedule" size="tiny" />
            Clocked in {formatRelativeTime(employee.lastClockIn)}
          </Text>
        } ELSE {
          <Text size="small" color="gray">
            Off duty
          </Text>
        }
      </CardFooter>
    </Card>
}
```

### 4.4 NoteCard

```pseudo
COMPONENT NoteCard {
  PROPS:
    - note: Note
    - onClick: Function
    - onPin: Function
    - compact: Boolean = false

  STATE (from global):
    - currentUser: Employee
    - employees: Map<id, Employee>

  COMPUTED:
    - author: Employee = employees[note.createdBy]
    - isUnread: Boolean = !note.lastReadBy.find(r => r.employeeId == currentUser.id)
    - priorityColor: String = getPriorityColor(note.priority)

  METHODS:
    handlePin(event) {
      event.stopPropagation()
      CALL onPin(note.id)
    }

    handleClick() {
      // Mark as read
      DISPATCH markNoteAsRead(note.id)
      CALL onClick(note.id)
    }

  RENDER:
    <Card
      onClick={handleClick}
      className={isUnread ? "unread" : ""}
    >
      <CardHeader>
        <AuthorInfo>
          <Avatar src={author.avatar} size="small" />
          <AuthorName>{author.fullName}</AuthorName>
          <Timestamp>{formatRelativeTime(note.createdAt)}</Timestamp>
        </AuthorInfo>

        <HeaderActions>
          {/* Pin Button */}
          <IconButton
            icon={note.pinned ? "push_pin" : "push_pin_outline"}
            active={note.pinned}
            onClick={handlePin}
          />

          {/* Priority Indicator */}
          IF note.priority IN [HIGH, URGENT] {
            <PriorityBadge color={priorityColor}>
              {note.priority}
            </PriorityBadge>
          }
        </HeaderActions>
      </CardHeader>

      <CardBody>
        {/* Title */}
        IF note.title {
          <NoteTitle>{note.title}</NoteTitle>
        }

        {/* Content */}
        <NoteContent>
          IF compact {
            {truncate(note.content, 150)}
          } ELSE {
            {note.content}
          }
        </NoteContent>

        {/* Tags */}
        IF note.tags.length > 0 {
          <TagList>
            FOR EACH tag IN note.tags {
              <Tag key={tag}>{tag}</Tag>
            }
          </TagList>
        }

        {/* Related Items */}
        IF note.relatedSuite OR note.relatedTask {
          <RelatedItems>
            IF note.relatedSuite {
              <RelatedChip>
                <Icon name="room" size="tiny" />
                Suite {suites[note.relatedSuite].suiteNumber}
              </RelatedChip>
            }

            IF note.relatedTask {
              <RelatedChip>
                <Icon name="task" size="tiny" />
                {tasks[note.relatedTask].title}
              </RelatedChip>
            }
          </RelatedItems>
        }
      </CardBody>

      <CardFooter>
        {/* Comments Count */}
        IF note.comments.length > 0 {
          <CommentCount>
            <Icon name="comment" size="small" />
            {note.comments.length} comments
          </CommentCount>
        }

        {/* Follow-up */}
        IF note.requiresFollowUp {
          <FollowUpIndicator>
            <Icon name="flag" size="small" color="orange" />
            Follow-up {formatDate(note.followUpDate)}
          </FollowUpIndicator>
        }

        {/* Unread Indicator */}
        IF isUnread {
          <UnreadDot />
        }
      </CardFooter>
    </Card>
}
```

---

## 5. Modal/Dialog Components

### 5.1 CreateTaskModal

```pseudo
COMPONENT CreateTaskModal {
  PROPS:
    - isOpen: Boolean
    - onClose: Function
    - initialData: Object | null

  STATE (local):
    - formData: Object = {
        type: CLEANING,
        priority: NORMAL,
        title: "",
        description: "",
        suiteId: null,
        assignedTo: null,
        scheduledStart: null,
        estimatedDuration: 30
      }
    - errors: Object = {}
    - isSubmitting: Boolean = false

  STATE (from global):
    - suites: Map<id, Suite>
    - employees: Map<id, Employee>

  LIFECYCLE:
    onMount() {
      IF initialData {
        SET formData = { ...formData, ...initialData }
      }
    }

  METHODS:
    handleFieldChange(field, value) {
      SET formData[field] = value

      // Clear error for this field
      DELETE errors[field]

      // Auto-generate title for cleaning tasks
      IF field == "suiteId" AND formData.type == CLEANING {
        suite = suites[value]
        SET formData.title = "Clean Suite " + suite.suiteNumber
      }
    }

    validate() {
      new_errors = {}

      IF !formData.title {
        new_errors.title = "Title is required"
      }

      IF !formData.type {
        new_errors.type = "Task type is required"
      }

      SET errors = new_errors
      RETURN Object.keys(new_errors).length == 0
    }

    async handleSubmit() {
      IF !validate() {
        RETURN
      }

      SET isSubmitting = true

      TRY {
        new_task = AWAIT DISPATCH createTask(formData)
        CALL onClose()

        // Show success message
        DISPATCH showToast({
          type: SUCCESS,
          message: "Task created successfully"
        })

        // Navigate to task if needed
        IF formData.assignedTo == currentUser.id {
          NAVIGATE_TO("/tasks/" + new_task.id)
        }

      } CATCH (error) {
        SET errors.submit = error.message
      } FINALLY {
        SET isSubmitting = false
      }
    }

  RENDER:
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task"
      size="large"
    >
      <Form onSubmit={handleSubmit}>
        {/* Task Type */}
        <FormField label="Type" required error={errors.type}>
          <Select
            value={formData.type}
            onChange={(val) => handleFieldChange("type", val)}
            options={TASK_TYPES}
          />
        </FormField>

        {/* Title */}
        <FormField label="Title" required error={errors.title}>
          <Input
            value={formData.title}
            onChange={(val) => handleFieldChange("title", val)}
            placeholder="Enter task title"
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <TextArea
            value={formData.description}
            onChange={(val) => handleFieldChange("description", val)}
            rows={4}
            placeholder="Add any additional details..."
          />
        </FormField>

        {/* Suite Selection */}
        <FormField label="Suite">
          <SuiteSelect
            value={formData.suiteId}
            onChange={(val) => handleFieldChange("suiteId", val)}
            suites={Object.values(suites)}
            placeholder="Select a suite"
          />
        </FormField>

        {/* Priority */}
        <FormField label="Priority" required>
          <RadioGroup
            value={formData.priority}
            onChange={(val) => handleFieldChange("priority", val)}
            options={TASK_PRIORITIES}
          />
        </FormField>

        {/* Assign To */}
        <FormField label="Assign To">
          <EmployeeSelect
            value={formData.assignedTo}
            onChange={(val) => handleFieldChange("assignedTo", val)}
            employees={getAvailableEmployees()}
            placeholder="Select employee (optional)"
          />
        </FormField>

        {/* Scheduling */}
        <FormRow>
          <FormField label="Scheduled Start">
            <DateTimePicker
              value={formData.scheduledStart}
              onChange={(val) => handleFieldChange("scheduledStart", val)}
            />
          </FormField>

          <FormField label="Estimated Duration (min)">
            <NumberInput
              value={formData.estimatedDuration}
              onChange={(val) => handleFieldChange("estimatedDuration", val)}
              min={5}
              step={5}
            />
          </FormField>
        </FormRow>

        {/* Error Message */}
        IF errors.submit {
          <ErrorMessage>{errors.submit}</ErrorMessage>
        }

        {/* Actions */}
        <ModalActions>
          <Button
            variant="text"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            type="submit"
            loading={isSubmitting}
          >
            Create Task
          </Button>
        </ModalActions>
      </Form>
    </Modal>
}
```

---

## 6. Component Communication Patterns

```pseudo
COMMUNICATION_PATTERNS {

  // Parent to Child - Props
  PATTERN PropsDown {
    <ParentComponent>
      <ChildComponent
        data={parentData}
        onEvent={parentHandler}
      />
    </ParentComponent>
  }

  // Child to Parent - Callbacks
  PATTERN EventsUp {
    COMPONENT Child {
      handleClick() {
        CALL this.props.onEvent(data)
      }
    }
  }

  // Sibling Communication - Via Parent or Global State
  PATTERN SiblingComm {
    // Via Global State (Preferred)
    COMPONENT SiblingA {
      handleAction() {
        DISPATCH updateSharedData(data)
      }
    }

    COMPONENT SiblingB {
      // Automatically receives update via state subscription
    }
  }

  // Deep Nesting - Context/Global State
  PATTERN DeepNesting {
    // Use global state instead of prop drilling
    COMPONENT DeepChild {
      STATE (from global):
        - currentUser: Employee

      // No need to pass through multiple levels
    }
  }

  // Cross-Feature Communication - Events/PubSub
  PATTERN CrossFeature {
    // When task is completed
    DISPATCH createTask.success {
      // State management handles updating all subscribed components
      // TasksList automatically re-renders
      // SuiteCard automatically updates status
      // Dashboard stats automatically refresh
    }
  }
}
```

This component hierarchy provides a comprehensive structure for building a scalable motel management application with clear separation of concerns and reusable components.
