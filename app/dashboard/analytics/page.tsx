'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/dashboard/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface AnalyticsData {
  totalOpportunities: number;
  opportunitiesByStatus: { status: string; count: number }[];
  opportunitiesByIcp: { name: string; count: number }[];
  recentOpportunities: number;
  avgFitScore: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();

      // Calculate date threshold
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // Fetch opportunities
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .gte('discovered_at', dateThreshold.toISOString());

      // Fetch ICPs
      const { data: icps } = await supabase
        .from('icps')
        .select('id, name');

      if (opportunities && icps) {
        // Calculate stats
        const byStatus = ['new', 'reviewed', 'contacted', 'qualified', 'disqualified'].map((status) => ({
          status,
          count: opportunities.filter((o) => o.status === status).length,
        }));

        const byIcp = icps.map((icp) => ({
          name: icp.name,
          count: opportunities.filter((o) => o.icp_id === icp.id).length,
        })).filter((i) => i.count > 0);

        const scores = opportunities.filter((o) => o.fit_score).map((o) => o.fit_score!);
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        const qualified = opportunities.filter((o) => o.status === 'qualified').length;
        const conversionRate = opportunities.length > 0
          ? Math.round((qualified / opportunities.length) * 100)
          : 0;

        setData({
          totalOpportunities: opportunities.length,
          opportunitiesByStatus: byStatus,
          opportunitiesByIcp: byIcp,
          recentOpportunities: opportunities.filter((o) => {
            const discovered = new Date(o.discovered_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return discovered > weekAgo;
          }).length,
          avgFitScore: avgScore,
          conversionRate,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <>
      <Header title="Analytics" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Date range selector */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  dateRange === range
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : data ? (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard
                title="Total Opportunities"
                value={data.totalOpportunities}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <MetricCard
                title="New This Week"
                value={data.recentOpportunities}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
              <MetricCard
                title="Avg Fit Score"
                value={data.avgFitScore}
                suffix="%"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                }
              />
              <MetricCard
                title="Conversion Rate"
                value={data.conversionRate}
                suffix="%"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Pipeline */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline</h3>
                <div className="space-y-4">
                  {data.opportunitiesByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{item.status}</span>
                        <span className="font-medium text-gray-900">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              data.totalOpportunities > 0
                                ? (item.count / data.totalOpportunities) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By ICP */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">By ICP</h3>
                {data.opportunitiesByIcp.length > 0 ? (
                  <div className="space-y-4">
                    {data.opportunitiesByIcp.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 truncate">{item.name}</span>
                          <span className="font-medium text-gray-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                data.totalOpportunities > 0
                                  ? (item.count / data.totalOpportunities) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No ICP data yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available yet.</p>
          </div>
        )}
      </main>
    </>
  );
}

function MetricCard({
  title,
  value,
  suffix = '',
  icon,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 p-3 bg-brand-50 rounded-lg text-brand-600">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {suffix}
          </p>
        </div>
      </div>
    </div>
  );
}
