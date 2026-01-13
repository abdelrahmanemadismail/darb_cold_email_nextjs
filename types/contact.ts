import { z } from 'zod';

// Gender options
export const GENDERS = ['male', 'female', 'other', 'prefer-not-to-say'] as const;

// Validation schemas
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(50).optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').max(500).optional().nullable().or(z.literal('')),
  isEmailVerified: z.boolean(),
  tags: z.array(z.string().max(100)),
  notes: z.string().optional().nullable(),
  managedBy: z.string().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactQuerySchema = z.object({
  page: z.string().nullish().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().nullish().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional().nullable().transform(val => val || undefined),
  companyId: z.string().uuid().optional().nullable().transform(val => val || undefined),
  tags: z.string().optional().nullable().transform(val => val || undefined),
  isEmailVerified: z.coerce.boolean().optional().nullable().transform(val => val === null ? undefined : val),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt', 'lastContactedAt']).optional().nullable().transform(val => val || 'createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().nullable().transform(val => val || 'desc'),
});

export const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
  operation: z.enum(['delete', 'addTags', 'removeTags', 'addKeywords', 'removeKeywords', 'export']),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQueryParams = z.infer<typeof contactQuerySchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
