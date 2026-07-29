import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ruleProfileApi } from '../api/navigationApi';
import type { RuleProfile } from '@pilot-tide-planner/shared-types';

export default function RuleProfilePage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    redDifference: '',
    yellowDifference: '',
    greenDifference: '',
    yellowDisabledStart: '07:00',
    yellowDisabledEnd: '19:00',
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['rule-profiles'],
    queryFn: () => ruleProfileApi.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: Partial<RuleProfile> }) =>
      ruleProfileApi.update(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rule-profiles'] });
      setEditingId(null);
    },
  });

  const startEdit = (profile: RuleProfile) => {
    setEditingId(profile.id!);
    setForm({
      name: profile.name,
      redDifference: String(profile.redDifference),
      yellowDifference: String(profile.yellowDifference),
      greenDifference: String(profile.greenDifference),
      yellowDisabledStart: profile.yellowDisabledStart.slice(11, 16) || '07:00',
      yellowDisabledEnd: profile.yellowDisabledEnd.slice(11, 16) || '19:00',
    });
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({
      id,
      body: {
        redDifference: Number(form.redDifference),
        yellowDifference: Number(form.yellowDifference),
        greenDifference: Number(form.greenDifference),
        yellowDisabledStart: form.yellowDisabledStart,
        yellowDisabledEnd: form.yellowDisabledEnd,
      } as any,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-6">Rule Profiles</h2>

      <div className="space-y-4">
        {(profiles as RuleProfile[])?.map((profile) => (
          <div key={profile.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            {editingId === profile.id ? (
              <div className="space-y-5 max-w-2xl">
                <h3 className="font-semibold text-gray-900 text-lg">{profile.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Red Diff</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.redDifference}
                      onChange={(e) => setForm({ ...form, redDifference: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Yellow Diff</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.yellowDifference}
                      onChange={(e) => setForm({ ...form, yellowDifference: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Green Diff</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.greenDifference}
                      onChange={(e) => setForm({ ...form, greenDifference: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Yellow Off</label>
                    <input
                      type="time"
                      value={form.yellowDisabledStart}
                      onChange={(e) => setForm({ ...form, yellowDisabledStart: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Yellow On</label>
                    <input
                      type="time"
                      value={form.yellowDisabledEnd}
                      onChange={(e) => setForm({ ...form, yellowDisabledEnd: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSave(profile.id!)}
                    disabled={updateMutation.isPending}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="border border-gray-300 px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-lg">{profile.name}</h3>
                    {profile.active && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-600 ring-1 ring-green-200">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Red Diff</span>
                      <p className="font-bold text-gray-800 text-base sm:text-lg">{Number(profile.redDifference).toFixed(1)} <span className="text-sm font-normal text-gray-400">ft</span></p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Yellow Diff</span>
                      <p className="font-bold text-gray-800 text-base sm:text-lg">{Number(profile.yellowDifference).toFixed(1)} <span className="text-sm font-normal text-gray-400">ft</span></p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Green Diff</span>
                      <p className="font-bold text-gray-800 text-base sm:text-lg">{Number(profile.greenDifference).toFixed(1)} <span className="text-sm font-normal text-gray-400">ft</span></p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Yellow Off</span>
                      <p className="font-bold text-gray-800 text-base sm:text-lg font-mono">{profile.yellowDisabledStart?.slice(11, 16) || '07:00'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Yellow On</span>
                      <p className="font-bold text-gray-800 text-base sm:text-lg font-mono">{profile.yellowDisabledEnd?.slice(11, 16) || '19:00'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startEdit(profile)}
                  className="sm:ml-4 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
        {(!profiles || (profiles as RuleProfile[]).length === 0) && (
          <p className="text-gray-400 text-center py-8 italic">No rule profiles found</p>
        )}
      </div>
    </div>
  );
}
