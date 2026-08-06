import { Link } from 'react-router-dom';

function HomeNavbar() {
  return (
    <nav
      className="sticky top-0 z-40 bg-paper/80 backdrop-blur-md border-b border-[#E7E5DD] px-6 py-4 flex items-center justify-between"
      style={{ animation: 'slideDown 0.6s ease-out forwards' }}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-teal-brand animate-pulse"></span>
        <span className="font-display text-2xl md:text-3xl font-semibold logo-gradient">SkillSwap</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="relative text-sm text-ink font-medium px-4 py-2 group animate-fade-in-up"
          style={{ animationDelay: '150ms', opacity: 0 }}
        >
          Log in
          <span className="absolute bottom-1 left-4 right-4 h-px bg-teal-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
        </Link>
        <Link
          to="/signup"
          className="text-sm bg-teal-brand text-white font-medium px-4 py-2 rounded-lg hover:bg-teal-brand/90 hover:scale-105 transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: '250ms', opacity: 0 }}
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
}

export default HomeNavbar;