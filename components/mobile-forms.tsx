'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  User,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Camera,
  Upload,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  Plus,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'autocomplete';
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  maxLength?: number;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function MobileFormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  options = [],
  error,
  required = false,
  disabled = false,
  icon,
  description,
  maxLength,
  rows = 3,
  accept,
  multiple = false,
  className
}: MobileFormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    // Add slight delay for mobile keyboard to appear
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const renderInput = () => {
    const inputClassName = cn(
      "h-12 text-base border-2 transition-all duration-200 rounded-xl",
      "focus:border-[#1993e5] focus:ring-0 focus:outline-none",
      error && "border-red-300 focus:border-red-500",
      disabled && "opacity-50 cursor-not-allowed",
      icon && "pl-12",
      type === 'password' && "pr-12"
    );

    switch (type) {
      case 'textarea':
        return (
          <div className="relative">
            <Textarea
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={rows}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={cn(
                "text-base border-2 transition-all duration-200 rounded-xl resize-none",
                "focus:border-[#1993e5] focus:ring-0 focus:outline-none",
                error && "border-red-300 focus:border-red-500",
                disabled && "opacity-50 cursor-not-allowed",
                icon && "pl-12"
              )}
            />
            {icon && (
              <div className="absolute left-4 top-4 text-gray-400">
                {icon}
              </div>
            )}
            {maxLength && (
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {(value || '').length}/{maxLength}
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={inputClassName}>
              {icon && (
                <div className="absolute left-4 text-gray-400">
                  {icon}
                </div>
              )}
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-xl">
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="text-base font-medium text-gray-900">{placeholder}</p>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-colors",
                  value === option.value
                    ? "border-[#1993e5] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => onChange?.(option.value)}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  value === option.value
                    ? "border-[#1993e5] bg-[#1993e5]"
                    : "border-gray-300"
                )}>
                  {value === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-base font-medium text-gray-900">{option.label}</span>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onChange?.(multiple ? files : files[0]);
              }}
              disabled={disabled}
              className="hidden"
            />
            <div
              className={cn(
                "flex items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#1993e5] hover:bg-blue-50",
                error && "border-red-300"
              )}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-base font-medium text-gray-900">
                  {placeholder || 'Tap to upload file'}
                </p>
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={inputClassName}
            />
            {icon && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                {icon}
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        );

      default:
        return (
          <div className="relative">
            <Input
              ref={inputRef}
              type={type}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={inputClassName}
            />
            {icon && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                {icon}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-semibold text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {renderInput()}

      {error && (
        <div className="flex items-center space-x-2 text-red-600">
          <X className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {description && !error && type !== 'checkbox' && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
}

interface MobileFormProps {
  title: string;
  description?: string;
  fields: MobileFormFieldProps[];
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  className?: string;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export function MobileForm({
  title,
  description,
  fields,
  onSubmit,
  submitLabel = 'Submit',
  className,
  showProgress = false,
  currentStep = 1,
  totalSteps = 1
}: MobileFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Handle mobile keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      // Simple heuristic to detect mobile keyboard
      const heightDiff = window.screen.height - window.innerHeight;
      setIsKeyboardVisible(heightDiff > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFieldChange = (fieldIndex: number, value: any) => {
    const field = fields[fieldIndex];
    const key = field.label.toLowerCase().replace(/\s+/g, '_');

    setFormData(prev => ({ ...prev, [key]: value }));

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    fields.forEach((field, index) => {
      const key = field.label.toLowerCase().replace(/\s+/g, '_');
      const value = formData[key];

      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[key] = `${field.label} is required`;
      }

      // Email validation
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[key] = 'Please enter a valid email address';
      }

      // Phone validation
      if (field.type === 'tel' && value && !/^\+?[\d\s-()]+$/.test(value)) {
        newErrors[key] = 'Please enter a valid phone number';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
          {showProgress && (
            <div className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>
          )}
        </div>

        {showProgress && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#1993e5] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-6 pb-24">
          {fields.map((field, index) => {
            const key = field.label.toLowerCase().replace(/\s+/g, '_');
            return (
              <MobileFormField
                key={index}
                {...field}
                value={formData[key]}
                onChange={(value) => handleFieldChange(index, value)}
                error={errors[key]}
              />
            );
          })}
        </div>

        {/* Fixed Submit Button */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 p-4 bg-white border-t transition-transform duration-300",
          isKeyboardVisible && "transform translate-y-full"
        )}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold bg-[#1993e5] hover:bg-[#1680cc]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Example usage component
export function MobileFormExample() {
  const sampleFields: MobileFormFieldProps[] = [
    {
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      icon: <User className="w-5 h-5" />,
      required: true
    },
    {
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email',
      icon: <Mail className="w-5 h-5" />,
      required: true
    },
    {
      label: 'Phone Number',
      type: 'tel',
      placeholder: 'Enter your phone number',
      icon: <Phone className="w-5 h-5" />,
      required: true
    },
    {
      label: 'Location',
      type: 'text',
      placeholder: 'City, State/Country',
      icon: <MapPin className="w-5 h-5" />
    },
    {
      label: 'Experience Level',
      type: 'select',
      placeholder: 'Select your experience level',
      options: [
        { value: 'entry', label: '0-2 years (Entry Level)' },
        { value: 'mid', label: '3-5 years (Mid Level)' },
        { value: 'senior', label: '6-10 years (Senior Level)' },
        { value: 'lead', label: '10+ years (Lead/Principal)' }
      ],
      required: true
    },
    {
      label: 'Cover Letter',
      type: 'textarea',
      placeholder: 'Tell us about yourself and why you are interested in this position...',
      description: 'Share your motivation and relevant experience',
      maxLength: 1000,
      rows: 4
    },
    {
      label: 'Resume',
      type: 'file',
      placeholder: 'Upload your resume',
      description: 'PDF, DOC, or DOCX files only (max 5MB)',
      accept: '.pdf,.doc,.docx',
      required: true
    },
    {
      label: 'Remote Work Preference',
      type: 'radio',
      options: [
        { value: 'remote', label: 'Fully Remote' },
        { value: 'hybrid', label: 'Hybrid (2-3 days remote)' },
        { value: 'onsite', label: 'On-site Only' }
      ],
      required: true
    },
    {
      label: 'Terms and Conditions',
      type: 'checkbox',
      placeholder: 'I agree to the terms and conditions',
      description: 'By checking this box, you agree to our privacy policy and terms of service',
      required: true
    }
  ];

  const handleSubmit = async (data: any) => {
    console.log('Form submitted:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('Form submitted successfully!');
  };

  return (
    <MobileForm
      title="Job Application"
      description="Apply for Senior Frontend Developer position"
      fields={sampleFields}
      onSubmit={handleSubmit}
      submitLabel="Submit Application"
      showProgress={true}
      currentStep={1}
      totalSteps={3}
    />
  );
}