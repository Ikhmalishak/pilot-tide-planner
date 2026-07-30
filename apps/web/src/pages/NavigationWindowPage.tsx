import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navigationApi } from '../api/navigationApi';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthStartEnd(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  return { from, to };
}

function Cell({ statuses }: { statuses: { isRed: boolean; isYellow: boolean; isGreen: boolean } | null }) {
  if (!statuses) return <td className="p-0.5"><div className="h-full min-h-[28px] rounded border border-gray-100 bg-gray-50/50" /></td>;
  const dots: { color: string; bg: string }[] = [];
  if (statuses.isRed) dots.push({ color: 'RED', bg: 'bg-red-500' });
  if (statuses.isYellow) dots.push({ color: 'YELLOW', bg: 'bg-yellow-400' });
  if (statuses.isGreen) dots.push({ color: 'GREEN', bg: 'bg-green-500' });
  const all = dots.map(d => d.bg).join(' ');
  return (
    <td className="p-0.5">
      <div className={`h-full min-h-[28px] rounded border flex items-center justify-center gap-0.5 ${statuses.isRed ? 'border-red-200' : statuses.isYellow ? 'border-yellow-200' : statuses.isGreen ? 'border-green-200' : 'border-gray-100'}`}>
        {dots.length > 0 ? (
          <div className="flex gap-0.5">
            {dots.map((d, i) => <span key={i} className={`w-2 h-2 rounded-full ${d.bg}`} title={d.color} />)}
          </div>
        ) : (
          <span className="text-gray-300 text-[10px]">-</span>
        )}
      </div>
    </td>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function NavigationWindowPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { from, to } = monthStartEnd(year, month);
  const numDays = daysInMonth(year, month);

  const { data, isLoading } = useQuery({
    queryKey: ['navigation', 'month', year, month],
    queryFn: () => navigationApi.getHistory({ from, to, limit: 31 }),
  });

  const windows = (data as any)?.data || [];

  const matrix = useMemo(() => {
    const map: Record<string, Record<number, { isRed: boolean; isYellow: boolean; isGreen: boolean }>> = {};
    for (const w of windows) {
      const dateStr = w.navigationDate?.slice(0, 10);
      if (!dateStr) continue;
      const items = w.items || [];
      const hourMap: Record<number, { isRed: boolean; isYellow: boolean; isGreen: boolean }> = {};
      for (const item of items) {
        const h = new Date(item.hour).getUTCHours();
        hourMap[h] = { isRed: item.isRed, isYellow: item.isYellow, isGreen: item.isGreen };
      }
      map[dateStr] = hourMap;
    }
    return map;
  }, [windows]);

  const days = Array.from({ length: numDays }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayData: { day: number; dateStr: string; hours: Record<number, { isRed: boolean; isYellow: boolean; isGreen: boolean }> } = {
      day: d,
      dateStr,
      hours: matrix[dateStr] || {},
    };
    return dayData;
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Navigation Window</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">&larr;</button>
          <span className="font-semibold text-gray-800 min-w-[140px] text-center">
            {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">&rarr;</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="flex gap-4 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> RED</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> YELLOW</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> GREEN</span>
          </div>

          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-20 px-2 py-2.5 font-semibold text-gray-600 text-[10px] uppercase tracking-wider text-left min-w-[70px]">Date</th>
                    {HOURS.map((h) => (
                      <th key={h} className={`px-1 py-2.5 font-mono font-semibold text-center text-[10px] w-[34px] ${h % 3 === 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                        {String(h).padStart(2, '0')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((dayRow) => {
                    const hasData = Object.keys(dayRow.hours).length > 0;
                    return (
                      <tr key={dayRow.dateStr} className={`border-t border-gray-100 hover:bg-gray-50/30 transition-colors ${!hasData ? 'opacity-40' : ''}`}>
                        <td className={`sticky left-0 bg-white z-10 px-2 py-1 font-mono text-sm whitespace-nowrap ${hasData ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
                          {String(dayRow.day).padStart(2, '0')} {new Date(dayRow.dateStr).toLocaleString('default', { weekday: 'short' })}
                        </td>
                        {HOURS.map((h) => (
                          <Cell key={h} statuses={dayRow.hours[h] || null} />
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {days.every(d => Object.keys(d.hours).length === 0) && (
            <p className="text-center text-gray-400 text-sm py-12 italic">No navigation windows for this month</p>
          )}
        </>
      )}
    </div>
  );
}
