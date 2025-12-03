'use client';

import { useState } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { useUIStore, useTasksStore } from '@/lib/store';
import { TaskType, TaskPriority } from '@/lib/types';
import { formatEnumValue } from '@/lib/utils';

const taskTypeOptions = Object.values(TaskType).map(type => ({
  value: type,
  label: formatEnumValue(type),
}));

const priorityOptions = Object.values(TaskPriority).map(priority => ({
  value: priority,
  label: formatEnumValue(priority),
}));

export function CreateTaskModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const showToast = useUIStore((state) => state.showToast);

  const isOpen = activeModal === 'create-task';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: TaskType.CLEANING,
    priority: TaskPriority.NORMAL,
    suiteId: '',
    assignedTo: '',
    estimatedDuration: 30,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Task type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      // TODO: Call API to create task
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showToast({ type: 'SUCCESS', message: 'Task created successfully' });
      closeModal();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: TaskType.CLEANING,
        priority: TaskPriority.NORMAL,
        suiteId: '',
        assignedTo: '',
        estimatedDuration: 30,
      });
    } catch (error) {
      showToast({ type: 'ERROR', message: 'Failed to create task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeModal();
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Create Task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Task Type"
            required
            options={taskTypeOptions}
            value={formData.type}
            onChange={(value) => handleChange('type', value)}
            error={errors.type}
          />
          
          <Select
            label="Priority"
            required
            options={priorityOptions}
            value={formData.priority}
            onChange={(value) => handleChange('priority', value)}
          />
        </div>

        <Input
          label="Title"
          required
          placeholder="Enter task title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
        />

        <Textarea
          label="Description"
          placeholder="Add any additional details..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Suite (Optional)"
            placeholder="Select suite"
            value={formData.suiteId}
            onChange={(e) => handleChange('suiteId', e.target.value)}
          />
          
          <Input
            label="Assign To (Optional)"
            placeholder="Select employee"
            value={formData.assignedTo}
            onChange={(e) => handleChange('assignedTo', e.target.value)}
          />
        </div>

        <Input
          label="Estimated Duration (minutes)"
          type="number"
          min={5}
          step={5}
          value={formData.estimatedDuration}
          onChange={(e) => handleChange('estimatedDuration', parseInt(e.target.value))}
        />
      </div>
    </Modal>
  );
}

