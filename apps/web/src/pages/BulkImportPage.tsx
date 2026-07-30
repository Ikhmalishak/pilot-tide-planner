import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkApi } from '../api/tideApi';
import { todayLocal } from '../utils/format';

function StatusBadge({ label, type }: { label: string; type: 'success' | 'error' | 'info' }) {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${styles[type]}`}>
      {label}
    </span>
  );
}

export default function BulkImportPage() {
  const queryClient = useQueryClient();
  const tideRef = useRef<HTMLInputElement>(null);
  const hourlyRef = useRef<HTMLInputElement>(null);

  const [tideFile, setTideFile] = useState<File | null>(null);
  const [hourlyFile, setHourlyFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => bulkApi.upload(tideFile!, hourlyFile!),
    onSuccess: (data: any) => {
      setResult(data);
      const totalOk = data.succeeded?.length || 0;
      const totalFail = data.failed?.length || 0;
      setMsg({
        type: totalFail === 0 ? 'success' : 'error',
        text: `Processed ${data.totalDays} days: ${totalOk} succeeded, ${totalFail} failed`,
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
    },
    onError: (err: Error) => {
      setMsg({ type: 'error', text: `Import failed: ${err.message}` });
    },
  });

  const canUpload = tideFile && hourlyFile && !mutation.isPending;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Bulk Import (15 Days)</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <p className="text-sm text-gray-500 mb-6">
          Upload the two Excel files received every 15 days. The system will parse both files,
          save the data, and generate navigation windows for all days automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tide Indicators</label>
            <div
              onClick={() => tideRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                tideFile ? 'border-green-300 bg-green-50/30' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {tideFile ? (
                <div>
                  <p className="text-sm font-medium text-green-700">{'\u2713'} {tideFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(tideFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Click to select</p>
                  <p className="text-xs text-gray-400 mt-1">ttables*-*_mthly.xls</p>
                </div>
              )}
            </div>
            <input ref={tideRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={(e) => setTideFile(e.target.files?.[0] || null)} />
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Tide Levels</label>
            <div
              onClick={() => hourlyRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                hourlyFile ? 'border-green-300 bg-green-50/30' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {hourlyFile ? (
                <div>
                  <p className="text-sm font-medium text-green-700">{'\u2713'} {hourlyFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(hourlyFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Click to select</p>
                  <p className="text-xs text-gray-400 mt-1">ttables*-*_hourly.xlsx</p>
                </div>
              )}
            </div>
            <input ref={hourlyRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={(e) => setHourlyFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        {msg && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium border ${
            msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canUpload}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {mutation.isPending ? 'Importing...' : 'Import & Generate'}
          </button>
          {(tideFile || hourlyFile) && (
            <button
              onClick={() => { setTideFile(null); setHourlyFile(null); setResult(null); setMsg(null); }}
              className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Results</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-gray-900">{result.totalDays}</p>
              <p className="text-xs text-gray-500 font-medium">Total Days</p>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-green-700">{result.succeeded?.length || 0}</p>
              <p className="text-xs text-green-600 font-medium">Succeeded</p>
            </div>
            <div className="bg-red-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-red-700">{result.failed?.length || 0}</p>
              <p className="text-xs text-red-600 font-medium">Failed</p>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-blue-700">{result.totalInserted?.indicators || 0}</p>
              <p className="text-xs text-blue-600 font-medium">Tide Indicators</p>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-blue-700">{result.totalInserted?.levels || 0}</p>
              <p className="text-xs text-blue-600 font-medium">Hourly Levels</p>
            </div>
          </div>

          {result.parseErrors?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Parse Warnings ({result.parseErrors.length})</h4>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">Source</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">Row</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.parseErrors.map((e: any, i: number) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-3 py-1.5 text-gray-500">{e.source}</td>
                        <td className="px-3 py-1.5 text-gray-500">{e.row}</td>
                        <td className="px-3 py-1.5 text-gray-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Indicators</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Levels</th>
                </tr>
              </thead>
              <tbody>
                {result.succeeded?.map((s: any) => (
                  <tr key={s.date} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-mono text-gray-700">{s.date}</td>
                    <td className="px-4 py-2"><StatusBadge label="OK" type="success" /></td>
                    <td className="px-4 py-2 text-gray-600">{s.insertedIndicators}</td>
                    <td className="px-4 py-2 text-gray-600">{s.insertedLevels}</td>
                  </tr>
                ))}
                {result.failed?.map((f: any) => (
                  <tr key={f.date} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-mono text-gray-700">{f.date}</td>
                    <td className="px-4 py-2"><StatusBadge label="FAILED" type="error" /></td>
                    <td className="px-4 py-2 text-red-600 text-xs" colSpan={2}>{f.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
