import React from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';
import StatsCards from '@/components/admin/StatsCards';
import UserManagementTable from '@/components/admin/UserManagementTable';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 overflow-auto p-8 space-y-8">
        <StatsCards />
        <UserManagementTable />
      </div>
    </div>
  );
}
