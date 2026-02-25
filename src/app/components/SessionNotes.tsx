import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, TextField, Button, IconButton, Stack, Typography, Chip, Select, MenuItem, FormControl } from '@mui/material';
import { Add, Edit, Delete as DeleteIcon } from '@mui/icons-material';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import NotesIcon from '@mui/icons-material/Notes';
import { format } from 'date-fns';
import { colors } from '../styles/colors';
import { useNotesTemplate } from '../contexts/NotesTemplateContext';

export interface SessionNote {
  id: string;
  content: string; // For free-form notes, this is the full text. For template notes, this is JSON stringified object
  timestamp: string;
  isTemplate?: boolean; // Flag to indicate if this note uses a template
  templateId?: string; // Which template was used
  templateName?: string; // Store template name for display
}

interface SessionNotesProps {
  notes: SessionNote[];
  onNotesChange: (notes: SessionNote[]) => void;
}

export function SessionNotes({ 
  notes, 
  onNotesChange,
}: SessionNotesProps) {
  const navigate = useNavigate();
  const { templateMode, getActiveTemplate } = useNotesTemplate();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'free' | 'template'>('free');
  
  // For free-form notes
  const [newNoteContent, setNewNoteContent] = useState('');
  
  // For template notes - key-value pairs for each field
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, string>>({});

  // Get the active template from settings
  const activeTemplate = getActiveTemplate();
  
  // Determine if template is available and should be default
  const hasTemplate = templateMode === 'template' && activeTemplate;
  const defaultMode = hasTemplate ? 'template' : 'free';

  // Initialize selectedMode based on default on mount
  const [initializedMode, setInitializedMode] = useState(false);
  
  if (!initializedMode) {
    setSelectedMode(defaultMode);
    setInitializedMode(true);
  }

  const handleModeChange = (value: string) => {
    if (value === 'template' && !hasTemplate) {
      // Redirect to settings notes section if template is not configured
      navigate('/settings#notes');
      return; // Don't change the mode
    } else if (value === 'free') {
      setSelectedMode('free');
    } else if (value === 'template') {
      setSelectedMode('template');
    }
  };

  const handleStartAddNote = () => {
    setIsAddingNote(true);
    setEditingNoteId(null);
    setNewNoteContent('');
    
    // When adding additional notes (not the first note), always default to free mode
    // Only use template mode as default for the very first note if configured
    if (notes.length > 0) {
      setSelectedMode('free');
    }
    
    // Initialize template fields if in template mode
    if (selectedMode === 'template' && activeTemplate) {
      const initialValues: Record<string, string> = {};
      activeTemplate.fields.forEach(field => {
        initialValues[field] = '';
      });
      setTemplateFieldValues(initialValues);
    }
  };

  const handleStartEditNote = (note: SessionNote) => {
    setEditingNoteId(note.id);
    setIsAddingNote(false);
    
    if (note.isTemplate && note.templateId) {
      // Parse template data
      try {
        const parsedData = JSON.parse(note.content);
        setTemplateFieldValues(parsedData);
      } catch (e) {
        console.error('Failed to parse template note:', e);
      }
    } else {
      setNewNoteContent(note.content);
    }
  };

  const handleSaveNote = () => {
    const isEditing = !!editingNoteId;
    const editingNote = isEditing ? notes.find(n => n.id === editingNoteId) : null;
    const effectiveMode = isEditing && editingNote 
      ? (editingNote.isTemplate ? 'template' : 'free')
      : selectedMode;
    
    if (effectiveMode === 'template' && activeTemplate) {
      // Template mode - save structured data
      const hasAnyContent = Object.values(templateFieldValues).some(val => val.trim());
      if (!hasAnyContent) return;

      const newNote: SessionNote = {
        id: editingNoteId || `note-${Date.now()}`,
        content: JSON.stringify(templateFieldValues),
        timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
        isTemplate: true,
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
      };

      if (editingNoteId) {
        const updatedNotes = notes.map(n => n.id === editingNoteId ? newNote : n);
        onNotesChange(updatedNotes);
      } else {
        onNotesChange([newNote, ...notes]);
      }
    } else {
      // Free-form mode
      if (!newNoteContent.trim()) return;

      const newNote: SessionNote = {
        id: editingNoteId || `note-${Date.now()}`,
        content: newNoteContent.trim(),
        timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
        isTemplate: false,
      };

      if (editingNoteId) {
        const updatedNotes = notes.map(n => n.id === editingNoteId ? newNote : n);
        onNotesChange(updatedNotes);
      } else {
        onNotesChange([newNote, ...notes]);
      }
    }

    handleCancelNote();
  };

  const handleCancelNote = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
    setNewNoteContent('');
    setTemplateFieldValues({});
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    onNotesChange(updatedNotes);
  };

  const handleTemplateFieldChange = (fieldName: string, value: string) => {
    setTemplateFieldValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const renderNoteContent = (note: SessionNote) => {
    if (note.isTemplate && note.templateId) {
      try {
        const data = JSON.parse(note.content);
        return (
          <Box>
            {/* Template badge */}
            {note.templateName && (
              <Chip
                icon={<ArticleOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                label={note.templateName}
                size="small"
                sx={{
                  mb: 2,
                  height: 24,
                  bgcolor: 'rgba(110, 91, 206, 0.08)',
                  color: colors.primary.main,
                  border: `1px solid rgba(110, 91, 206, 0.2)`,
                  fontWeight: 600,
                  fontSize: '11px',
                  '& .MuiChip-icon': {
                    color: colors.primary.main,
                  },
                }}
              />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {Object.entries(data).map(([field, value]) => (
                <Box 
                  key={field}
                  sx={{
                    pl: 2,
                    borderLeft: `3px solid ${colors.primary.light}`,
                  }}
                >
                  <Typography 
                    sx={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: colors.primary.main, 
                      mb: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {field}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '14px', 
                      color: colors.text.primary, 
                      lineHeight: 1.7, 
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {value as string || <span style={{ color: colors.text.secondary, fontStyle: 'italic' }}>No entry</span>}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );
      } catch (e) {
        return <Typography sx={{ color: colors.text.secondary, fontStyle: 'italic' }}>Invalid template data</Typography>;
      }
    }
    
    // Free-form note
    return (
      <Typography sx={{ color: colors.text.primary, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
        {note.content}
      </Typography>
    );
  };

  const renderNoteForm = () => {
    const isEditing = !!editingNoteId;
    
    // When editing, determine mode based on the note being edited
    const editingNote = isEditing ? notes.find(n => n.id === editingNoteId) : null;
    const effectiveMode = isEditing && editingNote 
      ? (editingNote.isTemplate ? 'template' : 'free')
      : selectedMode;

    if (effectiveMode === 'template' && activeTemplate) {
      // Template mode - render fields with beautiful design
      return (
        <Box
          sx={{
            p: 3,
            bgcolor: colors.surface.card,
            border: `2px solid ${colors.primary.light}`,
            borderRadius: '12px',
            mb: 3,
          }}
        >
          {/* Template indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, pb: 2.5, borderBottom: `1px solid ${colors.neutral.gray200}` }}>
            <ArticleOutlinedIcon sx={{ fontSize: 18, color: colors.primary.main }} />
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: colors.primary.main, letterSpacing: '0.3px' }}>
              {activeTemplate.name}
            </Typography>
            <Chip 
              label="Template" 
              size="small" 
              sx={{ 
                ml: 'auto',
                height: 22, 
                fontSize: '10px',
                fontWeight: 700,
                bgcolor: 'rgba(110, 91, 206, 0.12)',
                color: colors.primary.main,
              }} 
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
            {activeTemplate.fields.map((field, index) => (
              <Box key={field}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box 
                    sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: colors.primary.main,
                    }} 
                  />
                  <Typography 
                    sx={{ 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      color: colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {field}
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={templateFieldValues[field] || ''}
                  onChange={(e) => handleTemplateFieldChange(field, e.target.value)}
                  placeholder={`Enter ${field.toLowerCase()}...`}
                  autoFocus={index === 0}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      bgcolor: '#FFFFFF',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: colors.neutral.gray200,
                        borderWidth: '1.5px',
                      },
                      '&:hover fieldset': {
                        borderColor: colors.primary.light,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary.main,
                        borderWidth: '2px',
                      },
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
          
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={handleSaveNote}
              disabled={!Object.values(templateFieldValues).some(val => val.trim())}
              sx={{
                bgcolor: colors.primary.main,
                color: '#FFFFFF',
                fontWeight: 600,
                textTransform: 'none',
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(110, 91, 206, 0.2)',
                '&:hover': {
                  bgcolor: colors.primary.dark,
                  boxShadow: '0 4px 12px rgba(110, 91, 206, 0.3)',
                },
                '&:disabled': {
                  bgcolor: colors.neutral.gray200,
                  color: colors.text.secondary,
                  boxShadow: 'none',
                },
              }}
            >
              {isEditing ? 'Update Note' : 'Save Note'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancelNote}
              sx={{
                borderColor: colors.neutral.gray300,
                color: colors.text.secondary,
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1.25,
                borderRadius: '8px',
                '&:hover': {
                  borderColor: colors.neutral.gray400,
                  bgcolor: colors.neutral.gray50,
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      );
    }

    // Free-form mode with beautiful design
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: colors.surface.card,
          border: `2px solid ${colors.neutral.gray200}`,
          borderRadius: '12px',
          mb: 3,
        }}
      >
        {/* Free-form indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, pb: 2.5, borderBottom: `1px solid ${colors.neutral.gray200}` }}>
          <NotesIcon sx={{ fontSize: 18, color: colors.text.secondary }} />
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: colors.text.secondary, letterSpacing: '0.3px' }}>
            Free-form Notes
          </Typography>
          <Chip 
            label="Free-form" 
            size="small" 
            sx={{ 
              ml: 'auto',
              height: 22, 
              fontSize: '10px',
              fontWeight: 700,
              bgcolor: colors.neutral.gray100,
              color: colors.text.secondary,
            }} 
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={10}
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Write your notes here..."
          autoFocus
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              fontSize: '14px',
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              '& fieldset': {
                borderColor: colors.neutral.gray200,
                borderWidth: '1.5px',
              },
              '&:hover fieldset': {
                borderColor: colors.neutral.gray300,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.primary.main,
                borderWidth: '2px',
              },
            },
          }}
        />
        
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            onClick={handleSaveNote}
            disabled={!newNoteContent.trim()}
            sx={{
              bgcolor: colors.primary.main,
              color: '#FFFFFF',
              fontWeight: 600,
              textTransform: 'none',
              flex: 1,
              py: 1.25,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(110, 91, 206, 0.2)',
              '&:hover': {
                bgcolor: colors.primary.dark,
                boxShadow: '0 4px 12px rgba(110, 91, 206, 0.3)',
              },
              '&:disabled': {
                bgcolor: colors.neutral.gray200,
                color: colors.text.secondary,
                boxShadow: 'none',
              },
            }}
          >
            {isEditing ? 'Update Note' : 'Add Note'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleCancelNote}
            sx={{
              borderColor: colors.neutral.gray300,
              color: colors.text.secondary,
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              py: 1.25,
              borderRadius: '8px',
              '&:hover': {
                borderColor: colors.neutral.gray400,
                bgcolor: colors.neutral.gray50,
              },
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      {/* Section Header with Mode Selector */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DescriptionIcon sx={{ fontSize: 20, color: colors.primary.main }} />
            <Typography
              variant="subtitle2"
              sx={{ 
                color: colors.text.primary, 
                fontWeight: 700, 
                fontSize: '14px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px' 
              }}
            >
              Session Notes
            </Typography>
          </Box>

          {/* Simple 2-option dropdown */}
          <FormControl size="small">
            <Select
              value={selectedMode}
              onChange={(e) => handleModeChange(e.target.value)}
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                bgcolor: colors.surface.card,
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral.gray200,
                  borderWidth: '1.5px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary.light,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary.main,
                  borderWidth: '2px',
                },
              }}
            >
              {/* Option 1: Free Notes */}
              <MenuItem value="free" sx={{ fontSize: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotesIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Free Notes</Typography>
                </Box>
              </MenuItem>
              
              {/* Option 2: Template name OR "Choose Template from Settings" */}
              <MenuItem value="template" sx={{ fontSize: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArticleOutlinedIcon sx={{ fontSize: 16, color: hasTemplate ? colors.primary.main : colors.text.secondary }} />
                  <Typography 
                    sx={{ 
                      fontSize: '12px', 
                      fontWeight: hasTemplate ? 600 : 400,
                      fontStyle: hasTemplate ? 'normal' : 'italic',
                      color: hasTemplate ? colors.text.primary : colors.text.secondary,
                    }}
                  >
                    {hasTemplate ? `${activeTemplate.name} Template` : 'Choose Template from Settings'}
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Note Form - Add or Edit */}
      {(isAddingNote || editingNoteId) && renderNoteForm()}

      {/* Existing Notes */}
      {!isAddingNote && !editingNoteId && (
        <>
          {notes.length > 0 ? (
            <>
              {notes.map((note) => (
                <Box
                  key={note.id}
                  sx={{
                    mb: 2.5,
                    p: 2.5,
                    bgcolor: colors.surface.card,
                    border: `1.5px solid ${colors.neutral.gray200}`,
                    borderRadius: '10px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: note.isTemplate ? colors.primary.light : colors.neutral.gray300,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      '& .note-actions': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {/* Timestamp and Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography 
                      sx={{ 
                        fontSize: '10px', 
                        color: colors.text.secondary, 
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {note.timestamp}
                    </Typography>
                    <Box
                      className="note-actions"
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleStartEditNote(note)}
                        sx={{
                          width: 28,
                          height: 28,
                          color: colors.primary.main,
                          bgcolor: 'rgba(110, 91, 206, 0.06)',
                          '&:hover': {
                            bgcolor: 'rgba(110, 91, 206, 0.12)',
                          },
                        }}
                      >
                        <Edit sx={{ fontSize: '15px' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (window.confirm('Delete this note?')) {
                            handleDeleteNote(note.id);
                          }
                        }}
                        sx={{
                          width: 28,
                          height: 28,
                          color: '#8B4A4A',
                          bgcolor: 'rgba(139, 74, 74, 0.06)',
                          '&:hover': {
                            bgcolor: 'rgba(139, 74, 74, 0.12)',
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '15px' }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Note Content */}
                  {renderNoteContent(note)}
                </Box>
              ))}

              {/* Add Another Note Button */}
              <Box
                onClick={handleStartAddNote}
                sx={{
                  p: 2.5,
                  bgcolor: colors.neutral.gray50,
                  border: `2px dashed ${colors.neutral.gray200}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.primary.main,
                    bgcolor: 'rgba(110, 91, 206, 0.03)',
                  },
                }}
              >
                <Add sx={{ fontSize: 20, color: colors.text.secondary, mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: colors.text.secondary, fontSize: '13px', fontWeight: 600 }}>
                  Add another note
                </Typography>
              </Box>
            </>
          ) : (
            // Empty State - No Notes Yet
            <Box
              onClick={handleStartAddNote}
              sx={{
                p: 4,
                bgcolor: colors.surface.card,
                border: `2px solid ${colors.neutral.gray200}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.primary.main,
                  bgcolor: 'rgba(110, 91, 206, 0.02)',
                  boxShadow: '0 2px 12px rgba(110, 91, 206, 0.08)',
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'rgba(110, 91, 206, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Add sx={{ fontSize: 28, color: colors.primary.main }} />
              </Box>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: colors.text.primary, mb: 0.75 }}>
                Add Your First Note
              </Typography>
              <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.5 }}>
                {selectedMode === 'template' && activeTemplate
                  ? `Using ${activeTemplate.name} template`
                  : 'Capture important details about this session'}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}