export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export class Validator<T = unknown> {
  private rules: ValidationRule<T>[] = [];

  required(message: string = 'This field is required'): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
      },
      message
    });
    return this;
  }

  minLength(min: number, message?: string): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value === 'string') return value.length >= min;
        if (Array.isArray(value)) return value.length >= min;
        return false;
      },
      message: message || `Minimum length is ${min}`
    });
    return this;
  }

  maxLength(max: number, message?: string): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value === 'string') return value.length <= max;
        if (Array.isArray(value)) return value.length <= max;
        return false;
      },
      message: message || `Maximum length is ${max}`
    });
    return this;
  }

  email(message: string = 'Invalid email address'): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value !== 'string') return false;
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(value);
      },
      message
    });
    return this;
  }

  url(message: string = 'Invalid URL'): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value !== 'string') return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message
    });
    return this;
  }

  phone(message: string = 'Invalid phone number'): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value !== 'string') return false;
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(value.replace(/[\s-()]/g, ''));
      },
      message
    });
    return this;
  }

  numeric(message: string = 'Must be a number'): this {
    this.rules.push({
      validate: (value) => {
        if (typeof value === 'number') return !isNaN(value);
        if (typeof value === 'string') return !isNaN(parseFloat(value));
        return false;
      },
      message
    });
    return this;
  }

  min(min: number, message?: string): this {
    this.rules.push({
      validate: (value) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return typeof num === 'number' && num >= min;
      },
      message: message || `Minimum value is ${min}`
    });
    return this;
  }

  max(max: number, message?: string): this {
    this.rules.push({
      validate: (value) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return typeof num === 'number' && num <= max;
      },
      message: message || `Maximum value is ${max}`
    });
    return this;
  }

  pattern(regex: RegExp, message: string): this {
    this.rules.push({
      validate: (value) => {
        return typeof value === 'string' && regex.test(value);
      },
      message
    });
    return this;
  }

  custom(validate: (value: T) => boolean, message: string): this {
    this.rules.push({ validate, message });
    return this;
  }

  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const createValidator = <T = unknown>() => new Validator<T>();

export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, Validator>
): { isValid: boolean; errors: Record<keyof T, string[]> } => {
  const errors = {} as Record<keyof T, string[]>;
  let isValid = true;

  for (const key in schema) {
    const result = schema[key].validate(data[key]);
    if (!result.isValid) {
      errors[key] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors };
};

export const campaignValidation = {
  name: createValidator<string>()
    .required('Campaign name is required')
    .minLength(3, 'Campaign name must be at least 3 characters')
    .maxLength(100, 'Campaign name must be less than 100 characters'),

  description: createValidator<string>()
    .maxLength(1000, 'Description must be less than 1000 characters'),

  budget: createValidator<number>()
    .numeric('Budget must be a valid number')
    .min(0, 'Budget cannot be negative'),

  startDate: createValidator<string>()
    .required('Start date is required')
    .custom(
      (date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      'Invalid date format'
    ),

  endDate: createValidator<string>()
    .custom(
      (date) => {
        if (!date) return true;
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      'Invalid date format'
    )
};

export const creatorValidation = {
  name: createValidator<string>()
    .required('Creator name is required')
    .minLength(2, 'Name must be at least 2 characters')
    .maxLength(100, 'Name must be less than 100 characters'),

  email: createValidator<string>()
    .email('Invalid email address'),

  phone: createValidator<string>()
    .phone('Invalid phone number'),

  instagramHandle: createValidator<string>()
    .pattern(/^@?[\w.]+$/, 'Invalid Instagram handle'),

  tiktokHandle: createValidator<string>()
    .pattern(/^@?[\w.]+$/, 'Invalid TikTok handle'),

  youtubeHandle: createValidator<string>()
    .pattern(/^@?[\w-]+$/, 'Invalid YouTube handle'),

  engagementRate: createValidator<number>()
    .numeric('Engagement rate must be a number')
    .min(0, 'Engagement rate cannot be negative')
    .max(100, 'Engagement rate cannot exceed 100%')
};

export const taskValidation = {
  title: createValidator<string>()
    .required('Task title is required')
    .minLength(3, 'Title must be at least 3 characters')
    .maxLength(200, 'Title must be less than 200 characters'),

  description: createValidator<string>()
    .maxLength(2000, 'Description must be less than 2000 characters'),

  dueDate: createValidator<string>()
    .custom(
      (date) => {
        if (!date) return true;
        const d = new Date(date);
        return !isNaN(d.getTime()) && d >= new Date();
      },
      'Due date must be in the future'
    )
};

export const userValidation = {
  fullName: createValidator<string>()
    .required('Full name is required')
    .minLength(2, 'Name must be at least 2 characters')
    .maxLength(100, 'Name must be less than 100 characters'),

  email: createValidator<string>()
    .required('Email is required')
    .email('Invalid email address'),

  phone: createValidator<string>()
    .phone('Invalid phone number'),

  company: createValidator<string>()
    .maxLength(100, 'Company name must be less than 100 characters'),

  jobTitle: createValidator<string>()
    .maxLength(100, 'Job title must be less than 100 characters')
};

export const workspaceValidation = {
  name: createValidator<string>()
    .required('Workspace name is required')
    .minLength(3, 'Workspace name must be at least 3 characters')
    .maxLength(50, 'Workspace name must be less than 50 characters'),

  slug: createValidator<string>()
    .required('Workspace slug is required')
    .pattern(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .minLength(3, 'Slug must be at least 3 characters')
    .maxLength(50, 'Slug must be less than 50 characters')
};

export const adSetValidation = {
  name: createValidator<string>()
    .required('Ad set name is required')
    .minLength(3, 'Ad set name must be at least 3 characters')
    .maxLength(100, 'Ad set name must be less than 100 characters'),

  revenue: createValidator<number>()
    .numeric('Revenue must be a valid number')
    .min(0, 'Revenue cannot be negative'),

  spend: createValidator<number>()
    .numeric('Spend must be a valid number')
    .min(0, 'Spend cannot be negative'),

  adCreativeUrl: createValidator<string>()
    .url('Invalid URL format')
};
