'use client';

import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useUIStore, useEmployeesStore } from '@/lib/store';
import { EmployeeRole, Department } from '@/lib/types';
import { formatEnumValue } from '@/lib/utils';

const roleOptions = Object.values(EmployeeRole).map(role => ({
  value: role,
  label: formatEnumValue(role),
}));

const departmentOptions = Object.values(Department).map(dept => ({
  value: dept,
  label: formatEnumValue(dept),
}));

export function CreateEmployeeModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const createEmployee = useEmployeesStore((state) => state.createEmployee);

  const isOpen = activeModal === 'create-employee';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: EmployeeRole.HOUSEKEEPER,
    department: Department.HOUSEKEEPING,
    hireDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      await createEmployee({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        username: formData.username,
        role: formData.role,
        department: formData.department,
        hireDate: formData.hireDate,
      } as any); // Password is required for creation but not part of Employee type
      
      closeModal();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        role: EmployeeRole.HOUSEKEEPER,
        department: Department.HOUSEKEEPING,
        hireDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      // Error handling is done in the store
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
      title="Add New Employee"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Add Employee
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            placeholder="Enter first name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
          />
          
          <Input
            label="Last Name"
            required
            placeholder="Enter last name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            required
            type="email"
            placeholder="employee@motel.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
          />
          
          <Input
            label="Phone"
            type="tel"
            placeholder="555-0100"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Username"
            required
            placeholder="Enter username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            error={errors.username}
          />
          
          <Input
            label="Password"
            required
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            required
            options={roleOptions}
            value={formData.role}
            onChange={(value) => handleChange('role', value)}
          />
          
          <Select
            label="Department"
            required
            options={departmentOptions}
            value={formData.department}
            onChange={(value) => handleChange('department', value)}
          />
        </div>

        <Input
          label="Hire Date"
          type="date"
          value={formData.hireDate}
          onChange={(e) => handleChange('hireDate', e.target.value)}
        />
      </div>
    </Modal>
  );
}
