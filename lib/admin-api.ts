/**
 * Admin API Client Service
 * Handles all admin backend API communication
 */

import { createClient } from './supabase/client';

// Production API URL
// NEXT_PUBLIC_API_URL should be like: https://api.cvlab.sa/api
// We append /admin to get: https://api.cvlab.sa/api/admin
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/admin`
  : process.env.NODE_ENV === 'production'
  ? 'https://api.cvlab.sa/api/admin'
  : 'http://localhost:8002/api/admin';

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
async function fetchAdminAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

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

  // Handle blob responses for exports
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/vnd.openxmlformats')) {
    return response.blob() as Promise<T>;
  }

  return response.json();
}

// ============== Types ==============

// Stats
export interface DashboardStats {
  server_uptime: string;
  resumes_processed: number;
  total_sessions: number;
  total_users: number;
}

// User Management
export type UserRole = 'user' | 'admin' | 'authenticated';
export type UserStatus = 'active' | 'inactive';

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  last_active: string | null;
  created_at: string | null;
  resumes_count: number;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: UserStatus | 'all';
  role?: UserRole | 'all';
  sort?: 'newest' | 'oldest';
}

// Resume Management
export type ResumeStatus = 'optimized' | 'analyzed' | 'failed' | 'processing';

export interface AdminResumeListItem {
  id: number;
  request_number: string;
  user_name: string | null;
  user_email: string | null;
  original_filename: string;
  status: ResumeStatus;
  user_status: UserStatus | null;  // User's active/inactive status
  created_at: string;
  file_size: number | null;
}

export interface ResumeListResponse {
  resumes: AdminResumeListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ResumeListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ResumeStatus | 'all';
  sort?: 'newest' | 'oldest';
}

export interface AIOptimizationInfo {
  status: string;
  optimization_score: number | null;
  readability_score: string | null;
  ats_score: number | null;
  improvements: string[];
}

export interface AdminResumeDetail {
  id: number;
  request_number: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_status: UserStatus | null;  // User's active/inactive status
  original_filename: string;
  file_type: string;
  file_size: number | null;
  status: ResumeStatus;
  created_at: string;
  updated_at: string | null;
  extracted_text: string | null;
  ai_optimization: AIOptimizationInfo | null;
  error_message: string | null;
}

// Claims Management
export type ClaimStatus = 'PENDING' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface AdminClaim {
  id: number;
  claim_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  subject: string;
  description: string;
  status: ClaimStatus;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ClaimListResponse {
  claims: AdminClaim[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClaimListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ClaimStatus | 'all';
}

export interface ClaimStats {
  open_claims: number;
  in_review: number;
  resolved: number;
  total: number;
}

// LLM & Prompts
export type LLMProvider = 'anthropic' | 'openai';
export type PromptStatus = 'active' | 'draft';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  max_tokens: number;
}

export interface Prompt {
  id: string;
  name: string;
  title: string;
  description: string;
  content: string;
  status: PromptStatus;
  last_updated: string;
}

export interface PromptListResponse {
  prompts: Prompt[];
}

// ============== API Functions ==============

// Stats
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAdminAPI<DashboardStats>('/stats');
}

// User Management
export async function getUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  // Backend expects 'limit' not 'page_size'
  if (params.page_size) searchParams.set('limit', params.page_size.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.role && params.role !== 'all') searchParams.set('role', params.role);
  if (params.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  return fetchAdminAPI<UserListResponse>(`/users${query ? `?${query}` : ''}`);
}

export async function getUser(userId: string): Promise<AdminUser> {
  return fetchAdminAPI<AdminUser>(`/users/${userId}`);
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<AdminUser> {
  return fetchAdminAPI<AdminUser>(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await fetchAdminAPI(`/users/${userId}`, { method: 'DELETE' });
}

// Resume Management
export async function getResumes(params: ResumeListParams = {}): Promise<ResumeListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size) searchParams.set('page_size', params.page_size.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  return fetchAdminAPI<ResumeListResponse>(`/resumes${query ? `?${query}` : ''}`);
}

export async function getResume(resumeId: number): Promise<AdminResumeDetail> {
  return fetchAdminAPI<AdminResumeDetail>(`/resumes/${resumeId}`);
}

export async function deleteResume(resumeId: number): Promise<void> {
  await fetchAdminAPI(`/resumes/${resumeId}`, { method: 'DELETE' });
}

export async function exportResumes(): Promise<Blob> {
  return fetchAdminAPI<Blob>('/resumes/export');
}

export function getResumeDownloadUrl(resumeId: number, type: 'original' | 'optimized'): string {
  // Use the same base URL logic as fetchAdminAPI
  const adminBaseUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/admin`
    : process.env.NODE_ENV === 'production'
    ? 'https://api.cvlab.sa/api/admin'
    : 'http://localhost:8002/api/admin';
  return `${adminBaseUrl}/resumes/${resumeId}/download/${type}`;
}

// Claims Management
export async function getClaimStats(): Promise<ClaimStats> {
  return fetchAdminAPI<ClaimStats>('/claims/stats');
}

export async function getClaims(params: ClaimListParams = {}): Promise<ClaimListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size) searchParams.set('page_size', params.page_size.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);

  const query = searchParams.toString();
  return fetchAdminAPI<ClaimListResponse>(`/claims${query ? `?${query}` : ''}`);
}

export async function updateClaimStatus(claimId: number, status: ClaimStatus): Promise<AdminClaim> {
  return fetchAdminAPI<AdminClaim>(`/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function exportClaims(): Promise<Blob> {
  return fetchAdminAPI<Blob>('/claims/export');
}

// LLM & Prompts
export async function getLLMConfig(): Promise<LLMConfig> {
  return fetchAdminAPI<LLMConfig>('/llm-config');
}

export async function updateLLMConfig(provider: LLMProvider, model: string): Promise<LLMConfig> {
  return fetchAdminAPI<LLMConfig>('/llm-config', {
    method: 'PUT',
    body: JSON.stringify({ provider, model }),
  });
}

export async function getPrompts(): Promise<PromptListResponse> {
  return fetchAdminAPI<PromptListResponse>('/prompts');
}

export async function updatePrompt(promptId: string, content: string, status?: PromptStatus): Promise<Prompt> {
  return fetchAdminAPI<Prompt>(`/prompts/${promptId}`, {
    method: 'PUT',
    body: JSON.stringify({ content, status }),
  });
}

// Notifications Management
export interface AdminNotification {
  id: number;
  type: 'user_registered' | 'resume_optimized';
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  notifications: AdminNotification[];
  unread_count: number;
  total: number;
}

export async function getNotifications(limit: number = 20): Promise<NotificationListResponse> {
  return fetchAdminAPI<NotificationListResponse>(`/notifications?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getUnreadCount(): Promise<{ unread_count: number }> {
  return fetchAdminAPI<{ unread_count: number }>('/notifications/unread-count', {
    method: 'GET',
  });
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  return fetchAdminAPI<void>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  return fetchAdminAPI<{ count: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
