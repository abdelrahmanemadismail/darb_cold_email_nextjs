import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Contact } from '@/db/schema/contacts';
import type { ContactQueryParams, CreateContactInput, UpdateContactInput, BulkOperation } from '@/types/contact';

const API_BASE = '/api/contacts';

interface ContactsResponse {
  data: (Contact & { company: { id: string; name: string; city: string | null; country: string | null } | null })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fetch contacts list
export function useContacts(params?: Partial<ContactQueryParams>) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const { data } = await axios.get<ContactsResponse>(API_BASE, { params });
      return data;
    },
  });
}

// Fetch single contact
export function useContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', contactId],
    queryFn: async () => {
      if (!contactId) throw new Error('Contact ID is required');
      type ContactWithCompany = Contact & {
        company: { id: string; name: string; size: string | null; city: string | null; country: string | null } | null
      };
      const { data } = await axios.get<ContactWithCompany>(`${API_BASE}/${contactId}`);
      return data;
    },
    enabled: !!contactId,
  });
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data } = await axios.post<Contact>(API_BASE, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactInput }) => {
      const { data: result } = await axios.patch<Contact>(`${API_BASE}/${id}`, data);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.id] });
    },
  });
}

// Delete contact mutation
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_BASE}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// Bulk operations mutation
export function useBulkOperation(type: 'companies' | 'contacts') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operation: BulkOperation) => {
      const { data } = await axios.post(`/api/data/bulk?type=${type}`, operation);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type] });
    },
  });
}
