import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

export interface TemplateField {
  id: number;
  label: string;
  sortOrder: number;
  fieldType?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  fields: string[];
  fieldsDetail?: TemplateField[];
  custom?: boolean;
}

export type TemplateSelectionKind = 'preset' | 'custom';

export interface TemplateSelection {
  kind: TemplateSelectionKind;
  id: string;
}

interface NotesTemplateContextType {
  templateMode: 'default' | 'template';
  selectedTemplate: TemplateSelection | null;
  customTemplates: Template[];
  presetTemplates: Template[];
  setTemplateMode: (mode: 'default' | 'template') => void;
  setSelectedTemplate: (selection: TemplateSelection | null) => void;
  setCustomTemplates: Dispatch<SetStateAction<Template[]>>;
  refreshTemplates: () => Promise<void>;
  getActiveTemplate: () => Template | null;
}

const NotesTemplateContext = createContext<NotesTemplateContextType | undefined>(undefined);

export function NotesTemplateProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [templateMode, setTemplateMode] = useState<'default' | 'template'>('default');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSelection | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [presetTemplates, setPresetTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (!user?.practiceId) return;

    const selectedTemplateKind = localStorage.getItem('selectedTemplateKind');
    const selectedTemplateId = localStorage.getItem('selectedTemplateId');

    if ((selectedTemplateKind === 'preset' || selectedTemplateKind === 'custom') && selectedTemplateId) {
      setSelectedTemplate({ kind: selectedTemplateKind, id: selectedTemplateId });
      return;
    }

    setSelectedTemplate(null);
  }, [user?.practiceId]);

  useEffect(() => {
    if (!user?.practiceId) return;

    if (!selectedTemplate) {
      localStorage.removeItem('selectedTemplateKind');
      localStorage.removeItem('selectedTemplateId');
      return;
    }

    localStorage.setItem('selectedTemplateKind', selectedTemplate.kind);
    localStorage.setItem('selectedTemplateId', selectedTemplate.id);
  }, [selectedTemplate, user?.practiceId]);

  const refreshTemplates = useCallback(async () => {
    if (!user?.practiceId) return;

    const [presets, custom] = await Promise.all([apiClient.getTemplatePresets(), apiClient.getCustomTemplates(user.practiceId)]);
    setPresetTemplates(presets);
    setCustomTemplates(custom);
  }, [user?.practiceId]);

  useEffect(() => {
    if (loading || !user?.practiceId) return;

    refreshTemplates().catch(() => undefined);
  }, [loading, refreshTemplates, user?.practiceId]);

  const getActiveTemplate = (): Template | null => {
    if (templateMode === 'default' || !selectedTemplate) return null;

    if (selectedTemplate.kind === 'preset') {
      return presetTemplates.find(t => t.id === selectedTemplate.id) ?? null;
    }

    return customTemplates.find(t => t.id === selectedTemplate.id) ?? null;
  };

  return (
    <NotesTemplateContext.Provider value={{ templateMode, selectedTemplate, customTemplates, presetTemplates, setTemplateMode, setSelectedTemplate, setCustomTemplates, refreshTemplates, getActiveTemplate }}>
      {children}
    </NotesTemplateContext.Provider>
  );
}

export function useNotesTemplate() {
  const context = useContext(NotesTemplateContext);
  if (!context) throw new Error('useNotesTemplate must be used within NotesTemplateProvider');
  return context;
}
