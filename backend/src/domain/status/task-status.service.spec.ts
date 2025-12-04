import { TaskStatusService } from './task-status.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('TaskStatusService', () => {
  let service: TaskStatusService;

  beforeEach(() => {
    service = new TaskStatusService();
  });

  describe('canTransition', () => {
    it('should allow PENDING -> ASSIGNED', () => {
      const result = service.canTransition('PENDING', 'ASSIGNED');
      expect(result.valid).toBe(true);
    });

    it('should allow ASSIGNED -> IN_PROGRESS', () => {
      const result = service.canTransition('ASSIGNED', 'IN_PROGRESS');
      expect(result.valid).toBe(true);
    });

    it('should allow IN_PROGRESS -> COMPLETED', () => {
      const result = service.canTransition('IN_PROGRESS', 'COMPLETED');
      expect(result.valid).toBe(true);
    });

    it('should allow IN_PROGRESS -> PAUSED', () => {
      const result = service.canTransition('IN_PROGRESS', 'PAUSED');
      expect(result.valid).toBe(true);
    });

    it('should allow PAUSED -> IN_PROGRESS', () => {
      const result = service.canTransition('PAUSED', 'IN_PROGRESS');
      expect(result.valid).toBe(true);
    });

    it('should allow COMPLETED -> VERIFIED', () => {
      const result = service.canTransition('COMPLETED', 'VERIFIED');
      expect(result.valid).toBe(true);
    });

    it('should reject PENDING -> IN_PROGRESS (must be assigned first)', () => {
      const result = service.canTransition('PENDING', 'IN_PROGRESS');
      expect(result.valid).toBe(false);
    });

    it('should reject PENDING -> COMPLETED directly', () => {
      const result = service.canTransition('PENDING', 'COMPLETED');
      expect(result.valid).toBe(false);
    });

    it('should allow same status (no change)', () => {
      const result = service.canTransition('PENDING', 'PENDING');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTransition', () => {
    it('should require assignedTo for PENDING -> ASSIGNED', () => {
      const result = service.validateTransition('PENDING', 'ASSIGNED', {
        assignedTo: null,
      });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('assignedTo');
    });

    it('should pass when assignedTo is provided for PENDING -> ASSIGNED', () => {
      const result = service.validateTransition('PENDING', 'ASSIGNED', {
        assignedTo: 'employee-123',
      });
      expect(result.valid).toBe(true);
    });

    it('should require actualStart for ASSIGNED -> IN_PROGRESS', () => {
      const result = service.validateTransition('ASSIGNED', 'IN_PROGRESS', {
        actualStart: null,
      });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('actualStart');
    });

    it('should require actualEnd for IN_PROGRESS -> COMPLETED', () => {
      const result = service.validateTransition('IN_PROGRESS', 'COMPLETED', {
        actualEnd: null,
      });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('actualEnd');
    });

    it('should require verifiedBy for COMPLETED -> VERIFIED', () => {
      const result = service.validateTransition('COMPLETED', 'VERIFIED', {
        verifiedBy: null,
      });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('verifiedBy');
    });
  });

  describe('getValidTransitions', () => {
    it('should return valid next statuses for PENDING', () => {
      const transitions = service.getValidTransitions('PENDING');
      expect(transitions).toContain('ASSIGNED');
      expect(transitions).toContain('CANCELLED');
      expect(transitions).not.toContain('IN_PROGRESS');
    });

    it('should return valid next statuses for IN_PROGRESS', () => {
      const transitions = service.getValidTransitions('IN_PROGRESS');
      expect(transitions).toContain('COMPLETED');
      expect(transitions).toContain('PAUSED');
    });
  });

  describe('assertValidTransition', () => {
    it('should throw BadRequestException for invalid transitions', () => {
      expect(() => {
        service.assertValidTransition('PENDING', 'COMPLETED');
      }).toThrow(BadRequestException);
    });

    it('should not throw for valid transitions', () => {
      expect(() => {
        service.assertValidTransition('PENDING', 'ASSIGNED', {
          assignedTo: 'employee-123',
        });
      }).not.toThrow();
    });
  });

  describe('helper methods', () => {
    it('isActive should return true for IN_PROGRESS and PAUSED', () => {
      expect(service.isActive('IN_PROGRESS')).toBe(true);
      expect(service.isActive('PAUSED')).toBe(true);
      expect(service.isActive('PENDING')).toBe(false);
      expect(service.isActive('COMPLETED')).toBe(false);
    });

    it('isCompleted should return true for COMPLETED and VERIFIED', () => {
      expect(service.isCompleted('COMPLETED')).toBe(true);
      expect(service.isCompleted('VERIFIED')).toBe(true);
      expect(service.isCompleted('IN_PROGRESS')).toBe(false);
    });

    it('isActionable should return true for workable statuses', () => {
      expect(service.isActionable('PENDING')).toBe(true);
      expect(service.isActionable('ASSIGNED')).toBe(true);
      expect(service.isActionable('IN_PROGRESS')).toBe(true);
      expect(service.isActionable('PAUSED')).toBe(true);
      expect(service.isActionable('COMPLETED')).toBe(false);
      expect(service.isActionable('CANCELLED')).toBe(false);
    });

    it('needsAssignment should return true only for PENDING', () => {
      expect(service.needsAssignment('PENDING')).toBe(true);
      expect(service.needsAssignment('ASSIGNED')).toBe(false);
    });

    it('getPriorityWeight should return correct weights', () => {
      expect(service.getPriorityWeight('LOW')).toBe(1);
      expect(service.getPriorityWeight('NORMAL')).toBe(2);
      expect(service.getPriorityWeight('HIGH')).toBe(3);
      expect(service.getPriorityWeight('URGENT')).toBe(4);
      expect(service.getPriorityWeight('EMERGENCY')).toBe(5);
    });

    it('isOverdue should return true for past scheduled end with non-completed status', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(service.isOverdue(pastDate, 'IN_PROGRESS')).toBe(true);
      expect(service.isOverdue(pastDate, 'COMPLETED')).toBe(false);
      expect(service.isOverdue(null, 'IN_PROGRESS')).toBe(false);
    });
  });
});
