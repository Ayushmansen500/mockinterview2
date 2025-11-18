import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, AlertCircle, CheckCircle, Loader, Copy, Check } from 'lucide-react';

interface SessionRecord {
  id: string;
  session_name: string;
  session_code: string;
  batch_name: string | null;
  created_at: string;
}

export function AttendanceBatchSelector() {
  const { admin } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [batchName, setBatchName] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [admin?.id]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading sessions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      if (!sessionName.trim()) {
        throw new Error('Session name is required');
      }
      if (!sessionCode.trim()) {
        throw new Error('Session code is required');
      }

      const { error: insertError } = await supabase
        .from('attendance_sessions')
        .insert({
          session_name: sessionName.trim(),
          session_code: sessionCode.trim(),
          batch_name: batchName.trim() || null,
          admin_id: admin?.id,
        });

      if (insertError) throw insertError;

      setFormSuccess(`Session created! Code
