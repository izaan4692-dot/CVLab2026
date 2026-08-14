import AdminSectionHeader from '@/components/admin/resumes/SectionHeader';
import SettingsPage from '@/components/admin/SettingsPage';

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSectionHeader
        title="Settings"
        subtitle="Manage system configuration and LLM settings"
      />
      <div className="max-w-4xl mx-auto p-8">
        <SettingsPage />
      </div>
    </div>
  );
}


