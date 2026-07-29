import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { navigationApi } from '../api/navigationApi';
import { formatTime, todayLocal } from '../utils/format';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayLocal());

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', selectedDate],
    queryFn: () => dashboardApi.get(selectedDate),
  });

  const [genFeedback, setGenFeedback] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => navigationApi.generate(selectedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedDate] });
      setGenFeedback('Navigation window generated successfully');
      setTimeout(() => setGenFeedback(null), 4000);
    },
    onError: (err: Error) => {
      setGenFeedback(`Failed: ${err.message}`);
      setTimeout(() => setGenFeedback(null), 8000);
    },
  });

  const handleGenerate = () => {
    setGenFeedback(null);
    generateMutation.mutate();
  };

  const itemsMap = useMemo(() => {
    const map: Record<number, { waterLevelFt?: number; status: string[] }> = {};
    if (dashboard?.navigationWindow?.items) {
      for (const item of dashboard.navigationWindow.items) {
        const h = new Date(item.hour).getUTCHours();
        map[h] = { waterLevelFt: item.waterLevelFt, status: item.status };
      }
    }
    return map;
  }, [dashboard]);

  const tideStatus = useMemo(() => {
    if (!dashboard?.navigationWindow) return 'empty';
    return dashboard.navigationWindow.generated ? 'generated' : 'pending';
  }, [dashboard]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow w-full sm:w-auto"
          />
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {genFeedback && (
        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${genFeedback.startsWith('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {genFeedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Tide Indicators
          </h3>
          {dashboard?.tideIndicators?.length ? (
            <div className="space-y-3">
              {dashboard.tideIndicators.map((indicator, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                      indicator.type === 'HIGH' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {indicator.type === 'HIGH' ? '\u2191' : '\u2193'}
                    </span>
                    <span className="font-semibold text-gray-900">{indicator.type}</span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-sm text-gray-500">{formatTime(indicator.time)}</p>
                    <p className="text-lg font-bold text-gray-900">{indicator.level} <span className="text-sm font-normal text-gray-500">ft</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No tide indicators for this date</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h12v2H4v-2zm0 4h12v2H4v-2z" clipRule="evenodd" />
            </svg>
            Navigation Window
          </h3>

          {tideStatus === 'empty' ? (
            <p className="text-sm text-gray-400 text-center py-8">No navigation window generated. Click <span className="font-medium text-gray-500">Generate</span>.</p>
          ) : (
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-20 px-2 py-2 font-semibold text-gray-600 text-[10px] uppercase tracking-wider text-left min-w-[60px]">
                      Hour
                    </th>
                    {HOURS.map((h) => (
                      <th
                        key={h}
                        className={`px-1.5 py-2 font-mono font-semibold text-center text-[10px] w-[44px] ${
                          h % 3 === 0 ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {String(h).padStart(2, '0')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="sticky left-0 bg-white z-10 px-2 py-2 font-semibold text-gray-600 text-[10px] uppercase tracking-wider">
                      Metre (m)
                    </td>
                    {HOURS.map((h) => {
                      const info = itemsMap[h];
                      const hasRed = info?.status?.includes('RED');
                      return (
                        <td
                          key={h}
                          className={`px-1.5 py-2 text-center font-mono text-[11px] ${
                            hasRed ? 'bg-red-100 text-red-800' : 'text-gray-400'
                          }`}
                        >
                          {info?.waterLevelFt != null
                            ? (info.waterLevelFt * 0.3048).toFixed(2)
                            : '-'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="sticky left-0 bg-white z-10 px-2 py-2 font-semibold text-gray-600 text-[10px] uppercase tracking-wider">
                      Tide (ft)
                    </td>
                    {HOURS.map((h) => {
                      const info = itemsMap[h];
                      const hasGreen = info?.status?.includes('GREEN');
                      const hasYellow = info?.status?.includes('YELLOW');
                      const hl = hasGreen ? 'bg-green-100 text-green-800' : hasYellow ? 'bg-yellow-100 text-yellow-800' : null;
                      return (
                        <td
                          key={h}
                          className={`px-1.5 py-2 text-center font-mono text-[11px] ${
                            hl || 'text-gray-400'
                          }`}
                        >
                          {info?.waterLevelFt != null
                            ? Number(info.waterLevelFt).toFixed(1)
                            : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
