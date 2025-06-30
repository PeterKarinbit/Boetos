import React, { useState } from 'react';
import { useMemoryEntries } from '../../hooks/useMemoryEntries';
import { MoreVertical } from 'lucide-react';

const nudgeOptions = [
  { value: 'daily', label: 'Remind me daily' },
  { value: 'before_sleep', label: 'Remind me before sleep' },
  { value: 'never', label: 'Don\'t remind me' },
];

const typeOptions = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'reminder', label: 'Reminder' },
];

// Add color map for entry types
const typeColors: Record<string, string> = {
  note: '#3b82f6', // blue
  link: '#10b981', // green
  reminder: '#f59e42', // orange
};
const typeIcons: Record<string, string> = {
  note: '📝',
  link: '🔗',
  reminder: '⏰',
};

export default function MemoryArea() {
  const [content, setContent] = useState('');
  const [type, setType] = useState('note');
  const [nudgePreference, setNudgePreference] = useState('daily');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    setError
  } = useMemoryEntries();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addEntry({ content, type, nudgePreference });
    setContent('');
    setType('note');
    setNudgePreference('daily');
  };

  const handleUpdate = async (id: string, updates: any) => {
    await updateEntry(id, updates);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
  };

  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100">Memory Assistant</h2>
        <p className="text-slate-400 mt-1">Capture and organize your thoughts</p>
        {/* Legend */}
        <div className="flex gap-4 mt-3">
          <span className="flex items-center text-xs text-slate-300"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: typeColors.note }}></span>Note</span>
          <span className="flex items-center text-xs text-slate-300"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: typeColors.link }}></span>Link</span>
          <span className="flex items-center text-xs text-slate-300"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: typeColors.reminder }}></span>Reminder</span>
        </div>
      </div>
      
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-600 bg-slate-700/60 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          placeholder="Paste a note, link, or reminder..."
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <select
          className="px-4 py-3 rounded-2xl border border-slate-600 bg-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select
          className="px-4 py-3 rounded-2xl border border-slate-600 bg-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          value={nudgePreference}
          onChange={e => setNudgePreference(e.target.value)}
        >
          {nudgeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Add
        </button>
      </form>
      
      {error && <div className="text-red-400 mb-4 p-3 bg-red-900/20 rounded-2xl border border-red-800/50">{error}</div>}
      
      <div className="space-y-4 overflow-y-auto flex-1">
        {loading && <div className="text-slate-400 text-center py-4">Loading...</div>}
        {!loading && entries.length === 0 && <div className="text-slate-500 text-center py-8">No memory entries yet.</div>}
        {entries.map((entry: any) => (
          <div
            key={entry.id}
            className="relative rounded-2xl border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-300 cursor-pointer"
            style={{ borderLeft: `6px solid ${typeColors[entry.type] || '#64748b'}` }}
            onClick={() => toggleExpand(entry.id)}
          >
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div className="font-medium text-slate-200 flex items-center gap-2">
                  <span>{typeIcons[entry.type] || '\ud83d\uddc2\ufe0f'}</span>
                  {expandedEntryId === entry.id ? entry.content : `Memory Entry - Click to view`}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold" style={{ color: typeColors[entry.type] || '#64748b' }}>
                    {typeOptions.find(opt => opt.value === entry.type)?.label || entry.type}
                  </div>
                  <button
                    className="opacity-60 hover:opacity-100 ml-2 p-1 rounded-full focus:outline-none"
                    onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === entry.id ? null : String(entry.id)); }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpenId === String(entry.id) && (
                    <div className="absolute right-2 top-10 z-10 bg-slate-800 border border-slate-700 rounded-xl shadow-lg py-1">
                      <button
                        className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-600/20 rounded-xl"
                        onClick={e => { e.stopPropagation(); handleDelete(entry.id); setMenuOpenId(null); }}
                        disabled={loading}
                      >Delete</button>
                    </div>
                  )}
                </div>
              </div>
              {expandedEntryId === entry.id && (
                <>
                  <div className="text-xs text-slate-400 mt-2">
                    {nudgeOptions.find(opt => opt.value === entry.nudgePreference)?.label || entry.nudgePreference}
                    {entry.snoozedUntil && (
                      <span> &middot; Snoozed until {new Date(entry.snoozedUntil).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-4">
                    <button
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium transition-all duration-300"
                      onClick={(e) => { e.stopPropagation(); handleUpdate(entry.id, { isDone: true }); }}
                      disabled={entry.isDone || loading}
                    >
                      {entry.isDone ? 'Done' : 'Mark as Done'}
                    </button>
                    <button
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-all duration-300"
                      onClick={(e) => { e.stopPropagation(); handleUpdate(entry.id, { snoozedUntil: new Date(Date.now() + 60 * 60 * 1000) }); }}
                      disabled={loading}
                    >
                      Snooze 1h
                    </button>
                    <button
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-all duration-300"
                      onClick={(e) => { e.stopPropagation(); handleUpdate(entry.id, { isArchived: true }); }}
                      disabled={loading}
                    >
                      Archive
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 