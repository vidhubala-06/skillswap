import Reveal from './Reveal';

const steps = [
    { num: '01', title: 'Build your profile', desc: 'List the skills you know and the ones you want to learn.' },
    { num: '02', title: 'Verify with a quiz', desc: 'Pass a short quiz to confirm each skill you claim to know.' },
    { num: '03', title: 'Find your match', desc: 'We surface people who know what you want, and want what you know.' },
    { num: '04', title: 'Swap and grow', desc: 'Schedule a session, video call right in the app, and learn together.' }
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
            <Reveal>
                <h2 className="font-display text-3xl font-semibold text-ink text-center mb-2">How it works</h2>
                <p className="text-[#6B6E76] text-center mb-12">From profile to project, in four steps.</p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((s, i) => (
                    <Reveal key={s.num} delay={i * 100}>
                        <div className="bg-white border border-[#E7E5DD] rounded-xl p-6 h-full hover:-translate-y-1 hover:shadow-lg hover:border-teal-brand/30 transition-all duration-300">
                            <p className="font-tag text-teal-brand text-sm mb-3">{s.num}</p>
                            <h3 className="font-display text-lg font-semibold text-ink mb-2">{s.title}</h3>
                            <p className="text-sm text-[#6B6E76] leading-relaxed">{s.desc}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

export default HowItWorks;