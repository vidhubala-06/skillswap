import { Link } from 'react-router-dom';

function HomeFooter() {
    return (
        <footer className="bg-ink text-gray-400 py-10">
            <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <span className="font-display text-white font-semibold">SkillSwap</span>
                <p className="text-sm">A peer-to-peer skill exchange platform.</p>
                <div className="flex gap-5 text-sm">
                    <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
                    <Link to="/signup" className="hover:text-white transition-colors">Sign up</Link>
                </div>
            </div>
        </footer>
    );
}

export default HomeFooter;