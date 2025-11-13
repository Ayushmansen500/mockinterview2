import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceDashboard } from './AttendanceDashboard';
import { Calendar } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  created_at: string;
}

export function AttendanceBatchSelector() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setBatches(data);
      setSelectedBatch(data[0]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Loading batches...</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No Batches Found
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Create a batch in the Zoom Activeness Board tab first to start tracking attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Select Batch
        </label>
        <select
          value={selectedBatch?.id || ''}
          onChange={(e) => {
            const batch = batches.find(b => b.id === e.target.value);
            setSelectedBatch(batch || null);
          }}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBatch && (
        <AttendanceDashboard
          batchId={selectedBatch.id}
          batchName={selectedBatch.name}
        />
      )}
    </div>
  );
}
