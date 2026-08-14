'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Camera, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/admin-api';

interface ProfileFormProps {
  userId?: string;
}

export default function ProfileForm({ userId }: ProfileFormProps) {
  const { t } = useLanguage();
  const { user, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const isViewingOtherUser = !!userId && userId !== user?.id;
  
  const fullName = viewingUser?.full_name || user?.user_metadata?.full_name || '';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || viewingUser?.email?.split('@')[0] || user?.email?.split('@')[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const userInitial = firstName.charAt(0).toUpperCase();
  
  const [formData, setFormData] = useState({
    firstName: firstName,
    lastName: lastName,
    email: viewingUser?.email || user?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function loadUserData() {
      if (userId && isViewingOtherUser) {
        try {
          setLoading(true);
          const userData = await getUser(userId);
          setViewingUser(userData);
          const nameParts = (userData.full_name || '').split(' ');
          setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: userData.email || '',
          });
        } catch (error) {
          console.error('Error loading user data:', error);
          toast.error('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      } else if (user) {
        const fullName = user?.user_metadata?.full_name || '';
        const nameParts = fullName.split(' ');
        setFormData({
          firstName: nameParts[0] || user?.email?.split('@')[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
        });
        setLoading(false);
      }
    }
    loadUserData();
  }, [userId, user?.id, isViewingOtherUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user || isViewingOtherUser) return;
    
    try {
      setSaving(true);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        }
      });

      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8 space-y-8">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-black overflow-hidden flex items-center justify-center">
            <span className="text-white text-3xl font-semibold">{userInitial}</span>
          </div>
          <button 
            className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            disabled
            title="Profile photo upload coming soon"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">{t('profile.changePhoto')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">{t('profile.firstName')}</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={isViewingOtherUser}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">{t('profile.lastName')}</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={isViewingOtherUser}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">{t('profile.email')}</label>
        <input
          type="email"
          value={formData.email}
          disabled
          className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        {!isViewingOtherUser && <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.changePassword')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('profile.currentPassword')}</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                disabled={isViewingOtherUser}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isViewingOtherUser}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('profile.newPassword')}</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                disabled={isViewingOtherUser}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isViewingOtherUser}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('profile.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                disabled={isViewingOtherUser}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isViewingOtherUser}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {!isViewingOtherUser && (
            <Button
              onClick={handleChangePassword}
              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                t('profile.changePassword')
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleSaveProfile}
          disabled={saving || isViewingOtherUser}
          className="px-8 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('profile.saveChanges')}
            </>
          )}
        </Button>
      </div>

      {isViewingOtherUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Viewing:</strong> {viewingUser?.full_name || viewingUser?.email || 'User'}
          </p>
        </div>
      )}
    </div>
  );
}
