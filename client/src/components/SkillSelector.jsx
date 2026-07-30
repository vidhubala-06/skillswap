import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function SkillSelector({ label, selectedSkills, onAdd, onRemove, excludedIds }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/skills/search?q=${encodeURIComponent(query)}`, {
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
        'http://localhost:5000/api/skills/suggest',
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
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedSkills.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => onRemove(skill.id)}
              className="text-blue-500 hover:text-blue-700 font-bold ml-1"
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
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {showDropdown && query.trim().length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 shadow-lg max-h-48 overflow-y-auto">
            {results.map((skill) => (
              <button
                type="button"
                key={skill.id}
                onClick={() => handleSelect(skill)}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                {skill.name}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSuggest}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-blue-600 border-t border-gray-100"
            >
              + Add "{query}" as a new skill
            </button>
          </div>
        )}
      </div>

      {suggestMessage && (
        <p className="text-xs text-gray-500 mt-1">{suggestMessage}</p>
      )}
    </div>
  );
}

export default SkillSelector;