import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tideApi } from '../api/tideApi';
import { createLocalDate, todayLocal } from '../utils/format';

type TideType = 'HIGH' | 'LOW';

const SLOTS: { type: TideType; label: string }[] = [
  { type: 'HIGH', label: '1st HIGH' },
  { type: 'LOW', label: '1st LOW' },
  { type: 'HIGH', label: '2nd HIGH' },
  { type: 'LOW', label: '2nd LOW' },
];

export default function TideIndicatorPage() {
  const queryClient = useQueryClient();
  const date = todayLocal();

  const { data: indicators, isLoading } = useQuery({
    queryKey: ['tide-indicators', date],
    queryFn: () => tideApi.getAll(date),
  });

  const createMutation = useMutation({
    mutationFn: (data: { occurredAt: Date; type: TideType; waterLevelFt: number }) =>
      tideApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tide-indicators', date] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { occurredAt?: Date; waterLevelFt?: number } }) =>
      tideApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tide-indicators', date] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tideApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tide-indicators', date] }),
  });

  const existingBySlot = useMemo(() => {
    const arr: ({ time: string; level: string; id: string } | null)[] = SLOTS.map(() => null);
    const sorted = ((indicators as any[]) || [])
      .slice()
      .sort((a: any, b: any) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    let hIdx = 0, lIdx = 0;
    for (const r of sorted) {
      const h = new Date(r.occurredAt).getUTCHours();
      const m = new Date(r.occurredAt).getUTCMinutes();
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (r.type === 'HIGH' && hIdx < 2) {
        const slot = hIdx === 0 ? 0 : 2;
        arr[slot] = { time, level: String(Number(r.waterLevelFt)), id: r.id };
        hIdx++;
      } else if (r.type === 'LOW' && lIdx < 2) {
        const slot = lIdx === 0 ? 1 : 3;
        arr[slot] = { time, level: String(Number(r.waterLevelFt)), id: r.id };
        lIdx++;
      }
    }
    return arr;
  }, [indicators]);

  const [times, setTimes] = useState<string[]>(SLOTS.map(() => ''));
  const [levels, setLevels] = useState<string[]>(SLOTS.map(() => ''));

  useEffect(() => {
    setTimes(existingBySlot.map((s) => s?.time ?? ''));
    setLevels(existingBySlot.map((s) => s?.level ?? ''));
  }, [existingBySlot]);

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const saveAll = async () => {
    const ops: Promise<any>[] = [];
    for (let i = 0; i < SLOTS.length; i++) {
      const time = times[i]?.trim();
      const level = levels[i]?.trim();
      const existing = existingBySlot[i];
      if (time && level) {
        const occurredAt = createLocalDate(`${date}T${time}`);
        const waterLevelFt = Number(level);
        if (existing) {
          const changed = time !== existing.time || level !== existing.level;
          if (changed) {
            ops.push(updateMutation.mutateAsync({ id: existing.id, data: { occurredAt, waterLevelFt } }));
          }
        } else {
          ops.push(createMutation.mutateAsync({ occurredAt, type: SLOTS[i].type, waterLevelFt }));
        }
      } else if (existing) {
        ops.push(deleteMutation.mutateAsync(existing.id));
      }
    }
    await Promise.all(ops);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Tide Indicators</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-mono text-center sm:text-left">{date}</span>
          <button
            onClick={saveAll}
            disabled={isSaving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="sm:hidden space-y-3">
        {SLOTS.map((slot, i) => {
          const existing = existingBySlot[i];
          const hasInput = times[i] && levels[i];
          return (
            <div
              key={i}
              className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 ${
                existing ? '' : hasInput ? 'bg-blue-50/30 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                  slot.type === 'HIGH' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {slot.type === 'HIGH' ? '\u2191' : '\u2193'}
                </span>
                <span className={`font-semibold ${slot.type === 'HIGH' ? 'text-orange-700' : 'text-blue-700'}`}>
                  {slot.label}
                </span>
                {existing ? (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-600 ring-1 ring-green-200">{'\u2713'} SAVED</span>
                ) : hasInput ? (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200">{'\u25CB'} UNSAVED</span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="time"
                    value={times[i]}
                    onChange={(e) => {
                      const next = [...times];
                      next[i] = e.target.value;
                      setTimes(next);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Level (ft)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={levels[i]}
                    onChange={(e) => {
                      const next = [...levels];
                      next[i] = e.target.value;
                      setLevels(next);
                    }}
                    placeholder="--"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Time</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Level (ft)</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot, i) => {
                const existing = existingBySlot[i];
                const hasInput = times[i] && levels[i];
                return (
                  <tr key={i} className={`border-t border-gray-100 transition-colors hover:bg-gray-50/50 ${existing ? '' : hasInput ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                          slot.type === 'HIGH' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {slot.type === 'HIGH' ? '\u2191' : '\u2193'}
                        </span>
                        <span className={`font-semibold ${slot.type === 'HIGH' ? 'text-orange-700' : 'text-blue-700'}`}>
                          {slot.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="time"
                        value={times[i]}
                        onChange={(e) => {
                          const next = [...times];
                          next[i] = e.target.value;
                          setTimes(next);
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow w-36"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={levels[i]}
                        onChange={(e) => {
                          const next = [...levels];
                          next[i] = e.target.value;
                          setLevels(next);
                        }}
                        placeholder="--"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow w-28"
                      />
                    </td>
                    <td className="px-5 py-3">
                      {existing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-600 ring-1 ring-green-200">{'\u2713'} SAVED</span>
                      ) : hasInput ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200">{'\u25CB'} UNSAVED</span>
                      ) : (
                        <span className="text-gray-300 text-xs">empty</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}