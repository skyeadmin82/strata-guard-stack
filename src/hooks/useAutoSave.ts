import { useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export interface AutoSaveConfig {
  key: string;
  data: any;
  saveInterval?: number; // milliseconds
  onSave?: (data: any) => Promise<void>;
  onRestore?: (data: any) => void;
  enabled?: boolean;
}

export const useAutoSave = ({
  key,
  data,
  saveInterval = 30000, // 30 seconds default
  onSave,
  onRestore,
  enabled = true
}: AutoSaveConfig) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Save to localStorage
  const saveToLocal = useCallback((dataToSave: any) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0'
      });
      localStorage.setItem(`autosave_${key}`, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }, [key]);

  // Restore from localStorage
  const restoreFromLocal = useCallback(() => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to restore from localStorage:', error);
    }
    return null;
  }, [key]);

  // Save data with debouncing
  const saveData = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    isSavingRef.current = true;
    
    try {
      // Save to localStorage first (immediate backup)
      saveToLocal(data);

      // Save to external storage if callback provided
      if (onSave) {
        await onSave(data);
      }

      lastSavedRef.current = currentData;
      
      // Silent success - only show errors
    } catch (error) {
      toast({
        title: "Auto-save Failed",
        description: "Your changes are backed up locally but couldn't sync to the server",
        variant: "destructive",
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled, onSave, saveToLocal]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveData();
    }, saveInterval);
  }, [saveData, saveInterval]);

  // Manual save
  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveData();
  }, [saveData]);

  // Restore data on mount
  useEffect(() => {
    const restored = restoreFromLocal();
    if (restored && onRestore) {
      onRestore(restored);
      toast({
        title: "Data Restored",
        description: "Your previous work has been recovered",
      });
    }
  }, [restoreFromLocal, onRestore]);

  // Schedule auto-save when data changes
  useEffect(() => {
    if (enabled) {
      scheduleAutoSave();
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, scheduleAutoSave]);

  // Clear auto-save data
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    lastSavedRef.current = '';
  }, [key]);

  return {
    forceSave,
    clearAutoSave,
    hasUnsavedChanges: JSON.stringify(data) !== lastSavedRef.current,
    isSaving: isSavingRef.current
  };
};