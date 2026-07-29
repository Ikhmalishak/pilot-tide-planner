import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navigationApi } from '../api/navigationApi';
import { formatTime, todayLocal } from '../utils/format';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RED: 'bg-red-100 text-red-700 ring-1 ring-red-300/50',
    YELLOW: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300/50',
    GREEN: 'bg-green-100 text-green-700 ring-1 ring-green-300/50',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      <span className="text-[10px]">{'\u25CF'}</span>
      {status}
    </span>
  );
}

export default function NavigationWindowPage() {
  const [date, setDate] = useState(todayLocal());
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  const { data: byDate, isLoading: loadingByDate } = useQuery({
    queryKey: ['navigation', 'date', date],
    queryFn: () => navigationApi.getByDate(date),
    enabled: !!date,
    retry: false,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['navigation', 'history', pagination],
    queryFn: () => navigationApi.getHistory(pagination),
  });

  const totalPages = Math.ceil((history as any)?.total / pagination.limit) || 1;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Navigation History</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow w-full sm:w-auto"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-500">{'\u{1F4C5}'}</span>
            View by Date: <span className="font-mono font-normal text-gray-500">{date}</span>
          </h3>
          {loadingByDate ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            </div>
          ) : byDate ? (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden space-y-2 max-h-[55vh] overflow-y-auto rounded-lg border border-gray-100 p-2">
                {(byDate as any)?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-sm text-gray-700">{formatTime(item.hour)}</span>
                      <span className="font-mono text-sm font-medium text-gray-800">{Number(item.waterLevelFt).toFixed(2)} ft</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {item.isRed && <StatusBadge status="RED" />}
                      {item.isYellow && <StatusBadge status="YELLOW" />}
                      {item.isGreen && <StatusBadge status="GREEN" />}
                      {!item.isRed && !item.isYellow && !item.isGreen && <span className="text-gray-300 italic text-xs">-</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block max-h-[55vh] overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Hour</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Level</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(byDate as any)?.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-gray-700">{formatTime(item.hour)}</td>
                        <td className="px-4 py-2.5 font-mono font-medium text-gray-800">{Number(item.waterLevelFt).toFixed(2)} ft</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5 flex-wrap">
                            {item.isRed && <StatusBadge status="RED" />}
                            {item.isYellow && <StatusBadge status="YELLOW" />}
                            {item.isGreen && <StatusBadge status="GREEN" />}
                            {!item.isRed && !item.isYellow && !item.isGreen && <span className="text-gray-300 italic">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No navigation window for this date</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-500">{'\u2630'}</span>
            History
          </h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden space-y-2 max-h-[45vh] overflow-y-auto rounded-lg border border-gray-100 p-2">
                {(history as any)?.data?.map((w: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-sm text-gray-700">{w.navigationDate?.slice(0, 10)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        w.status === 'GENERATED' ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'bg-red-50 text-red-600 ring-1 ring-red-200'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Generated: {w.generatedAt ? formatTime(w.generatedAt) : '-'}</p>
                  </div>
                ))}
                {(!history || (history as any).data?.length === 0) && (
                  <p className="py-8 text-center text-gray-400 italic text-sm">No history</p>
                )}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block max-h-[45vh] overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history as any)?.data?.map((w: any, idx: number) => (
                      <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-gray-700">{w.navigationDate?.slice(0, 10)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            w.status === 'GENERATED' ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'bg-red-50 text-red-600 ring-1 ring-red-200'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-500">{w.generatedAt ? formatTime(w.generatedAt) : ''}</td>
                      </tr>
                    ))}
                    {(!history || (history as any).data?.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-400 italic">No history</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {(history as any)?.total > pagination.limit && (
                <div className="flex justify-center items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 font-medium">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
