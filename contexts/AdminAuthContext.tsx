'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const checkAdminStatus = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      console.log('[AdminAuth] Starting admin status check...', { retryCount });
      
      // First check if there's a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AdminAuth] getSession error:', sessionError);
        setError(sessionError.message || 'Failed to get session');
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return false;
      }

      if (!session || !session.user) {
        console.log('[AdminAuth] No session found');
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return false;
      }

      // Get user with proper error handling
      const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError) {
        console.error('[AdminAuth] getUser error:', getUserError);
        setError(getUserError.message || 'Failed to get user');
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return false;
      }

      if (!currentUser) {
        console.log('[AdminAuth] No user found');
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return false;
      }

      console.log('[AdminAuth] User found:', currentUser.id);
      setUser(currentUser);

      // Check if user has admin role in user metadata
      // The role is stored in user.user_metadata.role (from raw_user_meta_data in Supabase)
      let userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
      const adminRoles = ['admin', 'service_role', 'super_admin'];
      let hasAdminRole = userRole && adminRoles.includes(userRole);

      // If role is not found and we haven't retried yet, wait a bit and retry (metadata might not be immediately available)
      if (!userRole && retryCount < 2) {
        console.log('[AdminAuth] Role not found, retrying after delay...', { retryCount });
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return checkAdminStatus(retryCount + 1);
      }

      // Always log for debugging
      console.log('[AdminAuth] User role check:', {
        userId: currentUser.id,
        email: currentUser.email,
        user_metadata: JSON.stringify(currentUser.user_metadata),
        app_metadata: JSON.stringify(currentUser.app_metadata),
        user_metadata_role: currentUser.user_metadata?.role,
        app_metadata_role: currentUser.app_metadata?.role,
        resolvedRole: userRole,
        isAdmin: hasAdminRole,
        retryCount,
      });

      setIsAdmin(hasAdminRole);
      setError(null);
      setIsLoading(false);
      
      if (!hasAdminRole) {
        console.warn('[AdminAuth] User does not have admin role. Role:', userRole);
      }
      
      return hasAdminRole;
    } catch (err) {
      console.error('[AdminAuth] Admin auth check error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMessage);
      setIsAdmin(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const updateProfile = async (fullName: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (!error && user) {
        // Update local user state
        setUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: fullName
          }
        });
      }

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // Verify current password first
      if (user?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (verifyError) {
          return { error: new Error('Current password is incorrect') };
        }
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      setIsLoading(true);
      setError(null);
      
      // Set a safety timeout to ensure loading doesn't hang forever
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('[AdminAuth] Admin check taking too long, forcing completion');
          setIsLoading(false);
          setError('Admin check timed out. Please refresh the page.');
        }
      }, 10000); // 10 second safety timeout

      try {
      await checkAdminStatus();
        // checkAdminStatus now sets isLoading to false internally
      } catch (err) {
        console.error('[AdminAuth] Admin auth initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to verify admin access');
      setIsLoading(false);
          setIsAdmin(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes - only handle sign out
    // Don't re-check admin status on every auth state change (like normal auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        // Don't re-check on SIGNED_IN or other events - only check once on mount
        // This prevents re-checking when switching tabs
      }
    );

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, supabase.auth]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        error,
        checkAdminStatus,
        signOut,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
