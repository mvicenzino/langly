import React from 'react';
import { StrideSprintWidget } from '../widgets/StrideSprintWidget';
import { Target, TrendingUp } from 'lucide-react';
import { ResourcesCard } from '../widgets/ResourcesCard';

export function StrideProjectsView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Stride</h1>
        <p className="text-gray-400">Track career growth, content creation, and personal brand development</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Sprint Widget - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <StrideSprintWidget />
        </div>

        {/* Right Sidebar - Context & Resources */}
        <div className="space-y-4">
          {/* Stride Focus Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
            <h3 className="font-semibold text-gray-100 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" />
              Stride Focus
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Primary Project:</span>
                <p className="font-medium text-gray-100 mt-1">Stride Personal Brand</p>
              </div>
              <div>
                <span className="text-gray-400">Mission:</span>
                <p className="font-medium text-gray-100 mt-1">AI strategy, career growth, and thought leadership</p>
              </div>
              <div>
                <span className="text-gray-400">Channels:</span>
                <p className="font-medium text-gray-100 mt-1">LinkedIn, Substack, Speaking</p>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <ResourcesCard project="stride" />

          {/* Today's Focus Card */}
          <div className="bg-purple-900/20 rounded-lg border border-purple-700/30 p-4">
            <h3 className="font-semibold text-purple-100 mb-2 flex items-center gap-2">
              <Target size={16} />
              Today's Focus
            </h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Add tasks for the day to stay focused. One sprint per day keeps you moving forward.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Command Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <CommandCard
          title="Content Strategy"
          description="Plan LinkedIn posts, Substack articles, and thought leadership content for the week."
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
      <h4 className="font-semibold text-gray-100 mb-2 group-hover:text-purple-300 transition">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
