# Real-time & Offline QA Test Plan

## Overview
This document outlines manual and automated test procedures for validating the real-time WebSocket functionality and offline queue behavior.

---

## Automated Tests

### Running Tests
```bash
# Run all frontend tests
cd frontend
npm run test

# Run with coverage
npm run test:coverage

# Run specific test files
npm run test -- websocket-manager
npm run test -- sync-store
```

### Test Coverage Areas
1. **WebSocket Manager** (`websocket-manager.test.ts`)
   - Connection state transitions
   - Event subscription/unsubscription
   - Message queuing when disconnected
   - Room subscriptions (suite, task)
   - Token management
   - Disconnect handling

2. **Sync Store** (`sync-store.test.ts`)
   - Online/offline state management
   - Pending change queue operations
   - Change merging (CREATE + UPDATE → CREATE)
   - Change cancellation (CREATE + DELETE → remove)
   - Sync operation guards (offline, already syncing)
   - Timestamp and ID generation

---

## Manual Test Procedures

### Test 1: Multi-Browser Real-time Sync

**Objective:** Verify that changes made in one browser appear in another in real-time.

**Prerequisites:**
- Backend and frontend running locally or on staging
- Two browser windows/tabs logged in as different users

**Steps:**
1. Open Browser A and Browser B, both on the Tasks page
2. In Browser A, create a new task with title "Test Real-time Task"
3. **Expected:** Browser B should show the new task within 2 seconds without refresh
4. In Browser B, update the task status to "In Progress"
5. **Expected:** Browser A should reflect the status change within 2 seconds
6. In Browser A, delete the task
7. **Expected:** Browser B should remove the task from the list within 2 seconds

**Pass Criteria:**
- [ ] Task creation syncs to other browser
- [ ] Task update syncs to other browser
- [ ] Task deletion syncs to other browser
- [ ] No page refresh required
- [ ] Latency < 2 seconds for all operations

---

### Test 2: Offline Mode - Task Creation

**Objective:** Verify that tasks created while offline are queued and synced when back online.

**Prerequisites:**
- Frontend running locally
- Browser DevTools accessible

**Steps:**
1. Open the Tasks page
2. Open DevTools → Network tab
3. Set network to "Offline" mode
4. Verify the header shows "Offline" indicator (red badge)
5. Create a new task with title "Offline Task 1"
6. **Expected:** Toast shows "Task saved offline. Will sync when connected."
7. Verify the header shows "1 pending" badge
8. Create another task "Offline Task 2"
9. **Expected:** Header shows "2 pending" badge
10. Set network back to "Online"
11. **Expected:** 
    - Toast shows "Back online. Syncing changes..."
    - Toast shows "All changes synced successfully"
    - Pending badge disappears
    - Tasks appear in the list with server-generated IDs

**Pass Criteria:**
- [ ] Offline indicator appears when disconnected
- [ ] Tasks can be created while offline
- [ ] Pending count increments correctly
- [ ] Changes sync automatically when back online
- [ ] Success toast appears after sync
- [ ] Tasks persist after page refresh

---

### Test 3: Offline Mode - Task Updates

**Objective:** Verify that task updates while offline are queued and merged correctly.

**Steps:**
1. Create a task "Update Test Task" while online
2. Go offline (DevTools → Network → Offline)
3. Update the task title to "Updated Title"
4. Update the task priority to "High"
5. **Expected:** Only 1 pending change (merged updates)
6. Go back online
7. **Expected:** Task shows "Updated Title" with "High" priority after sync

**Pass Criteria:**
- [ ] Multiple updates to same entity are merged
- [ ] Final state reflects all updates
- [ ] Only one API call made (not multiple)

---

### Test 4: Offline Mode - Create then Delete

**Objective:** Verify that creating then deleting an entity while offline cancels out.

**Steps:**
1. Go offline
2. Create a new task "Temporary Task"
3. **Expected:** 1 pending change
4. Delete the same task
5. **Expected:** 0 pending changes (CREATE cancelled by DELETE)
6. Go back online
7. **Expected:** No sync needed, no API calls made

**Pass Criteria:**
- [ ] CREATE + DELETE for same entity results in 0 pending changes
- [ ] No unnecessary API calls when back online

---

### Test 5: Connection Recovery

**Objective:** Verify WebSocket reconnects automatically after network interruption.

**Steps:**
1. Open the app with network online
2. Verify header shows "Live" indicator (green)
3. Disconnect network (airplane mode or DevTools offline)
4. **Expected:** Header shows "Offline" indicator
5. Wait 5 seconds
6. Reconnect network
7. **Expected:** 
    - Header shows "Reconnecting" briefly (amber)
    - Header shows "Live" after successful reconnection
    - Toast: "Connected to real-time updates"

**Pass Criteria:**
- [ ] Connection state indicator updates correctly
- [ ] Automatic reconnection occurs
- [ ] No manual refresh required
- [ ] Real-time updates resume after reconnection

---

### Test 6: Emergency Task Notification

**Objective:** Verify emergency tasks trigger immediate notifications to supervisors.

**Prerequisites:**
- Two users: one regular employee, one supervisor/manager

**Steps:**
1. Log in as supervisor in Browser A
2. Log in as employee in Browser B
3. In Browser B, create a task with priority "Emergency"
4. **Expected in Browser A:** 
    - Toast notification appears: "🚨 EMERGENCY: [task title]"
    - Task appears in task list immediately

**Pass Criteria:**
- [ ] Emergency tasks trigger special notification
- [ ] Notification includes task details
- [ ] Only supervisors/managers receive emergency alerts

---

### Test 7: Suite Status Real-time Updates

**Objective:** Verify suite status changes sync across browsers.

**Steps:**
1. Open Suites page in Browser A and Browser B
2. In Browser A, change Suite 101 status from "Vacant Clean" to "Occupied"
3. **Expected in Browser B:** Suite 101 shows "Occupied" status immediately
4. In Browser B, change Suite 101 to "Vacant Dirty"
5. **Expected in Browser A:** Suite 101 shows "Vacant Dirty" immediately

**Pass Criteria:**
- [ ] Suite status changes sync in real-time
- [ ] Status badges update without refresh
- [ ] Dashboard stats update accordingly

---

## Load Testing (Optional)

### Concurrent Users Test
1. Use a tool like k6 or Artillery
2. Simulate 50 concurrent WebSocket connections
3. Each connection sends 10 messages over 60 seconds
4. Monitor:
   - Connection success rate (target: > 99%)
   - Message delivery latency (target: < 500ms p95)
   - Server memory usage
   - WebSocket error rate

### Sample k6 Script
```javascript
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 50,
  duration: '60s',
};

export default function () {
  const url = 'ws://localhost:3001/realtime';
  const params = { headers: { Authorization: 'Bearer <token>' } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({ event: 'heartbeat', data: { timestamp: Date.now() } }));
    });

    socket.on('message', (data) => {
      check(data, { 'message received': (d) => d.length > 0 });
    });

    socket.setTimeout(() => socket.close(), 60000);
  });

  check(res, { 'connection established': (r) => r && r.status === 101 });
}
```

---

## Troubleshooting

### WebSocket Not Connecting
1. Check browser console for connection errors
2. Verify JWT token is valid and not expired
3. Check backend logs for authentication failures
4. Verify CORS settings allow WebSocket connections

### Changes Not Syncing
1. Check network tab for failed API requests
2. Verify sync store has pending changes
3. Check for JavaScript errors in console
4. Verify backend is processing events correctly

### Offline Mode Not Working
1. Verify service worker is registered (if using PWA)
2. Check localStorage for persisted pending changes
3. Verify online/offline event listeners are attached

---

## Sign-off Checklist

| Test | Tester | Date | Pass/Fail | Notes |
|------|--------|------|-----------|-------|
| Multi-Browser Sync | | | | |
| Offline Task Creation | | | | |
| Offline Task Updates | | | | |
| Create then Delete | | | | |
| Connection Recovery | | | | |
| Emergency Notification | | | | |
| Suite Status Sync | | | | |

**QA Sign-off:** _________________ Date: _________

