import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Company } from '@/db/schema/companies';
import type { CompanyQueryParams, CreateCompanyInput, UpdateCompanyInput } from '@/types/company';

const API_BASE = '/api/companies';

interface CompaniesResponse {
  data: (Company & { contactsCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fetch companies list
export function useCompanies(params?: Partial<CompanyQueryParams>) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const { data } = await axios.get<CompaniesResponse>(API_BASE, { params });
      return data;
    },
  });
}

// Fetch single company
export function useCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');
      const { data } = await axios.get<Company & { contactsCount: number }>(`${API_BASE}/${companyId}`);
      return data;
    },
    enabled: !!companyId,
  });
}

// Create company mutation
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCompanyInput) => {
      const { data } = await axios.post<Company>(API_BASE, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

// Update company mutation
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompanyInput }) => {
      const { data: result } = await axios.patch<Company>(`${API_BASE}/${id}`, data);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] });
    },
  });
}

// Delete company mutation
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_BASE}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
