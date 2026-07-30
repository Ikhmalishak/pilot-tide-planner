import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tideApi } from '../api/tideApi';
import { navigationApi } from '../api/navigationApi';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthStartEnd(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  return { from, to };
}

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { from, to } = monthStartEnd(year, month);
  const numDays = daysInMonth(year, month);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data: tideData, isLoading: loadingTide } = useQuery({
    queryKey: ['tide-indicators', 'month', year, month],
    queryFn: () => tideApi.getByRange(from, to),
  });

  const { data: navData, isLoading: loadingNav } = useQuery({
    queryKey: ['navigation', 'month', year, month],
    queryFn: () => navigationApi.getHistory({ from, to, limit: 31 }),
  });

  const windows = (navData as any)?.data || [];

  const tideGrouped = useMemo(() => {
    const map: Record<string, { time: string; type: string; level: number }[]> = {};
    for (const t of (tideData as any[]) || []) {
      const d = new Date(t.occurredAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push({
        time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
        type: t.type,
        level: Number(t.waterLevelFt),
      });
    }
    return map;
  }, [tideData]);

  const generateMutation = useMutation({
    mutationFn: (date: string) => navigationApi.generate(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation', 'month', year, month] });
      queryClient.invalidateQueries({ queryKey: ['tide-indicators', 'month', year, month] });
    },
  });

  useEffect(() => {
    const exists = windows.find((w: any) => w.navigationDate?.slice(0, 10) === todayStr);
    if (!exists && !generateMutation.isPending) {
      generateMutation.mutate(todayStr);
    }
  }, [year, month]);

  const matrix = useMemo(() => {
    const map: Record<string, Record<number, { waterLevelFt: number; isRed: boolean; isYellow: boolean; isGreen: boolean }>> = {};
    for (const w of windows) {
      const dateStr = w.navigationDate?.slice(0, 10);
      if (!dateStr) continue;
      const items = w.items || [];
      const hourMap: Record<number, { waterLevelFt: number; isRed: boolean; isYellow: boolean; isGreen: boolean }> = {};
      for (const item of items) {
        const h = new Date(item.hour).getUTCHours();
        hourMap[h] = { waterLevelFt: item.waterLevelFt, isRed: item.isRed, isYellow: item.isYellow, isGreen: item.isGreen };
      }
      map[dateStr] = hourMap;
    }
    return map;
  }, [windows]);

  const days = Array.from({ length: numDays }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return { day: d, dateStr, hours: matrix[dateStr] || {} };
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const daysWithData = days.filter(d => Object.keys(d.hours).length > 0).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-lg p-4 sm:p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-blue-100 text-xs mt-0.5">{monthNames[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-1.5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/20 transition-colors" title="Previous month">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="font-semibold text-sm min-w-[120px] text-center select-none">{monthNames[month - 1]} {year}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/20 transition-colors" title="Next month">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Tide Indicators
            </h3>
          </div>
          <div className="p-0">
            {loadingTide ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              </div>
            ) : Object.keys(tideGrouped).length > 0 ? (
              <div className="max-h-[55vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Date</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Time</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Type</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.flatMap((dayRow) => {
                      const events = tideGrouped[dayRow.dateStr];
                      if (!events || events.length === 0) return [];
                      return events.map((evt, idx) => (
                        <tr key={dayRow.dateStr + '-' + idx} className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors">
                          {idx === 0 && (
                            <td rowSpan={events.length} className="px-3 py-2 font-mono text-sm font-medium text-gray-800 align-top">
                              {String(dayRow.day).padStart(2, '0')} {new Date(dayRow.dateStr).toLocaleString('default', { weekday: 'short' })}
                            </td>
                          )}
                          <td className="px-3 py-2 font-mono text-gray-500">{evt.time}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              evt.type === 'HIGH' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                            }`}>
                              {evt.type === 'HIGH' ? '\u2191' : '\u2193'} {evt.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">{evt.level.toFixed(2)}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p className="text-sm">No tide indicators for this month</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h12v2H4v-2zm0 4h12v2H4v-2z" clipRule="evenodd" />
              </svg>
              Navigation Window
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" /> RED</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400" /> YELLOW</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> GREEN</span>
            </div>
          </div>
          {loadingNav ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : daysWithData > 0 ? (
            <div className="overflow-x-auto">
              <div className="max-h-[55vh] overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="sticky left-0 bg-gray-50/80 backdrop-blur-sm z-20 px-2 py-2.5 font-semibold text-gray-500 text-[10px] uppercase tracking-wider text-left min-w-[72px]">Date</th>
                      {HOURS.map((h) => (
                        <th key={h} className={`px-1 py-3 font-mono font-semibold text-center text-xs w-[56px] ${h % 3 === 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                          {String(h).padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.flatMap((dayRow) => {
                      const hasData = Object.keys(dayRow.hours).length > 0;
                      const dateLabel = `${String(dayRow.day).padStart(2, '0')} ${new Date(dayRow.dateStr).toLocaleString('default', { weekday: 'short' })}`;
                      return [
                        <tr key={dayRow.dateStr + '-m'} className={`hover:bg-blue-50/20 transition-colors ${hasData ? '' : 'opacity-30'}`}>
                          <td rowSpan={2} className={`sticky left-0 bg-white z-10 px-3 py-2 font-mono text-sm align-middle ${hasData ? 'font-semibold text-gray-800' : 'text-gray-300'}`}>
                            {dateLabel}
                          </td>
                          {HOURS.map((h) => {
                            const info = dayRow.hours[h];
                            const isRed = info?.isRed;
                            return (
                              <td key={h} className={`px-2 py-2 text-center font-mono text-sm leading-tight ${isRed ? 'bg-red-50 text-red-700 font-semibold' : hasData ? 'text-gray-400' : 'text-gray-200'}`}>
                                {info ? (info.waterLevelFt * 0.3048).toFixed(2) : '-'}
                                <span className="block text-[10px] text-gray-400 font-normal">m</span>
                              </td>
                            );
                          })}
                        </tr>,
                        <tr key={dayRow.dateStr + '-f'} className={`hover:bg-blue-50/20 transition-colors ${hasData ? '' : 'opacity-30'}`}>
                          {HOURS.map((h) => {
                            const info = dayRow.hours[h];
                            const hasGreen = info?.isGreen;
                            const hasYellow = info?.isYellow;
                            const hl = hasGreen ? 'bg-green-50 text-green-700 font-semibold' : hasYellow ? 'bg-yellow-50 text-yellow-700 font-semibold' : null;
                            return (
                              <td key={h} className={`px-2 py-2 text-center font-mono text-sm leading-tight ${hl || (hasData ? 'text-gray-400' : 'text-gray-200')}`}>
                                {info ? Number(info.waterLevelFt).toFixed(1) : '-'}
                                <span className="block text-[10px] text-gray-400 font-normal">ft</span>
                              </td>
                            );
                          })}
                        </tr>,
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <p className="text-sm font-medium">No navigation data for this month</p>
              <p className="text-xs text-gray-300 mt-1">Use Bulk Import or add data manually</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
