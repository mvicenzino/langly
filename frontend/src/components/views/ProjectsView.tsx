import React from 'react';
import { ProjectSprintWidget } from '../widgets/ProjectSprintWidget';
import { ExternalLink, Target, Zap } from 'lucide-react';

export function ProjectsView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Projects</h1>
        <p className="text-gray-400">Manage Kindora projects and daily sprints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Sprint Widget - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <ProjectSprintWidget />
        </div>

        {/* Right Sidebar - Context & Resources */}
        <div className="space-y-4">
          {/* Kindora Focus Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
            <h3 className="font-semibold text-gray-100 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Kindora Focus
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">🎯 Primary Project:</span>
                <p className="font-medium text-gray-100 mt-1">Calendora Launch</p>
              </div>
              <div>
                <span className="text-gray-400">📦 Product Type:</span>
                <p className="font-medium text-gray-100 mt-1">Family Calendar</p>
              </div>
              <div>
                <span className="text-gray-400">🌟 Vision:</span>
                <p className="font-medium text-gray-100 mt-1">Kindora Family OS</p>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
            <h3 className="font-semibold text-gray-100 mb-3">Resources</h3>
            <div className="space-y-2">
              <a
                href="https://calendora.replit.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium group"
              >
                <span>→ Calendora App</span>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100" />
              </a>
              <a
                href="https://docs.google.com/document/d/1-7fEvj1eYUEO4WaD734UmC6dbAUO42GxKHyEoAOF7AI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium group"
              >
                <span>→ Launch Plan Doc</span>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium group"
              >
                <span>→ Code Repository</span>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Today's Focus Card */}
          <div className="bg-blue-900/20 rounded-lg border border-blue-700/30 p-4">
            <h3 className="font-semibold text-blue-100 mb-2 flex items-center gap-2">
              <Target size={16} />
              Today's Focus
            </h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Add tasks for the day to stay focused. One sprint per day keeps you moving forward.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Command Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <CommandCard
          title="Calendora Launch Plan"
          description="Review the Calendora launch roadmap. What are the key milestones?"
        />
        <CommandCard
          title="Daily Standup"
          description="What did I complete yesterday, what's today's focus, any blockers?"
        />
        <CommandCard
          title="Week Planning"
          description="What are the top 3-5 things that move the needle this week?"
        />
      </div>
    </div>
  );
}

function CommandCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition cursor-pointer group">
      <h4 className="font-semibold text-gray-100 mb-2 group-hover:text-blue-300 transition">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
