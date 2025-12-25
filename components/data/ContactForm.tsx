'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactSchema, GENDERS, type CreateContactInput } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompanies } from '@/hooks/data/useCompanies';
import type { Contact } from '@/db/schema/contacts';

interface ContactFormProps {
  onSubmit: (data: CreateContactInput) => void;
  initialData?: Partial<Contact>;
  isLoading?: boolean;
}

export function ContactForm({ onSubmit, initialData, isLoading }: ContactFormProps) {
  const { data: companiesData } = useCompanies({ limit: 100, sortBy: 'name', sortOrder: 'asc' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      gender: (initialData?.gender as typeof GENDERS[number]) || undefined,
      position: initialData?.position || '',
      companyId: initialData?.companyId || undefined,
      linkedinUrl: initialData?.linkedinUrl || '',
      isEmailVerified: initialData?.isEmailVerified ?? false,
      tags: initialData?.tags ?? [],
      notes: initialData?.notes || '',
    },
  });

  const tags = watch('tags') || [];

  const handleTagsChange = (value: string) => {
    const tagArray = value.split(',').map(t => t.trim()).filter(Boolean);
    setValue('tags', tagArray);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="John"
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Doe"
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="john.doe@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            {...register('gender')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
          >
            <option value="">Select gender...</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender.charAt(0).toUpperCase() + gender.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
          {errors.gender && (
            <p className="text-sm text-red-500">{errors.gender.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          {...register('position')}
          placeholder="Software Engineer"
          disabled={isLoading}
        />
        {errors.position && (
          <p className="text-sm text-red-500">{errors.position.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyId">Company</Label>
        <select
          id="companyId"
          {...register('companyId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isLoading}
        >
          <option value="">Select company...</option>
          {companiesData?.data.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        {errors.companyId && (
          <p className="text-sm text-red-500">{errors.companyId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
        <Input
          id="linkedinUrl"
          {...register('linkedinUrl')}
          placeholder="https://linkedin.com/in/johndoe"
          disabled={isLoading}
        />
        {errors.linkedinUrl && (
          <p className="text-sm text-red-500">{errors.linkedinUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="vip, decision-maker, interested"
          disabled={isLoading}
        />
        {errors.tags && (
          <p className="text-sm text-red-500">{errors.tags.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes about this contact..."
          rows={3}
          disabled={isLoading}
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isEmailVerified"
          {...register('isEmailVerified')}
          className="h-4 w-4 rounded border-gray-300"
          disabled={isLoading}
        />
        <Label htmlFor="isEmailVerified" className="cursor-pointer">
          Email Verified
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}
