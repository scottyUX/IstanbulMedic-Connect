'use client'

export default function ProfileConsultations() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0D1E32]">Consultations</h1>
        <p className="text-slate-500 text-sm mt-1">Book and manage consultations with clinics</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#3EBBB7]/10 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-[#3EBBB7]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-[#3EBBB7]/10 text-[#3EBBB7] text-xs font-semibold mb-4">
          Coming soon
        </span>

        <h2 className="text-lg font-semibold text-[#0D1E32] mb-2">Consultations are on the way</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Soon you&apos;ll be able to shortlist clinics, schedule consultations directly through the platform, and manage all your bookings in one place.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { label: 'Clinic shortlisting', icon: '🏥' },
            { label: 'Schedule consultations', icon: '📅' },
            { label: 'Manage bookings', icon: '✅' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-medium text-slate-600 text-center">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
