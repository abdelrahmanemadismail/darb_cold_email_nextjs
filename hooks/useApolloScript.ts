/**
 * React Hook for Apollo.io Script Integration
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ApolloConfig,
  ApolloScriptRequest,
  ApolloScriptResponse,
  ApolloErrorResponse
} from '@/types/apollo';

/**
 * Fetch Apollo configuration
 */
export function useApolloConfig() {
  return useQuery<ApolloConfig, Error>({
    queryKey: ['apollo-config'],
    queryFn: async () => {
      const response = await fetch('/api/scripts/apollo');
      if (!response.ok) {
        const error: ApolloErrorResponse = await response.json();
        throw new Error(error.message || 'Failed to fetch Apollo configuration');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Run Apollo script
 */
export function useRunApolloScript() {
  return useMutation<ApolloScriptResponse, Error, ApolloScriptRequest>({
    mutationFn: async (params) => {
      const response = await fetch('/api/scripts/apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to run Apollo script');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Apollo script completed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to run Apollo script');
    },
  });
}
