import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="relative overflow-hidden dot-grid">
      {/* Decorative background shapes */}
      <div className="absolute top-10 -left-20 w-72 h-72 bg-teal-brand/10 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
      <div className="absolute top-32 -right-24 w-96 h-96 bg-violet-brand/10 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s]"></div>

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: headline + CTA */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E7E5DD] rounded-full px-4 py-1.5 mb-6 text-xs text-[#6B6E76]">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-brand"></span>
            Peer-to-peer skill exchange for students &amp; developers
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink leading-tight animate-fade-in-up">
            Trade skills,{' '}
            <span className="relative text-teal-brand">
              not money.
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0,5 Q50,0 100,5 T200,5" stroke="#0D9488" strokeWidth="2" fill="none" opacity="0.4" />
              </svg>
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#6B6E76] mt-5 leading-relaxed max-w-lg mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
            Teach what you know. Learn what you don't. SkillSwap matches you with people who have exactly the skill you need — verified, not just claimed.
          </p>

          <div className="flex items-center justify-center lg:justify-start gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>
            <Link to="/signup" className="bg-teal-brand text-white font-medium px-6 py-3 rounded-lg hover:bg-teal-brand/90 transition-colors">
              Get started — it's free
            </Link>
            <a href="#how-it-works" className="text-ink font-medium px-6 py-3 rounded-lg border border-[#D8D6CC] hover:bg-white transition-colors">
              See how it works
            </a>
          </div>
        </div>

        {/* Right: illustrative product preview */}
        <div className="relative hidden lg:block animate-fade-in-up" style={{ animationDelay: '400ms', opacity: 0 }}>
          <div className="bg-white border border-[#E7E5DD] rounded-2xl shadow-xl p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
            <p className="text-xs font-medium text-[#9A9890] uppercase tracking-wide mb-3">Two-way match</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-teal-bg text-teal-text font-display font-semibold flex items-center justify-center">A</div>
              <div>
                <p className="font-medium text-ink text-sm">Aarav</p>
                <p className="text-xs text-[#9A9890]">Knows React · Rated 9/10</p>
              </div>
            </div>
            <div className="flex justify-center my-2">
              <span className="text-violet-brand text-xl animate-[float_3s_ease-in-out_infinite]">⇅</span>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-violet-bg text-violet-text font-display font-semibold flex items-center justify-center">Y</div>
              <div>
                <p className="font-medium text-ink text-sm">You</p>
                <p className="text-xs text-[#9A9890]">Knows Python · Wants React</p>
              </div>
            </div>
            <button className="w-full bg-teal-brand text-white text-sm font-medium py-2 rounded-lg">
              Send swap request
            </button>
          </div>

          {/* floating skill tags around the card */}
          <span className="absolute -top-4 -left-6 font-tag text-xs bg-teal-bg text-teal-text px-3 py-1.5 rounded-lg shadow-sm animate-[float_4s_ease-in-out_infinite]">docker</span>
          <span className="absolute -bottom-4 -right-4 font-tag text-xs bg-violet-bg text-violet-text px-3 py-1.5 rounded-lg shadow-sm animate-[float_5s_ease-in-out_infinite_0.7s]">graphql</span>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="flex justify-center pb-10">
        <a href="#how-it-works" className="text-[#9A9890] hover:text-teal-text transition-colors animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </div>
    </section>
  );
}

export default Hero;