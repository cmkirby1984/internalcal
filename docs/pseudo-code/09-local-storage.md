# Local Storage & Caching Specifications

## Overview
This document defines local storage strategies, caching mechanisms, offline data persistence, and data synchronization patterns for the motel management application.

---

## 1. Storage Technologies

### 1.1 Technology Selection

```typescript
STORAGE_TECHNOLOGIES = {
  // For small data (< 5MB total)
  localStorage: {
    uses: [
      'User preferences',
      'UI state',
      'Theme settings',
      'Auth tokens',
      'Recently viewed items'
    ],
    maxSize: '5-10MB',
    persistence: 'Permanent (until cleared)',
    synchronous: true
  },

  // For larger structured data
  IndexedDB: {
    uses: [
      'Offline entity cache (suites, tasks, employees)',
      'Pending operations queue',
      'Attachment files',
      'Activity history',
      'Large datasets'
    ],
    maxSize: 'Browser dependent (typically 50MB-1GB+)',
    persistence: 'Permanent (until cleared)',
    synchronous: false,
    transactional: true
  },

  // For temporary session data
  sessionStorage: {
    uses: [
      'Current session state',
      'Temporary form data',
      'Navigation history'
    ],
    maxSize: '5-10MB',
    persistence: 'Until tab/window closed',
    synchronous: true
  },

  // For offline files
  Cache API: {
    uses: [
      'Static assets (JS, CSS, images)',
      'API response caching',
      'Offline PWA support'
    ],
    maxSize: 'Browser dependent',
    persistence: 'Permanent (until cleared)',
    synchronous: false
  }
}
```

---

## 2. LocalStorage Usage

### 2.1 Auth Token Storage

```typescript
// services/storage/authStorage.ts
CLASS AuthStorage {
  CONST TOKEN_KEY = 'motel_manager_auth_token'
  CONST REFRESH_TOKEN_KEY = 'motel_manager_refresh_token'
  CONST USER_KEY = 'motel_manager_current_user'

  // Store auth data
  METHOD saveAuthData(token: string, refreshToken: string, user: User) {
    TRY {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } CATCH (error) {
      CONSOLE.error('Failed to save auth data', error)
      // Fallback to sessionStorage if localStorage is full
      sessionStorage.setItem(TOKEN_KEY, token)
    }
  }

  // Retrieve auth token
  METHOD getAuthToken(): string | null {
    RETURN localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  }

  // Retrieve refresh token
  METHOD getRefreshToken(): string | null {
    RETURN localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  // Retrieve current user
  METHOD getCurrentUser(): User | null {
    userJson = localStorage.getItem(USER_KEY)
    IF userJson {
      TRY {
        RETURN JSON.parse(userJson)
      } CATCH (error) {
        RETURN null
      }
    }
    RETURN null
  }

  // Clear auth data
  METHOD clearAuthData() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  // Check if logged in
  METHOD isLoggedIn(): boolean {
    RETURN this.getAuthToken() !== null
  }
}

EXPORT CONST authStorage = NEW AuthStorage()
```

### 2.2 User Preferences Storage

```typescript
// services/storage/preferencesStorage.ts
INTERFACE UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  suitesViewMode: 'grid' | 'list' | 'floor_plan'
  tasksViewMode: 'list' | 'kanban' | 'calendar'
  tasksViewDensity: 'compact' | 'comfortable' | 'spacious'
  suitesGridColumns: number
  notificationSound: boolean
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
}

CLASS PreferencesStorage {
  CONST PREFERENCES_KEY = 'motel_manager_preferences'

  CONST DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'auto',
    suitesViewMode: 'grid',
    tasksViewMode: 'list',
    tasksViewDensity: 'comfortable',
    suitesGridColumns: 3,
    notificationSound: true,
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  }

  // Get all preferences
  METHOD getPreferences(): UserPreferences {
    storedPrefs = localStorage.getItem(PREFERENCES_KEY)

    IF storedPrefs {
      TRY {
        parsed = JSON.parse(storedPrefs)
        RETURN { ...DEFAULT_PREFERENCES, ...parsed }
      } CATCH (error) {
        RETURN DEFAULT_PREFERENCES
      }
    }

    RETURN DEFAULT_PREFERENCES
  }

  // Update preferences
  METHOD updatePreferences(updates: Partial<UserPreferences>) {
    current = this.getPreferences()
    updated = { ...current, ...updates }

    TRY {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
      RETURN updated
    } CATCH (error) {
      CONSOLE.error('Failed to save preferences', error)
      RETURN current
    }
  }

  // Get single preference
  METHOD getPreference<K extends keyof UserPreferences>(
    key: K
  ): UserPreferences[K] {
    prefs = this.getPreferences()
    RETURN prefs[key]
  }

  // Set single preference
  METHOD setPreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    RETURN this.updatePreferences({ [key]: value })
  }

  // Reset to defaults
  METHOD resetToDefaults() {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(DEFAULT_PREFERENCES))
    RETURN DEFAULT_PREFERENCES
  }
}

EXPORT CONST preferencesStorage = NEW PreferencesStorage()
```

### 2.3 Recently Viewed Items

```typescript
// services/storage/recentStorage.ts
CLASS RecentItemsStorage {
  CONST MAX_RECENT_ITEMS = 10
  CONST RECENT_SUITES_KEY = 'motel_manager_recent_suites'
  CONST RECENT_TASKS_KEY = 'motel_manager_recent_tasks'

  // Add item to recent list
  METHOD addRecentItem(storageKey: string, itemId: string, itemData: any) {
    recentItems = this.getRecentItems(storageKey)

    // Remove if already exists
    filtered = recentItems.filter(item => item.id !== itemId)

    // Add to beginning
    updated = [
      { id: itemId, ...itemData, viewedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT_ITEMS)

    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  // Get recent items
  METHOD getRecentItems(storageKey: string): Array<any> {
    stored = localStorage.getItem(storageKey)
    IF stored {
      TRY {
        RETURN JSON.parse(stored)
      } CATCH (error) {
        RETURN []
      }
    }
    RETURN []
  }

  // Add recently viewed suite
  METHOD addRecentSuite(suiteId: string, suiteNumber: string, floor: number) {
    this.addRecentItem(RECENT_SUITES_KEY, suiteId, { suiteNumber, floor })
  }

  // Get recently viewed suites
  METHOD getRecentSuites(): Array<{ id: string; suiteNumber: string; floor: number }> {
    RETURN this.getRecentItems(RECENT_SUITES_KEY)
  }

  // Add recently viewed task
  METHOD addRecentTask(taskId: string, title: string, type: string) {
    this.addRecentItem(RECENT_TASKS_KEY, taskId, { title, type })
  }

  // Get recently viewed tasks
  METHOD getRecentTasks(): Array<{ id: string; title: string; type: string }> {
    RETURN this.getRecentItems(RECENT_TASKS_KEY)
  }

  // Clear recent items
  METHOD clearRecent(storageKey: string) {
    localStorage.removeItem(storageKey)
  }
}

EXPORT CONST recentStorage = NEW RecentItemsStorage()
```

---

## 3. IndexedDB Implementation

### 3.1 Database Setup

```typescript
// services/storage/indexedDBStorage.ts
CLASS IndexedDBStorage {
  PROPERTIES:
    - db: IDBDatabase | null = null
    - dbName: string = 'MotelManagerDB'
    - dbVersion: number = 1

  // Initialize database
  ASYNC METHOD initialize(): Promise<void> {
    RETURN NEW Promise((resolve, reject) => {
      request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        CONSOLE.error('Failed to open IndexedDB', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        CONSOLE.log('IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        db = (event.target as IDBOpenDBRequest).result
        this.createObjectStores(db, event.oldVersion)
      }
    })
  }

  // Create object stores
  METHOD createObjectStores(db: IDBDatabase, oldVersion: number) {
    // Suites store
    IF !db.objectStoreNames.contains('suites') {
      suitesStore = db.createObjectStore('suites', { keyPath: 'id' })
      suitesStore.createIndex('suiteNumber', 'suiteNumber', { unique: true })
      suitesStore.createIndex('status', 'status', { unique: false })
      suitesStore.createIndex('floor', 'floor', { unique: false })
      suitesStore.createIndex('updatedAt', 'updatedAt', { unique: false })
    }

    // Tasks store
    IF !db.objectStoreNames.contains('tasks') {
      tasksStore = db.createObjectStore('tasks', { keyPath: 'id' })
      tasksStore.createIndex('status', 'status', { unique: false })
      tasksStore.createIndex('assignedTo', 'assignedTo', { unique: false })
      tasksStore.createIndex('suiteId', 'suiteId', { unique: false })
      tasksStore.createIndex('priority', 'priority', { unique: false })
      tasksStore.createIndex('scheduledStart', 'scheduledStart', { unique: false })
      tasksStore.createIndex('createdAt', 'createdAt', { unique: false })
    }

    // Employees store
    IF !db.objectStoreNames.contains('employees') {
      employeesStore = db.createObjectStore('employees', { keyPath: 'id' })
      employeesStore.createIndex('employeeNumber', 'employeeNumber', { unique: true })
      employeesStore.createIndex('email', 'email', { unique: true })
      employeesStore.createIndex('role', 'role', { unique: false })
      employeesStore.createIndex('isOnDuty', 'isOnDuty', { unique: false })
    }

    // Notes store
    IF !db.objectStoreNames.contains('notes') {
      notesStore = db.createObjectStore('notes', { keyPath: 'id' })
      notesStore.createIndex('type', 'type', { unique: false })
      notesStore.createIndex('relatedSuiteId', 'relatedSuiteId', { unique: false })
      notesStore.createIndex('relatedTaskId', 'relatedTaskId', { unique: false })
      notesStore.createIndex('createdAt', 'createdAt', { unique: false })
      notesStore.createIndex('pinned', 'pinned', { unique: false })
    }

    // Pending operations store (for offline sync)
    IF !db.objectStoreNames.contains('pending_operations') {
      pendingOpsStore = db.createObjectStore('pending_operations', {
        keyPath: 'id',
        autoIncrement: true
      })
      pendingOpsStore.createIndex('timestamp', 'timestamp', { unique: false })
      pendingOpsStore.createIndex('entityType', 'entityType', { unique: false })
    }

    // Metadata store
    IF !db.objectStoreNames.contains('metadata') {
      db.createObjectStore('metadata', { keyPath: 'key' })
    }
  }

  // Generic CRUD operations
  ASYNC METHOD add(storeName: string, data: any): Promise<void> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.add(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD put(storeName: string, data: any): Promise<void> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD get(storeName: string, id: string): Promise<any> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readonly')
      store = transaction.objectStore(storeName)
      request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD getAll(storeName: string): Promise<any[]> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readonly')
      store = transaction.objectStore(storeName)
      request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD delete(storeName: string, id: string): Promise<void> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  ASYNC METHOD clear(storeName: string): Promise<void> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)
      request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Query by index
  ASYNC METHOD getAllByIndex(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<any[]> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readonly')
      store = transaction.objectStore(storeName)
      index = store.index(indexName)
      request = index.getAll(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Batch operations
  ASYNC METHOD bulkPut(storeName: string, items: any[]): Promise<void> {
    RETURN NEW Promise((resolve, reject) => {
      IF !this.db {
        reject(new Error('Database not initialized'))
        RETURN
      }

      transaction = this.db.transaction([storeName], 'readwrite')
      store = transaction.objectStore(storeName)

      FOR EACH item IN items {
        store.put(item)
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

EXPORT CONST indexedDBStorage = NEW IndexedDBStorage()
```

### 3.2 Entity-Specific Storage Services

```typescript
// services/storage/suitesCacheService.ts
CLASS SuitesCacheService {
  CONST STORE_NAME = 'suites'

  // Save suites to cache
  ASYNC METHOD saveAll(suites: Suite[]) {
    AWAIT indexedDBStorage.bulkPut(STORE_NAME, suites)
    AWAIT this.updateMetadata()
  }

  // Get all cached suites
  ASYNC METHOD getAll(): Promise<Suite[]> {
    RETURN AWAIT indexedDBStorage.getAll(STORE_NAME)
  }

  // Get suite by ID
  ASYNC METHOD getById(id: string): Promise<Suite | null> {
    RETURN AWAIT indexedDBStorage.get(STORE_NAME, id)
  }

  // Get suites by status
  ASYNC METHOD getByStatus(status: SuiteStatus): Promise<Suite[]> {
    RETURN AWAIT indexedDBStorage.getAllByIndex(STORE_NAME, 'status', status)
  }

  // Get suites by floor
  ASYNC METHOD getByFloor(floor: number): Promise<Suite[]> {
    RETURN AWAIT indexedDBStorage.getAllByIndex(STORE_NAME, 'floor', floor)
  }

  // Update metadata
  ASYNC METHOD updateMetadata() {
    AWAIT indexedDBStorage.put('metadata', {
      key: 'suites_last_sync',
      value: new Date().toISOString()
    })
  }

  // Get last sync time
  ASYNC METHOD getLastSyncTime(): Promise<string | null> {
    metadata = AWAIT indexedDBStorage.get('metadata', 'suites_last_sync')
    RETURN metadata?.value || null
  }

  // Clear cache
  ASYNC METHOD clear() {
    AWAIT indexedDBStorage.clear(STORE_NAME)
  }
}

EXPORT CONST suitesCacheService = NEW SuitesCacheService()
```

---

## 4. Pending Operations Queue

### 4.1 Operations Queue Service

```typescript
// services/storage/pendingOperationsService.ts
INTERFACE PendingOperation {
  id?: number
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: 'SUITE' | 'TASK' | 'EMPLOYEE' | 'NOTE'
  entityId?: string
  endpoint: string
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  data?: any
  timestamp: number
  retryCount: number
  lastError?: string
}

CLASS PendingOperationsService {
  CONST STORE_NAME = 'pending_operations'
  CONST MAX_RETRIES = 3

  // Add operation to queue
  ASYNC METHOD enqueue(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) {
    pendingOp: PendingOperation = {
      ...operation,
      timestamp: Date.now(),
      retryCount: 0
    }

    AWAIT indexedDBStorage.add(STORE_NAME, pendingOp)

    CONSOLE.log('Operation queued for offline sync', pendingOp)
  }

  // Get all pending operations
  ASYNC METHOD getAll(): Promise<PendingOperation[]> {
    RETURN AWAIT indexedDBStorage.getAll(STORE_NAME)
  }

  // Get pending operations by entity type
  ASYNC METHOD getByEntityType(entityType: string): Promise<PendingOperation[]> {
    RETURN AWAIT indexedDBStorage.getAllByIndex(STORE_NAME, 'entityType', entityType)
  }

  // Remove operation from queue
  ASYNC METHOD dequeue(operationId: number) {
    AWAIT indexedDBStorage.delete(STORE_NAME, operationId.toString())
  }

  // Update operation (increment retry count)
  ASYNC METHOD updateRetryCount(operationId: number, error: string) {
    operation = AWAIT indexedDBStorage.get(STORE_NAME, operationId.toString())

    IF operation {
      operation.retryCount++
      operation.lastError = error

      IF operation.retryCount >= MAX_RETRIES {
        CONSOLE.error('Max retries reached for operation', operation)
        // Could move to failed operations store
        AWAIT this.dequeue(operationId)
      } ELSE {
        AWAIT indexedDBStorage.put(STORE_NAME, operation)
      }
    }
  }

  // Clear all pending operations
  ASYNC METHOD clearAll() {
    AWAIT indexedDBStorage.clear(STORE_NAME)
  }

  // Get count of pending operations
  ASYNC METHOD getCount(): Promise<number> {
    operations = AWAIT this.getAll()
    RETURN operations.length
  }
}

EXPORT CONST pendingOperationsService = NEW PendingOperationsService()
```

---

## 5. Cache Strategy

### 5.1 Cache-First Strategy

```typescript
// services/cacheStrategy.ts
CLASS CacheFirstStrategy {
  // Get data with cache-first strategy
  ASYNC METHOD getData<T>(
    cacheService: any,
    apiCall: () => Promise<T>,
    options = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      forceRefresh: false
    }
  ): Promise<T> {
    // Check if force refresh requested
    IF options.forceRefresh {
      RETURN AWAIT this.fetchFromAPI(cacheService, apiCall)
    }

    // Try to get from cache
    TRY {
      cachedData = AWAIT cacheService.getAll()
      lastSync = AWAIT cacheService.getLastSyncTime()

      // Check if cache is fresh
      IF cachedData.length > 0 AND lastSync {
        age = Date.now() - new Date(lastSync).getTime()

        IF age < options.maxAge {
          CONSOLE.log('Using cached data', { age, maxAge: options.maxAge })
          RETURN cachedData
        }
      }
    } CATCH (error) {
      CONSOLE.warn('Cache read failed', error)
    }

    // Cache miss or stale - fetch from API
    RETURN AWAIT this.fetchFromAPI(cacheService, apiCall)
  }

  // Fetch from API and update cache
  ASYNC METHOD fetchFromAPI<T>(cacheService: any, apiCall: () => Promise<T>): Promise<T> {
    TRY {
      data = AWAIT apiCall()

      // Update cache in background
      cacheService.saveAll(data).catch((error: any) => {
        CONSOLE.error('Failed to update cache', error)
      })

      RETURN data
    } CATCH (error) {
      // If API fails, try to return stale cache
      CONSOLE.error('API call failed, trying stale cache', error)

      TRY {
        staleData = AWAIT cacheService.getAll()
        IF staleData.length > 0 {
          CONSOLE.warn('Using stale cache due to API failure')
          RETURN staleData
        }
      } CATCH (cacheError) {
        // Both API and cache failed
        CONSOLE.error('Both API and cache failed', cacheError)
      }

      THROW error
    }
  }
}

EXPORT CONST cacheFirstStrategy = NEW CacheFirstStrategy()
```

### 5.2 Network-First Strategy

```typescript
CLASS NetworkFirstStrategy {
  // Get data with network-first strategy
  ASYNC METHOD getData<T>(
    cacheService: any,
    apiCall: () => Promise<T>,
    options = {
      timeout: 5000 // 5 seconds
    }
  ): Promise<T> {
    TRY {
      // Try network first with timeout
      data = AWAIT Promise.race([
        apiCall(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), options.timeout)
        )
      ])

      // Update cache in background
      cacheService.saveAll(data).catch((error: any) => {
        CONSOLE.error('Failed to update cache', error)
      })

      RETURN data
    } CATCH (error) {
      // Network failed - try cache
      CONSOLE.warn('Network failed, trying cache', error)

      cachedData = AWAIT cacheService.getAll()
      IF cachedData.length > 0 {
        RETURN cachedData
      }

      THROW error
    }
  }
}

EXPORT CONST networkFirstStrategy = NEW NetworkFirstStrategy()
```

---

## 6. Storage Quota Management

### 6.1 Quota Monitoring

```typescript
// services/storageQuota.ts
CLASS StorageQuotaManager {
  // Check available storage
  ASYNC METHOD checkQuota(): Promise<{
    usage: number
    quota: number
    available: number
    percentUsed: number
  }> {
    IF navigator.storage AND navigator.storage.estimate {
      estimate = AWAIT navigator.storage.estimate()

      RETURN {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        percentUsed: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
      }
    }

    // Fallback for unsupported browsers
    RETURN {
      usage: 0,
      quota: 0,
      available: 0,
      percentUsed: 0
    }
  }

  // Check if we're running low on storage
  ASYNC METHOD isStorageLow(): Promise<boolean> {
    quota = AWAIT this.checkQuota()
    RETURN quota.percentUsed > 80
  }

  // Clean old cache data
  ASYNC METHOD cleanOldData() {
    CONSOLE.log('Cleaning old cache data')

    // Remove data older than 30 days
    cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000)

    // Could implement cleanup logic for each store
    // For now, just clear all caches
    AWAIT Promise.all([
      suitesCacheService.clear(),
      // tasksCacheService.clear(),
      // etc.
    ])

    CONSOLE.log('Old data cleaned')
  }

  // Request persistent storage
  ASYNC METHOD requestPersistentStorage(): Promise<boolean> {
    IF navigator.storage AND navigator.storage.persist {
      TRY {
        isPersisted = AWAIT navigator.storage.persist()
        CONSOLE.log('Persistent storage:', isPersisted)
        RETURN isPersisted
      } CATCH (error) {
        CONSOLE.error('Failed to request persistent storage', error)
        RETURN false
      }
    }

    RETURN false
  }
}

EXPORT CONST storageQuotaManager = NEW StorageQuotaManager()
```

---

## 7. Data Synchronization

### 7.1 Full Sync on App Start

```typescript
// services/syncService.ts
CLASS SyncService {
  // Perform full sync
  ASYNC METHOD performFullSync() {
    CONSOLE.log('Starting full sync...')

    TRY {
      // Fetch all data from API
      [suites, tasks, employees, notes] = AWAIT Promise.all([
        api.get('/suites'),
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/notes')
      ])

      // Save to IndexedDB cache
      AWAIT Promise.all([
        suitesCacheService.saveAll(suites.data),
        tasksCacheService.saveAll(tasks.data),
        employeesCacheService.saveAll(employees.data),
        notesCacheService.saveAll(notes.data)
      ])

      CONSOLE.log('Full sync completed')

      RETURN true
    } CATCH (error) {
      CONSOLE.error('Full sync failed', error)
      RETURN false
    }
  }

  // Sync pending operations
  ASYNC METHOD syncPendingOperations() {
    operations = AWAIT pendingOperationsService.getAll()

    IF operations.length == 0 {
      RETURN
    }

    CONSOLE.log(`Syncing ${operations.length} pending operations`)

    FOR EACH operation IN operations {
      TRY {
        AWAIT this.executePendingOperation(operation)
        AWAIT pendingOperationsService.dequeue(operation.id)
      } CATCH (error) {
        CONSOLE.error('Failed to sync operation', operation, error)
        AWAIT pendingOperationsService.updateRetryCount(operation.id, error.message)
      }
    }
  }

  ASYNC METHOD executePendingOperation(operation: PendingOperation) {
    SWITCH operation.method {
      CASE 'POST':
        AWAIT api.post(operation.endpoint, operation.data)
        BREAK
      CASE 'PATCH':
      CASE 'PUT':
        AWAIT api.patch(operation.endpoint, operation.data)
        BREAK
      CASE 'DELETE':
        AWAIT api.delete(operation.endpoint)
        BREAK
    }
  }
}

EXPORT CONST syncService = NEW SyncService()
```

---

## 8. Usage Examples

### 8.1 Fetching Suites with Cache

```typescript
// In a component or service
ASYNC FUNCTION fetchSuites() {
  // Use cache-first strategy
  suites = AWAIT cacheFirstStrategy.getData(
    suitesCacheService,
    () => api.get('/suites').then(r => r.data),
    {
      maxAge: 5 * 60 * 1000, // 5 minutes
      forceRefresh: false
    }
  )

  RETURN suites
}
```

### 8.2 Creating Task Offline

```typescript
// When creating a task while offline
ASYNC FUNCTION createTaskOffline(taskData: Partial<Task>) {
  // Generate temporary ID
  tempId = `temp-${Date.now()}`

  // Create optimistic task object
  newTask = {
    ...taskData,
    id: tempId,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  }

  // Add to local state immediately
  dispatch(addTaskLocal(newTask))

  // Queue for sync when online
  AWAIT pendingOperationsService.enqueue({
    type: 'CREATE',
    entityType: 'TASK',
    endpoint: '/tasks',
    method: 'POST',
    data: taskData
  })
}
```

This comprehensive local storage specification ensures robust offline support and efficient data caching for the motel management application.
