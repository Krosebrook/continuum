'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/dashboard/Header';
import { LoadingCard } from '@/components/LoadingSpinner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ICP } from '@/lib/types';

export default function ICPsPage() {
  const [icps, setIcps] = useState<ICP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchICPs();
  }, []);

  async function fetchICPs() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('icps')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setIcps(data);
      }
    } catch (error) {
      console.error('Error fetching ICPs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleICPStatus(id: string, currentStatus: boolean) {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('icps')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      setIcps((prev) =>
        prev.map((icp) =>
          icp.id === id ? { ...icp, is_active: !currentStatus } : icp
        )
      );
    } catch (error) {
      console.error('Error toggling ICP status:', error);
    }
  }

  async function deleteICP(id: string) {
    if (!confirm('Are you sure you want to delete this ICP?')) return;

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from('icps').delete().eq('id', id);
      setIcps((prev) => prev.filter((icp) => icp.id !== id));
    } catch (error) {
      console.error('Error deleting ICP:', error);
    }
  }

  return (
    <>
      <Header title="Ideal Customer Profiles" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Your ICPs</h2>
            <p className="text-sm text-gray-500">
              Define your ideal customer profiles to discover matching opportunities.
            </p>
          </div>
          <Link
            href="/dashboard/icps/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create ICP
          </Link>
        </div>

        {/* ICP list */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <LoadingCard />
              </div>
            ))}
          </div>
        ) : icps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {icps.map((icp) => (
              <ICPCard
                key={icp.id}
                icp={icp}
                onToggle={toggleICPStatus}
                onDelete={deleteICP}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function ICPCard({
  icp,
  onToggle,
  onDelete,
}: {
  icp: ICP;
  onToggle: (id: string, status: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{icp.name}</h3>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              icp.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {icp.is_active ? 'Active' : 'Paused'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggle(icp.id, icp.is_active)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={icp.is_active ? 'Pause' : 'Activate'}
          >
            {icp.is_active ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <Link
            href={`/dashboard/icps/${icp.id}/edit`}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <button
            onClick={() => onDelete(icp.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {icp.industry && icp.industry.length > 0 && (
          <div className="flex items-start">
            <span className="font-medium w-24 flex-shrink-0">Industries:</span>
            <span className="text-gray-900">{icp.industry.slice(0, 3).join(', ')}</span>
          </div>
        )}
        {icp.company_size && icp.company_size.length > 0 && (
          <div className="flex items-start">
            <span className="font-medium w-24 flex-shrink-0">Size:</span>
            <span className="text-gray-900">{icp.company_size.join(', ')}</span>
          </div>
        )}
        {icp.location && icp.location.length > 0 && (
          <div className="flex items-start">
            <span className="font-medium w-24 flex-shrink-0">Location:</span>
            <span className="text-gray-900">{icp.location.slice(0, 2).join(', ')}</span>
          </div>
        )}
        {icp.keywords && icp.keywords.length > 0 && (
          <div className="flex items-start">
            <span className="font-medium w-24 flex-shrink-0">Keywords:</span>
            <span className="text-gray-900">{icp.keywords.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Created {new Date(icp.created_at).toLocaleDateString()}</span>
        <Link
          href={`/dashboard/opportunities?icp=${icp.id}`}
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          View opportunities
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No ICPs yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create your first Ideal Customer Profile to start discovering opportunities.
      </p>
      <Link
        href="/dashboard/icps/new"
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700"
      >
        Create ICP
      </Link>
    </div>
  );
}
