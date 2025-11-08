# UI Layout Structure Pseudo-Code

## Overview
This document defines the user interface layout structure, responsive design patterns, and visual design system for the motel management application.

---

## 1. Design System Foundation

### 1.1 Layout Grid System

```pseudo
LAYOUT_GRID {
  // Breakpoints
  breakpoints: {
    mobile: 0px - 767px
    tablet: 768px - 1023px
    desktop: 1024px - 1439px
    wide: 1440px+
  }

  // Container Widths
  containers: {
    mobile: 100% (with 16px padding)
    tablet: 100% (with 24px padding)
    desktop: 1200px (centered)
    wide: 1400px (centered)
  }

  // Grid Columns
  columns: {
    mobile: 4 columns
    tablet: 8 columns
    desktop: 12 columns
  }

  // Spacing Scale (based on 8px)
  spacing: {
    xs: 4px    // 0.5 unit
    sm: 8px    // 1 unit
    md: 16px   // 2 units
    lg: 24px   // 3 units
    xl: 32px   // 4 units
    xxl: 48px  // 6 units
    xxxl: 64px // 8 units
  }
}
```

### 1.2 Color System

```pseudo
COLOR_PALETTE {
  // Primary Colors
  primary: {
    50: "#E3F2FD"   // Lightest
    100: "#BBDEFB"
    200: "#90CAF9"
    300: "#64B5F6"
    400: "#42A5F5"
    500: "#2196F3"  // Main
    600: "#1E88E5"
    700: "#1976D2"
    800: "#1565C0"
    900: "#0D47A1"  // Darkest
  }

  // Status Colors
  status: {
    // Suite Statuses
    vacantClean: "#4CAF50"      // Green
    vacantDirty: "#FF9800"      // Orange
    occupiedClean: "#2196F3"    // Blue
    occupiedDirty: "#FF5722"    // Deep Orange
    outOfOrder: "#F44336"       // Red
    blocked: "#9E9E9E"          // Gray

    // Task Statuses
    pending: "#9E9E9E"          // Gray
    assigned: "#2196F3"         // Blue
    inProgress: "#FF9800"       // Orange
    completed: "#4CAF50"        // Green
    cancelled: "#757575"        // Dark Gray
  }

  // Priority Colors
  priority: {
    low: "#4CAF50"       // Green
    normal: "#2196F3"    // Blue
    high: "#FF9800"      // Orange
    urgent: "#FF5722"    // Deep Orange
    emergency: "#F44336" // Red
  }

  // Semantic Colors
  semantic: {
    success: "#4CAF50"
    warning: "#FF9800"
    error: "#F44336"
    info: "#2196F3"
  }

  // Neutral Colors
  neutral: {
    white: "#FFFFFF"
    gray50: "#FAFAFA"
    gray100: "#F5F5F5"
    gray200: "#EEEEEE"
    gray300: "#E0E0E0"
    gray400: "#BDBDBD"
    gray500: "#9E9E9E"
    gray600: "#757575"
    gray700: "#616161"
    gray800: "#424242"
    gray900: "#212121"
    black: "#000000"
  }

  // Background Colors
  backgrounds: {
    page: neutral.gray50
    card: neutral.white
    sidebar: neutral.gray900
    header: neutral.white
    hover: neutral.gray100
  }

  // Text Colors
  text: {
    primary: neutral.gray900
    secondary: neutral.gray600
    disabled: neutral.gray400
    inverse: neutral.white
  }
}
```

### 1.3 Typography System

```pseudo
TYPOGRAPHY {
  // Font Families
  fontFamilies: {
    primary: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    monospace: "'Roboto Mono', 'Courier New', monospace"
  }

  // Font Sizes
  sizes: {
    xs: 12px
    sm: 14px
    base: 16px
    lg: 18px
    xl: 20px
    xxl: 24px
    xxxl: 32px
    display: 48px
  }

  // Font Weights
  weights: {
    light: 300
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
  }

  // Line Heights
  lineHeights: {
    tight: 1.2
    normal: 1.5
    relaxed: 1.75
  }

  // Text Styles
  styles: {
    h1: {
      fontSize: sizes.xxxl
      fontWeight: weights.bold
      lineHeight: lineHeights.tight
    }
    h2: {
      fontSize: sizes.xxl
      fontWeight: weights.semibold
      lineHeight: lineHeights.tight
    }
    h3: {
      fontSize: sizes.xl
      fontWeight: weights.semibold
      lineHeight: lineHeights.normal
    }
    h4: {
      fontSize: sizes.lg
      fontWeight: weights.medium
      lineHeight: lineHeights.normal
    }
    body: {
      fontSize: sizes.base
      fontWeight: weights.regular
      lineHeight: lineHeights.normal
    }
    small: {
      fontSize: sizes.sm
      fontWeight: weights.regular
      lineHeight: lineHeights.normal
    }
    caption: {
      fontSize: sizes.xs
      fontWeight: weights.regular
      lineHeight: lineHeights.normal
      color: text.secondary
    }
  }
}
```

### 1.4 Shadow System

```pseudo
SHADOWS {
  none: "none"
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)"
  md: "0 4px 6px rgba(0, 0, 0, 0.1)"
  lg: "0 10px 15px rgba(0, 0, 0, 0.1)"
  xl: "0 20px 25px rgba(0, 0, 0, 0.1)"
  xxl: "0 25px 50px rgba(0, 0, 0, 0.15)"

  // Special Shadows
  card: "0 2px 8px rgba(0, 0, 0, 0.08)"
  cardHover: "0 4px 12px rgba(0, 0, 0, 0.12)"
  modal: "0 20px 40px rgba(0, 0, 0, 0.2)"
  dropdown: "0 4px 12px rgba(0, 0, 0, 0.15)"
}
```

---

## 2. Main Layout Structure

### 2.1 Overall Layout

```pseudo
LAYOUT MainApplicationLayout {
  STRUCTURE:
    <AppContainer>
      <Sidebar /> {/* Fixed left sidebar */}
      <MainContent>
        <Header /> {/* Sticky header */}
        <PageContent /> {/* Scrollable content */}
      </MainContent>
    </AppContainer>

  DIMENSIONS:
    sidebar: {
      width: {
        desktop: 260px (expanded), 80px (collapsed)
        tablet: 260px (overlay)
        mobile: 100% (overlay, max 280px)
      }
      height: 100vh
      position: fixed
    }

    header: {
      height: 64px
      position: sticky
      top: 0
      zIndex: 100
    }

    mainContent: {
      marginLeft: {
        desktop: sidebar.width (if expanded)
        tablet: 0
        mobile: 0
      }
      minHeight: calc(100vh - header.height)
    }

  CSS:
    .app-container {
      display: flex
      minHeight: 100vh
      backgroundColor: backgrounds.page
    }

    .main-content {
      flex: 1
      display: flex
      flexDirection: column
      transition: margin-left 0.3s ease
    }

    .page-content {
      flex: 1
      padding: {
        mobile: 16px
        tablet: 24px
        desktop: 32px
      }
      overflowY: auto
    }
}
```

### 2.2 Sidebar Layout

```pseudo
LAYOUT Sidebar {
  STRUCTURE:
    <SidebarContainer>
      <UserProfile />
      <Navigation />
      <ClockInOut />
      <LogoutButton />
    </SidebarContainer>

  DIMENSIONS:
    width: {
      expanded: 260px
      collapsed: 80px
    }
    padding: 16px

  SECTIONS:
    userProfile: {
      height: auto
      padding: 16px
      marginBottom: 24px
      borderBottom: "1px solid rgba(255,255,255,0.1)"
    }

    navigation: {
      flex: 1
      overflowY: auto
    }

    clockInOut: {
      padding: 16px
      marginTop: auto
    }

    logout: {
      padding: 16px
    }

  CSS:
    .sidebar-container {
      width: ${width}
      height: 100vh
      backgroundColor: backgrounds.sidebar
      color: text.inverse
      display: flex
      flexDirection: column
      position: fixed
      left: 0
      top: 0
      transition: width 0.3s ease
      boxShadow: shadows.lg
      zIndex: 200
    }

    // Mobile Overlay
    @media (max-width: tablet) {
      .sidebar-container {
        transform: translateX(${isOpen ? '0' : '-100%'})
        transition: transform 0.3s ease
      }

      .sidebar-overlay {
        position: fixed
        top: 0
        left: 0
        right: 0
        bottom: 0
        backgroundColor: rgba(0, 0, 0, 0.5)
        zIndex: 190
        display: ${isOpen ? 'block' : 'none'}
      }
    }

  NAVIGATION_ITEM_LAYOUT:
    .nav-item {
      display: flex
      alignItems: center
      padding: 12px 16px
      marginBottom: 4px
      borderRadius: 8px
      cursor: pointer
      transition: all 0.2s

      &:hover {
        backgroundColor: rgba(255, 255, 255, 0.1)
      }

      &.active {
        backgroundColor: primary.500
      }
    }

    .nav-item-icon {
      width: 24px
      height: 24px
      marginRight: 12px

      // When collapsed, center icon
      @collapsed {
        marginRight: 0
      }
    }

    .nav-item-label {
      fontSize: sizes.sm
      fontWeight: weights.medium

      // Hide when collapsed
      @collapsed {
        display: none
      }
    }
}
```

### 2.3 Header Layout

```pseudo
LAYOUT Header {
  STRUCTURE:
    <HeaderContainer>
      <LeftSection>
        <MenuButton /> {/* Mobile only */}
        <PageTitle />
        <Breadcrumbs /> {/* Desktop only */}
      </LeftSection>

      <CenterSection>
        <SearchBar /> {/* Desktop/Tablet only */}
      </CenterSection>

      <RightSection>
        <QuickActions />
        <NotificationButton />
        <UserMenu />
      </RightSection>
    </HeaderContainer>

  DIMENSIONS:
    height: 64px
    padding: {
      horizontal: 24px
      vertical: 12px
    }

  CSS:
    .header-container {
      height: 64px
      backgroundColor: backgrounds.header
      borderBottom: "1px solid ${neutral.gray200}"
      display: flex
      alignItems: center
      justifyContent: space-between
      padding: 12px 24px
      position: sticky
      top: 0
      zIndex: 100
      boxShadow: shadows.sm
    }

    .left-section {
      display: flex
      alignItems: center
      gap: 16px
      flex: 1

      @mobile {
        flex: 0 // Don't grow on mobile
      }
    }

    .center-section {
      flex: 2
      maxWidth: 600px
      padding: 0 24px

      @mobile, @tablet {
        display: none
      }
    }

    .right-section {
      display: flex
      alignItems: center
      gap: 12px
      flex: 1
      justifyContent: flex-end
    }

  COMPONENTS:
    .page-title {
      fontSize: sizes.xl
      fontWeight: weights.semibold
      color: text.primary

      @mobile {
        fontSize: sizes.lg
      }
    }

    .search-bar {
      width: 100%
      maxWidth: 500px
      height: 40px
      borderRadius: 20px
      border: "1px solid ${neutral.gray300}"
      padding: 0 16px 0 40px
      backgroundColor: backgrounds.card
      position: relative
    }

    .notification-button {
      width: 40px
      height: 40px
      borderRadius: 50%
      position: relative

      .badge {
        position: absolute
        top: -4px
        right: -4px
        minWidth: 20px
        height: 20px
        borderRadius: 10px
        backgroundColor: semantic.error
        color: text.inverse
        fontSize: sizes.xs
        fontWeight: weights.bold
        display: flex
        alignItems: center
        justifyContent: center
        padding: 0 6px
      }
    }
}
```

---

## 3. Page-Specific Layouts

### 3.1 Dashboard Layout

```pseudo
LAYOUT DashboardPage {
  STRUCTURE:
    <PageContainer>
      {/* Stats Row */}
      <StatsGrid>
        <StatCard /> × 4
      </StatsGrid>

      <StatsGrid>
        <StatCard /> × 4
      </StatsGrid>

      {/* Content Grid */}
      <ContentGrid>
        <LeftColumn>
          <MyTasksCard />
          <UrgentTasksCard />
        </LeftColumn>

        <RightColumn>
          <SuiteStatusCard />
          <RecentActivityCard />
          <PinnedNotesCard />
        </RightColumn>
      </ContentGrid>
    </PageContainer>

  GRID_LAYOUT:
    .stats-grid {
      display: grid
      gridTemplateColumns: {
        mobile: "1fr"
        tablet: "repeat(2, 1fr)"
        desktop: "repeat(4, 1fr)"
      }
      gap: 16px
      marginBottom: 24px
    }

    .content-grid {
      display: grid
      gridTemplateColumns: {
        mobile: "1fr"
        tablet: "1fr"
        desktop: "2fr 1fr"
      }
      gap: 24px
    }

  STAT_CARD_DIMENSIONS:
    .stat-card {
      backgroundColor: backgrounds.card
      borderRadius: 12px
      padding: 24px
      boxShadow: shadows.card
      minHeight: 120px
      display: flex
      flexDirection: column
      justifyContent: space-between
      cursor: pointer
      transition: all 0.2s

      &:hover {
        boxShadow: shadows.cardHover
        transform: translateY(-2px)
      }
    }

    .stat-value {
      fontSize: sizes.xxxl
      fontWeight: weights.bold
      lineHeight: lineHeights.tight
      marginBottom: 4px
    }

    .stat-label {
      fontSize: sizes.sm
      color: text.secondary
      fontWeight: weights.medium
    }

    .stat-icon {
      width: 48px
      height: 48px
      borderRadius: 50%
      backgroundColor: rgba(primary.500, 0.1)
      display: flex
      alignItems: center
      justifyContent: center
      marginBottom: 12px
    }

  DASHBOARD_CARD:
    .dashboard-card {
      backgroundColor: backgrounds.card
      borderRadius: 12px
      padding: 24px
      boxShadow: shadows.card
      height: 100%
      display: flex
      flexDirection: column
    }

    .dashboard-card-header {
      display: flex
      justifyContent: space-between
      alignItems: center
      marginBottom: 16px
      paddingBottom: 12px
      borderBottom: "1px solid ${neutral.gray200}"
    }

    .dashboard-card-title {
      fontSize: sizes.lg
      fontWeight: weights.semibold
    }

    .dashboard-card-content {
      flex: 1
      overflowY: auto
    }
}
```

### 3.2 Suites Grid Layout

```pseudo
LAYOUT SuitesGridView {
  STRUCTURE:
    <SuitesContainer>
      <FiltersPanel /> {/* Collapsible */}
      <SuitesGrid>
        <SuiteCard /> × N
      </SuitesGrid>
    </SuitesContainer>

  GRID_LAYOUT:
    .suites-grid {
      display: grid
      gridTemplateColumns: {
        mobile: "1fr"
        tablet: "repeat(2, 1fr)"
        desktop: "repeat(3, 1fr)"
        wide: "repeat(4, 1fr)"
      }
      gap: {
        mobile: 16px
        tablet: 20px
        desktop: 24px
      }
      padding: 24px 0
    }

  SUITE_CARD_DIMENSIONS:
    .suite-card {
      backgroundColor: backgrounds.card
      borderRadius: 12px
      boxShadow: shadows.card
      overflow: hidden
      cursor: pointer
      transition: all 0.2s
      display: flex
      flexDirection: column
      minHeight: 200px

      &:hover {
        boxShadow: shadows.cardHover
        transform: translateY(-4px)
      }
    }

    .suite-card-header {
      padding: 16px
      borderBottom: "1px solid ${neutral.gray200}"
      display: flex
      justifyContent: space-between
      alignItems: center
    }

    .suite-number {
      fontSize: sizes.xl
      fontWeight: weights.bold
    }

    .suite-card-body {
      padding: 16px
      flex: 1
      display: flex
      flexDirection: column
      gap: 12px
    }

    .suite-card-footer {
      padding: 12px 16px
      backgroundColor: backgrounds.hover
      borderTop: "1px solid ${neutral.gray200}"
      fontSize: sizes.sm
      color: text.secondary
    }
}
```

### 3.3 Tasks List Layout

```pseudo
LAYOUT TasksListView {
  STRUCTURE:
    <TasksContainer>
      <FiltersPanel />
      <TasksList>
        <TaskCard /> × N
      </TasksList>
    </TasksContainer>

  LIST_LAYOUT:
    .tasks-list {
      display: flex
      flexDirection: column
      gap: 12px
    }

  TASK_CARD_DIMENSIONS:
    .task-card {
      backgroundColor: backgrounds.card
      borderRadius: 8px
      boxShadow: shadows.card
      padding: 16px
      cursor: pointer
      transition: all 0.2s
      position: relative
      overflow: hidden
      borderLeft: "4px solid ${priorityColor}"

      &:hover {
        boxShadow: shadows.cardHover
      }
    }

    .task-card-content {
      display: flex
      gap: 16px
      alignItems: flex-start

      @mobile {
        flexDirection: column
      }
    }

    .task-main {
      flex: 1
      minWidth: 0
    }

    .task-actions {
      display: flex
      gap: 8px
      flexShrink: 0

      @mobile {
        width: 100%
        justifyContent: flex-end
      }
    }
}
```

### 3.4 Kanban Board Layout

```pseudo
LAYOUT TasksKanbanView {
  STRUCTURE:
    <KanbanContainer>
      <KanbanColumn status="PENDING" />
      <KanbanColumn status="ASSIGNED" />
      <KanbanColumn status="IN_PROGRESS" />
      <KanbanColumn status="COMPLETED" />
    </KanbanContainer>

  GRID_LAYOUT:
    .kanban-container {
      display: flex
      gap: 16px
      overflowX: auto
      paddingBottom: 16px
      minHeight: calc(100vh - 200px)

      @mobile {
        flexDirection: column
        overflowX: visible
      }
    }

    .kanban-column {
      backgroundColor: backgrounds.hover
      borderRadius: 12px
      padding: 16px
      minWidth: {
        mobile: 100%
        tablet: 300px
        desktop: 320px
      }
      maxWidth: {
        mobile: 100%
        tablet: none
        desktop: 400px
      }
      display: flex
      flexDirection: column
      flexShrink: 0

      @mobile {
        minWidth: 100%
      }
    }

    .kanban-column-header {
      display: flex
      justifyContent: space-between
      alignItems: center
      marginBottom: 16px
      padding: 12px
      backgroundColor: backgrounds.card
      borderRadius: 8px
    }

    .kanban-column-title {
      fontSize: sizes.base
      fontWeight: weights.semibold
    }

    .kanban-column-count {
      fontSize: sizes.sm
      color: text.secondary
      backgroundColor: neutral.gray200
      borderRadius: 12px
      padding: 4px 8px
      minWidth: 24px
      textAlign: center
    }

    .kanban-cards {
      flex: 1
      overflowY: auto
      display: flex
      flexDirection: column
      gap: 12px
      padding: 4px
    }

    .kanban-task-card {
      backgroundColor: backgrounds.card
      borderRadius: 8px
      padding: 12px
      boxShadow: shadows.sm
      cursor: grab

      &:active {
        cursor: grabbing
        boxShadow: shadows.lg
      }

      &.dragging {
        opacity: 0.5
      }
    }
}
```

---

## 4. Component-Level Layouts

### 4.1 Modal Layout

```pseudo
LAYOUT Modal {
  STRUCTURE:
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader />
        <ModalBody />
        <ModalFooter />
      </ModalContainer>
    </ModalOverlay>

  DIMENSIONS:
    .modal-overlay {
      position: fixed
      top: 0
      left: 0
      right: 0
      bottom: 0
      backgroundColor: rgba(0, 0, 0, 0.5)
      display: flex
      alignItems: center
      justifyContent: center
      zIndex: 1000
      padding: 16px
    }

    .modal-container {
      backgroundColor: backgrounds.card
      borderRadius: 12px
      boxShadow: shadows.modal
      width: 100%
      maxWidth: {
        small: 400px
        medium: 600px
        large: 800px
        xlarge: 1000px
      }
      maxHeight: 90vh
      display: flex
      flexDirection: column

      @mobile {
        maxWidth: 100%
        maxHeight: 100%
        borderRadius: 0
      }
    }

    .modal-header {
      padding: 24px
      borderBottom: "1px solid ${neutral.gray200}"
      display: flex
      justifyContent: space-between
      alignItems: center
      flexShrink: 0
    }

    .modal-title {
      fontSize: sizes.xl
      fontWeight: weights.semibold
    }

    .modal-body {
      padding: 24px
      overflowY: auto
      flex: 1
    }

    .modal-footer {
      padding: 24px
      borderTop: "1px solid ${neutral.gray200}"
      display: flex
      justifyContent: flex-end
      gap: 12px
      flexShrink: 0

      @mobile {
        flexDirection: column-reverse
      }
    }
}
```

### 4.2 Form Layout

```pseudo
LAYOUT Form {
  STRUCTURE:
    <FormContainer>
      <FormField /> × N
      <FormActions />
    </FormContainer>

  DIMENSIONS:
    .form-container {
      display: flex
      flexDirection: column
      gap: 20px
    }

    .form-field {
      display: flex
      flexDirection: column
      gap: 8px
    }

    .form-label {
      fontSize: sizes.sm
      fontWeight: weights.medium
      color: text.primary

      &.required::after {
        content: " *"
        color: semantic.error
      }
    }

    .form-input {
      height: 40px
      padding: 0 12px
      border: "1px solid ${neutral.gray300}"
      borderRadius: 6px
      fontSize: sizes.base
      transition: all 0.2s

      &:focus {
        outline: none
        borderColor: primary.500
        boxShadow: "0 0 0 3px rgba(${primary.500}, 0.1)"
      }

      &.error {
        borderColor: semantic.error
      }
    }

    .form-textarea {
      minHeight: 100px
      padding: 12px
      border: "1px solid ${neutral.gray300}"
      borderRadius: 6px
      fontSize: sizes.base
      resize: vertical
      fontFamily: fontFamilies.primary

      &:focus {
        outline: none
        borderColor: primary.500
        boxShadow: "0 0 0 3px rgba(${primary.500}, 0.1)"
      }
    }

    .form-error {
      fontSize: sizes.sm
      color: semantic.error
      marginTop: 4px
    }

    .form-help {
      fontSize: sizes.sm
      color: text.secondary
      marginTop: 4px
    }

    .form-row {
      display: grid
      gridTemplateColumns: {
        mobile: "1fr"
        tablet: "repeat(2, 1fr)"
      }
      gap: 16px
    }

    .form-actions {
      display: flex
      gap: 12px
      justifyContent: flex-end
      marginTop: 24px
      paddingTop: 24px
      borderTop: "1px solid ${neutral.gray200}"

      @mobile {
        flexDirection: column-reverse
      }
    }
}
```

### 4.3 Card Layout

```pseudo
LAYOUT Card {
  STRUCTURE:
    <Card>
      <CardHeader />
      <CardBody />
      <CardFooter />
    </Card>

  BASE_STYLES:
    .card {
      backgroundColor: backgrounds.card
      borderRadius: 8px
      boxShadow: shadows.card
      overflow: hidden
      transition: all 0.2s

      &.clickable {
        cursor: pointer

        &:hover {
          boxShadow: shadows.cardHover
          transform: translateY(-2px)
        }
      }
    }

    .card-header {
      padding: 16px
      borderBottom: "1px solid ${neutral.gray200}"
      display: flex
      justifyContent: space-between
      alignItems: center
    }

    .card-title {
      fontSize: sizes.base
      fontWeight: weights.semibold
    }

    .card-body {
      padding: 16px
    }

    .card-footer {
      padding: 12px 16px
      backgroundColor: backgrounds.hover
      borderTop: "1px solid ${neutral.gray200}"
      fontSize: sizes.sm
      color: text.secondary
    }

  VARIANTS:
    .card-compact {
      .card-header, .card-body, .card-footer {
        padding: 12px
      }
    }

    .card-spacious {
      .card-header, .card-body, .card-footer {
        padding: 24px
      }
    }
}
```

### 4.4 Table Layout

```pseudo
LAYOUT Table {
  STRUCTURE:
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell /> × N
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell /> × N
          </TableRow> × M
        </TableBody>
      </Table>
    </TableContainer>

  DIMENSIONS:
    .table-container {
      backgroundColor: backgrounds.card
      borderRadius: 8px
      boxShadow: shadows.card
      overflowX: auto
    }

    .table {
      width: 100%
      borderCollapse: collapse
      fontSize: sizes.sm
    }

    .table-header {
      backgroundColor: backgrounds.hover
      borderBottom: "2px solid ${neutral.gray300}"
    }

    .table-header-cell {
      padding: 12px 16px
      textAlign: left
      fontSize: sizes.sm
      fontWeight: weights.semibold
      color: text.secondary
      textTransform: uppercase
      letterSpacing: 0.5px
    }

    .table-row {
      borderBottom: "1px solid ${neutral.gray200}"
      transition: backgroundColor 0.2s

      &:hover {
        backgroundColor: backgrounds.hover
      }

      &:last-child {
        borderBottom: none
      }
    }

    .table-cell {
      padding: 16px
      verticalAlign: middle
    }

  RESPONSIVE:
    @mobile {
      // Stack table on mobile
      .table-header {
        display: none
      }

      .table-row {
        display: block
        marginBottom: 16px
        border: "1px solid ${neutral.gray200}"
        borderRadius: 8px
      }

      .table-cell {
        display: flex
        justifyContent: space-between
        padding: 12px 16px
        borderBottom: "1px solid ${neutral.gray200}"

        &:last-child {
          borderBottom: none
        }

        &::before {
          content: attr(data-label)
          fontWeight: weights.semibold
          color: text.secondary
          marginRight: 16px
        }
      }
    }
}
```

---

## 5. Responsive Patterns

### 5.1 Navigation Patterns

```pseudo
RESPONSIVE_PATTERN Navigation {
  // Desktop: Permanent sidebar
  @desktop {
    .sidebar {
      position: fixed
      transform: none
      transition: width 0.3s ease
    }

    .main-content {
      marginLeft: sidebar.width
    }

    .mobile-menu-button {
      display: none
    }
  }

  // Tablet: Overlay sidebar
  @tablet {
    .sidebar {
      position: fixed
      transform: translateX(${isOpen ? '0' : '-100%'})
      transition: transform 0.3s ease
      zIndex: 200
    }

    .sidebar-overlay {
      display: ${isOpen ? 'block' : 'none'}
      position: fixed
      inset: 0
      backgroundColor: rgba(0, 0, 0, 0.5)
      zIndex: 190
    }

    .main-content {
      marginLeft: 0
    }
  }

  // Mobile: Full-screen overlay sidebar
  @mobile {
    .sidebar {
      width: 100%
      maxWidth: 280px
      position: fixed
      transform: translateX(${isOpen ? '0' : '-100%'})
      transition: transform 0.3s ease
      zIndex: 200
    }
  }
}
```

### 5.2 Content Patterns

```pseudo
RESPONSIVE_PATTERN ContentGrid {
  // Desktop: Multi-column layout
  @desktop {
    .content-grid {
      display: grid
      gridTemplateColumns: "2fr 1fr"
      gap: 24px
    }
  }

  // Tablet: Reduced columns
  @tablet {
    .content-grid {
      display: grid
      gridTemplateColumns: "1fr"
      gap: 20px
    }
  }

  // Mobile: Single column
  @mobile {
    .content-grid {
      display: flex
      flexDirection: column
      gap: 16px
    }
  }
}

RESPONSIVE_PATTERN CardsGrid {
  @desktop {
    gridTemplateColumns: "repeat(4, 1fr)"
    gap: 24px
  }

  @tablet {
    gridTemplateColumns: "repeat(2, 1fr)"
    gap: 20px
  }

  @mobile {
    gridTemplateColumns: "1fr"
    gap: 16px
  }
}
```

### 5.3 Form Patterns

```pseudo
RESPONSIVE_PATTERN FormLayout {
  @desktop {
    .form-row {
      display: grid
      gridTemplateColumns: "repeat(2, 1fr)"
      gap: 16px
    }

    .modal-footer {
      display: flex
      flexDirection: row
      justifyContent: flex-end
    }
  }

  @mobile {
    .form-row {
      display: flex
      flexDirection: column
      gap: 16px
    }

    .modal-footer {
      display: flex
      flexDirection: column-reverse
      gap: 12px
    }

    .modal-footer button {
      width: 100%
    }
  }
}
```

---

## 6. Animation & Transitions

```pseudo
ANIMATIONS {
  // Fade In
  fadeIn: {
    from: { opacity: 0 }
    to: { opacity: 1 }
    duration: 0.2s
    timing: ease-out
  }

  // Slide In From Right
  slideInRight: {
    from: { transform: translateX(100%) }
    to: { transform: translateX(0) }
    duration: 0.3s
    timing: ease-out
  }

  // Slide In From Left
  slideInLeft: {
    from: { transform: translateX(-100%) }
    to: { transform: translateX(0) }
    duration: 0.3s
    timing: ease-out
  }

  // Scale In
  scaleIn: {
    from: {
      opacity: 0
      transform: scale(0.9)
    }
    to: {
      opacity: 1
      transform: scale(1)
    }
    duration: 0.2s
    timing: ease-out
  }

  // Bounce
  bounce: {
    0%, 100%: { transform: translateY(0) }
    50%: { transform: translateY(-10px) }
    duration: 0.5s
    timing: ease-in-out
  }

  // Spin
  spin: {
    from: { transform: rotate(0deg) }
    to: { transform: rotate(360deg) }
    duration: 1s
    timing: linear
    iteration: infinite
  }
}

TRANSITIONS {
  // Default Transition
  default: "all 0.2s ease"

  // Fast Transition
  fast: "all 0.1s ease"

  // Slow Transition
  slow: "all 0.3s ease"

  // Color Transition
  color: "color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease"

  // Transform Transition
  transform: "transform 0.2s ease"

  // Shadow Transition
  shadow: "box-shadow 0.2s ease"

  // Complex
  complex: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
}
```

---

## 7. Loading & Empty States

```pseudo
LAYOUT LoadingState {
  .loading-container {
    display: flex
    flexDirection: column
    alignItems: center
    justifyContent: center
    padding: 48px
    minHeight: 300px
  }

  .loading-spinner {
    width: 40px
    height: 40px
    border: "4px solid ${neutral.gray200}"
    borderTop: "4px solid ${primary.500}"
    borderRadius: 50%
    animation: spin 1s linear infinite
  }

  .loading-text {
    marginTop: 16px
    fontSize: sizes.base
    color: text.secondary
  }
}

LAYOUT EmptyState {
  .empty-state-container {
    display: flex
    flexDirection: column
    alignItems: center
    justifyContent: center
    padding: 48px
    minHeight: 300px
    textAlign: center
  }

  .empty-state-icon {
    width: 64px
    height: 64px
    marginBottom: 16px
    color: neutral.gray400
  }

  .empty-state-title {
    fontSize: sizes.lg
    fontWeight: weights.semibold
    marginBottom: 8px
    color: text.primary
  }

  .empty-state-description {
    fontSize: sizes.base
    color: text.secondary
    marginBottom: 24px
    maxWidth: 400px
  }

  .empty-state-action {
    // Button or link to create new item
  }
}
```

---

## 8. Accessibility Patterns

```pseudo
ACCESSIBILITY {
  // Focus Styles
  focusRing: {
    outline: "2px solid ${primary.500}"
    outlineOffset: 2px
  }

  // Skip to Content Link
  skipLink: {
    position: absolute
    top: -40px
    left: 0
    backgroundColor: primary.500
    color: text.inverse
    padding: 8px
    textDecoration: none
    zIndex: 9999

    &:focus {
      top: 0
    }
  }

  // Screen Reader Only
  srOnly: {
    position: absolute
    width: 1px
    height: 1px
    margin: -1px
    padding: 0
    overflow: hidden
    clip: rect(0, 0, 0, 0)
    border: 0
  }

  // Keyboard Navigation
  keyboardNav: {
    // Ensure all interactive elements are keyboard accessible
    // Tab order should be logical
    // Provide visible focus indicators
    // Support keyboard shortcuts
  }

  // ARIA Labels
  ariaLabels: {
    // All interactive elements should have descriptive labels
    // Use aria-label, aria-labelledby, or aria-describedby
    // Ensure icons have text alternatives
  }

  // Color Contrast
  colorContrast: {
    // Minimum contrast ratio of 4.5:1 for normal text
    // Minimum contrast ratio of 3:1 for large text
    // Ensure sufficient contrast in all states (normal, hover, focus, disabled)
  }
}
```

This comprehensive UI layout structure provides a complete design system and layout patterns for building a professional, accessible, and responsive motel management application.
