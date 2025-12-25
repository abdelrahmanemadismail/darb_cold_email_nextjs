'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCompanySchema, COMPANY_SIZES, COMPANY_SOURCES, type CreateCompanyInput } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Company } from '@/db/schema/companies';

interface CompanyFormProps {
  onSubmit: (data: CreateCompanyInput) => void;
  initialData?: Partial<Company>;
  isLoading?: boolean;
}

export function CompanyForm({ onSubmit, initialData, isLoading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: initialData?.name || '',
      size: (initialData?.size as typeof COMPANY_SIZES[number]) || undefined,
      city: initialData?.city || '',
      country: initialData?.country || '',
      keywords: initialData?.keywords ?? [],
      source: (initialData?.source as typeof COMPANY_SOURCES[number]) || 'manual',
    },
  });

  const keywords = watch('keywords') || [];

  const handleKeywordsChange = (value: string) => {
    const keywordArray = value.split(',').map(k => k.trim()).filter(Boolean);
    setValue('keywords', keywordArray);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Acme Corporation"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size">Company Size</Label>
          <select
            id="size"
            {...register('size')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
          >
            <option value="">Select size...</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} employees
              </option>
            ))}
          </select>
          {errors.size && (
            <p className="text-sm text-red-500">{errors.size.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <select
            id="source"
            {...register('source')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
          >
            <option value="">Select source...</option>
            {COMPANY_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>
          {errors.source && (
            <p className="text-sm text-red-500">{errors.source.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="San Francisco"
            disabled={isLoading}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="United States"
            disabled={isLoading}
          />
          {errors.country && (
            <p className="text-sm text-red-500">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={keywords.join(', ')}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder="SaaS, B2B, Technology"
          disabled={isLoading}
        />
        {errors.keywords && (
          <p className="text-sm text-red-500">{errors.keywords.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Company' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}
