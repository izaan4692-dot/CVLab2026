'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Download, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getUserActivity, ResumeActivityItem } from '@/lib/api';
import { getResumes, getUser, AdminResumeListItem } from '@/lib/admin-api';

interface ActivityHistoryProps {
  userId?: string;
}

export default function ActivityHistory({ userId }: ActivityHistoryProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  const [activities, setActivities] = useState<ResumeActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isViewingOtherUser = !!userId && userId !== user?.id;

  useEffect(() => {
    async function fetchActivity() {
      if (isViewingOtherUser && userId) {
        // Fetch resumes for the other user using search by email
        try {
          setLoading(true);
          // First get user info to get their email
          const userData = await getUser(userId);
          const userEmail = userData.email;
          
          if (userEmail) {
            // Search resumes by user email
            const response = await getResumes({ page: 1, page_size: 10, search: userEmail });
            // Filter resumes that match this user's email
            const userResumes = response.resumes.filter((resume: AdminResumeListItem) => 
              resume.user_email?.toLowerCase() === userEmail?.toLowerCase()
            );
            
            // Convert AdminResumeListItem to ResumeActivityItem format
            const convertedActivities: ResumeActivityItem[] = userResumes.map((resume: AdminResumeListItem) => ({
              id: resume.id,
              filename: resume.original_filename,
              status: resume.status,
              created_at: resume.created_at,
              updated_at: resume.created_at,
              is_optimized: resume.status === 'optimized',
            }));
            
            setActivities(convertedActivities);
          } else {
            setActivities([]);
          }
        } catch (error) {
          console.error('Error fetching user activity:', error);
          setActivities([]);
        } finally {
          setLoading(false);
        }
      } else if (user) {
        try {
          setLoading(true);
          const data = await getUserActivity(10);
          setActivities(data.activities);
        } catch (error) {
          console.error('Error fetching activity:', error);
          setActivities([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    
    fetchActivity();
  }, [userId, user?.id, isViewingOtherUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.activityHistory')}</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.activityHistory')}</h3>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('profile.noActivity') || 'No recent activity'}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t('profile.uploadResumeToSeeActivity') || 'Upload a resume to see your activity history'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {activity.is_optimized ? (
                  <Download className="w-5 h-5 text-orange-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {activity.is_optimized 
                    ? t('profile.resumeOptimized') || 'Resume Optimized'
                    : t('profile.resumeUploaded') || 'Resume Uploaded'}
                </h4>
                <p className="text-sm text-gray-600 truncate">{activity.filename}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.updated_at || activity.created_at), { 
                    addSuffix: true,
                    locale: isArabic ? ar : undefined
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
