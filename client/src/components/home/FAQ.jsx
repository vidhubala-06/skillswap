import { useState } from 'react';
import Reveal from './Reveal';

const faqs = [
    { q: 'Is SkillSwap free to use?', a: 'Yes, completely. There\'s no payment involved anywhere — you exchange skills directly with other people.' },
    { q: 'How does skill verification work?', a: 'When you add a skill you know, you take a short quiz on it. You need to score at least 48/50 to get verified — this keeps the platform trustworthy for everyone matching with you.' },
    { q: 'What if I fail the quiz?', a: 'No problem — you can retry after a 24-hour cooldown. Take your time to actually learn the material before retrying.' },
    { q: 'What is a "two-way" match?', a: 'It means the other person also wants to learn something you know, so you can teach each other in the same exchange. If no two-way match exists, we\'ll still show you anyone who knows the skill you want.' },
    { q: 'Can I meet over video call in the app?', a: 'Yes — once a session is scheduled, a "Join Meeting" button unlocks 10 minutes before your session time, right on the Active Swap page.' },
    { q: 'What if someone behaves inappropriately?', a: 'You can report them directly from chat or your active swap. Our team reviews every report and can warn or ban an account if needed.' }
];

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-[#E7E5DD] py-5">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
                <span className="font-medium text-ink">{q}</span>
                <span className={`text-[#9A9890] transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
            </button>
            <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <p className="text-sm text-[#6B6E76] leading-relaxed">{a}</p>
                </div>
            </div>
        </div>
    );
}

function FAQ() {
    return (
        <section className="max-w-3xl mx-auto px-6 py-20">
            <Reveal>
                <h2 className="font-display text-3xl font-semibold text-ink text-center mb-2">Frequently asked questions</h2>
                <p className="text-[#6B6E76] text-center mb-10">Everything you might be wondering before you start.</p>
            </Reveal>
            <Reveal delay={100}>
                <div>
                    {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
                </div>
            </Reveal>
        </section>
    );
}

export default FAQ;