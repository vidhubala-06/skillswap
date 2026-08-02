function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex bg-paper">
            <div className="hidden lg:flex lg:w-1/2 bg-ink text-white flex-col justify-between p-12">
                <div>
                    <p className="font-display text-2xl font-semibold">SkillSwap</p>
                </div>
                <div>
                    <h2 className="font-display text-3xl font-semibold leading-tight mb-4">
                        Trade skills, not money.
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                        Teach what you know, learn what you don't. SkillSwap connects you with people who have exactly the skill you need, verified through a quiz — no payment required.
                    </p>
                    <div className="flex gap-6 mt-8">
                        <div>
                            <p className="font-tag text-teal-brand text-xl font-semibold">verified</p>
                            <p className="text-xs text-gray-500 mt-1">Skills confirmed by quiz</p>
                        </div>
                        <div>
                            <p className="font-tag text-violet-brand text-xl font-semibold">matched</p>
                            <p className="text-xs text-gray-500 mt-1">Two-way skill exchange</p>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-600">A peer-to-peer learning platform.</p>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;