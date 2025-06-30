import { useState, useEffect } from 'react';
import api from '../services/api';

export interface MemoryEntry {
  id: string | number;
  content: string;
  type: string;
  nudgePreference?: string;
  snoozedUntil?: string | Date;
  sender?: 'user' | 'assistant';
  time?: string;
  isDone?: boolean;
  isArchived?: boolean;
}

export function useMemoryEntries() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/memory');
      setEntries(res.data);
    } catch (err) {
      setError('Failed to load memory entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const addEntry = async (entry: Omit<MemoryEntry, 'id'>) => {
    setLoading(true);
    try {
      await api.post('/api/memory', entry);
      await fetchEntries();
    } catch (err) {
      setError('Failed to add memory entry');
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (id: string | number, updates: Partial<MemoryEntry>) => {
    setLoading(true);
    try {
      await api.patch(`/api/memory/${id}`, updates);
      await fetchEntries();
    } catch (err) {
      setError('Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string | number) => {
    setLoading(true);
    try {
      await api.delete(`/api/memory/${id}`);
      await fetchEntries();
    } catch (err) {
      setError('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  return {
    entries,
    loading,
    error,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    setError,
    setEntries,
  };
} 