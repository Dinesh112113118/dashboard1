import axios from 'axios';
import { Issue } from '../types';

const api = axios.create({
  // Use a relative path for the base URL.
  // The Vite proxy will intercept this and forward it to the backend.
  baseURL: '/api',
});

// Mapper function to handle data transformation, especially for dates
const mapApiDataToIssue = (data: any): Issue => ({
  ...data,
  submittedAt: new Date(data.submittedAt),
  resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
});

export const getIssues = async (): Promise<Issue[]> => {
  const response = await api.get<any[]>('/issues');
  // With the proxy fixed, response.data should be the JSON array from the API.
  return response.data.map(mapApiDataToIssue);
};

export const updateIssue = async (issueId: string, updates: Partial<Issue>): Promise<Issue> => {
  const response = await api.patch(`/issues/${issueId}`, updates);
  return mapApiDataToIssue(response.data);
};

export const deleteIssue = async (issueId: string): Promise<void> => {
  await api.delete(`/issues/${issueId}`);
};

export const resolveIssue = async (issueId: string, data: { resolutionNotes: string; resolutionImage: File; resolvedBy: string; }): Promise<Issue> => {
  const formData = new FormData();
  formData.append('resolutionNotes', data.resolutionNotes);
  formData.append('resolutionImage', data.resolutionImage);
  formData.append('resolvedBy', data.resolvedBy);

  const response = await api.post(`/issues/${issueId}/resolve`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return mapApiDataToIssue(response.data);
};

export default {
  getIssues,
  updateIssue,
  deleteIssue,
  resolveIssue,
};
