import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hourlyApi } from '../api/tideApi';
import { createLocalDate, todayLocal } from '../utils/format';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HourlyLevelPage() {
  const queryClient = useQueryClient();
  const date = todayLocal();

  const { data: levels, isLoading } = useQuery({
    queryKey: ['hourly-levels', date],
    queryFn: () => hourlyApi.getAll(date),
  });

  const createMutation = useMutation({
    mutationFn: (data: { recordedAt: Date; waterLevelFt: number }) => hourlyApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hourly-levels', date] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { waterLevelFt: number } }) =>
      hourlyApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hourly-levels', date] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hourlyApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hourly-levels', date] }),
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => hourlyApi.upload(file),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['hourly-levels', date] });
      const msg = res?.inserted
        ? `Uploaded ${res.inserted} level(s) successfully`
        : 'Upload successful';
      const errs = res?.errors?.length ? ` (${res.errors.length} rows skipped)` : '';
      setUploadMsg(msg + errs);
      setTimeout(() => setUploadMsg(null), 5000);
    },
    onError: (err: Error) => {
      setUploadMsg(`Upload failed: ${err.message}`);
      setTimeout(() => setUploadMsg(null), 8000);
    },
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  const existingMap = useMemo(() => {
    const map: Record<number, { id: string; level: number }> = {};
    ((levels as any[]) || []).forEach((r) => {
      const h = new Date(r.recordedAt).getUTCHours();
      map[h] = { id: r.id, level: Number(r.waterLevelFt) };
    });
    return map;
  }, [levels]);

  const [values, setValues] = useState<Record<number, string>>({});

  useEffect(() => {
    const init: Record<number, string> = {};
    HOURS.forEach((h) => {
      if (existingMap[h]) init[h] = String(existingMap[h].level);
    });
    setValues(init);
  }, [existingMap]);

  const setHour = (hour: number, val: string) => {
    setValues((prev) => ({ ...prev, [hour]: val }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const saveAll = async () => {
    const ops: Promise<any>[] = [];
    for (const h of HOURS) {
      const val = values[h]?.trim();
      const existing = existingMap[h];
      if (val) {
        const num = Number(val);
        if (existing) {
          if (num !== existing.level) {
            ops.push(updateMutation.mutateAsync({ id: existing.id, data: { waterLevelFt: num } }));
          }
        } else {
          ops.push(
            createMutation.mutateAsync({
              recordedAt: createLocalDate(`${date}T${String(h).padStart(2, '0')}:00`),
              waterLevelFt: num,
            })
          );
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Hourly Tide Levels</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-mono text-center sm:text-left">{date}</span>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
          <button
            onClick={saveAll}
            disabled={isSaving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {uploadMsg && (
        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${uploadMsg.startsWith('Upload failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {uploadMsg}
        </div>
      )}

      {/* Mobile card grid view */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        {HOURS.map((h) => {
          const existing = existingMap[h];
          const hasValue = values[h]?.trim();
          return (
            <div
              key={h}
              className={`bg-white border rounded-lg shadow-sm p-3 ${
                existing ? 'border-gray-200' : hasValue ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold text-sm text-gray-700">{String(h).padStart(2, '0')}:00</span>
                {existing ? (
                  <span className="text-[10px] font-medium text-green-600">{'\u2713'}</span>
                ) : hasValue ? (
                  <span className="text-[10px] font-medium text-blue-500">{'\u25CB'}</span>
                ) : null}
              </div>
              <input
                type="number"
                step="0.01"
                value={values[h] ?? ''}
                onChange={(e) => setHour(h, e.target.value)}
                placeholder="--"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-24">Hour</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tide Level (ft)</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => {
                const existing = existingMap[h];
                const hasValue = values[h]?.trim();
                return (
                  <tr key={h} className={`border-t border-gray-100 transition-colors hover:bg-gray-50/50 ${existing ? '' : hasValue ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-2.5">
                      <span className="font-mono font-medium text-gray-700">{String(h).padStart(2, '0')}:00</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={values[h] ?? ''}
                        onChange={(e) => setHour(h, e.target.value)}
                        placeholder="--"
                        className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      {existing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-600 ring-1 ring-green-200">
                          {'\u2713'} SAVED
                        </span>
                      ) : hasValue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                          {'\u25CB'} UNSAVED
                        </span>
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
