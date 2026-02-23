import React, { useEffect, useState } from 'react';
import { ExternalLink, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { resourcesApi, type Resource, type ResourceInput } from '../../api/client';

interface ResourcesCardProps {
  project: string;
}

const RESOURCE_TYPES = ['document', 'link', 'repo', 'design'] as const;

export function ResourcesCard({ project }: ResourcesCardProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResourceInput>({ name: '', url: '', description: '', type: 'document' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    resourcesApi.getAll(project).then(setResources).catch(console.error).finally(() => setLoading(false));
  }, [project]);

  function resetForm() {
    setFormData({ name: '', url: '', description: '', type: 'document' });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.url.trim()) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        const updated = await resourcesApi.update(project, editingId, formData);
        setResources(prev => prev.map(r => r.id === editingId ? updated : r));
      } else {
        const created = await resourcesApi.create(project, formData);
        setResources(prev => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save resource:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this resource?')) return;
    try {
      await resourcesApi.delete(project, id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  }

  function startEdit(resource: Resource) {
    setFormData({ name: resource.name, url: resource.url, description: resource.description, type: resource.resource_type });
    setEditingId(resource.id);
    setShowForm(true);
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-100">Resources</h3>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Resource list */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
          <Loader2 size={14} className="animate-spin" />
          Loading...
        </div>
      ) : resources.length === 0 && !showForm ? (
        <p className="text-gray-500 text-sm">No resources yet. Click + Add to get started.</p>
      ) : (
        <div className="space-y-1">
          {resources.map(resource => (
            <div key={resource.id} className="group flex items-center gap-2">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium truncate"
              >
                <span className="truncate">&rarr; {resource.name}</span>
                <ExternalLink size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition" />
              </a>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => startEdit(resource)} className="p-1 text-gray-400 hover:text-blue-300">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleDelete(resource.id)} className="p-1 text-gray-400 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
          <input
            type="text"
            placeholder="Name *"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="url"
            placeholder="URL *"
            value={formData.url}
            onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={formData.type}
            onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2.5 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {RESOURCE_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name.trim() || !formData.url.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white transition"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {editingId !== null ? 'Update' : 'Save'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-gray-300 transition"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
