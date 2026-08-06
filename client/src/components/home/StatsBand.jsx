import Reveal from './Reveal';

const stats = [
  { value: 'verified', label: 'Every skill confirmed by quiz', color: 'text-teal-brand' },
  { value: 'two-way', label: 'Matched on mutual exchange', color: 'text-violet-brand' },
  { value: 'in-app', label: 'Chat and video, no third-party links', color: 'text-teal-brand' },
  { value: 'moderated', label: 'Reports reviewed by a real team', color: 'text-violet-brand' }
];

function StatsBand() {
  return (
    <section className="bg-ink py-16">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <p className="text-center text-gray-500 text-sm mb-10">Built for real skill exchange, not just a listing</p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <Reveal key={s.value} delay={i * 100}>
              <div className="text-center">
                <p className={`font-tag text-2xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsBand;
