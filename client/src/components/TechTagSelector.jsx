import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function TechTagSelector({ selectedSkills, onAdd, onRemove }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length === 0) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/skills/search?q=${encodeURIComponent(query)}`, {
                    withCredentials: true
                });
                const filtered = res.data.skills.filter(
                    (s) => !selectedSkills.some((sel) => sel.id === s.id)
                );
                setResults(filtered);
            } catch (err) {
                console.error('Search error:', err);
            }
        }, 300);
    }, [query, selectedSkills]);

    const handleSelect = (skill) => {
        onAdd(skill);
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-ink mb-1">Technologies Used</label>

            <div className="flex flex-wrap gap-2 mb-3">
                {selectedSkills.map((skill) => (
                    <span
                        key={skill.id}
                        className="font-tag flex items-center gap-1.5 bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1.5 rounded-lg text-sm"
                    >
                        {skill.name}
                        <button
                            type="button"
                            onClick={() => onRemove(skill.id)}
                            className="text-[#5F5E5A] hover:text-ink font-sans font-bold ml-0.5"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search technologies..."
                    className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
                />

                {showDropdown && query.trim().length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-[#E7E5DD] rounded-lg mt-1 shadow-md max-h-48 overflow-y-auto">
                        {results.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-[#9A9890]">No matching skills found.</p>
                        ) : (
                            results.map((skill) => (
                                <button
                                    type="button"
                                    key={skill.id}
                                    onClick={() => handleSelect(skill)}
                                    className="block w-full text-left px-3 py-2 hover:bg-[#F5F4EF] text-sm text-ink"
                                >
                                    {skill.name}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TechTagSelector;