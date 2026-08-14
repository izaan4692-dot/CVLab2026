/**
 * API Client Service
 * Handles all backend API communication
 */

import { createClient } from './supabase/client';

// Production API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/v1`
  : 'https://api.cvlab.sa/api/v1';

/**
 * Get current auth token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Generic fetch wrapper with error handling and auth
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// Types
export interface UploadResponse {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  message: string;
}

export interface StatusResponse {
  id: number;
  status: string;
  original_filename: string;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  extracted_text_length: number | null;
  analysis_complete: boolean;
  questions_available: boolean;
  answers_submitted: boolean;
  optimization_complete: boolean;
}

export interface QuestionItem {
  id: number;
  question: string;
  category: string;
  related_issue_id: number | null;
  priority: string;
  example: string | null;
}

export interface QuestionsResponse {
  resume_id: number;
  total_questions: number;
  questions: QuestionItem[];
  instructions: string;
}

export interface AnswerItem {
  question_id: number;
  answer: string;
  status: 'complete' | 'partial' | 'minimal' | 'skipped';
}

export interface AnswerSubmitRequest {
  resume_id: number;
  answers: AnswerItem[];
}

export interface AnswerResponse {
  id: number;
  resume_id: number;
  question_id: number;
  total_answered: number;
  total_skipped: number;
  completion_percentage: number;
  answers_json: object;
  created_at: string;
  message: string;
}

export interface PreviewResponse {
  resume_id: number;
  original_filename: string;
  optimized_text: string;
  changes_summary: object;
  file_format: string;
}

export interface UserNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface UserNotificationListResponse {
  notifications: UserNotification[];
  unread_count: number;
  total: number;
}

// API Functions

/**
 * Upload a resume file
 */
export async function uploadResume(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Get auth token
  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get resume processing status
 */
export async function getResumeStatus(resumeId: number): Promise<StatusResponse> {
  return fetchAPI<StatusResponse>(`/status/${resumeId}`);
}

/**
 * Get generated questions for a resume
 */
export async function getQuestions(resumeId: number): Promise<QuestionsResponse> {
  return fetchAPI<QuestionsResponse>(`/questions/${resumeId}`);
}

/**
 * Submit answers to questions
 */
export async function submitAnswers(data: AnswerSubmitRequest): Promise<AnswerResponse> {
  return fetchAPI<AnswerResponse>('/answers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get optimized resume preview
 */
export async function getResumePreview(resumeId: number): Promise<PreviewResponse> {
  return fetchAPI<PreviewResponse>(`/preview/${resumeId}`);
}

/**
 * Download optimized resume
 */
export function getDownloadUrl(resumeId: number, format: 'txt' | 'pdf' | 'docx' = 'txt'): string {
  return `${API_BASE_URL}/download/${resumeId}?format=${format}`;
}

/**
 * Poll status until a condition is met
 */
export async function pollStatus(
  resumeId: number,
  checkCondition: (status: StatusResponse) => boolean,
  onProgress?: (status: StatusResponse) => void,
  intervalMs: number = 2000,
  maxAttempts: number = 150
): Promise<StatusResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getResumeStatus(resumeId);

    if (onProgress) {
      onProgress(status);
    }

    if (checkCondition(status)) {
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error_message || 'Processing failed');
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('Polling timeout');
}

/**
 * Get user notifications
 */
export async function getUserNotifications(limit: number = 20, unreadOnly: boolean = false): Promise<UserNotificationListResponse> {
  return fetchAPI<UserNotificationListResponse>(`/notifications?limit=${limit}&unread_only=${unreadOnly}`);
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<{ unread_count: number }> {
  return fetchAPI<{ unread_count: number }>('/notifications/unread-count');
}

/**
 * Mark notification as read
 */
export async function markUserNotificationRead(notificationId: number): Promise<{ message: string; id: number }> {
  return fetchAPI<{ message: string; id: number }>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllUserNotificationsRead(): Promise<{ message: string; count: number }> {
  return fetchAPI<{ message: string; count: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

// User Activity
export interface ResumeActivityItem {
  id: number;
  filename: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  is_optimized: boolean;
}

export interface ActivityHistoryResponse {
  activities: ResumeActivityItem[];
  total: number;
}

export async function getUserActivity(limit: number = 10): Promise<ActivityHistoryResponse> {
  return fetchAPI<ActivityHistoryResponse>(`/activity?limit=${limit}`);
}
