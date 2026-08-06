import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function getThumbnailUrl(url) {
  // Insert Cloudinary transformation params: 400px wide, auto quality/format
  return url.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
}

function ProjectCard({ project, showPoster = true }) {
  const navigate = useNavigate();
  const [showAllImages, setShowAllImages] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/feed/${project.id}/report`, { reason }, { withCredentials: true });
      setReportMsg('Reported. Thank you.');
      setShowReport(false);
    } catch (err) {
      setReportMsg('Failed to report');
    }
  };

  return (
    <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 mb-4">
      {showPoster && (
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-sm flex items-center justify-center flex-shrink-0">
            {project.posterName.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => navigate(`/feed/user/${project.userId}`)}
            className="font-medium text-ink hover:text-teal-text transition-colors text-sm"
          >
            {project.posterName}
          </button>
        </div>
      )}
      <p className="text-sm text-[#3D3D3A] whitespace-pre-wrap leading-relaxed">{project.description}</p>

      {project.images && project.images.length > 0 && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {(showAllImages ? project.images : project.images.slice(0, 2)).map((url, i) => (
              <img
                key={i}
                src={getThumbnailUrl(url)}
                alt=""
                onClick={() => setEnlargedImage(url)}
                className="rounded w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            ))}
          </div>

          {project.images.length > 2 && !showAllImages && (
            <button
              onClick={() => setShowAllImages(true)}
              className="text-xs text-teal-text font-medium hover:underline mt-2"
            >
              View {project.images.length - 2} more image{project.images.length - 2 > 1 ? 's' : ''}
            </button>
          )}

          {showAllImages && project.images.length > 2 && (
            <button
              onClick={() => setShowAllImages(false)}
              className="text-xs text-[#9A9890] hover:underline mt-2"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {project.repoUrl && (
        <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-text font-medium hover:underline mt-3 inline-flex items-center gap-1">
          View repo →
        </a>
      )}

      {project.technologies && project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.technologies.map((t) => (
            <span key={t.id} className="font-tag text-xs bg-[#F1EFE8] text-[#5F5E5A] px-2 py-1 rounded-lg">{t.name}</span>
          ))}
        </div>
      )}

      <p className="text-xs text-[#9A9890] mt-3">{project.createdAt?.split('T')[0]}</p>

      <div className="mt-3 pt-3 border-t border-[#E7E5DD]">
        {reportMsg && <p className="text-xs text-[#9A9890] mb-1">{reportMsg}</p>}
        <button onClick={() => setShowReport(!showReport)} className="text-xs text-[#B4B2A9] hover:text-[#993C1D] transition-colors">
          Report
        </button>
        {showReport && (
          <form onSubmit={handleReport} className="mt-2 space-y-1">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs" placeholder="Reason..." />
            <button type="submit" className="bg-red-600 text-white text-xs px-2 py-1 rounded">Submit</button>
          </form>
        )}
      </div>

      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
        >
          <img
            src={enlargedImage}
            alt=""
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectCard;