import { z } from 'zod';

// Company size options
export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
] as const;

// Company source options
export const COMPANY_SOURCES = ['manual', 'apify', 'apollo', 'import'] as const;

// Validation schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  size: z.enum(COMPANY_SIZES).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  keywords: z.array(z.string().max(255)),
  source: z.enum(COMPANY_SOURCES).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyQuerySchema = z.object({
  page: z.string().nullish().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().nullish().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional().nullable().transform(val => val || undefined),
  source: z.enum(COMPANY_SOURCES).optional().nullable().transform(val => val || undefined),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().nullable().transform(val => val || 'createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().nullable().transform(val => val || 'desc'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyQueryParams = z.infer<typeof companyQuerySchema>;
