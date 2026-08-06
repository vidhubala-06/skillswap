function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-paper">
      <div className="hidden lg:flex lg:w-1/2 bg-ink text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-10 -left-16 w-72 h-72 bg-teal-brand/10 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-10 -right-16 w-80 h-80 bg-violet-brand/10 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s]"></div>

        <div className="relative flex items-center gap-2.5 animate-fade-in-up" style={{ opacity: 0 }}>
          <span className="w-2.5 h-2.5 rounded-full bg-teal-brand animate-pulse"></span>
          <span className="font-display text-2xl font-semibold logo-gradient">SkillSwap</span>
        </div>

        <div className="relative animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
          <h2 className="font-display text-3xl font-semibold leading-tight mb-4">
            Trade skills,{' '}
            <span className="relative text-teal-brand">
              not money.
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0,5 Q50,0 100,5 T200,5" stroke="#0D9488" strokeWidth="2" fill="none" opacity="0.6" />
              </svg>
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Teach what you know, learn what you don't. SkillSwap connects you with people who have exactly the skill you need, verified through a quiz — no payment required.
          </p>
          <div className="flex gap-6 mt-8">
            <div>
              <p className="font-tag text-teal-brand text-xl font-semibold animate-[float_4s_ease-in-out_infinite]">verified</p>
              <p className="text-xs text-gray-500 mt-1">Skills confirmed by quiz</p>
            </div>
            <div>
              <p className="font-tag text-violet-brand text-xl font-semibold animate-[float_4s_ease-in-out_infinite_0.8s]">matched</p>
              <p className="text-xs text-gray-500 mt-1">Two-way skill exchange</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-gray-600 animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>
          A peer-to-peer learning platform.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden dot-grid">
        {/* Floating background shapes */}
        <div className="absolute top-16 right-10 w-56 h-56 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-16 left-10 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1.2s]"></div>

        {/* Floating skill tag chips, decorative */}
        <span className="hidden md:block absolute top-[18%] right-[12%] font-tag text-xs bg-teal-bg text-teal-text px-3 py-1.5 rounded-lg shadow-sm opacity-70 animate-[float_5s_ease-in-out_infinite]">
          ui/ux
        </span>
        <span className="hidden md:block absolute bottom-[20%] right-[8%] font-tag text-xs bg-violet-bg text-violet-text px-3 py-1.5 rounded-lg shadow-sm opacity-70 animate-[float_6s_ease-in-out_infinite_0.6s]">
          aws
        </span>
        <span className="hidden md:block absolute top-[65%] left-[6%] font-tag text-xs bg-teal-bg text-teal-text px-3 py-1.5 rounded-lg shadow-sm opacity-70 animate-[float_5.5s_ease-in-out_infinite_1s]">
          sql
        </span>

        <div className="relative w-full max-w-md animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;