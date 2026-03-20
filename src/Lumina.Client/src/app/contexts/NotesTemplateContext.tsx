import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
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

const getStoredTemplateMode = (): 'default' | 'template' =>
  (localStorage.getItem('templateMode') as 'default' | 'template') || 'default';

const getStoredSelectedTemplate = (): TemplateSelection | null => {
  const selectedTemplateKind = localStorage.getItem('selectedTemplateKind');
  const selectedTemplateId = localStorage.getItem('selectedTemplateId');

  if ((selectedTemplateKind === 'preset' || selectedTemplateKind === 'custom') && selectedTemplateId) {
    return { kind: selectedTemplateKind, id: selectedTemplateId };
  }

  return null;
};

const serializeSettings = (
  templateMode: 'default' | 'template',
  selectedTemplate: TemplateSelection | null,
) =>
  JSON.stringify({
    templateMode,
    selectedTemplateKind: selectedTemplate?.kind ?? null,
    selectedTemplateId: selectedTemplate?.id ?? null,
  });

export function NotesTemplateProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [templateMode, setTemplateMode] = useState<'default' | 'template'>(getStoredTemplateMode);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSelection | null>(getStoredSelectedTemplate);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [presetTemplates, setPresetTemplates] = useState<Template[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const lastPersistedSettingsRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem('templateMode', templateMode);

    if (selectedTemplate) {
      localStorage.setItem('selectedTemplateKind', selectedTemplate.kind);
      localStorage.setItem('selectedTemplateId', selectedTemplate.id);
    } else {
      localStorage.removeItem('selectedTemplateKind');
      localStorage.removeItem('selectedTemplateId');
    }
  }, [selectedTemplate, templateMode]);

  const refreshTemplates = useCallback(async () => {
    if (!user?.practiceId) return;

    const [presets, custom] = await Promise.all([apiClient.getTemplatePresets(), apiClient.getCustomTemplates(user.practiceId)]);
    setPresetTemplates(presets);
    setCustomTemplates(custom);
  }, [user?.practiceId]);

  useEffect(() => {
    if (loading || !user?.practiceId) {
      setIsHydrated(false);
      return;
    }

    let isActive = true;

    void Promise.all([
      apiClient.getTemplatePresets(),
      apiClient.getCustomTemplates(user.practiceId),
      apiClient.getNotesTemplateSettings(),
    ])
      .then(([presets, custom, settings]) => {
        if (!isActive) {
          return;
        }

        setPresetTemplates(presets);
        setCustomTemplates(custom);

        const fallbackTemplateMode = getStoredTemplateMode();
        const fallbackSelectedTemplate = getStoredSelectedTemplate();
        const serverSelectedTemplate =
          settings.selectedTemplateKind && settings.selectedTemplateId
            ? {
              kind: settings.selectedTemplateKind,
              id: settings.selectedTemplateId,
            } satisfies TemplateSelection
            : null;

        const nextTemplateMode =
          settings.templateMode === 'template' || settings.templateMode === 'default'
            ? settings.templateMode
            : fallbackTemplateMode;
        const nextSelectedTemplate =
          serverSelectedTemplate ?? fallbackSelectedTemplate;

        setTemplateMode(nextTemplateMode);
        setSelectedTemplate(nextSelectedTemplate);
        lastPersistedSettingsRef.current = serializeSettings(
          settings.templateMode,
          serverSelectedTemplate,
        );
        setIsHydrated(true);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        refreshTemplates().catch(() => undefined);
        setTemplateMode(getStoredTemplateMode());
        setSelectedTemplate(getStoredSelectedTemplate());
        lastPersistedSettingsRef.current = serializeSettings(
          getStoredTemplateMode(),
          getStoredSelectedTemplate(),
        );
        setIsHydrated(true);
      });

    return () => {
      isActive = false;
    };
  }, [loading, refreshTemplates, user?.practiceId]);

  useEffect(() => {
    if (!user?.practiceId || !isHydrated) {
      return;
    }

    const serialized = serializeSettings(templateMode, selectedTemplate);
    if (serialized === lastPersistedSettingsRef.current) {
      return;
    }

    let isActive = true;

    void apiClient
      .updateNotesTemplateSettings({
        templateMode,
        selectedTemplateKind: selectedTemplate?.kind,
        selectedTemplateId: selectedTemplate?.id,
      })
      .then((settings) => {
        if (!isActive) {
          return;
        }

        const persistedSelection =
          settings.selectedTemplateKind && settings.selectedTemplateId
            ? {
              kind: settings.selectedTemplateKind,
              id: settings.selectedTemplateId,
            } satisfies TemplateSelection
            : null;

        lastPersistedSettingsRef.current = serializeSettings(
          settings.templateMode,
          persistedSelection,
        );

        if (
          settings.templateMode !== templateMode ||
          serializeSettings(settings.templateMode, persistedSelection) !== serialized
        ) {
          setTemplateMode(settings.templateMode);
          setSelectedTemplate(persistedSelection);
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [isHydrated, selectedTemplate, templateMode, user?.practiceId]);

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
