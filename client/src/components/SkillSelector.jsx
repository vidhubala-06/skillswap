import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function SkillSelector({ label, selectedSkills, onAdd, onRemove, excludedIds, variant = 'teal' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState('');
  const debounceRef = useRef(null);

  const variantStyles = {
    teal: { bg: 'bg-teal-bg', text: 'text-teal-text', hover: 'hover:text-teal-brand' },
    violet: { bg: 'bg-violet-bg', text: 'text-violet-text', hover: 'hover:text-violet-brand' },
    neutral: { bg: 'bg-[#F1EFE8]', text: 'text-[#5F5E5A]', hover: 'hover:text-ink' }
  };
  const styles = variantStyles[variant] || variantStyles.teal;

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
        // filter out skills already selected here OR selected in the other list
        const filtered = res.data.skills.filter(
          (s) => !selectedSkills.some((sel) => sel.id === s.id) && !excludedIds.includes(s.id)
        );
        setResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  }, [query, selectedSkills, excludedIds]);

  const handleSelect = (skill) => {
    onAdd(skill);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleSuggest = async () => {
    try {
      const res = await axios.post(
        '/api/skills/suggest',
        { name: query },
        { withCredentials: true }
      );
      if (res.data.existingMatch) {
        setSuggestMessage(`"${res.data.skill.name}" already exists — search again to select it.`);
      } else {
        setSuggestMessage(res.data.message);
      }
      setQuery('');
      setResults([]);
    } catch (err) {
      setSuggestMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">{label}</label>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedSkills.map((skill) => (
          <span
            key={skill.id}
            className={`flex items-center gap-1.5 ${styles.bg} ${styles.text} px-3 py-1.5 rounded-lg text-sm font-tag`}
          >
            {skill.name}
            <button
              type="button"
              onClick={() => onRemove(skill.id)}
              className={`${styles.text} ${styles.hover} font-sans font-bold ml-0.5`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); setSuggestMessage(''); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search for a skill..."
          className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
        />

        {showDropdown && query.trim().length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-[#E7E5DD] rounded-lg mt-1 shadow-md max-h-48 overflow-y-auto">
            {results.map((skill) => (
              <button
                type="button"
                key={skill.id}
                onClick={() => handleSelect(skill)}
                className="block w-full text-left px-3 py-2 hover:bg-[#F5F4EF] text-sm text-ink"
              >
                {skill.name}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSuggest}
              className="block w-full text-left px-3 py-2 hover:bg-[#F5F4EF] text-sm text-teal-text border-t border-[#E7E5DD]"
            >
              + Add "{query}" as a new skill
            </button>
          </div>
        )}
      </div>

      {suggestMessage && (
        <p className="text-xs text-[#9A9890] mt-1">{suggestMessage}</p>
      )}
    </div>
  );
}

export default SkillSelector;