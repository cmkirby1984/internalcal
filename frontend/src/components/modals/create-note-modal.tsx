'use client';

import { useState } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { useUIStore } from '@/lib/store';
import { NoteType, NotePriority, NoteVisibility } from '@/lib/types';
import { formatEnumValue } from '@/lib/utils';

const noteTypeOptions = Object.values(NoteType).map(type => ({
  value: type,
  label: formatEnumValue(type),
}));

const priorityOptions = Object.values(NotePriority).map(priority => ({
  value: priority,
  label: formatEnumValue(priority),
}));

const visibilityOptions = Object.values(NoteVisibility).map(visibility => ({
  value: visibility,
  label: formatEnumValue(visibility),
}));

export function CreateNoteModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const showToast = useUIStore((state) => state.showToast);

  const isOpen = activeModal === 'create-note';

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: NoteType.GENERAL,
    priority: NotePriority.NORMAL,
    visibility: NoteVisibility.ALL_STAFF,
    tags: '',
    requiresFollowUp: false,
    followUpDate: '',
    relatedSuite: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
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
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.requiresFollowUp && !formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      // TODO: Call API to create note
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showToast({ type: 'SUCCESS', message: 'Note created successfully' });
      closeModal();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        type: NoteType.GENERAL,
        priority: NotePriority.NORMAL,
        visibility: NoteVisibility.ALL_STAFF,
        tags: '',
        requiresFollowUp: false,
        followUpDate: '',
        relatedSuite: '',
      });
    } catch (error) {
      showToast({ type: 'ERROR', message: 'Failed to create note' });
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
      title="Create New Note"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Create Note
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          required
          placeholder="Enter note title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
        />

        <Textarea
          label="Content"
          required
          placeholder="Enter note content..."
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          error={errors.content}
          rows={4}
        />

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Type"
            options={noteTypeOptions}
            value={formData.type}
            onChange={(value) => handleChange('type', value)}
          />
          
          <Select
            label="Priority"
            options={priorityOptions}
            value={formData.priority}
            onChange={(value) => handleChange('priority', value)}
          />
          
          <Select
            label="Visibility"
            options={visibilityOptions}
            value={formData.visibility}
            onChange={(value) => handleChange('visibility', value)}
          />
        </div>

        <Input
          label="Tags"
          placeholder="e.g., VIP, Urgent, Maintenance (comma separated)"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          helperText="Enter tags separated by commas"
        />

        <Input
          label="Related Suite (Optional)"
          placeholder="e.g., 101"
          value={formData.relatedSuite}
          onChange={(e) => handleChange('relatedSuite', e.target.value)}
        />

        <div className="space-y-3 pt-2 border-t border-[var(--border-light)]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresFollowUp}
              onChange={(e) => handleChange('requiresFollowUp', e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Requires follow-up</span>
          </label>

          {formData.requiresFollowUp && (
            <Input
              label="Follow-up Date"
              type="date"
              required
              value={formData.followUpDate}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              error={errors.followUpDate}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

