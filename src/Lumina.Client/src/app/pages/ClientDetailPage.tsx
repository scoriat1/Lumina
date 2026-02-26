import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkIcon from '@mui/icons-material/Work';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import PersonIcon from '@mui/icons-material/Person';
import NoteIcon from '@mui/icons-material/Note';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { colors } from '../styles/colors';
import { NewSessionModal } from '../components/NewSessionModal';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';

// Mock data - would come from API/database
const mockClient = {
  id: '1',
  name: 'Jessica Martinez',
  initials: 'JM',
  avatarColor: colors.primary.main,
  email: 'jessica.martinez@email.com',
  phone: '+1 (555) 123-4567',
  joinDate: 'January 15, 2024',
  totalLifetimeRevenue: '$5,800',
  totalEngagements: 3,
};

// Engagements structure - groups sessions and notes by program
const mockEngagements = [
  {
    id: 'eng-1',
    name: '3-Month Professional Development',
    status: 'active' as 'active' | 'completed',
    startDate: 'Feb 1, 2025',
    endDate: 'Apr 30, 2025',
    sessionsUsed: 6,
    totalSessions: 12,
    progress: 50,
    revenue: '$2,400',
    sessions: [
      {
        id: 's1',
        title: 'Conflict Resolution',
        date: 'Feb 18, 2025',
        time: '2:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [],
      },
      {
        id: 's2',
        title: 'Communication Skills',
        date: 'Feb 15, 2025',
        time: '2:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn1', timestamp: 'Feb 15, 2025 3:15 PM', content: 'Practiced active listening techniques. Role-played difficult conversations with team members.' },
        ],
      },
      {
        id: 's2b',
        title: '',
        date: 'Feb 12, 2025',
        time: '3:30 PM',
        duration: '45 min',
        method: 'In Person',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn2', timestamp: 'Feb 12, 2025 4:20 PM', content: 'Quick check-in session.' },
        ],
      },
      {
        id: 's3',
        title: 'Leadership Development',
        date: 'Feb 8, 2025',
        time: '2:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn3', timestamp: 'Feb 8, 2025 3:05 PM', content: 'Explored leadership styles and strengths. Completed assessment.' },
        ],
      },
      {
        id: 's4',
        title: 'Goal Setting & Vision',
        date: 'Feb 4, 2025',
        time: '2:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn4', timestamp: 'Feb 4, 2025 3:10 PM', content: 'Discussed career goals and 3-year vision.' },
        ],
      },
    ],
    notes: [
      {
        id: 'n1',
        date: 'Feb 13, 2025',
        content: 'Client reached out about rescheduling next session due to team offsite. Moved to Feb 18 at 2:00 PM.',
      },
      {
        id: 'n2',
        date: 'Feb 10, 2025',
        content: 'Mid-program check-in completed. Client is on track with goals and showing strong progress.',
      },
    ],
  },
  {
    id: 'eng-2',
    name: '6-Week Career Transition',
    status: 'completed' as 'active' | 'completed',
    startDate: 'Oct 1, 2024',
    endDate: 'Nov 15, 2024',
    sessionsUsed: 6,
    totalSessions: 6,
    progress: 100,
    revenue: '$1,800',
    sessions: [
      {
        id: 's5',
        title: 'Final Strategy Session',
        date: 'Nov 12, 2024',
        time: '3:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn5', timestamp: 'Nov 12, 2024 4:10 PM', content: 'Reviewed job search progress and finalized networking strategy.' },
        ],
      },
      {
        id: 's6',
        title: 'Interview Preparation',
        date: 'Nov 5, 2024',
        time: '3:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn6', timestamp: 'Nov 5, 2024 4:15 PM', content: 'Mock interviews and feedback on presentation skills.' },
        ],
      },
      {
        id: 's7',
        title: 'Resume & LinkedIn Review',
        date: 'Oct 29, 2024',
        time: '3:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn7', timestamp: 'Oct 29, 2024 4:05 PM', content: 'Refined resume and updated LinkedIn profile for tech industry.' },
        ],
      },
    ],
    notes: [
      {
        id: 'n3',
        date: 'Nov 10, 2024',
        content: 'Client received two job offers and accepted position at tech startup.',
      },
    ],
  },
  {
    id: 'eng-3',
    name: 'Single Sessions',
    status: 'completed' as 'active' | 'completed',
    startDate: 'May 2024',
    endDate: 'Sep 2024',
    sessionsUsed: 4,
    totalSessions: 4,
    progress: 100,
    revenue: '$1,600',
    sessions: [
      {
        id: 's8',
        title: 'Salary Negotiation Strategy',
        date: 'Sep 20, 2024',
        time: '4:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn8', timestamp: 'Sep 20, 2024 5:10 PM', content: 'Prepared for compensation discussion with new employer.' },
        ],
      },
      {
        id: 's9',
        title: 'Career Direction Consultation',
        date: 'Jul 15, 2024',
        time: '2:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn9', timestamp: 'Jul 15, 2024 3:20 PM', content: 'Explored career pivot options and assessed readiness for change.' },
        ],
      },
      {
        id: 's10',
        title: 'Executive Presence Coaching',
        date: 'Jun 8, 2024',
        time: '1:00 PM',
        duration: '60 min',
        method: 'In Person',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn10', timestamp: 'Jun 8, 2024 2:15 PM', content: 'Worked on presentation skills for upcoming board meeting.' },
        ],
      },
      {
        id: 's11',
        title: 'Initial Consultation',
        date: 'May 12, 2024',
        time: '3:00 PM',
        duration: '60 min',
        method: 'Video Call',
        status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
        sessionNotes: [
          { id: 'sn11', timestamp: 'May 12, 2024 4:05 PM', content: 'Discovery session to understand goals and current challenges.' },
        ],
      },
    ],
    notes: [],
  },
];

// Client Notes - separate from engagement timeline
const mockClientNotes = [
  {
    id: 'cn-1',
    content: 'Prefers morning sessions when possible. Has mentioned interest in expanding to team workshops in Q3.',
    timestamp: 'Feb 16, 2025 at 3:45 PM',
    tag: 'General' as 'General' | 'Internal' | 'Admin',
  },
  {
    id: 'cn-2',
    content: 'Approved invoice #2024-089. Payment expected within 14 days.',
    timestamp: 'Feb 10, 2025 at 11:20 AM',
    tag: 'Admin' as 'General' | 'Internal' | 'Admin',
  },
  {
    id: 'cn-3',
    content: 'Strong communicator, responds well to direct feedback. Prefers actionable next steps.',
    timestamp: 'Feb 5, 2025 at 9:15 AM',
    tag: 'Internal' as 'General' | 'Internal' | 'Admin',
  },
];

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedEngagements, setExpandedEngagements] = useState<{ [key: string]: boolean }>(
    // Only expand active engagements by default
    Object.fromEntries(
      mockEngagements.filter(eng => eng.status === 'active').map(eng => [eng.id, true])
    )
  );
  
  // Transform all sessions from all engagements into SessionDetailsDrawer format
  const allSessions = mockEngagements.flatMap(engagement => 
    engagement.sessions.map(session => ({
      ...session,
      id: session.id,
      client: mockClient.name,
      initials: mockClient.initials,
      avatarColor: mockClient.avatarColor,
      sessionType: session.title || 'Session',
      // Parse date string to Date object
      date: new Date(session.date),
      // Extract duration number from string like "60 min"
      duration: parseInt(session.duration),
      location: session.method.toLowerCase().includes('video') ? 'zoom' : 
                session.method.toLowerCase().includes('person') ? 'office' : 'phone',
      status: session.status === 'scheduled' ? 'upcoming' : session.status,
      payment: 'paid', // Default for now
      paymentStatus: 'paid',
      billingSource: 'package',
      focus: '',
      sessionNotes: session.sessionNotes,
      isRecurring: false,
    }))
  );
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionsData, setSessionsData] = useState(allSessions);

  // Client Notes state
  const [clientNotes, setClientNotes] = useState(mockClientNotes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<'General' | 'Internal' | 'Admin'>('General');

  // New Session Modal state
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  // Contact Info editing state
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [editedContactInfo, setEditedContactInfo] = useState({
    email: mockClient.email,
    phone: mockClient.phone,
  });

  const toggleEngagement = (engagementId: string) => {
    setExpandedEngagements((prev) => ({
      ...prev,
      [engagementId]: !prev[engagementId],
    }));
  };

  const handleSessionClick = (session: any) => {
    setSelectedSessionId(session.id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSessionId(null);
  };
  
  const handleUpdateSession = (sessionId: string, updates: any) => {
    setSessionsData(prev => 
      prev.map(s => s.id === sessionId ? { ...s, ...updates } : s)
    );
  };

  // Client Notes handlers
  const handleAddNote = () => {
    setIsAddingNote(true);
  };

  const handleSaveNote = () => {
    if (newNoteContent.trim()) {
      const newNote = {
        id: `cn-${Date.now()}`,
        content: newNoteContent.trim(),
        timestamp: new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        }),
        tag: newNoteTag,
      };
      setClientNotes([newNote, ...clientNotes]);
      setNewNoteContent('');
      setNewNoteTag('General');
      setIsAddingNote(false);
    }
  };

  const handleCancelNote = () => {
    setNewNoteContent('');
    setNewNoteTag('General');
    setIsAddingNote(false);
  };

  // Contact Info handlers
  const handleEditContactInfo = () => {
    setIsEditingContactInfo(true);
  };

  const handleSaveContactInfo = () => {
    // In a real app, this would make an API call
    console.log('Saving contact info:', editedContactInfo);
    setIsEditingContactInfo(false);
  };

  const handleCancelContactInfo = () => {
    // Reset to original values
    setEditedContactInfo({
      email: mockClient.email,
      phone: mockClient.phone,
    });
    setIsEditingContactInfo(false);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Internal':
        return { bg: 'rgba(110, 91, 206, 0.08)', text: '#6E5BCE' };
      case 'Admin':
        return { bg: 'rgba(251, 146, 60, 0.08)', text: '#EA580C' };
      case 'General':
      default:
        return { bg: 'rgba(100, 100, 100, 0.08)', text: 'rgba(80, 80, 80, 0.8)' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: colors.status.successBg, text: colors.status.success, border: colors.status.successBorder };
      case 'scheduled':
        return { bg: colors.badge.scheduled.bg, text: colors.badge.scheduled.text, border: colors.border.subtle };
      case 'cancelled':
        return { bg: colors.semantic.error.bg, text: colors.semantic.error.text, border: colors.border.subtle };
      case 'active':
        return { bg: colors.badge.active.bg, text: colors.badge.active.text, border: colors.border.subtle };
      default:
        return { bg: colors.badge.scheduled.bg, text: colors.badge.scheduled.text, border: colors.border.subtle };
    }
  };

  return (
    <Box>
      {/* Back Button */}
      <Box sx={{ mb: 5 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clients')}
          sx={{
            color: 'rgba(80, 80, 80, 0.8)',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '14px',
            px: 2,
            py: 1,
            borderRadius: '8px',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              color: colors.text.primary,
              transform: 'translateX(-4px)',
            },
            '&:active': {
              transform: 'translateX(-2px)',
            },
          }}
        >
          Back to Clients
        </Button>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: '32px' }}>
            {mockClient.name}
          </Typography>

          {/* Action Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsNewSessionModalOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              bgcolor: '#8B5CF6',
              color: 'white',
              height: '42px',
              px: 3.5,
              borderRadius: '10px',
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                bgcolor: '#7C3AED',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
              },
            }}
          >
            New Session
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: 'rgba(100, 100, 100, 0.75)', fontSize: '14px', mb: 3.5 }}>
          Client since {mockClient.joinDate}  •  {mockClient.totalEngagements} engagements  •  {mockClient.totalLifetimeRevenue} lifetime
        </Typography>

        {/* Next Step Indicator */}
        <Box
          sx={{
            bgcolor: 'rgba(110, 91, 206, 0.04)',
            border: '1px solid rgba(110, 91, 206, 0.12)',
            borderRadius: '10px',
            px: 3,
            py: 2,
            mb: 4,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: colors.neutral.gray600,
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              display: 'block',
              mb: 0.75,
            }}
          >
            Next Step
          </Typography>
          <Typography sx={{ fontSize: '14px', color: colors.text.primary, fontWeight: 500 }}>
            Next session scheduled Feb 18 at 2:00 PM
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />
      </Box>

      {/* Two Column Layout */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Left Column - Journey Overview */}
        <Box sx={{ flex: { xs: 1, md: '0 0 calc(70% - 16px)' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6.5 }}>
            {mockEngagements.map((engagement) => {
              const isExpanded = expandedEngagements[engagement.id];
              const statusColors = getStatusColor(engagement.status);
              const isActive = engagement.status === 'active';

              // Merge sessions and notes into chronological timeline
              const timelineItems: Array<{ type: 'session' | 'note'; data: any; date: string }> = [
                ...engagement.sessions.map(s => ({ 
                  type: 'session' as const, 
                  data: s, 
                  date: s.date 
                })),
                ...engagement.notes.map(n => ({ 
                  type: 'note' as const, 
                  data: n, 
                  date: n.date 
                }))
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return (
                <Box key={engagement.id}>
                  {/* Engagement Container */}
                  <Box
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      ...(isActive ? {
                        bgcolor: 'white',
                        borderRadius: '14px',
                        p: 4.5,
                        boxShadow: '0 4px 20px rgba(110, 91, 206, 0.12)',
                        border: '2px solid rgba(110, 91, 206, 0.15)',
                      } : {
                        bgcolor: '#FAFBFC',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '10px',
                        p: 3,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#F7F9FA',
                          borderColor: 'rgba(0, 0, 0, 0.08)',
                        },
                      }),
                    }}
                  >
                    {/* Engagement Header */}
                    <Box sx={{ cursor: 'pointer' }} onClick={() => toggleEngagement(engagement.id)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: isActive ? 3 : 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: isActive ? 1 : 0.75 }}>
                            {isActive && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(110, 91, 206, 0.7)',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                }}
                              >
                                Current Phase
                              </Typography>
                            )}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: isActive ? 650 : 500,
                                color: isActive ? '#1A1A1A' : 'rgba(60, 60, 60, 0.9)',
                                fontSize: isActive ? '20px' : '16px',
                              }}
                            >
                              {engagement.name}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={engagement.status === 'active' ? 'Active' : 'Completed'}
                              size="small"
                              sx={{
                                bgcolor: statusColors.bg,
                                color: statusColors.text,
                                border: `1px solid ${statusColors.border}`,
                                fontWeight: 600,
                                fontSize: '11px',
                                height: '22px',
                              }}
                            />
                            <Typography variant="body2" sx={{ fontSize: '13px', color: 'rgba(80, 80, 80, 0.7)' }}>
                              {engagement.startDate} – {engagement.endDate}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '13px', color: 'rgba(80, 80, 80, 0.7)' }}>
                              {engagement.revenue}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '13px', color: 'rgba(80, 80, 80, 0.7)', mb: 0.5 }}>
                              {engagement.sessionsUsed} of {engagement.totalSessions} sessions
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={engagement.progress}
                              sx={{
                                width: 120,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(110, 91, 206, 0.08)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: isActive ? '#8B5CF6' : 'rgba(110, 91, 206, 0.4)',
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                          <IconButton size="small" sx={{ color: 'rgba(80, 80, 80, 0.6)' }}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    {/* Engagement Timeline - Collapsible */}
                    <Collapse in={isExpanded}>
                      <Divider sx={{ my: 3, borderColor: 'rgba(0, 0, 0, 0.06)' }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {timelineItems.map((item) => {
                          if (item.type === 'session') {
                            const session = item.data;
                            const sessionStatusColors = getStatusColor(session.status);
                            
                            return (
                              <Card
                                key={session.id}
                                sx={{
                                  cursor: 'pointer',
                                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                  border: '1px solid rgba(0, 0, 0, 0.06)',
                                  boxShadow: 'none',
                                  '&:hover': {
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                    borderColor: 'rgba(110, 91, 206, 0.2)',
                                    transform: 'translateY(-1px)',
                                  },
                                }}
                                onClick={() => handleSessionClick(session)}
                              >
                                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                        <VideoCallIcon sx={{ fontSize: 18, color: 'rgba(110, 91, 206, 0.6)' }} />
                                        <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                                          {session.title || 'Session'}
                                        </Typography>
                                        <Chip
                                          label={session.status === 'scheduled' ? 'Scheduled' : session.status === 'completed' ? 'Completed' : 'Cancelled'}
                                          size="small"
                                          sx={{
                                            bgcolor: sessionStatusColors.bg,
                                            color: sessionStatusColors.text,
                                            border: `1px solid ${sessionStatusColors.border}`,
                                            fontWeight: 600,
                                            fontSize: '10px',
                                            height: '20px',
                                          }}
                                        />
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <CalendarTodayIcon sx={{ fontSize: 13, color: 'rgba(80, 80, 80, 0.5)' }} />
                                          <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                            {session.date} at {session.time}
                                          </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                          {session.duration}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'rgba(80, 80, 80, 0.7)' }}>
                                          {session.method}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          } else {
                            const note = item.data;
                            return (
                              <Box
                                key={note.id}
                                sx={{
                                  bgcolor: 'rgba(251, 146, 60, 0.04)',
                                  border: '1px solid rgba(251, 146, 60, 0.15)',
                                  borderRadius: '8px',
                                  p: 2,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                  <NoteIcon sx={{ fontSize: 16, color: 'rgba(251, 146, 60, 0.7)', mt: 0.25 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '13px', color: colors.text.primary, mb: 0.5 }}>
                                      {note.content}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '11px', color: 'rgba(80, 80, 80, 0.6)' }}>
                                      {note.date}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          }
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Right Column - Client Info & Notes */}
        <Box sx={{ flex: { xs: 1, md: '0 0 calc(30% - 16px)' } }}>
          <Box sx={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Contact Information Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                    Contact Information
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={isEditingContactInfo ? handleSaveContactInfo : handleEditContactInfo}
                    sx={{ color: colors.primary.main }}
                  >
                    {isEditingContactInfo ? <SaveIcon sx={{ fontSize: 18 }} /> : <EditIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'rgba(110, 91, 206, 0.6)', mt: 0.25 }} />
                    {isEditingContactInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedContactInfo.email}
                        onChange={(e) => setEditedContactInfo({ ...editedContactInfo, email: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                      />
                    ) : (
                      <Box>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(80, 80, 80, 0.6)', mb: 0.25 }}>
                          Email
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: colors.text.primary }}>
                          {mockClient.email}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <PhoneIcon sx={{ fontSize: 18, color: 'rgba(110, 91, 206, 0.6)', mt: 0.25 }} />
                    {isEditingContactInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedContactInfo.phone}
                        onChange={(e) => setEditedContactInfo({ ...editedContactInfo, phone: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                      />
                    ) : (
                      <Box>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(80, 80, 80, 0.6)', mb: 0.25 }}>
                          Phone
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: colors.text.primary }}>
                          {mockClient.phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {isEditingContactInfo && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleCancelContactInfo}
                    sx={{ mt: 2, textTransform: 'none', fontSize: '13px' }}
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Client Notes Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                    Client Notes
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={handleAddNote}
                    disabled={isAddingNote}
                    sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.primary.main,
                      minWidth: 0,
                      px: 1.5,
                    }}
                  >
                    Add
                  </Button>
                </Box>

                {/* Add Note Form */}
                {isAddingNote && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(110, 91, 206, 0.02)', borderRadius: '8px' }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Add a note..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={newNoteTag}
                          onChange={(e) => setNewNoteTag(e.target.value as 'General' | 'Internal' | 'Admin')}
                          sx={{ fontSize: '12px' }}
                        >
                          <MenuItem value="General">General</MenuItem>
                          <MenuItem value="Internal">Internal</MenuItem>
                          <MenuItem value="Admin">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleSaveNote}
                        sx={{
                          textTransform: 'none',
                          fontSize: '12px',
                          bgcolor: colors.primary.main,
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleCancelNote}
                        sx={{ textTransform: 'none', fontSize: '12px' }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Notes List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {clientNotes.map((note) => {
                    const tagColors = getTagColor(note.tag);
                    return (
                      <Box
                        key={note.id}
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                          <Chip
                            label={note.tag}
                            size="small"
                            sx={{
                              bgcolor: tagColors.bg,
                              color: tagColors.text,
                              fontWeight: 600,
                              fontSize: '10px',
                              height: '20px',
                            }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(80, 80, 80, 0.5)' }}>
                            {note.timestamp}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '13px', color: colors.text.primary, lineHeight: 1.5 }}>
                          {note.content}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Session Details Drawer */}
      <SessionDetailsDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        sessions={sessionsData}
        sessionId={selectedSessionId}
        onUpdateSession={handleUpdateSession}
      />

      {/* New Session Modal */}
      <NewSessionModal 
        open={isNewSessionModalOpen} 
        onClose={() => setIsNewSessionModalOpen(false)}
        preselectedClientId={mockClient.id}
      />
    </Box>
  );
}