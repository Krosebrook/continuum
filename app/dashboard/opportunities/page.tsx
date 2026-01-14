'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { LoadingSpinner, LoadingCard } from '@/components/LoadingSpinner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Opportunity, ICP } from '@/lib/types';

type OpportunityStatus = 'all' | 'new' | 'reviewed' | 'contacted' | 'qualified' | 'disqualified';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-purple-100 text-purple-800',
  qualified: 'bg-green-100 text-green-800',
  disqualified: 'bg-gray-100 text-gray-800',
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [icps, setIcps] = useState<ICP[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus>('all');
  const [icpFilter, setIcpFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const supabase = getSupabaseBrowserClient();

      // Fetch ICPs
      const { data: icpData } = await supabase
        .from('icps')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (icpData) {
        setIcps(icpData);
      }

      // Fetch opportunities
      const { data: oppData } = await supabase
        .from('opportunities')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(50);

      if (oppData) {
        setOpportunities(oppData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (statusFilter !== 'all' && opp.status !== statusFilter) return false;
    if (icpFilter !== 'all' && opp.icp_id !== icpFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        opp.company_name.toLowerCase().includes(search) ||
        opp.domain?.toLowerCase().includes(search) ||
        opp.industry?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  async function updateOpportunityStatus(id: string, status: string) {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('opportunities')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id);

      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === id ? { ...opp, status: status as Opportunity['status'] } : opp
        )
      );
    } catch (error) {
      console.error('Error updating opportunity:', error);
    }
  }

  return (
    <>
      <Header title="Opportunities" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total"
            value={opportunities.length}
            color="bg-gray-900"
          />
          <StatCard
            label="New"
            value={opportunities.filter((o) => o.status === 'new').length}
            color="bg-blue-600"
          />
          <StatCard
            label="Contacted"
            value={opportunities.filter((o) => o.status === 'contacted').length}
            color="bg-purple-600"
          />
          <StatCard
            label="Qualified"
            value={opportunities.filter((o) => o.status === 'qualified').length}
            color="bg-green-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OpportunityStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="disqualified">Disqualified</option>
          </select>
          <select
            value={icpFilter}
            onChange={(e) => setIcpFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">All ICPs</option>
            {icps.map((icp) => (
              <option key={icp.id} value={icp.id}>
                {icp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Opportunities list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <LoadingCard />
              </div>
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                icp={icps.find((i) => i.id === opp.icp_id)}
                onStatusChange={updateOpportunityStatus}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-lg p-4 text-white`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  icp,
  onStatusChange,
}: {
  opportunity: Opportunity;
  icp?: ICP;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {opportunity.company_name}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[opportunity.status]}`}>
              {opportunity.status}
            </span>
            {opportunity.fit_score && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-800">
                Score: {opportunity.fit_score}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            {opportunity.domain && (
              <a
                href={`https://${opportunity.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-600"
              >
                {opportunity.domain}
              </a>
            )}
            {opportunity.industry && <span>{opportunity.industry}</span>}
            {opportunity.location && <span>{opportunity.location}</span>}
          </div>
          {opportunity.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{opportunity.description}</p>
          )}
          {icp && (
            <p className="mt-2 text-xs text-gray-400">
              Matched ICP: {icp.name}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <select
            value={opportunity.status}
            onChange={(e) => onStatusChange(opportunity.id, e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
          >
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create an ICP to start discovering opportunities.
      </p>
      <a
        href="/dashboard/icps/new"
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700"
      >
        Create ICP
      </a>
    </div>
  );
}
