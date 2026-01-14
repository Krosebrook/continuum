'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Professional Services', 'Media',
  'Transportation', 'Energy', 'Agriculture', 'Construction'
];

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
];

const REVENUE_RANGES = [
  'Under $1M', '$1M-$5M', '$5M-$10M', '$10M-$50M', '$50M-$100M',
  '$100M-$500M', '$500M-$1B', 'Over $1B'
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function NewICPPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [name, setName] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [revenueRanges, setRevenueRanges] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your ICP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = getSupabaseBrowserClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // For now, create org if needed (simplified - in production would be more complex)
      let orgId: string;
      const { data: existingUser } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (existingUser?.org_id) {
        orgId = existingUser.org_id;
      } else {
        // Create new organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: 'My Organization' })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;

        // Link user to org
        await supabase.from('users').upsert({
          id: user.id,
          org_id: orgId,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          role: 'owner',
        });
      }

      // Create ICP
      const { error: icpError } = await supabase.from('icps').insert({
        org_id: orgId,
        name: name.trim(),
        industry: industries.length > 0 ? industries : null,
        company_size: companySizes.length > 0 ? companySizes : null,
        revenue_range: revenueRanges.length > 0 ? revenueRanges : null,
        location: locations.length > 0 ? locations : null,
        keywords: keywords.length > 0 ? keywords : null,
        is_active: true,
      });

      if (icpError) throw icpError;

      router.push('/dashboard/icps');
    } catch (err) {
      console.error('Error creating ICP:', err);
      setError('Failed to create ICP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Name' },
    { num: 2, title: 'Industries' },
    { num: 3, title: 'Company Size' },
    { num: 4, title: 'Location' },
    { num: 5, title: 'Keywords' },
  ];

  return (
    <>
      <Header title="Create ICP" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress steps */}
          <nav className="mb-8">
            <ol className="flex items-center justify-between">
              {steps.map((s, i) => (
                <li key={s.num} className="flex items-center">
                  <button
                    onClick={() => setStep(s.num as Step)}
                    className={`flex items-center ${
                      step === s.num
                        ? 'text-brand-600'
                        : step > s.num
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        step === s.num
                          ? 'border-brand-600 bg-brand-50'
                          : step > s.num
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    >
                      {step > s.num ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        s.num
                      )}
                    </span>
                    <span className="ml-2 text-sm font-medium hidden sm:block">
                      {s.title}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className="w-8 sm:w-16 h-0.5 mx-2 bg-gray-300" />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Form content */}
          <div className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Name your ICP
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Give your Ideal Customer Profile a descriptive name.
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Enterprise SaaS Companies"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Select target industries
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Choose the industries your ideal customers operate in.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => toggleSelection(industry, industries, setIndustries)}
                      className={`px-4 py-2 text-sm rounded-lg border ${
                        industries.includes(industry)
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Select company sizes
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Choose the employee count ranges for your target companies.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSelection(size, companySizes, setCompanySizes)}
                      className={`px-4 py-2 text-sm rounded-lg border ${
                        companySizes.includes(size)
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size} employees
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Revenue Range</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {REVENUE_RANGES.map((range) => (
                      <button
                        key={range}
                        onClick={() => toggleSelection(range, revenueRanges, setRevenueRanges)}
                        className={`px-4 py-2 text-sm rounded-lg border ${
                          revenueRanges.includes(range)
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Add target locations
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Specify the geographic regions for your target companies.
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                    placeholder="e.g., United States"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                  <button
                    onClick={addLocation}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <span
                      key={location}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-50 text-brand-700"
                    >
                      {location}
                      <button
                        onClick={() => setLocations(locations.filter((l) => l !== location))}
                        className="ml-2 text-brand-600 hover:text-brand-800"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Add keywords
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Add keywords that describe your ideal customers (technologies, solutions, pain points).
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="e.g., machine learning, B2B"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-50 text-brand-700"
                    >
                      {keyword}
                      <button
                        onClick={() => setKeywords(keywords.filter((k) => k !== keyword))}
                        className="ml-2 text-brand-600 hover:text-brand-800"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Summary</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex">
                      <dt className="w-24 text-gray-500">Name:</dt>
                      <dd className="text-gray-900">{name || 'Not set'}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-24 text-gray-500">Industries:</dt>
                      <dd className="text-gray-900">{industries.join(', ') || 'Any'}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-24 text-gray-500">Size:</dt>
                      <dd className="text-gray-900">{companySizes.join(', ') || 'Any'}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-24 text-gray-500">Locations:</dt>
                      <dd className="text-gray-900">{locations.join(', ') || 'Any'}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-24 text-gray-500">Keywords:</dt>
                      <dd className="text-gray-900">{keywords.join(', ') || 'None'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep((step - 1) as Step)}
                disabled={step === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {step < 5 ? (
                <button
                  onClick={() => setStep((step + 1) as Step)}
                  className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create ICP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
