import { createContext, useContext, useState, ReactNode } from 'react';

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
  setTemplateMode: (mode: 'default' | 'template') => void;
  setSelectedTemplateId: (id: string) => void;
  setCustomTemplates: (templates: Template[]) => void;
  getActiveTemplate: () => Template | null;
}

const NotesTemplateContext = createContext<NotesTemplateContextType | undefined>(undefined);

// Predefined template presets
export const templatePresets: Template[] = [
  {
    id: 'coach',
    name: 'Professional Coach',
    fields: ['Arrival State', 'Intention', 'Process', 'Closing State / Takeaway', 'Commitment'],
  },
  {
    id: 'therapist',
    name: 'Speech/Physical Therapist',
    fields: ['Exercises Completed', 'Progress Assessment', 'Challenges Observed', 'Homework Assigned', 'Parent/Caregiver Notes'],
  },
  {
    id: 'nutritionist',
    name: 'Nutritionist/Dietitian',
    fields: ['Meals Reviewed', 'Weight & Measurements', 'Supplements Discussed', 'Dietary Changes', 'Next Steps'],
  },
  {
    id: 'music',
    name: 'Music Teacher',
    fields: ['Pieces Practiced', 'Technique Focus', 'Theory Covered', 'Practice Assignment', 'Performance Notes'],
  },
  {
    id: 'swim',
    name: 'Swim Instructor',
    fields: ['Strokes Practiced', 'Breathing Exercises', 'Skills Mastered', 'Areas for Improvement', 'Goals for Next Session'],
  },
  {
    id: 'tutor',
    name: 'Academic Tutor',
    fields: ['Topics Covered', 'Comprehension Level', 'Homework Review', 'Study Strategies', 'Upcoming Tests/Projects'],
  },
];

export function NotesTemplateProvider({ children }: { children: ReactNode }) {
  const [templateMode, setTemplateMode] = useState<'default' | 'template'>('default');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

  const getActiveTemplate = (): Template | null => {
    if (templateMode === 'default' || !selectedTemplateId) {
      return null;
    }

    // Check preset templates first
    const preset = templatePresets.find(t => t.id === selectedTemplateId);
    if (preset) return preset;

    // Check custom templates
    const custom = customTemplates.find(t => t.id === selectedTemplateId);
    return custom || null;
  };

  return (
    <NotesTemplateContext.Provider
      value={{
        templateMode,
        selectedTemplateId,
        customTemplates,
        setTemplateMode,
        setSelectedTemplateId,
        setCustomTemplates,
        getActiveTemplate,
      }}
    >
      {children}
    </NotesTemplateContext.Provider>
  );
}

export function useNotesTemplate() {
  const context = useContext(NotesTemplateContext);
  if (!context) {
    throw new Error('useNotesTemplate must be used within NotesTemplateProvider');
  }
  return context;
}