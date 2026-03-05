import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

export interface Template {
  id: string;
  name: string;
  fields: string[];
  custom?: boolean;
}

interface NotesTemplateContextType {
  templateMode: 'default' | 'template';
  selectedTemplateId: string;
  customTemplates: Template[];
  presetTemplates: Template[];
  setTemplateMode: (mode: 'default' | 'template') => void;
  setSelectedTemplateId: (id: string) => void;
  setCustomTemplates: Dispatch<SetStateAction<Template[]>>;
  refreshTemplates: () => Promise<void>;
  getActiveTemplate: () => Template | null;
}

const NotesTemplateContext = createContext<NotesTemplateContextType | undefined>(undefined);

export function NotesTemplateProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [templateMode, setTemplateMode] = useState<'default' | 'template'>('default');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [presetTemplates, setPresetTemplates] = useState<Template[]>([]);

  const refreshTemplates = useCallback(async () => {
    if (!user?.practiceId) return;

    const [presets, custom] = await Promise.all([apiClient.getTemplatePresets(), apiClient.getCustomTemplates()]);
    setPresetTemplates(presets);
    setCustomTemplates(custom);
  }, [user?.practiceId]);

  useEffect(() => {
    if (loading || !user?.practiceId) return;

    refreshTemplates().catch(() => undefined);
  }, [loading, refreshTemplates, user?.practiceId]);

  const getActiveTemplate = (): Template | null => {
    if (templateMode === 'default' || !selectedTemplateId) return null;
    const preset = presetTemplates.find(t => t.id === selectedTemplateId);
    if (preset) return preset;
    return customTemplates.find(t => t.id === selectedTemplateId) ?? null;
  };

  return (
    <NotesTemplateContext.Provider value={{ templateMode, selectedTemplateId, customTemplates, presetTemplates, setTemplateMode, setSelectedTemplateId, setCustomTemplates, refreshTemplates, getActiveTemplate }}>
      {children}
    </NotesTemplateContext.Provider>
  );
}

export function useNotesTemplate() {
  const context = useContext(NotesTemplateContext);
  if (!context) throw new Error('useNotesTemplate must be used within NotesTemplateProvider');
  return context;
}
