import React from 'react';
import { ProjectSprintWidget } from '../widgets/ProjectSprintWidget';
import { Target, Zap } from 'lucide-react';
import { ResourcesCard } from '../widgets/ResourcesCard';

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
          <ResourcesCard project="calendora" />

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
