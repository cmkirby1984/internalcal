'use client';

import { useState } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { useUIStore } from '@/lib/store';
import { SuiteType, SuiteStatus, BedConfiguration } from '@/lib/types';
import { formatEnumValue } from '@/lib/utils';

const suiteTypeOptions = Object.values(SuiteType).map(type => ({
  value: type,
  label: formatEnumValue(type),
}));

const bedConfigOptions = Object.values(BedConfiguration).map(config => ({
  value: config,
  label: formatEnumValue(config),
}));

const floorOptions = [
  { value: '1', label: 'Floor 1' },
  { value: '2', label: 'Floor 2' },
  { value: '3', label: 'Floor 3' },
  { value: '4', label: 'Floor 4' },
];

export function CreateSuiteModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const showToast = useUIStore((state) => state.showToast);

  const isOpen = activeModal === 'create-suite';

  const [formData, setFormData] = useState({
    suiteNumber: '',
    floor: '1',
    type: SuiteType.STANDARD,
    bedConfiguration: BedConfiguration.QUEEN,
    maxOccupancy: 2,
    amenities: '',
    notes: '',
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
    
    if (!formData.suiteNumber.trim()) {
      newErrors.suiteNumber = 'Suite number is required';
    }
    
    if (!formData.floor) {
      newErrors.floor = 'Floor is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      // TODO: Call API to create suite
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showToast({ type: 'SUCCESS', message: 'Suite created successfully' });
      closeModal();
      
      // Reset form
      setFormData({
        suiteNumber: '',
        floor: '1',
        type: SuiteType.STANDARD,
        bedConfiguration: BedConfiguration.QUEEN,
        maxOccupancy: 2,
        amenities: '',
        notes: '',
      });
    } catch (error) {
      showToast({ type: 'ERROR', message: 'Failed to create suite' });
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
      title="Add New Suite"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Create Suite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Suite Number"
            required
            placeholder="e.g., 101"
            value={formData.suiteNumber}
            onChange={(e) => handleChange('suiteNumber', e.target.value)}
            error={errors.suiteNumber}
          />
          
          <Select
            label="Floor"
            required
            options={floorOptions}
            value={formData.floor}
            onChange={(value) => handleChange('floor', value)}
            error={errors.floor}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Suite Type"
            required
            options={suiteTypeOptions}
            value={formData.type}
            onChange={(value) => handleChange('type', value)}
          />
          
          <Select
            label="Bed Configuration"
            required
            options={bedConfigOptions}
            value={formData.bedConfiguration}
            onChange={(value) => handleChange('bedConfiguration', value)}
          />
        </div>

        <Input
          label="Max Occupancy"
          type="number"
          min={1}
          max={10}
          value={formData.maxOccupancy}
          onChange={(e) => handleChange('maxOccupancy', parseInt(e.target.value))}
        />

        <Input
          label="Amenities"
          placeholder="e.g., TV, WiFi, AC, Mini Bar (comma separated)"
          value={formData.amenities}
          onChange={(e) => handleChange('amenities', e.target.value)}
          helperText="Enter amenities separated by commas"
        />

        <Textarea
          label="Notes"
          placeholder="Any additional notes about this suite..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}

