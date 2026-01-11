import WaitlistForm from './WaitlistForm';

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-200 to-brand-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="container py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-700/10">
            <span className="mr-2">✨</span>
            Beta launching soon &mdash; First 100 users get 3 months free
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            AI-Powered{' '}
            <span className="text-brand-600">Opportunity Discovery</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-gray-600 sm:text-xl lg:text-2xl">
            Save your most precious resource for the important stuff.
          </p>

          {/* Value Props */}
          <div className="mb-12 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-xl">
                ⚡
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">10x Faster</h3>
              <p className="text-sm text-gray-600">
                AI agents research opportunities 24/7 while you focus on closing deals
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-xl">
                🎯
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">Laser-Focused</h3>
              <p className="text-sm text-gray-600">
                Only see opportunities that match your exact ideal customer profile
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-xl">
                💰
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">10x Cheaper</h3>
              <p className="text-sm text-gray-600">
                $49/month vs $500+ for outdated lead databases with stale data
              </p>
            </div>
          </div>

          {/* Waitlist Form */}
          <WaitlistForm />

          {/* Social Proof */}
          <p className="mt-8 text-sm text-gray-500">
            Join 200+ sales and BizDev professionals on the waitlist
          </p>
        </div>
      </div>

      {/* Bottom background decoration */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-brand-200 to-brand-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  );
}
