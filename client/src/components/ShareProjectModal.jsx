import { useState } from 'react';
import axios from 'axios';
import TechTagSelector from './TechTagSelector';

function ShareProjectModal({ onClose, onSuccess }) {
    const [description, setDescription] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [technologies, setTechnologies] = useState([]);
    const [images, setImages] = useState([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setImages(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!description.trim()) {
            setError('Description is required');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('description', description);
        formData.append('repoUrl', repoUrl);
        formData.append('skillIds', JSON.stringify(technologies.map(t => t.id)));
        images.forEach(file => formData.append('images', file));

        try {
            await axios.post('/api/feed', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="font-display text-lg font-semibold text-ink mb-4">Share a project</h2>

                {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-2 rounded-lg mb-3 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-ink mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
                            className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink mb-1">Repo Link</label>
                        <input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
                        />
                    </div>

                    <TechTagSelector
                        selectedSkills={technologies}
                        onAdd={(skill) => setTechnologies([...technologies, skill])}
                        onRemove={(id) => setTechnologies(technologies.filter((s) => s.id !== id))}
                    />

                    <div>
                        <label className="block text-sm font-medium text-ink mb-1">Images (up to 5)</label>
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="text-sm" />
                        {images.length > 0 && <p className="text-xs text-gray-500 mt-1">{images.length} image(s) selected</p>}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 bg-[#F1EFE8] text-ink py-2 rounded-lg hover:bg-[#E7E5DD] transition-colors text-sm">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 bg-teal-brand text-white py-2 rounded-lg hover:bg-teal-brand/90 disabled:opacity-40 transition-colors text-sm">
                            {submitting ? 'Posting...' : 'Post project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ShareProjectModal;