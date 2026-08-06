import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

function AdminFeed() {
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [p, r] = await Promise.all([
        axios.get('/api/admin/projects', { withCredentials: true }),
        axios.get('/api/admin/projects/reports', { withCredentials: true })
      ]);
      setProjects(p.data.projects);
      setReports(r.data.reports);
    } catch (err) {
      console.error('Failed to load feed admin data');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete this project by ${project.posterName}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/projects/${project.id}`, { withCredentials: true });
      setMessage('Project deleted.');
      loadAll();
    } catch (err) {
      setMessage('Failed to delete');
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await axios.post(`/api/admin/projects/reports/${reportId}/dismiss`, {}, { withCredentials: true });
      setMessage('Report dismissed.');
      loadAll();
    } catch (err) {
      setMessage('Failed to dismiss');
    }
  };

  if (loading) return <AdminLayout><p className="text-gray-500">Loading...</p></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Manage feed</h1>

      {message && <div className="bg-teal-bg text-teal-text p-3 rounded-lg mb-4 text-sm">{message}</div>}

      {/* Reported Projects */}
      <div className="mb-8">
        <h2 className="font-display text-base font-semibold text-ink mb-3">Reported projects ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-[#9A9890]">No pending reports.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="bg-amber-bg border border-amber-brand/20 rounded-xl p-4">
                <p className="text-sm text-ink">
                  <strong>{r.reporterName}</strong> reported a project by <strong>{r.posterName}</strong>
                </p>
                <p className="text-sm text-[#6B6E76] mt-1 italic">"{r.reason}"</p>
                <p className="text-xs text-[#9A9890] mt-2 border-l-2 border-[#D8D6CC] pl-2">{r.description}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDismissReport(r.id)}
                    className="text-xs bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1.5 rounded-lg hover:bg-[#E7E5DD] transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleDeleteProject({ id: r.projectId, posterName: r.posterName })}
                    className="text-xs bg-[#FCEBEB] text-[#791F1F] px-3 py-1.5 rounded-lg hover:bg-[#F7C1C1] transition-colors"
                  >
                    Delete project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Projects */}
      <div>
        <h2 className="font-display text-base font-semibold text-ink mb-3">All projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-[#9A9890]">No projects yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="bg-white border border-[#E7E5DD] rounded-xl p-4 flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{p.posterName}</p>
                  <p className="text-sm text-[#6B6E76] mt-1">{p.description}</p>
                  {p.repoUrl && (
                    <a href={p.repoUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-text hover:underline block mt-1.5 font-mono">
                      {p.repoUrl}
                    </a>
                  )}
                  <p className="text-xs text-[#9A9890] mt-2">{p.createdAt?.split('T')[0]}</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(p)}
                  className="text-xs bg-[#FCEBEB] text-[#791F1F] px-3 py-1.5 rounded-lg hover:bg-[#F7C1C1] transition-colors ml-3"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminFeed;