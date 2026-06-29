import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Job, Application } from '../types';

export const useJobs = (filters?: { category?: string; status?: string }) => {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      const { data } = await api.get(`/api/jobs?${params}`);
      return data.jobs as Job[];
    },
  });
};

export const useJob = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/jobs/${id}`);
      return {
        job: data.job as Job,
        applications: (data.applications || []) as Application[],
      };
    },
    enabled: !!id,
  });
};

export const useMyJobs = () => {
  return useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const { data } = await api.get('/api/jobs/my');
      return data.jobs as Job[];
    },
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobData: Partial<Job>) => {
      const { data } = await api.post('/api/jobs', jobData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    },
  });
};

export const useApplyJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, message }: { jobId: string; message: string }) => {
      const { data } = await api.post(`/api/jobs/${jobId}/apply`, { message });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['job', vars.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
