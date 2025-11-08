# Real-Time Synchronization Logic

## Overview
This document defines the real-time synchronization system using WebSockets for live updates between manager and employee views, offline support, and conflict resolution.

---

## 1. WebSocket Connection Architecture

### 1.1 Connection Setup

```javascript
// Client-Side Connection
CLASS WebSocketManager {
  PROPERTIES:
    - socket: WebSocket | null
    - connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING'
    - reconnectAttempts: number
    - maxReconnectAttempts: number = 5
    - reconnectDelay: number = 1000 // milliseconds
    - heartbeatInterval: number = 30000 // 30 seconds
    - heartbeatTimer: Timer | null
    - messageQueue: Array<Message> // For offline messages
    - subscriptions: Map<string, Set<Function>> // Event subscriptions

  CONSTRUCTOR(authToken: string) {
    this.connect(authToken)
  }

  METHOD connect(authToken: string) {
    TRY {
      SET this.connectionState = 'CONNECTING'

      // WebSocket URL with auth token
      wsUrl = `${WS_BASE_URL}?token=${authToken}`

      SET this.socket = NEW WebSocket(wsUrl)

      // Connection opened
      this.socket.onopen = () => {
        CONSOLE.log('WebSocket connected')
        SET this.connectionState = 'CONNECTED'
        SET this.reconnectAttempts = 0

        // Start heartbeat
        this.startHeartbeat()

        // Process queued messages
        this.processMessageQueue()

        // Emit connected event
        this.emit('connected')
      }

      // Message received
      this.socket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

      // Connection closed
      this.socket.onclose = (event) => {
        CONSOLE.log('WebSocket disconnected', event.code, event.reason)
        SET this.connectionState = 'DISCONNECTED'

        this.stopHeartbeat()
        this.emit('disconnected')

        // Attempt reconnection if not a clean close
        IF !event.wasClean {
          this.reconnect()
        }
      }

      // Connection error
      this.socket.onerror = (error) => {
        CONSOLE.error('WebSocket error', error)
        this.emit('error', error)
      }

    } CATCH (error) {
      CONSOLE.error('Failed to connect to WebSocket', error)
      this.reconnect()
    }
  }

  METHOD reconnect() {
    IF this.reconnectAttempts >= this.maxReconnectAttempts {
      CONSOLE.error('Max reconnection attempts reached')
      this.emit('reconnect_failed')
      RETURN
    }

    SET this.connectionState = 'RECONNECTING'
    INCREMENT this.reconnectAttempts

    // Exponential backoff
    delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    CONSOLE.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`)

    TIMEOUT(() => {
      this.connect(this.authToken)
    }, delay)
  }

  METHOD startHeartbeat() {
    this.heartbeatTimer = INTERVAL(() => {
      IF this.connectionState == 'CONNECTED' {
        this.send({
          type: 'HEARTBEAT',
          timestamp: Date.now()
        })
      }
    }, this.heartbeatInterval)
  }

  METHOD stopHeartbeat() {
    IF this.heartbeatTimer {
      CLEAR_INTERVAL(this.heartbeatTimer)
      SET this.heartbeatTimer = null
    }
  }

  METHOD send(message: object) {
    IF this.connectionState == 'CONNECTED' {
      this.socket.send(JSON.stringify(message))
    } ELSE {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
    }
  }

  METHOD processMessageQueue() {
    WHILE this.messageQueue.length > 0 {
      message = this.messageQueue.shift()
      this.send(message)
    }
  }

  METHOD handleMessage(message: object) {
    SWITCH message.type {
      CASE 'HEARTBEAT_ACK':
        // Connection is healthy
        BREAK

      CASE 'ENTITY_CREATED':
      CASE 'ENTITY_UPDATED':
      CASE 'ENTITY_DELETED':
        this.emit(message.type, message.data)
        BREAK

      CASE 'NOTIFICATION':
        this.emit('notification', message.data)
        BREAK

      CASE 'BROADCAST':
        this.emit('broadcast', message.data)
        BREAK

      DEFAULT:
        this.emit(message.type, message.data)
    }
  }

  // Pub/Sub pattern for event handling
  METHOD on(event: string, callback: Function) {
    IF !this.subscriptions.has(event) {
      this.subscriptions.set(event, new Set())
    }
    this.subscriptions.get(event).add(callback)
  }

  METHOD off(event: string, callback: Function) {
    IF this.subscriptions.has(event) {
      this.subscriptions.get(event).delete(callback)
    }
  }

  METHOD emit(event: string, data?: any) {
    IF this.subscriptions.has(event) {
      FOR EACH callback IN this.subscriptions.get(event) {
        TRY {
          callback(data)
        } CATCH (error) {
          CONSOLE.error('Error in event callback', error)
        }
      }
    }
  }

  METHOD disconnect() {
    this.stopHeartbeat()
    IF this.socket {
      this.socket.close(1000, 'Client disconnect')
      SET this.socket = null
    }
    SET this.connectionState = 'DISCONNECTED'
  }
}
```

### 1.2 Server-Side WebSocket Handler

```javascript
// Server-Side (Node.js with ws library)
CLASS WebSocketServer {
  PROPERTIES:
    - wss: WebSocketServer
    - clients: Map<userId, Set<WebSocket>> // Multiple connections per user
    - rooms: Map<roomId, Set<userId>> // Room-based broadcasting

  METHOD initialize() {
    this.wss = NEW WebSocketServer({ port: 8080 })

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request)
    })
  }

  METHOD handleConnection(ws: WebSocket, request: Request) {
    // Extract and verify JWT token
    token = this.extractToken(request)

    TRY {
      user = this.verifyToken(token)
    } CATCH (error) {
      ws.close(1008, 'Authentication failed')
      RETURN
    }

    // Register connection
    IF !this.clients.has(user.id) {
      this.clients.set(user.id, new Set())
    }
    this.clients.get(user.id).add(ws)

    // Join default rooms
    this.joinRoom(user.id, 'all_staff')
    this.joinRoom(user.id, `department:${user.department}`)

    CONSOLE.log(`User ${user.id} connected (${this.clients.get(user.id).size} connections)`)

    // Set up message handler
    ws.on('message', (data) => {
      this.handleMessage(ws, user, JSON.parse(data))
    })

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws, user)
    })

    // Handle errors
    ws.on('error', (error) => {
      CONSOLE.error('WebSocket error', error)
    })

    // Send connection acknowledgment
    this.sendToClient(ws, {
      type: 'CONNECTED',
      userId: user.id,
      timestamp: Date.now()
    })
  }

  METHOD handleMessage(ws: WebSocket, user: User, message: object) {
    SWITCH message.type {
      CASE 'HEARTBEAT':
        this.sendToClient(ws, {
          type: 'HEARTBEAT_ACK',
          timestamp: Date.now()
        })
        BREAK

      CASE 'SUBSCRIBE':
        // Subscribe to specific entity updates
        this.subscribe(user.id, message.entityType, message.entityId)
        BREAK

      CASE 'UNSUBSCRIBE':
        this.unsubscribe(user.id, message.entityType, message.entityId)
        BREAK

      DEFAULT:
        CONSOLE.warn('Unknown message type', message.type)
    }
  }

  METHOD handleDisconnection(ws: WebSocket, user: User) {
    IF this.clients.has(user.id) {
      this.clients.get(user.id).delete(ws)

      IF this.clients.get(user.id).size == 0 {
        this.clients.delete(user.id)
        this.leaveAllRooms(user.id)
      }

      CONSOLE.log(`User ${user.id} disconnected`)
    }
  }

  METHOD sendToClient(ws: WebSocket, message: object) {
    IF ws.readyState == WebSocket.OPEN {
      ws.send(JSON.stringify(message))
    }
  }

  METHOD sendToUser(userId: string, message: object) {
    IF this.clients.has(userId) {
      FOR EACH ws IN this.clients.get(userId) {
        this.sendToClient(ws, message)
      }
    }
  }

  METHOD broadcastToRoom(roomId: string, message: object, excludeUserId?: string) {
    IF this.rooms.has(roomId) {
      FOR EACH userId IN this.rooms.get(roomId) {
        IF userId != excludeUserId {
          this.sendToUser(userId, message)
        }
      }
    }
  }

  METHOD joinRoom(userId: string, roomId: string) {
    IF !this.rooms.has(roomId) {
      this.rooms.set(roomId, new Set())
    }
    this.rooms.get(roomId).add(userId)
  }

  METHOD leaveRoom(userId: string, roomId: string) {
    IF this.rooms.has(roomId) {
      this.rooms.get(roomId).delete(userId)
      IF this.rooms.get(roomId).size == 0 {
        this.rooms.delete(roomId)
      }
    }
  }

  METHOD leaveAllRooms(userId: string) {
    FOR EACH [roomId, users] IN this.rooms {
      users.delete(userId)
      IF users.size == 0 {
        this.rooms.delete(roomId)
      }
    }
  }
}
```

---

## 2. Real-Time Event Types

### 2.1 Entity Events

```typescript
// Suite Events
EVENT SuiteCreated {
  type: 'ENTITY_CREATED',
  entityType: 'SUITE',
  data: {
    suite: Suite,
    createdBy: string,
    timestamp: string
  }
}

EVENT SuiteUpdated {
  type: 'ENTITY_UPDATED',
  entityType: 'SUITE',
  data: {
    suiteId: string,
    changes: {
      before: Partial<Suite>,
      after: Partial<Suite>
    },
    updatedBy: string,
    timestamp: string
  }
}

EVENT SuiteDeleted {
  type: 'ENTITY_DELETED',
  entityType: 'SUITE',
  data: {
    suiteId: string,
    deletedBy: string,
    timestamp: string
  }
}

// Task Events
EVENT TaskCreated {
  type: 'ENTITY_CREATED',
  entityType: 'TASK',
  data: {
    task: Task,
    createdBy: string,
    timestamp: string
  }
}

EVENT TaskUpdated {
  type: 'ENTITY_UPDATED',
  entityType: 'TASK',
  data: {
    taskId: string,
    changes: {
      before: Partial<Task>,
      after: Partial<Task>
    },
    updatedBy: string,
    timestamp: string
  }
}

EVENT TaskAssigned {
  type: 'TASK_ASSIGNED',
  data: {
    taskId: string,
    task: Task,
    assignedTo: string,
    assignedBy: string,
    timestamp: string
  }
}

EVENT TaskStatusChanged {
  type: 'TASK_STATUS_CHANGED',
  data: {
    taskId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus,
    changedBy: string,
    timestamp: string
  }
}

// Employee Events
EVENT EmployeeStatusChanged {
  type: 'EMPLOYEE_STATUS_CHANGED',
  data: {
    employeeId: string,
    oldStatus: EmployeeStatus,
    newStatus: EmployeeStatus,
    isOnDuty: boolean,
    timestamp: string
  }
}

// Note Events
EVENT NoteCreated {
  type: 'ENTITY_CREATED',
  entityType: 'NOTE',
  data: {
    note: Note,
    createdBy: string,
    timestamp: string
  }
}

EVENT NoteCommentAdded {
  type: 'NOTE_COMMENT_ADDED',
  data: {
    noteId: string,
    comment: Comment,
    timestamp: string
  }
}

// Notification Events
EVENT NotificationCreated {
  type: 'NOTIFICATION',
  data: {
    notification: Notification,
    timestamp: string
  }
}
```

### 2.2 Broadcast Events

```typescript
EVENT EmergencyAlert {
  type: 'EMERGENCY_ALERT',
  data: {
    title: string,
    message: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    relatedTaskId?: string,
    relatedSuiteId?: string,
    timestamp: string
  }
}

EVENT SystemAnnouncement {
  type: 'SYSTEM_ANNOUNCEMENT',
  data: {
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH',
    expiresAt?: string,
    timestamp: string
  }
}

EVENT ShiftChange {
  type: 'SHIFT_CHANGE',
  data: {
    oldShift: string,
    newShift: string,
    onDutyEmployees: Array<string>,
    timestamp: string
  }
}
```

---

## 3. Client-Side Real-Time Integration

### 3.1 React Hook for Real-Time Updates

```typescript
// useRealTimeSync.ts
FUNCTION useRealTimeSync(entityType: string, entityId?: string) {
  CONST [isConnected, setIsConnected] = useState(false)
  CONST wsManager = useRef<WebSocketManager | null>(null)
  CONST dispatch = useDispatch()

  // Initialize WebSocket connection
  useEffect(() => {
    authToken = getAuthToken()

    IF authToken {
      wsManager.current = NEW WebSocketManager(authToken)

      // Subscribe to connection events
      wsManager.current.on('connected', () => {
        setIsConnected(true)
        CONSOLE.log('Real-time sync connected')

        // Subscribe to entity updates
        IF entityType {
          wsManager.current.send({
            type: 'SUBSCRIBE',
            entityType: entityType,
            entityId: entityId
          })
        }
      })

      wsManager.current.on('disconnected', () => {
        setIsConnected(false)
        CONSOLE.log('Real-time sync disconnected')
      })

      // Handle entity updates
      wsManager.current.on('ENTITY_CREATED', handleEntityCreated)
      wsManager.current.on('ENTITY_UPDATED', handleEntityUpdated)
      wsManager.current.on('ENTITY_DELETED', handleEntityDeleted)

      // Handle specific events
      wsManager.current.on('TASK_ASSIGNED', handleTaskAssigned)
      wsManager.current.on('TASK_STATUS_CHANGED', handleTaskStatusChanged)
      wsManager.current.on('NOTIFICATION', handleNotification)
      wsManager.current.on('EMERGENCY_ALERT', handleEmergencyAlert)
    }

    // Cleanup
    RETURN () => {
      IF wsManager.current {
        wsManager.current.disconnect()
      }
    }
  }, [entityType, entityId])

  // Event Handlers
  CONST handleEntityCreated = (data) => {
    SWITCH data.entityType {
      CASE 'SUITE':
        dispatch(addSuite(data.data.suite))
        dispatch(showToast({
          type: 'INFO',
          message: `New suite ${data.data.suite.suiteNumber} created`
        }))
        BREAK

      CASE 'TASK':
        dispatch(addTask(data.data.task))

        // Notify if assigned to current user
        IF data.data.task.assignedTo == currentUser.id {
          dispatch(showToast({
            type: 'INFO',
            message: `New task assigned: ${data.data.task.title}`
          }))
        }
        BREAK

      CASE 'NOTE':
        dispatch(addNote(data.data.note))
        BREAK
    }
  }

  CONST handleEntityUpdated = (data) => {
    // Check if update was made by current user
    IF data.data.updatedBy == currentUser.id {
      // Skip - already updated locally via optimistic update
      RETURN
    }

    SWITCH data.entityType {
      CASE 'SUITE':
        dispatch(updateSuite(data.data.suiteId, data.data.changes.after))

        // Show notification for important changes
        IF data.data.changes.after.status {
          dispatch(showToast({
            type: 'INFO',
            message: `Suite ${getSuiteNumber(data.data.suiteId)} status changed`
          }))
        }
        BREAK

      CASE 'TASK':
        dispatch(updateTask(data.data.taskId, data.data.changes.after))
        BREAK

      CASE 'NOTE':
        dispatch(updateNote(data.data.noteId, data.data.changes.after))
        BREAK
    }
  }

  CONST handleEntityDeleted = (data) => {
    IF data.data.deletedBy == currentUser.id {
      RETURN
    }

    SWITCH data.entityType {
      CASE 'SUITE':
        dispatch(removeSuite(data.data.suiteId))
        BREAK

      CASE 'TASK':
        dispatch(removeTask(data.data.taskId))
        BREAK

      CASE 'NOTE':
        dispatch(removeNote(data.data.noteId))
        BREAK
    }
  }

  CONST handleTaskAssigned = (data) => {
    IF data.data.assignedTo == currentUser.id {
      dispatch(addTask(data.data.task))
      dispatch(createNotification({
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: data.data.task.title,
        relatedEntityId: data.data.taskId
      }))
      dispatch(showToast({
        type: 'INFO',
        message: `New task assigned: ${data.data.task.title}`
      }))
    }
  }

  CONST handleTaskStatusChanged = (data) => {
    dispatch(updateTask(data.data.taskId, {
      status: data.data.newStatus
    }))

    // Update related suite if task is completed
    IF data.data.newStatus == 'COMPLETED' {
      task = getTaskById(data.data.taskId)
      IF task.type == 'CLEANING' {
        dispatch(fetchSuiteById(task.suiteId)) // Refresh suite status
      }
    }
  }

  CONST handleNotification = (data) => {
    dispatch(addNotification(data.data.notification))

    // Show toast for high priority notifications
    IF data.data.notification.priority IN ['HIGH', 'URGENT'] {
      dispatch(showToast({
        type: 'WARNING',
        message: data.data.notification.title,
        duration: 5000
      }))
    }
  }

  CONST handleEmergencyAlert = (data) => {
    dispatch(showToast({
      type: 'ERROR',
      message: `EMERGENCY: ${data.data.message}`,
      duration: 10000
    }))

    // Show prominent alert modal
    dispatch(openModal('emergency-alert', data.data))

    // Play alert sound (if enabled)
    playAlertSound()
  }

  RETURN {
    isConnected,
    wsManager: wsManager.current
  }
}
```

### 3.2 Integration with State Management

```typescript
// Optimistic Updates with Real-Time Sync

ASYNC FUNCTION updateTaskWithSync(taskId, updates) {
  // Get original state for rollback
  originalTask = getState().tasks.items[taskId]

  // Optimistic update
  dispatch(updateTaskLocal(taskId, updates))

  TRY {
    // API call
    updatedTask = AWAIT api.patch(`/tasks/${taskId}`, updates)

    // Update with server response
    dispatch(updateTask(updatedTask))

    // Broadcast update via WebSocket
    wsManager.send({
      type: 'ENTITY_UPDATED',
      entityType: 'TASK',
      data: {
        taskId: taskId,
        changes: {
          before: originalTask,
          after: updatedTask
        },
        updatedBy: currentUser.id,
        timestamp: new Date().toISOString()
      }
    })

  } CATCH (error) {
    // Rollback optimistic update
    dispatch(updateTaskLocal(taskId, originalTask))

    dispatch(showToast({
      type: 'ERROR',
      message: 'Failed to update task'
    }))

    THROW error
  }
}
```

---

## 4. Offline Support & Sync

### 4.1 Offline Detection

```typescript
CLASS OfflineManager {
  PROPERTIES:
    - isOnline: boolean
    - pendingOperations: Array<Operation>
    - syncInProgress: boolean

  CONSTRUCTOR() {
    this.isOnline = navigator.onLine
    this.setupEventListeners()
    this.loadPendingOperations()
  }

  METHOD setupEventListeners() {
    window.addEventListener('online', () => {
      this.handleOnline()
    })

    window.addEventListener('offline', () => {
      this.handleOffline()
    })
  }

  METHOD handleOnline() {
    this.isOnline = true
    CONSOLE.log('Connection restored')

    dispatch(updateSyncStatus({
      isOnline: true
    }))

    dispatch(showToast({
      type: 'SUCCESS',
      message: 'Connection restored. Syncing changes...'
    }))

    // Sync pending operations
    this.syncPendingOperations()
  }

  METHOD handleOffline() {
    this.isOnline = false
    CONSOLE.log('Connection lost')

    dispatch(updateSyncStatus({
      isOnline: false
    }))

    dispatch(showToast({
      type: 'WARNING',
      message: 'Connection lost. Changes will be saved locally.',
      duration: 5000
    }))
  }

  METHOD queueOperation(operation: Operation) {
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now(),
      id: generateUUID()
    })

    this.savePendingOperations()

    dispatch(updateSyncStatus({
      pendingChanges: this.pendingOperations.length
    }))
  }

  ASYNC METHOD syncPendingOperations() {
    IF this.syncInProgress OR !this.isOnline {
      RETURN
    }

    this.syncInProgress = true

    dispatch(updateSyncStatus({
      syncInProgress: true
    }))

    successCount = 0
    failedOperations = []

    FOR EACH operation IN this.pendingOperations {
      TRY {
        AWAIT this.executeOperation(operation)
        successCount++
      } CATCH (error) {
        CONSOLE.error('Failed to sync operation', operation, error)
        failedOperations.push(operation)
      }
    }

    // Update pending operations (keep failed ones)
    this.pendingOperations = failedOperations
    this.savePendingOperations()

    this.syncInProgress = false

    dispatch(updateSyncStatus({
      syncInProgress: false,
      pendingChanges: failedOperations.length,
      lastSyncTime: Date.now()
    }))

    IF successCount > 0 {
      dispatch(showToast({
        type: 'SUCCESS',
        message: `Synced ${successCount} change(s)${failedOperations.length > 0 ? `, ${failedOperations.length} failed` : ''}`
      }))
    }

    IF failedOperations.length > 0 {
      dispatch(showToast({
        type: 'ERROR',
        message: `${failedOperations.length} change(s) failed to sync. Will retry.`
      }))
    }
  }

  ASYNC METHOD executeOperation(operation: Operation) {
    SWITCH operation.type {
      CASE 'CREATE':
        AWAIT api.post(operation.endpoint, operation.data)
        BREAK

      CASE 'UPDATE':
        AWAIT api.patch(operation.endpoint, operation.data)
        BREAK

      CASE 'DELETE':
        AWAIT api.delete(operation.endpoint)
        BREAK
    }
  }

  METHOD savePendingOperations() {
    localStorage.setItem('pending_operations', JSON.stringify(this.pendingOperations))
  }

  METHOD loadPendingOperations() {
    stored = localStorage.getItem('pending_operations')
    IF stored {
      this.pendingOperations = JSON.parse(stored)

      dispatch(updateSyncStatus({
        pendingChanges: this.pendingOperations.length
      }))
    }
  }
}
```

### 4.2 Local Storage for Offline Data

```typescript
// Local data cache using IndexedDB
CLASS LocalDataCache {
  PROPERTIES:
    - db: IDBDatabase | null
    - dbName: string = 'MotelManagerDB'
    - dbVersion: number = 1

  ASYNC METHOD initialize() {
    RETURN NEW Promise((resolve, reject) => {
      request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        db = event.target.result

        // Create object stores
        IF !db.objectStoreNames.contains('suites') {
          suitesStore = db.createObjectStore('suites', { keyPath: 'id' })
          suitesStore.createIndex('status', 'status', { unique: false })
          suitesStore.createIndex('floor', 'floor', { unique: false })
        }

        IF !db.objectStoreNames.contains('tasks') {
          tasksStore = db.createObjectStore('tasks', { keyPath: 'id' })
          tasksStore.createIndex('status', 'status', { unique: false })
          tasksStore.createIndex('assignedTo', 'assignedTo', { unique: false })
          tasksStore.createIndex('suiteId', 'suiteId', { unique: false })
        }

        IF !db.objectStoreNames.contains('employees') {
          db.createObjectStore('employees', { keyPath: 'id' })
        }

        IF !db.objectStoreNames.contains('notes') {
          db.createObjectStore('notes', { keyPath: 'id' })
        }
      }
    })
  }

  ASYNC METHOD set(storeName: string, data: object) {
    RETURN NEW Promise((resolve, reject) => {
      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD get(storeName: string, id: string) {
    RETURN NEW Promise((resolve, reject) => {
      transaction = this.db.transaction([storeName], 'readonly')
      store = transaction.objectStore(storeName)
      request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD getAll(storeName: string) {
    RETURN NEW Promise((resolve, reject) => {
      transaction = this.db.transaction([storeName], 'readonly')
      store = transaction.objectStore(storeName)
      request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD delete(storeName: string, id: string) {
    RETURN NEW Promise((resolve, reject) => {
      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD clear(storeName: string) {
    RETURN NEW Promise((resolve, reject) => {
      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD syncFromAPI() {
    // Fetch all data from API and cache locally
    TRY {
      [suites, tasks, employees, notes] = AWAIT Promise.all([
        api.get('/suites'),
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/notes')
      ])

      // Clear existing data
      AWAIT Promise.all([
        this.clear('suites'),
        this.clear('tasks'),
        this.clear('employees'),
        this.clear('notes')
      ])

      // Store new data
      FOR EACH suite IN suites {
        AWAIT this.set('suites', suite)
      }

      FOR EACH task IN tasks {
        AWAIT this.set('tasks', task)
      }

      FOR EACH employee IN employees {
        AWAIT this.set('employees', employee)
      }

      FOR EACH note IN notes {
        AWAIT this.set('notes', note)
      }

      CONSOLE.log('Local cache synced from API')

    } CATCH (error) {
      CONSOLE.error('Failed to sync local cache', error)
    }
  }
}
```

---

## 5. Conflict Resolution

### 5.1 Optimistic Locking

```typescript
// Each entity has a version field
INTERFACE Versioned {
  version: number
  updatedAt: string
}

ASYNC FUNCTION updateWithConflictDetection(entityType, entityId, updates) {
  // Get current version from local state
  currentEntity = getState()[entityType].items[entityId]
  currentVersion = currentEntity.version

  TRY {
    // Send update with version
    response = AWAIT api.patch(`/${entityType}/${entityId}`, {
      ...updates,
      version: currentVersion
    })

    // Update successful - new version returned
    dispatch(updateEntity(entityType, response.data))

  } CATCH (error) {
    IF error.status == 409 {
      // Conflict detected
      CONSOLE.warn('Conflict detected', error.response.data)

      // Fetch latest version from server
      latest = AWAIT api.get(`/${entityType}/${entityId}`)

      // Show conflict resolution UI
      dispatch(openModal('conflict-resolution', {
        entityType,
        entityId,
        local: { ...currentEntity, ...updates },
        remote: latest.data,
        changes: updates
      }))

    } ELSE {
      THROW error
    }
  }
}
```

### 5.2 Last-Write-Wins Strategy

```typescript
FUNCTION resolveConflictLastWriteWins(local, remote) {
  // Simply use the most recent timestamp
  IF new Date(local.updatedAt) > new Date(remote.updatedAt) {
    RETURN local
  } ELSE {
    RETURN remote
  }
}
```

### 5.3 Manual Conflict Resolution

```typescript
COMPONENT ConflictResolutionModal {
  PROPS:
    - entityType: string
    - entityId: string
    - local: object
    - remote: object
    - changes: object

  STATE:
    - selectedVersion: 'local' | 'remote' | 'manual' = 'remote'
    - manualChanges: object = {}

  METHOD handleResolve() {
    SWITCH selectedVersion {
      CASE 'local':
        // Keep local changes, force update
        AWAIT api.patch(`/${entityType}/${entityId}`, {
          ...changes,
          force: true
        })
        dispatch(updateEntity(entityType, local))
        BREAK

      CASE 'remote':
        // Discard local changes, use remote
        dispatch(updateEntity(entityType, remote))
        BREAK

      CASE 'manual':
        // Use manually merged changes
        AWAIT api.patch(`/${entityType}/${entityId}`, {
          ...manualChanges,
          version: remote.version
        })
        dispatch(updateEntity(entityType, manualChanges))
        BREAK
    }

    closeModal()
  }

  RENDER:
    <Modal title="Conflict Detected">
      <p>This {entityType} was modified by another user. Choose how to resolve:</p>

      <RadioGroup value={selectedVersion} onChange={setSelectedVersion}>
        <Radio value="remote">
          Use Server Version (Recommended)
          <DiffView before={local} after={remote} />
        </Radio>

        <Radio value="local">
          Keep My Changes (Overwrite)
          <Warning>This will overwrite changes made by {remote.updatedBy}</Warning>
        </Radio>

        <Radio value="manual">
          Manually Merge Changes
          <MergeEditor
            local={local}
            remote={remote}
            onChange={setManualChanges}
          />
        </Radio>
      </RadioGroup>

      <Actions>
        <Button onClick={closeModal}>Cancel</Button>
        <Button variant="primary" onClick={handleResolve}>Resolve</Button>
      </Actions>
    </Modal>
}
```

---

## 6. Manager vs Employee Real-Time Scenarios

### 6.1 Scenario: Manager Assigns Task to Employee

```
1. Manager creates/assigns task via UI
   └─> API: POST /tasks (with assignedTo)
       └─> Database: Insert task
           └─> WebSocket: Broadcast TASK_ASSIGNED event
               ├─> Employee (assignedTo): Receive notification
               │   ├─> Update local task list
               │   ├─> Show toast notification
               │   └─> Play notification sound (optional)
               │
               └─> All Supervisors: Receive update
                   └─> Update task board
```

### 6.2 Scenario: Employee Completes Task

```
1. Employee marks task as complete
   └─> API: PATCH /tasks/:id/complete
       └─> Database: Update task status
           └─> Business Logic: Update suite status
               └─> WebSocket: Broadcast multiple events
                   ├─> TASK_STATUS_CHANGED
                   │   └─> Manager: See task marked complete
                   │       └─> Update dashboard stats
                   │
                   └─> SUITE_UPDATED
                       └─> All users viewing suite: See status change
                           └─> Update suite card color/status
```

### 6.3 Scenario: Suite Status Change

```
1. Suite status changes (guest checks out)
   └─> API: PATCH /suites/:id/status
       └─> Database: Update suite
           └─> Business Logic: Auto-create cleaning task
               └─> WebSocket: Broadcast events
                   ├─> SUITE_UPDATED
                   │   └─> All users: See suite status change
                   │
                   └─> TASK_CREATED
                       └─> Available housekeepers: Receive notification
                           └─> Task appears in "Unassigned Tasks" list
```

### 6.4 Scenario: Emergency Task Created

```
1. Manager creates emergency task
   └─> API: POST /tasks (type=EMERGENCY)
       └─> Database: Insert task with EMERGENCY priority
           └─> WebSocket: Broadcast EMERGENCY_ALERT
               ├─> All on-duty employees: Receive alert
               │   ├─> Show prominent alert modal
               │   ├─> Play alert sound
               │   └─> Add task to urgent list
               │
               └─> All managers: Receive notification
                   └─> Update dashboard with emergency indicator
```

---

## 7. Testing Real-Time Sync

### 7.1 Unit Tests

```typescript
DESCRIBE 'WebSocketManager' {
  TEST 'should connect to WebSocket server' {
    wsManager = new WebSocketManager(mockToken)
    AWAIT waitFor(() => wsManager.connectionState == 'CONNECTED')
    EXPECT(wsManager.socket).toBeDefined()
  }

  TEST 'should reconnect after disconnection' {
    wsManager = new WebSocketManager(mockToken)
    AWAIT waitFor(() => wsManager.connectionState == 'CONNECTED')

    // Simulate disconnection
    wsManager.socket.close()

    AWAIT waitFor(() => wsManager.connectionState == 'RECONNECTING')
    AWAIT waitFor(() => wsManager.connectionState == 'CONNECTED')

    EXPECT(wsManager.reconnectAttempts).toBeGreaterThan(0)
  }

  TEST 'should queue messages when offline' {
    wsManager = new WebSocketManager(mockToken)
    wsManager.connectionState = 'DISCONNECTED'

    wsManager.send({ type: 'TEST', data: 'test' })

    EXPECT(wsManager.messageQueue.length).toBe(1)
  }
}
```

### 7.2 Integration Tests

```typescript
DESCRIBE 'Real-Time Task Assignment' {
  TEST 'employee receives task assignment in real-time' {
    // Manager session
    managerSession = createTestSession('manager')

    // Employee session
    employeeSession = createTestSession('employee')

    // Manager assigns task
    AWAIT managerSession.api.post('/tasks', {
      title: 'Clean Suite 101',
      assignedTo: employeeSession.user.id
    })

    // Wait for WebSocket event
    AWAIT waitFor(() => {
      tasks = employeeSession.getState().tasks.items
      RETURN Object.values(tasks).some(t => t.title == 'Clean Suite 101')
    })

    EXPECT(employeeSession.getState().notifications.unreadCount).toBeGreaterThan(0)
  }
}
```

This comprehensive real-time synchronization system ensures all users stay in sync with live updates, handles offline scenarios gracefully, and resolves conflicts when they occur.
