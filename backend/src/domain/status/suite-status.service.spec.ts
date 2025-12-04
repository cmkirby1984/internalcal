import { SuiteStatusService } from './suite-status.service';
import { SuiteStatus } from '@prisma/client';

describe('SuiteStatusService', () => {
  let service: SuiteStatusService;

  beforeEach(() => {
    service = new SuiteStatusService();
  });

  describe('canTransition', () => {
    it('should allow VACANT_DIRTY -> VACANT_CLEAN', () => {
      const result = service.canTransition('VACANT_DIRTY', 'VACANT_CLEAN');
      expect(result.valid).toBe(true);
    });

    it('should allow OCCUPIED_DIRTY -> OCCUPIED_CLEAN', () => {
      const result = service.canTransition('OCCUPIED_DIRTY', 'OCCUPIED_CLEAN');
      expect(result.valid).toBe(true);
    });

    it('should allow VACANT_CLEAN -> OCCUPIED_CLEAN (check-in)', () => {
      const result = service.canTransition('VACANT_CLEAN', 'OCCUPIED_CLEAN');
      expect(result.valid).toBe(true);
    });

    it('should allow OCCUPIED_CLEAN -> VACANT_DIRTY (checkout)', () => {
      const result = service.canTransition('OCCUPIED_CLEAN', 'VACANT_DIRTY');
      expect(result.valid).toBe(true);
    });

    it('should allow any status -> OUT_OF_ORDER', () => {
      const statuses: SuiteStatus[] = [
        'VACANT_CLEAN',
        'VACANT_DIRTY',
        'OCCUPIED_CLEAN',
        'OCCUPIED_DIRTY',
      ];
      statuses.forEach((status) => {
        const result = service.canTransition(status, 'OUT_OF_ORDER');
        expect(result.valid).toBe(true);
      });
    });

    it('should allow OUT_OF_ORDER -> VACANT_DIRTY', () => {
      const result = service.canTransition('OUT_OF_ORDER', 'VACANT_DIRTY');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      // Cannot go from VACANT_CLEAN directly to OCCUPIED_DIRTY
      const result = service.canTransition('VACANT_CLEAN', 'OCCUPIED_DIRTY');
      expect(result.valid).toBe(false);
    });

    it('should reject OUT_OF_ORDER -> VACANT_CLEAN directly', () => {
      const result = service.canTransition('OUT_OF_ORDER', 'VACANT_CLEAN');
      expect(result.valid).toBe(false);
    });

    it('should allow same status (no change)', () => {
      const result = service.canTransition('VACANT_CLEAN', 'VACANT_CLEAN');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTransition', () => {
    it('should require cleaning task completion for VACANT_DIRTY -> VACANT_CLEAN', () => {
      const result = service.validateTransition(
        'VACANT_DIRTY',
        'VACANT_CLEAN',
        {
          hasCompletedCleaningTask: false,
        },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cleaning task');
    });

    it('should pass when cleaning task is completed', () => {
      const result = service.validateTransition(
        'VACANT_DIRTY',
        'VACANT_CLEAN',
        {
          hasCompletedCleaningTask: true,
        },
      );
      expect(result.valid).toBe(true);
    });

    it('should require maintenance task completion for OUT_OF_ORDER -> VACANT_DIRTY', () => {
      const result = service.validateTransition(
        'OUT_OF_ORDER',
        'VACANT_DIRTY',
        {
          hasCompletedMaintenanceTask: false,
        },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Maintenance task');
    });
  });

  describe('getValidTransitions', () => {
    it('should return valid next statuses for VACANT_CLEAN', () => {
      const transitions = service.getValidTransitions('VACANT_CLEAN');
      expect(transitions).toContain('OCCUPIED_CLEAN');
      expect(transitions).toContain('OUT_OF_ORDER');
      expect(transitions).toContain('BLOCKED');
    });

    it('should return valid next statuses for VACANT_DIRTY', () => {
      const transitions = service.getValidTransitions('VACANT_DIRTY');
      expect(transitions).toContain('VACANT_CLEAN');
      expect(transitions).toContain('OUT_OF_ORDER');
    });
  });

  describe('getStatusAfterTaskCompletion', () => {
    it('should return VACANT_CLEAN after cleaning VACANT_DIRTY', () => {
      const newStatus = service.getStatusAfterTaskCompletion(
        'VACANT_DIRTY',
        'CLEANING',
      );
      expect(newStatus).toBe('VACANT_CLEAN');
    });

    it('should return OCCUPIED_CLEAN after cleaning OCCUPIED_DIRTY', () => {
      const newStatus = service.getStatusAfterTaskCompletion(
        'OCCUPIED_DIRTY',
        'CLEANING',
      );
      expect(newStatus).toBe('OCCUPIED_CLEAN');
    });

    it('should return VACANT_DIRTY after maintenance on OUT_OF_ORDER', () => {
      const newStatus = service.getStatusAfterTaskCompletion(
        'OUT_OF_ORDER',
        'MAINTENANCE',
      );
      expect(newStatus).toBe('VACANT_DIRTY');
    });

    it('should return null for irrelevant task types', () => {
      const newStatus = service.getStatusAfterTaskCompletion(
        'VACANT_CLEAN',
        'CLEANING',
      );
      expect(newStatus).toBeNull();
    });
  });

  describe('helper methods', () => {
    it('isAvailableForCheckIn should return true only for VACANT_CLEAN', () => {
      expect(service.isAvailableForCheckIn('VACANT_CLEAN')).toBe(true);
      expect(service.isAvailableForCheckIn('VACANT_DIRTY')).toBe(false);
      expect(service.isAvailableForCheckIn('OCCUPIED_CLEAN')).toBe(false);
    });

    it('needsAttention should return true for dirty/out of order', () => {
      expect(service.needsAttention('VACANT_DIRTY')).toBe(true);
      expect(service.needsAttention('OCCUPIED_DIRTY')).toBe(true);
      expect(service.needsAttention('OUT_OF_ORDER')).toBe(true);
      expect(service.needsAttention('VACANT_CLEAN')).toBe(false);
    });

    it('isOccupied should return true for occupied statuses', () => {
      expect(service.isOccupied('OCCUPIED_CLEAN')).toBe(true);
      expect(service.isOccupied('OCCUPIED_DIRTY')).toBe(true);
      expect(service.isOccupied('VACANT_CLEAN')).toBe(false);
    });
  });
});
