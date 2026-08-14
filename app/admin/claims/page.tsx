import React from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';
import ClaimsTable from '@/components/admin/claims/ClaimsTable';

export default function AdminClaimsPage() {
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 overflow-auto p-8 bg-gray-50">
        <div className="w-full max-w-full">
          <ClaimsTable />
        </div>
      </div>
    </div>
  );
}

