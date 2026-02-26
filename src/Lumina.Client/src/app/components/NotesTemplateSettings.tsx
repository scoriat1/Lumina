import { useState } from 'react';
import { Box, Typography, Button, TextField, Chip, IconButton, Tooltip } from '@mui/material';
import { Add, ContentCopy, Edit } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { colors } from '../styles/colors';
import { useNotesTemplate, templatePresets, Template } from '../contexts/NotesTemplateContext';

export function NotesTemplateSettings() {
  const {
    templateMode,
    setTemplateMode,
    selectedTemplateId,
    setSelectedTemplateId,
    customTemplates,
    setCustomTemplates,
  } = useNotesTemplate();

  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateFields, setNewTemplateFields] = useState<string[]>(['']);

  const handleAddField = () => {
    setNewTemplateFields([...newTemplateFields, '']);
  };

  const handleRemoveField = (index: number) => {
    const updated = newTemplateFields.filter((_, i) => i !== index);
    setNewTemplateFields(updated);
  };

  const handleFieldChange = (index: number, value: string) => {
    const updated = [...newTemplateFields];
    updated[index] = value;
    setNewTemplateFields(updated);
  };

  const handleSaveCustomTemplate = () => {
    if (newTemplateName.trim() && newTemplateFields.some(f => f.trim())) {
      if (editingTemplateId) {
        // Update existing template
        setCustomTemplates(customTemplates.map(t => 
          t.id === editingTemplateId 
            ? { ...t, name: newTemplateName, fields: newTemplateFields.filter(f => f.trim()) }
            : t
        ));
        setEditingTemplateId(null);
      } else {
        // Create new template
        const newTemplate: Template = {
          id: `custom-${Date.now()}`,
          name: newTemplateName,
          fields: newTemplateFields.filter(f => f.trim()),
          custom: true,
        };
        setCustomTemplates([...customTemplates, newTemplate]);
      }
      setIsCreatingTemplate(false);
      setNewTemplateName('');
      setNewTemplateFields(['']);
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    setNewTemplateName(`${template.name} (Copy)`);
    setNewTemplateFields([...template.fields, '']);
    setEditingTemplateId(null);
    setIsCreatingTemplate(true);
  };

  const handleEditCustomTemplate = (template: Template) => {
    setNewTemplateName(template.name);
    setNewTemplateFields([...template.fields]);
    setEditingTemplateId(template.id);
    setIsCreatingTemplate(true);
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId('');
    }
  };

  const handleCancelEdit = () => {
    setIsCreatingTemplate(false);
    setEditingTemplateId(null);
    setNewTemplateName('');
    setNewTemplateFields(['']);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Template Mode Selection */}
      <Box>
        <Typography sx={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: colors.text.primary, 
          mb: 2,
          letterSpacing: '-0.01em'
        }}>
          Note-Taking Mode
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box
            onClick={() => setTemplateMode('default')}
            sx={{
              flex: 1,
              p: 3,
              border: `2px solid ${templateMode === 'default' ? colors.primary.main : colors.neutral.gray200}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              bgcolor: templateMode === 'default' ? 'rgba(110, 91, 206, 0.03)' : colors.surface.card,
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: templateMode === 'default' ? colors.primary.main : colors.neutral.gray300,
                bgcolor: templateMode === 'default' ? 'rgba(110, 91, 206, 0.04)' : colors.neutral.gray50,
                transform: 'translateY(-1px)',
              },
              '&::before': templateMode === 'default' ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                bgcolor: colors.primary.main,
              } : {},
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '15px', color: colors.text.primary, mb: 0.75 }}>
              Free-Form Notes
            </Typography>
            <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.5 }}>
              Maximum flexibility. Add multiple notes per session without any structure.
            </Typography>
          </Box>

          <Box
            onClick={() => setTemplateMode('template')}
            sx={{
              flex: 1,
              p: 3,
              border: `2px solid ${templateMode === 'template' ? colors.primary.main : colors.neutral.gray200}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              bgcolor: templateMode === 'template' ? 'rgba(110, 91, 206, 0.03)' : colors.surface.card,
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: templateMode === 'template' ? colors.primary.main : colors.neutral.gray300,
                bgcolor: templateMode === 'template' ? 'rgba(110, 91, 206, 0.04)' : colors.neutral.gray50,
                transform: 'translateY(-1px)',
              },
              '&::before': templateMode === 'template' ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                bgcolor: colors.primary.main,
              } : {},
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '15px', color: colors.text.primary, mb: 0.75 }}>
              Structured Template
            </Typography>
            <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.5 }}>
              Consistent format. Use predefined fields for every session.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Template Selection (shown when template mode is selected) */}
      {templateMode === 'template' && (
        <>
          {/* Preset Templates */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography sx={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: colors.text.primary,
                letterSpacing: '-0.01em'
              }}>
                Preset Templates
              </Typography>
              <Typography sx={{ fontSize: '12px', color: colors.text.secondary }}>
                Click to select, or duplicate to customize
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {templatePresets.map((preset) => (
                <Box
                  key={preset.id}
                  sx={{
                    position: 'relative',
                    p: 2.5,
                    border: `2px solid ${selectedTemplateId === preset.id ? colors.primary.main : colors.neutral.gray200}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: selectedTemplateId === preset.id ? 'rgba(110, 91, 206, 0.02)' : colors.surface.card,
                    '&:hover': {
                      borderColor: selectedTemplateId === preset.id ? colors.primary.main : colors.neutral.gray300,
                      bgcolor: selectedTemplateId === preset.id ? 'rgba(110, 91, 206, 0.03)' : colors.neutral.gray50,
                      transform: 'translateY(-1px)',
                      '& .action-button': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box onClick={() => setSelectedTemplateId(preset.id)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                        {preset.name}
                      </Typography>
                      <Tooltip title="Duplicate" placement="top">
                        <IconButton
                          className="action-button"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTemplate(preset);
                          }}
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            color: colors.primary.main,
                            '&:hover': {
                              bgcolor: 'rgba(110, 91, 206, 0.08)',
                            },
                          }}
                        >
                          <ContentCopy sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {preset.fields.map((field, idx) => (
                        <Chip
                          key={idx}
                          label={field}
                          size="small"
                          sx={{
                            bgcolor: selectedTemplateId === preset.id 
                              ? 'rgba(110, 91, 206, 0.08)' 
                              : colors.neutral.gray100,
                            color: selectedTemplateId === preset.id 
                              ? colors.primary.main 
                              : colors.text.secondary,
                            fontSize: '11px',
                            height: '22px',
                            fontWeight: 500,
                            border: 'none',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Custom Templates */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography sx={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: colors.text.primary,
                letterSpacing: '-0.01em'
              }}>
                Custom Templates
              </Typography>
              {!isCreatingTemplate && (
                <Button
                  variant="outlined"
                  startIcon={<Add sx={{ fontSize: '16px' }} />}
                  onClick={() => setIsCreatingTemplate(true)}
                  sx={{
                    borderColor: colors.primary.main,
                    color: colors.primary.main,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    px: 2.5,
                    py: 0.75,
                    borderRadius: '8px',
                    '&:hover': {
                      borderColor: colors.primary.dark,
                      bgcolor: 'rgba(110, 91, 206, 0.04)',
                    },
                  }}
                >
                  Create Custom
                </Button>
              )}
            </Box>

            {/* Create/Edit Custom Template Form */}
            {isCreatingTemplate && (
              <Box sx={{ 
                p: 3.5, 
                bgcolor: 'rgba(110, 91, 206, 0.02)', 
                borderRadius: '12px', 
                border: `2px solid ${colors.primary.main}`,
                mb: 2,
              }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary, mb: 2.5 }}>
                  {editingTemplateId ? 'Edit Template' : 'Create New Template'}
                </Typography>
                
                <FormField label="Template Name">
                  <TextField
                    fullWidth
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., My Session Notes"
                    sx={{ ...textFieldStyles, mb: 3 }}
                  />
                </FormField>

                <FormField label="Template Fields">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {newTemplateFields.map((field, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Box sx={{ 
                          minWidth: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          bgcolor: colors.neutral.gray100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: colors.text.secondary,
                        }}>
                          {index + 1}
                        </Box>
                        <TextField
                          fullWidth
                          value={field}
                          onChange={(e) => handleFieldChange(index, e.target.value)}
                          placeholder={`Field ${index + 1} name`}
                          sx={textFieldStyles}
                        />
                        {newTemplateFields.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveField(index)}
                            sx={{ 
                              color: colors.text.secondary,
                              '&:hover': {
                                color: '#8B4A4A',
                                bgcolor: 'rgba(139, 74, 74, 0.08)',
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button
                      variant="text"
                      startIcon={<Add sx={{ fontSize: '16px' }} />}
                      onClick={handleAddField}
                      sx={{
                        alignSelf: 'flex-start',
                        color: colors.text.secondary,
                        textTransform: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        px: 1.5,
                        '&:hover': { 
                          bgcolor: colors.neutral.gray100,
                          color: colors.text.primary,
                        },
                      }}
                    >
                      Add Field
                    </Button>
                  </Box>
                </FormField>

                <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 3, borderTop: `1px solid ${colors.neutral.gray200}` }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveCustomTemplate}
                    disabled={!newTemplateName.trim() || !newTemplateFields.some(f => f.trim())}
                    sx={saveButtonStyles}
                  >
                    {editingTemplateId ? 'Update Template' : 'Save Template'}
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleCancelEdit}
                    sx={cancelButtonStyles}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}

            {/* Display Custom Templates */}
            {customTemplates.length === 0 && !isCreatingTemplate && (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                border: `2px dashed ${colors.neutral.gray200}`,
                borderRadius: '12px',
                bgcolor: colors.neutral.gray50,
              }}>
                <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mb: 1.5 }}>
                  No custom templates yet
                </Typography>
                <Typography sx={{ fontSize: '12px', color: colors.text.secondary }}>
                  Create your own template or duplicate a preset to get started
                </Typography>
              </Box>
            )}

            {customTemplates.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {customTemplates.map((template) => (
                  <Box
                    key={template.id}
                    sx={{
                      position: 'relative',
                      p: 2.5,
                      border: `2px solid ${selectedTemplateId === template.id ? colors.primary.main : colors.neutral.gray200}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: selectedTemplateId === template.id ? 'rgba(110, 91, 206, 0.02)' : colors.surface.card,
                      '&:hover': {
                        borderColor: selectedTemplateId === template.id ? colors.primary.main : colors.neutral.gray300,
                        bgcolor: selectedTemplateId === template.id ? 'rgba(110, 91, 206, 0.03)' : colors.neutral.gray50,
                        transform: 'translateY(-1px)',
                        '& .action-buttons': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Box onClick={() => setSelectedTemplateId(template.id)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                            {template.name}
                          </Typography>
                          <Chip
                            label="Custom"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(110, 91, 206, 0.1)',
                              color: colors.primary.main,
                              fontSize: '9px',
                              height: '18px',
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          />
                        </Box>
                        <Box 
                          className="action-buttons"
                          sx={{ 
                            display: 'flex', 
                            gap: 0.5,
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomTemplate(template);
                            }}
                            sx={{
                              color: colors.primary.main,
                              '&:hover': {
                                bgcolor: 'rgba(110, 91, 206, 0.08)',
                              },
                            }}
                          >
                            <Edit sx={{ fontSize: '15px' }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete template "${template.name}"?`)) {
                                handleDeleteCustomTemplate(template.id);
                              }
                            }}
                            sx={{
                              color: '#8B4A4A',
                              '&:hover': {
                                bgcolor: 'rgba(139, 74, 74, 0.08)',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {template.fields.map((field: string, idx: number) => (
                          <Chip
                            key={idx}
                            label={field}
                            size="small"
                            sx={{
                              bgcolor: selectedTemplateId === template.id 
                                ? 'rgba(110, 91, 206, 0.08)' 
                                : colors.neutral.gray100,
                              color: selectedTemplateId === template.id 
                                ? colors.primary.main 
                                : colors.text.secondary,
                              fontSize: '11px',
                              height: '22px',
                              fontWeight: 500,
                              border: 'none',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Info Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 2, 
        p: 2.5, 
        bgcolor: 'rgba(110, 91, 206, 0.04)', 
        borderRadius: '10px',
        border: `1px solid rgba(110, 91, 206, 0.1)`,
      }}>
        <Box sx={{
          minWidth: '32px',
          height: '32px',
          borderRadius: '8px',
          bgcolor: 'rgba(110, 91, 206, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>
          💡
        </Box>
        <Box>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
            Flexibility Tip
          </Typography>
          <Typography sx={{ fontSize: '12px', color: colors.text.secondary, lineHeight: 1.6 }}>
            You can switch between free-form and template modes at any time. Your existing notes won't be affected.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Helper Components
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary, mb: 1.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

// Shared Styles
const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    fontSize: '13px',
    borderRadius: '8px',
    bgcolor: colors.surface.card,
    '& fieldset': {
      borderColor: colors.neutral.gray200,
    },
    '&:hover fieldset': {
      borderColor: colors.neutral.gray300,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.primary.main,
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-input': {
    padding: '10px 12px',
  },
};

const cancelButtonStyles = {
  color: colors.text.secondary,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '13px',
  px: 2.5,
  py: 1,
  '&:hover': { 
    bgcolor: colors.neutral.gray100,
    color: colors.text.primary,
  },
};

const saveButtonStyles = {
  bgcolor: colors.primary.main,
  color: '#FFFFFF',
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '13px',
  px: 3,
  py: 1,
  boxShadow: '0 1px 2px rgba(110, 91, 206, 0.2)',
  '&:hover': {
    bgcolor: colors.primary.dark,
    boxShadow: '0 2px 4px rgba(110, 91, 206, 0.3)',
  },
  '&:disabled': {
    bgcolor: colors.neutral.gray200,
    color: colors.text.secondary,
  },
};