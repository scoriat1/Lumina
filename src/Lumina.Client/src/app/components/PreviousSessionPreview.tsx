import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton, Stack } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format } from 'date-fns';
import { colors } from '../styles/colors';
import { SessionNote } from './SessionNotes';

interface PreviousSessionPreviewProps {
  sessionType: string;
  date: Date;
  notes: SessionNote[];
}

export function PreviousSessionPreview({ sessionType, date, notes }: PreviousSessionPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no notes exist, don't show preview text
  const hasNotes = notes && notes.length > 0;

  // Generate preview text from first note
  const getPreviewText = () => {
    if (!hasNotes) return 'No notes from previous session';
    
    const firstNote = notes[0];
    
    // For template notes, show first field's content
    if (firstNote.isTemplate && firstNote.content) {
      try {
        const data = JSON.parse(firstNote.content);
        const firstValue = Object.values(data)[0] as string;
        if (firstValue) {
          return firstValue.length > 100 ? firstValue.substring(0, 100) + '...' : firstValue;
        }
      } catch (e) {
        // Fall through to default
      }
    }
    
    // For free-form notes
    const content = firstNote.content;
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  // Render full note content when expanded
  const renderNoteContent = (note: SessionNote) => {
    if (note.isTemplate && note.templateId) {
      try {
        const data = JSON.parse(note.content);
        return (
          <Box>
            {/* Template badge */}
            {note.templateName && (
              <Chip
                icon={<ArticleOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                label={note.templateName}
                size="small"
                sx={{
                  mb: 1.5,
                  height: 22,
                  bgcolor: 'rgba(110, 91, 206, 0.08)',
                  color: colors.primary.main,
                  border: `1px solid rgba(110, 91, 206, 0.2)`,
                  fontWeight: 600,
                  fontSize: '10px',
                  '& .MuiChip-icon': {
                    color: colors.primary.main,
                  },
                }}
              />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(data).map(([field, value]) => (
                <Box 
                  key={field}
                  sx={{
                    pl: 1.5,
                    borderLeft: `2px solid ${colors.primary.light}`,
                  }}
                >
                  <Typography 
                    sx={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: colors.primary.main, 
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {field}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '13px', 
                      color: colors.text.primary, 
                      lineHeight: 1.6, 
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
        return <Typography sx={{ color: colors.text.secondary, fontStyle: 'italic', fontSize: '13px' }}>Invalid template data</Typography>;
      }
    }
    
    // Free-form note
    return (
      <Typography sx={{ color: colors.text.primary, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '13px' }}>
        {note.content}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: 'rgba(247, 248, 250, 0.5)',
        border: `1px solid ${colors.neutral.gray200}`,
        borderRadius: '10px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header - Always visible */}
      <Box
        onClick={() => hasNotes && setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          cursor: hasNotes ? 'pointer' : 'default',
          mb: isExpanded ? 2 : 0,
        }}
      >
        <Box sx={{ flex: 1 }}>
          {/* Label */}
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              mb: 1,
            }}
          >
            Previous Session
          </Typography>

          {/* Session metadata line */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 13, color: colors.text.secondary }} />
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: colors.text.primary }}>
                {format(date, 'MMM d, yyyy')}
              </Typography>
            </Box>
            {sessionType && (
              <>
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: colors.neutral.gray300 }} />
                <Typography sx={{ fontSize: '12px', color: colors.text.secondary }}>
                  {sessionType}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Expand/Collapse icon */}
        {hasNotes && (
          <IconButton
            size="small"
            sx={{
              ml: 1,
              color: colors.text.secondary,
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ExpandMore sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Box>

      {/* Expanded content - Full notes */}
      {hasNotes && (
        <Collapse in={isExpanded}>
          <Box
            sx={{
              pt: 2,
              borderTop: `1px solid ${colors.neutral.gray200}`,
            }}
          >
            <Stack spacing={2}>
              {notes.map((note, index) => (
                <Box key={note.id || index}>
                  {/* Timestamp for each note */}
                  {index > 0 && (
                    <Typography
                      sx={{
                        fontSize: '9px',
                        color: colors.text.secondary,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 1,
                        mt: 2,
                      }}
                    >
                      {note.timestamp}
                    </Typography>
                  )}
                  {renderNoteContent(note)}
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}