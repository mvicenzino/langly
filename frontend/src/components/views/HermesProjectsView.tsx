import { useState, useEffect } from 'react';

interface Project {
  name: string;
  status: string;
  status_color: string;
  type: string;
  deadline: string | null;
  blockers: string[];
  revenue: string;
  canonical_path: string;
  file: string;
}

interface DashboardData {
  projects: Record<string, Project>;
  critical_items: Array<{ project: string; deadline: string; blockers: string[] }>;
  total_projects: number;
  last_updated: string;
}

export const HermesProjectsView = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects/dashboard/hermes');
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const data = await response.json();
        setDashboard(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No projects found</div>;
  }

  const criticalCount = dashboard.critical_items.length;
  const projects = Object.values(dashboard.projects);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hermes Projects</h1>
          <p className="text-gray-600 text-sm mt-1">
            {dashboard.total_projects} active projects
            {criticalCount > 0 && ` · ${criticalCount} critical item${criticalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Last updated</p>
          <p className="text-sm font-mono text-gray-700">
            {new Date(dashboard.last_updated).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Critical Items Alert */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">🔴</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Critical This Week</h3>
              <ul className="space-y-2">
                {dashboard.critical_items.map((item, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    <strong>{item.project}</strong>
                    {item.deadline && ` — Due ${item.deadline}`}
                    {item.blockers.length > 0 && (
                      <div className="ml-4 mt-1 text-xs text-red-700">
                        {item.blockers[0]}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.file}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setExpandedProject(expandedProject === project.name ? null : project.name)}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{project.status_color}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{project.type}</p>
                </div>
              </div>

              {/* Deadline Badge */}
              {project.deadline && (
                <div className="mt-2 inline-block">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                    📅 {project.deadline}
                  </span>
                </div>
              )}
            </div>

            {/* Card Body - Blockers */}
            {project.blockers.length > 0 && (
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-600 font-semibold">Top Blockers:</p>
                <ul className="space-y-1">
                  {project.blockers.slice(0, 2).map((blocker, idx) => (
                    <li key={idx} className="text-xs text-gray-700 leading-snug">
                      <span className="text-gray-400">•</span> {blocker.substring(0, 60)}
                      {blocker.length > 60 ? '…' : ''}
                    </li>
                  ))}
                </ul>
                {project.blockers.length > 2 && (
                  <p className="text-xs text-blue-600 mt-2">+{project.blockers.length - 2} more</p>
                )}
              </div>
            )}

            {/* Expanded Details */}
            {expandedProject === project.name && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
                {project.blockers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">All Blockers:</p>
                    <ul className="space-y-1">
                      {project.blockers.map((blocker, idx) => (
                        <li key={idx} className="text-xs text-gray-700">
                          <span className="text-gray-400">○</span> {blocker}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Path:</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{project.canonical_path}</p>
                </div>

                <a
                  href={`/projects/${project.name.toLowerCase()}`}
                  className="block text-xs text-blue-600 hover:text-blue-700 font-semibold mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="flex gap-4 justify-center text-sm text-gray-600 border-t border-gray-200 pt-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-xs">Total Projects</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {projects.filter((p) => p.status_color === '🔴').length}
          </p>
          <p className="text-xs">Critical</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {projects.filter((p) => p.status_color === '🟢').length}
          </p>
          <p className="text-xs">Live</p>
        </div>
      </div>
    </div>
  );
};
