import Reveal from './Reveal';

const features = [
    { icon: '✓', title: 'Verified skills', desc: 'A quiz confirms you actually know what you claim — not just a self-reported tag.', color: 'teal' },
    { icon: '⇄', title: 'Two-way matching', desc: 'Get matched with people who both know what you want and want what you know.', color: 'violet' },
    { icon: '💬', title: 'Built-in chat & video', desc: 'Coordinate and teach right in the app — no need for a third-party meeting link.', color: 'teal' },
    { icon: '📁', title: 'Project feed', desc: 'Share what you built after learning a new skill, and browse what others made.', color: 'violet' },
    { icon: '🛡️', title: 'Moderated & safe', desc: 'Report issues anytime — our team reviews and acts to keep the community healthy.', color: 'teal' },
    { icon: '🔁', title: 'Flexible scheduling', desc: 'Reschedule sessions as needed — one swap can span as many meetings as it takes.', color: 'violet' }
];

function Features() {
    return (
        <section className="bg-white border-y border-[#E7E5DD] py-20">
            <div className="max-w-5xl mx-auto px-6">
                <Reveal>
                    <h2 className="font-display text-3xl font-semibold text-ink text-center mb-2">Everything you need to trade skills</h2>
                    <p className="text-[#6B6E76] text-center mb-12">Not just a directory — a full exchange, start to finish.</p>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <Reveal key={f.title} delay={i * 80}>
                            <div className={`border border-[#E7E5DD] rounded-xl p-6 h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${
                              f.color === 'teal' ? 'hover:border-teal-brand/30' : 'hover:border-violet-brand/30'
                            }`}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4 ${f.color === 'teal' ? 'bg-teal-bg' : 'bg-violet-bg'
                                    }`}>
                                    {f.icon}
                                </div>
                                <h3 className="font-display text-base font-semibold text-ink mb-1.5">{f.title}</h3>
                                <p className="text-sm text-[#6B6E76] leading-relaxed">{f.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;