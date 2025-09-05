import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiClient';

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        return response.json();
      } catch (error) {
        // Return null for unauthorized users
        return null;
      }
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}