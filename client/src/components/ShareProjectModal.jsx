import { useState } from 'react';
import axios from 'axios';
import SkillSelector from './SkillSelector';

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
            await axios.post('http://localhost:5000/api/feed', formData, {
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
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Share a Project</h2>

                {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Repo Link</label>
                        <input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <SkillSelector
                        label="Technologies Used"
                        selectedSkills={technologies}
                        onAdd={(skill) => setTechnologies([...technologies, skill])}
                        onRemove={(id) => setTechnologies(technologies.filter((s) => s.id !== id))}
                        excludedIds={[]}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Images (up to 5)</label>
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="text-sm" />
                        {images.length > 0 && <p className="text-xs text-gray-500 mt-1">{images.length} image(s) selected</p>}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? 'Posting...' : 'Post Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ShareProjectModal;