import { useState, useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  Stack, 
  Avatar, 
  Chip, 
  Button, 
  Divider,
  TextField,
  MenuItem,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import PaymentIcon from '@mui/icons-material/Payment';
import RepeatIcon from '@mui/icons-material/Repeat';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import { colors } from '../styles/colors';
import { SessionNotes, SessionNote } from './SessionNotes';
import { PreviousSessionPreview } from './PreviousSessionPreview';

const sessionTypes = [
  'Initial Consultation',
  'Weekly Check-in',
  'Progress Check-in',
  'Follow-up Session',
  'Values Alignment',
  'Leadership Growth',
  'Career Strategy',
  'Confidence Building',
  'Work-Life Balance',
];

const durations = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];

const statusOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface SessionDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  sessions: any[]; // Accept sessions array from parent
  onUpdateSession?: (sessionId: string, updates: any) => void;
}

export function SessionDetailsDrawer({ open, onClose, sessionId, sessions, onUpdateSession }: SessionDetailsDrawerProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Look up the session by ID from the passed sessions array
  const session = sessionId && sessions ? sessions.find((s) => s.id === sessionId) : null;
  
  // Initialize notes array from session (support both old single note and new notes array)
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    sessionType: '',
    date: '',
    time: '',
    duration: 60,
    method: 'zoom' as 'zoom' | 'phone' | 'office',
    status: 'upcoming',
  });

  // Update notes when session changes
  useEffect(() => {
    if (session) {
      // Support backward compatibility: if session has old 'notes' string, convert it
      if (session.sessionNotes && Array.isArray(session.sessionNotes)) {
        setSessionNotes(session.sessionNotes);
      } else if (session.notes && typeof session.notes === 'string' && session.notes.trim()) {
        // Convert old single note to new format
        setSessionNotes([{
          id: 'legacy-note',
          content: session.notes,
          timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
        }]);
      } else {
        setSessionNotes([]);
      }
      
      setIsAddingNote(false);
      setNewNoteContent('');
      setIsEditMode(false);
      
      // Initialize edit form data
      setEditFormData({
        sessionType: session.sessionType || '',
        date: format(session.date, 'yyyy-MM-dd'),
        time: format(session.date, 'HH:mm'),
        duration: session.duration || 60,
        method: (session.location as 'zoom' | 'phone' | 'office') || 'zoom',
        status: session.status || 'upcoming',
      });
    }
  }, [session]);

  if (!session) return null;

  // Find previous session for the same client
  const getPreviousSession = () => {
    // Filter sessions for the same client and exclude current session
    const clientSessions = sessions
      .filter(s => s.client === session.client && s.id !== session.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Find the session that occurred before the current one (using full timestamp)
    const currentDateTime = new Date(session.date).getTime();
    const previousSession = clientSessions.find(s => new Date(s.date).getTime() < currentDateTime);
    
    return previousSession;
  };

  const previousSession = getPreviousSession();

  const handleEditChange = (field: string, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    // Combine date and time into a single date object
    const updatedDateTime = new Date(`${editFormData.date}T${editFormData.time}`);
    
    if (onUpdateSession) {
      onUpdateSession(session.id, {
        sessionType: editFormData.sessionType,
        date: updatedDateTime,
        duration: editFormData.duration,
        location: editFormData.method,
        status: editFormData.status,
      });
    }
    
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    // Reset form to original session data
    setEditFormData({
      sessionType: session.sessionType || '',
      date: format(session.date, 'yyyy-MM-dd'),
      time: format(session.date, 'HH:mm'),
      duration: session.duration || 60,
      method: (session.location as 'zoom' | 'phone' | 'office') || 'zoom',
      status: session.status || 'upcoming',
    });
    setIsEditMode(false);
  };

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      const newNote: SessionNote = {
        id: `note-${Date.now()}`,
        content: newNoteContent.trim(),
        timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
      };
      const updatedNotes = [newNote, ...sessionNotes];
      setSessionNotes(updatedNotes);
      setNewNoteContent('');
      setIsAddingNote(false);
      
      if (onUpdateSession) {
        onUpdateSession(session.id, { sessionNotes: updatedNotes });
      }
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = sessionNotes.filter(note => note.id !== noteId);
    setSessionNotes(updatedNotes);
    
    if (onUpdateSession) {
      onUpdateSession(session.id, { sessionNotes: updatedNotes });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { bgcolor: 'rgba(168, 181, 160, 0.12)', color: '#5B7052', border: '1px solid rgba(168, 181, 160, 0.2)' };
      case 'completed':
        return { bgcolor: 'rgba(157, 170, 181, 0.12)', color: '#4A5B6D', border: '1px solid rgba(157, 170, 181, 0.2)' };
      case 'cancelled':
        return { bgcolor: 'rgba(139, 74, 74, 0.08)', color: '#8B4A4A', border: '1px solid rgba(139, 74, 74, 0.15)' };
      default:
        return { bgcolor: '#F5F3F1', color: '#7A746F', border: '1px solid #E8E5E1' };
    }
  };

  const statusColors = getStatusColor(isEditMode ? editFormData.status : session.status);

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'zoom':
        return <VideocamIcon sx={{ fontSize: 20, color: '#7A746F' }} />;
      case 'phone':
        return <PhoneIcon sx={{ fontSize: 20, color: '#7A746F' }} />;
      case 'office':
        return <BusinessIcon sx={{ fontSize: 20, color: '#7A746F' }} />;
      default:
        return <BusinessIcon sx={{ fontSize: 20, color: '#7A746F' }} />;
    }
  };

  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'zoom':
        return 'Zoom';
      case 'phone':
        return 'Phone';
      case 'office':
        return 'In Person';
      default:
        return location.charAt(0).toUpperCase() + location.slice(1);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500 },
          bgcolor: '#FDFCFB',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Compact Header */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E8E5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: session.avatarColor,
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {session.initials}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2C2825', fontSize: '18px', mb: 0.25 }}>
                {session.client}
              </Typography>
              <Typography variant="body2" sx={{ color: '#7A746F', fontSize: '13px' }}>
                {isEditMode && !editFormData.sessionType ? 'No title' : isEditMode ? editFormData.sessionType : session.sessionType}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              color: '#C7C2BD',
              '&:hover': {
                bgcolor: 'rgba(155, 139, 158, 0.06)',
                color: '#9A9490',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content - Scrollable */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Stack spacing={3}>
            {/* Session Notes - PROMINENT FIRST */}
            <SessionNotes
              notes={sessionNotes}
              onNotesChange={(updatedNotes) => {
                setSessionNotes(updatedNotes);
                if (onUpdateSession) {
                  onUpdateSession(session.id, { sessionNotes: updatedNotes });
                }
              }}
            />

            {/* Previous Session Preview - Only show if exists */}
            {previousSession && (previousSession.sessionNotes || previousSession.notes) && (() => {
              // Convert notes to sessionNotes format if needed
              const prevSessionNotes = previousSession.sessionNotes ||  
                (previousSession.notes ? [{
                  id: 'legacy-note',
                  content: previousSession.notes,
                  timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
                }] : []);
              
              return prevSessionNotes.length > 0 ? (
                <PreviousSessionPreview
                  sessionType={previousSession.sessionType}
                  date={previousSession.date}
                  notes={prevSessionNotes}
                />
              ) : null;
            })()}

            <Divider sx={{ borderColor: '#E8E5E1' }} />

            {/* Session Details */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: '#7A746F', fontWeight: 700, fontSize: '11px', mb: 2.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px' }}
              >
                Details
              </Typography>
              <Stack spacing={2.5}>
                {/* Session Title - Edit Mode */}
                {isEditMode && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#4A4542',
                        fontWeight: 600,
                        mb: 0.75,
                        display: 'block',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                      }}
                    >
                      Session Title <Box component="span" sx={{ color: '#9A9490', fontStyle: 'italic', fontWeight: 400 }}>(optional)</Box>
                    </Typography>
                    <Autocomplete
                      freeSolo
                      options={sessionTypes}
                      value={editFormData.sessionType}
                      onChange={(event, newValue) => {
                        handleEditChange('sessionType', newValue || '');
                      }}
                      onInputChange={(event, newInputValue) => {
                        handleEditChange('sessionType', newInputValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="No title"
                          sx={{
                            bgcolor: '#FFFFFF',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: '#E8E5E1',
                                borderWidth: '1.5px',
                              },
                              '&:hover fieldset': {
                                borderColor: '#9B8B9E',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9B8B9E',
                                borderWidth: '2px',
                              },
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* Date */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: '#F9F8F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: 18, color: '#7A746F' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9A9490', fontSize: '11px', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Date
                    </Typography>
                    {isEditMode ? (
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={editFormData.date}
                        onChange={(e) => handleEditChange('date', e.target.value)}
                        sx={{
                          bgcolor: '#FFFFFF',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: '#E8E5E1',
                              borderWidth: '1.5px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#9B8B9E',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#9B8B9E',
                              borderWidth: '2px',
                            },
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4542', fontSize: '14px' }}>
                        {format(session.date, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Time & Duration */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: '#F9F8F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 18, color: '#7A746F' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9A9490', fontSize: '11px', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Time & Duration
                    </Typography>
                    {isEditMode ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          type="time"
                          size="small"
                          value={editFormData.time}
                          onChange={(e) => handleEditChange('time', e.target.value)}
                          sx={{
                            flex: 1,
                            bgcolor: '#FFFFFF',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: '#E8E5E1',
                                borderWidth: '1.5px',
                              },
                              '&:hover fieldset': {
                                borderColor: '#9B8B9E',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9B8B9E',
                                borderWidth: '2px',
                              },
                            },
                          }}
                        />
                        <TextField
                          select
                          size="small"
                          value={editFormData.duration}
                          onChange={(e) => handleEditChange('duration', e.target.value)}
                          sx={{
                            flex: 1,
                            bgcolor: '#FFFFFF',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: '#E8E5E1',
                                borderWidth: '1.5px',
                              },
                              '&:hover fieldset': {
                                borderColor: '#9B8B9E',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9B8B9E',
                                borderWidth: '2px',
                              },
                            },
                          }}
                        >
                          {durations.map((duration) => (
                            <MenuItem key={duration.value} value={duration.value}>
                              {duration.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4542', fontSize: '14px' }}>
                        {format(session.date, 'h:mm a')} • {session.duration} minutes
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Method */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: '#F9F8F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getLocationIcon(isEditMode ? editFormData.method : session.location)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9A9490', fontSize: '11px', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Method
                    </Typography>
                    {isEditMode ? (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={editFormData.method}
                        onChange={(e) => handleEditChange('method', e.target.value)}
                        sx={{
                          bgcolor: '#FFFFFF',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: '#E8E5E1',
                              borderWidth: '1.5px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#9B8B9E',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#9B8B9E',
                              borderWidth: '2px',
                            },
                          },
                        }}
                      >
                        <MenuItem value="zoom">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VideocamIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                            <span>Zoom</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="phone">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                            <span>Phone</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="office">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                            <span>In Person</span>
                          </Box>
                        </MenuItem>
                      </TextField>
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4542', fontSize: '14px' }}>
                        {getLocationLabel(session.location)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Billing & Payment - Read-only */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: '#F9F8F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PaymentIcon sx={{ fontSize: 18, color: '#7A746F' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9A9490', fontSize: '11px', mb: 0.75, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Billing & Payment
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={
                          session.billingSource === 'pay-per-session'
                            ? 'Pay per session'
                            : session.billingSource === 'package' && session.packageRemaining !== undefined
                            ? `Package • ${session.packageRemaining} left`
                            : 'Included'
                        }
                        size="small"
                        sx={{
                          bgcolor: 'rgba(122, 116, 111, 0.06)',
                          color: '#7A746F',
                          border: '1px solid rgba(122, 116, 111, 0.1)',
                          fontWeight: 500,
                          fontSize: '12px',
                          height: 24,
                        }}
                      />
                      <Chip
                        label={session.paymentStatus?.charAt(0).toUpperCase() + session.paymentStatus?.slice(1) || 'Paid'}
                        size="small"
                        sx={{
                          ...(session.paymentStatus === 'paid'
                            ? { bgcolor: 'rgba(168, 181, 160, 0.12)', color: '#5B7052', border: '1px solid rgba(168, 181, 160, 0.2)' }
                            : session.paymentStatus === 'unpaid'
                            ? { bgcolor: 'rgba(212, 184, 138, 0.12)', color: '#8B7444', border: '1px solid rgba(212, 184, 138, 0.2)' }
                            : session.paymentStatus === 'invoiced'
                            ? { bgcolor: 'rgba(157, 170, 181, 0.12)', color: '#4A5B6D', border: '1px solid rgba(157, 170, 181, 0.2)' }
                            : { bgcolor: 'rgba(155, 139, 158, 0.12)', color: '#7A6B7D', border: '1px solid rgba(155, 139, 158, 0.2)' }),
                          fontWeight: 600,
                          fontSize: '11px',
                          height: 24,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Recurring - Read-only (if applicable) */}
                {session.isRecurring && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        bgcolor: '#F9F8F7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <RepeatIcon sx={{ fontSize: 18, color: '#7A746F' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#9A9490', fontSize: '11px', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Recurring
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4542', fontSize: '14px', textTransform: 'capitalize' }}>
                        {session.recurringType}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Status */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: '#F9F8F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18, color: '#7A746F' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9A9490', fontSize: '11px', mb: 0.75, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status
                    </Typography>
                    {isEditMode ? (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={editFormData.status}
                        onChange={(e) => handleEditChange('status', e.target.value)}
                        sx={{
                          bgcolor: '#FFFFFF',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: '#E8E5E1',
                              borderWidth: '1.5px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#9B8B9E',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#9B8B9E',
                              borderWidth: '2px',
                            },
                          },
                        }}
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Chip
                        label={session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        size="small"
                        sx={{
                          ...statusColors,
                          fontWeight: 600,
                          fontSize: '12px',
                          height: 26,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 2.5,
            borderTop: '1.5px solid #E8E5E1',
            bgcolor: '#FFFFFF',
          }}
        >
          {isEditMode ? (
            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                sx={{
                  bgcolor: '#9B8B9E',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1.25,
                  '&:hover': {
                    bgcolor: '#8A7A8D',
                  },
                }}
              >
                Save Changes
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCancelEdit}
                sx={{
                  borderColor: '#E8E5E1',
                  color: '#4A4542',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1.25,
                  '&:hover': {
                    borderColor: '#D0CCC7',
                    bgcolor: '#F9F8F7',
                  },
                }}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditMode(true)}
                sx={{
                  borderColor: '#E8E5E1',
                  color: '#4A4542',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1.25,
                  '&:hover': {
                    borderColor: '#9B8B9E',
                    bgcolor: 'rgba(155, 139, 158, 0.05)',
                  },
                }}
              >
                Edit Session
              </Button>
              
              {/* Show Cancel button only if not completed */}
              {session.status !== 'completed' && session.status !== 'cancelled' && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setIsCancelDialogOpen(true)}
                  sx={{
                    borderColor: '#F5E8E8',
                    color: '#8B4A4A',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 1.25,
                    '&:hover': {
                      borderColor: '#8B4A4A',
                      bgcolor: '#F5E8E8',
                    },
                  }}
                >
                  Cancel Session
                </Button>
              )}

              {/* Show Re-schedule button if cancelled */}
              {session.status === 'cancelled' && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EventAvailableIcon />}
                  onClick={() => {
                    if (onUpdateSession) {
                      onUpdateSession(session.id, { status: 'upcoming' });
                    }
                    onClose();
                  }}
                  sx={{
                    borderColor: '#E8E5E1',
                    color: '#5B7052',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 1.25,
                    '&:hover': {
                      borderColor: '#A8B5A0',
                      bgcolor: 'rgba(168, 181, 160, 0.08)',
                    },
                  }}
                >
                  Re-schedule Session
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Cancel Dialog */}
      <Dialog
        open={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            bgcolor: '#FDFCFB',
          },
        }}
      >
        <DialogTitle sx={{ color: '#2C2825', fontSize: '18px', fontWeight: 600, p: 2.5 }}>
          Cancel Session
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#7A746F', fontSize: '14px', lineHeight: 1.6 }}>
            Are you sure you want to cancel this session with {session.client}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsCancelDialogOpen(false)}
            sx={{
              color: '#4A4542',
              fontWeight: 600,
              textTransform: 'none',
              py: 1.25,
              '&:hover': {
                bgcolor: 'rgba(155, 139, 158, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (onUpdateSession) {
                onUpdateSession(session.id, { status: 'cancelled' });
              }
              setIsCancelDialogOpen(false);
              onClose();
            }}
            sx={{
              color: '#8B4A4A',
              fontWeight: 600,
              textTransform: 'none',
              py: 1.25,
              '&:hover': {
                bgcolor: '#F5E8E8',
              },
            }}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}