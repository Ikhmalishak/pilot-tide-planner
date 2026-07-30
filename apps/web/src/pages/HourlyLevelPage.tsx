import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../api/tideApi';
import { todayLocal } from '../utils/format';

export default function HourlyLevelPage() {
  const date = todayLocal();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Hourly Tide Levels</h2>
        <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-mono text-center sm:text-left">{date}</span>
      </div>

      <ImportSection />
    </div>
  );
}

function ImportSection() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importYear, setImportYear] = useState(String(new Date().getFullYear()));
  const [importMonth, setImportMonth] = useState(String(new Date().getMonth() + 1));
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setMsg(null);
    try {
      const result = await uploadApi.hourlyLevels(
        file,
        parseInt(importYear, 10),
        parseInt(importMonth, 10)
      );
      const genOk = result.navigationGenerated?.filter((r: any) => r.success).length || 0;
      const genFail = result.navigationGenerated?.filter((r: any) => !r.success) || [];
      let text = `Imported ${result.inserted} levels. Navigation generated for ${genOk} dates.`;
      if (genFail.length > 0) {
        text += ` Failed: ${genFail.map((f: any) => `${f.date} (${f.error})`).join(', ')}`;
      }
      setMsg({ type: genFail.length > 0 && genOk === 0 ? 'error' : 'success', text });
      queryClient.invalidateQueries({ queryKey: ['hourly-levels'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFile(null);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Import Monthly Hourly File</h3>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Year</label>
          <input
            type="number"
            value={importYear}
            onChange={(e) => setImportYear(e.target.value)}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={importMonth}
            onChange={(e) => setImportMonth(e.target.value)}
            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">File</label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              file ? 'border-green-300 bg-green-50/30' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {file ? (
              <p className="text-sm font-medium text-green-700">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Select ttables*_hourly.xlsx</p>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button
          onClick={handleImport}
          disabled={!file || isUploading}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isUploading ? 'Importing...' : 'Import'}
        </button>
      </div>
      {msg && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-medium border ${
          msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}