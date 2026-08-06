const skills = ['react', 'python', 'docker', 'sql', 'graphql', 'aws', 'node.js', 'typescript', 'figma', 'machine learning', 'java', 'next.js'];

function SkillMarquee() {
    const doubled = [...skills, ...skills];

    return (
        <div className="bg-white border-b border-[#E7E5DD] py-3 overflow-hidden">
            <div className="flex gap-3 animate-[marquee_28s_linear_infinite] w-max">
                {doubled.map((s, i) => (
                    <span
                        key={i}
                        className={`font-tag text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${i % 2 === 0 ? 'bg-teal-bg text-teal-text' : 'bg-violet-bg text-violet-text'
                            }`}
                    >
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default SkillMarquee;