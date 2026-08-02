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
        axios.get('http://localhost:5000/api/admin/projects', { withCredentials: true }),
        axios.get('http://localhost:5000/api/admin/projects/reports', { withCredentials: true })
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
      await axios.delete(`http://localhost:5000/api/admin/projects/${project.id}`, { withCredentials: true });
      setMessage('Project deleted.');
      loadAll();
    } catch (err) {
      setMessage('Failed to delete');
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/projects/reports/${reportId}/dismiss`, {}, { withCredentials: true });
      setMessage('Report dismissed.');
      loadAll();
    } catch (err) {
      setMessage('Failed to dismiss');
    }
  };

  if (loading) return <AdminLayout><p className="text-gray-500">Loading...</p></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Feed</h1>

      {message && <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-sm">{message}</div>}

      {/* Reported Projects */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-700 mb-3">Reported Projects ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">No pending reports.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-gray-800">
                  <strong>{r.reporterName}</strong> reported a project by <strong>{r.posterName}</strong>
                </p>
                <p className="text-sm text-gray-600 mt-1 italic">"{r.reason}"</p>
                <p className="text-xs text-gray-500 mt-2 border-l-2 border-gray-300 pl-2">{r.description}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDismissReport(r.id)}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleDeleteProject({ id: r.projectId, posterName: r.posterName })}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Projects */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">All Projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">No projects yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{p.posterName}</p>
                  <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                  {p.repoUrl && (
                    <a href={p.repoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      {p.repoUrl}
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{p.createdAt?.split('T')[0]}</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(p)}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 ml-3"
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