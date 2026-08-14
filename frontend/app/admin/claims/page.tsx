import React from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';
import ClaimsTable from '@/components/admin/claims/ClaimsTable';
import ClaimsOverview from '@/components/admin/claims/ClaimsOverview';

export default function AdminClaimsPage() {
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 overflow-auto p-8 bg-gray-50">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-3">
            <ClaimsTable />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-8">
            <ClaimsOverview />
          </div>
        </div>
      </div>
    </div>
  );
}

