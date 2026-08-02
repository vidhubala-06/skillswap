import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ProjectCard({ project, showPoster = true }) {
    const navigate = useNavigate();
    const [showAllImages, setShowAllImages] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reason, setReason] = useState('');
    const [reportMsg, setReportMsg] = useState('');

    const handleReport = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`http://localhost:5000/api/feed/${project.id}/report`, { reason }, { withCredentials: true });
        setReportMsg('Reported. Thank you.');
        setShowReport(false);
      } catch (err) {
        setReportMsg('Failed to report');
      }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            {showPoster && (
                <button
                    onClick={() => navigate(`/feed/user/${project.userId}`)}
                    className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                >
                    {project.posterName}
                </button>
            )}
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{project.description}</p>

            {project.images && project.images.length > 0 && (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {(showAllImages ? project.images : project.images.slice(0, 2)).map((url, i) => (
                    <img key={i} src={url} alt="" className="rounded w-full h-32 object-cover" />
                  ))}
                </div>

                {project.images.length > 2 && !showAllImages && (
                  <button
                    onClick={() => setShowAllImages(true)}
                    className="text-xs text-blue-600 hover:underline mt-2"
                  >
                    View {project.images.length - 2} more image{project.images.length - 2 > 1 ? 's' : ''}
                  </button>
                )}

                {showAllImages && project.images.length > 2 && (
                  <button
                    onClick={() => setShowAllImages(false)}
                    className="text-xs text-gray-500 hover:underline mt-2"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}

            {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline mt-3 inline-block">
                    🔗 View Repo
                </a>
            )}

            {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.technologies.map((t) => (
                        <span key={t.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{t.name}</span>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-400 mt-3">{project.createdAt?.split('T')[0]}</p>

            <div className="mt-3 pt-2 border-t border-gray-100">
              {reportMsg && <p className="text-xs text-gray-500 mb-1">{reportMsg}</p>}
              <button onClick={() => setShowReport(!showReport)} className="text-xs text-gray-400 hover:text-red-500">
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
        </div>
    );
}

export default ProjectCard;