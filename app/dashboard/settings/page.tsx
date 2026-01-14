'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type DigestFrequency = 'daily' | 'weekly' | 'never';

interface UserSettings {
  emailDigest: DigestFrequency;
  newOpportunityAlert: boolean;
  highScoreThreshold: number;
}

export default function SettingsPage() {
  const { user, updatePassword, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile
  const [fullName, setFullName] = useState('');

  // Notifications
  const [settings, setSettings] = useState<UserSettings>({
    emailDigest: 'daily',
    newOpportunityAlert: true,
    highScoreThreshold: 80,
  });

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) {
      return;
    }

    try {
      await signOut();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header title="Settings" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success/Error messages */}
          {success && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Profile */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Profile</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Digest
                </label>
                <select
                  value={settings.emailDigest}
                  onChange={(e) =>
                    setSettings({ ...settings, emailDigest: e.target.value as DigestFrequency })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="never">Never</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Receive a summary of new opportunities matching your ICPs.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">New Opportunity Alerts</h3>
                  <p className="text-sm text-gray-500">
                    Get notified when high-scoring opportunities are found.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, newOpportunityAlert: !settings.newOpportunityAlert })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.newOpportunityAlert ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.newOpportunityAlert ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.newOpportunityAlert && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    High Score Threshold: {settings.highScoreThreshold}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={settings.highScoreThreshold}
                    onChange={(e) =>
                      setSettings({ ...settings, highScoreThreshold: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Only notify for opportunities with a fit score above this threshold.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow border border-red-200">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
