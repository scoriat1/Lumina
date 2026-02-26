import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Drawer,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Divider,
  Stack,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import { useLocation, useNavigate } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { AddClientModal, ClientFormData } from '../components/AddClientModal';
import { apiClient } from '../api/client';

interface Client {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  program: string;
  progress: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSession?: string;
  status: 'active' | 'paused' | 'completed';
  email: string;
  phone: string;
  startDate: string;
  notes?: string;
}

export function ClientsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [programFilters, setProgramFilters] = useState<Set<string>>(new Set());
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.getClients().then(setClients).catch(() => setClients([]));
  }, []);

  // Check if we navigated from dashboard with a client ID to filter
  useEffect(() => {
    if (location.state?.clientId && location.state?.fromDashboard) {
      const client = clients.find((c) => c.id === location.state.clientId);
      if (client) {
        setSearchQuery(client.name);
      }
    }
    // Check if we navigated from dashboard with a status filter
    if (location.state?.statusFilter && location.state?.fromDashboard) {
      setStatusFilters(new Set([location.state.statusFilter]));
    }
  }, [location.state]);

  const handleRowClick = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // Keep the selected client ID for a smooth transition
    setTimeout(() => setSelectedClientId(null), 300);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusFilterToggle = (status: string) => {
    const newFilters = new Set(statusFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setStatusFilters(newFilters);
  };

  const handleProgramFilterToggle = (program: string) => {
    const newFilters = new Set(programFilters);
    if (newFilters.has(program)) {
      newFilters.delete(program);
    } else {
      newFilters.add(program);
    }
    setProgramFilters(newFilters);
  };

  const handleClearFilters = () => {
    setStatusFilters(new Set());
    setProgramFilters(new Set());
    setSearchQuery('');
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(168, 181, 160, 0.12)', text: '#7A8873' };
      case 'paused':
        return { bg: 'rgba(212, 184, 138, 0.12)', text: '#A88F5F' };
      case 'completed':
        return { bg: 'rgba(155, 139, 158, 0.12)', text: '#6D5F70' };
      default:
        return { bg: 'rgba(122, 116, 111, 0.12)', text: '#7A746F' };
    }
  };

  // Get unique programs for filter
  const uniquePrograms = Array.from(new Set(clients.map((c) => c.program))).sort();

  // Apply all filters
  const filteredClients = clients.filter((client) => {
    // Search filter
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.program.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus =
      statusFilters.size === 0 || statusFilters.has(client.status);
    
    // Program filter
    const matchesProgram =
      programFilters.size === 0 || programFilters.has(client.program);

    return matchesSearch && matchesStatus && matchesProgram;
  });

  const activeFilterCount = statusFilters.size + programFilters.size;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Compact Page Header - Title Only (no subtitle) */}
      <PageHeader title="Clients" />

      {/* Row 2: Search and Filter Controls */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <TextField
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: { xs: '1 1 auto', sm: '0 1 auto' },
            minWidth: 0,
            width: { sm: '500px' },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#F5F3F1',
              borderRadius: '10px',
              '& fieldset': {
                borderColor: '#E8E5E1',
              },
              '&:hover fieldset': {
                borderColor: '#9B8B9E',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9B9691' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{
                    color: '#9B9691',
                    '&:hover': {
                      bgcolor: 'rgba(155, 139, 158, 0.08)',
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Badge
          badgeContent={activeFilterCount}
          color="primary"
          sx={{
            flexShrink: 0,
            '& .MuiBadge-badge': {
              bgcolor: '#9B8B9E',
              color: '#FFFFFF',
            },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{
              borderColor: '#E8E5E1',
              color: '#7A746F',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              minWidth: '140px',
              height: '56px',
              px: 3,
              '&:hover': {
                borderColor: '#9B8B9E',
                bgcolor: 'rgba(155, 139, 158, 0.04)',
              },
            }}
            onClick={handleFilterClick}
          >
            Filter
          </Button>
        </Badge>

        {/* Spacer to push Add Client button to the right */}
        <Box sx={{ flex: 1 }} />

        {/* Add Client Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setIsAddClientModalOpen(true)}
        >
          Add Client
        </Button>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              bgcolor: '#FDFCFB',
              border: '1px solid #E8E5E1',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(74, 69, 66, 0.08)',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
              Status
            </Typography>
            <Stack spacing={1}>
              {['active', 'paused', 'completed'].map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={statusFilters.has(status)}
                      onChange={() => handleStatusFilterToggle(status)}
                      sx={{
                        color: '#7A746F',
                        '&.Mui-checked': {
                          color: '#9B8B9E',
                        },
                      }}
                    />
                  }
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                />
              ))}
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
              Program
            </Typography>
            <Stack spacing={1}>
              {uniquePrograms.map((program) => (
                <FormControlLabel
                  key={program}
                  control={
                    <Checkbox
                      checked={programFilters.has(program)}
                      onChange={() => handleProgramFilterToggle(program)}
                      sx={{
                        color: '#7A746F',
                        '&.Mui-checked': {
                          color: '#9B8B9E',
                        },
                      }}
                    />
                  }
                  label={program}
                />
              ))}
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="text"
              sx={{
                color: '#9B8B9E',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(155, 139, 158, 0.04)',
                },
              }}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Box>
        </Menu>
      </Box>

      {/* Clients List - Compact Rows */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pr: 1 }}>
        {filteredClients.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 3,
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: '#D0CCC7', mb: 2 }} />
            <Typography
              variant="h6"
              sx={{
                color: '#7A746F',
                fontWeight: 600,
                mb: 1,
                textAlign: 'center',
              }}
            >
              No clients found
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#9A9490',
                textAlign: 'center',
                maxWidth: 400,
              }}
            >
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by adding your first client.'}
            </Typography>
            {(searchQuery || activeFilterCount > 0) && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{
                  mt: 3,
                  borderColor: '#E8E5E1',
                  color: '#7A746F',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    borderColor: '#9B8B9E',
                    bgcolor: 'rgba(155, 139, 158, 0.04)',
                  },
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={2}>
            {filteredClients.map((client) => {
              const statusColors = getStatusColor(client.status);
              const isHighlighted = selectedClientId === client.id;

              return (
                <Box
                  key={client.id}
                  onClick={() => handleRowClick(client)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 2, md: 3 },
                    p: { xs: 2, sm: 2.5, md: 3 },
                    bgcolor: isHighlighted ? 'rgba(155, 139, 158, 0.04)' : '#FFFFFF',
                    border: isHighlighted ? '1.5px solid #9B8B9E' : '1px solid #E8E5E1',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(74, 69, 66, 0.08)',
                      borderColor: '#9B8B9E',
                      transform: { xs: 'none', md: 'translateX(4px)' },
                    },
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      bgcolor: client.avatarColor,
                      fontSize: { xs: '16px', sm: '18px' },
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {client.initials}
                  </Avatar>

                  {/* Client Name & Email */}
                  <Box sx={{ minWidth: { xs: 0, md: 200 }, flexShrink: 0, flex: { xs: 1, md: 0 } }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: '#1F1C1A',
                        mb: 0.5,
                        fontSize: '16px',
                        letterSpacing: '-0.015em',
                      }}
                    >
                      {client.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#9B9691',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {client.email}
                    </Typography>
                  </Box>

                  {/* Program */}
                  <Box sx={{ minWidth: { xs: 0, md: 220 }, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6B6762',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {client.program}
                    </Typography>
                  </Box>

                  {/* Progress */}
                  <Box sx={{ minWidth: { xs: 0, md: 180 }, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#9A9490', fontSize: '13px' }}>
                        {client.sessionsCompleted}/{client.totalSessions} sessions
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={client.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(155, 139, 158, 0.12)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: client.avatarColor,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>

                  {/* Next Session */}
                  <Box sx={{ minWidth: { xs: 0, md: 140 }, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#9A9490',
                        fontSize: '14px',
                      }}
                    >
                      {client.nextSession || '—'}
                    </Typography>
                  </Box>

                  {/* Status Badge */}
                  <Box sx={{ flexShrink: 0 }}>
                    <Chip
                      label={client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      sx={{
                        bgcolor: statusColors.bg,
                        color: statusColors.text,
                        fontWeight: 600,
                        fontSize: '12px',
                        height: 26,
                        borderRadius: '8px',
                      }}
                    />
                  </Box>

                  {/* Arrow indicator */}
                  <ArrowForwardIcon sx={{ color: '#D0CCC7', fontSize: 20, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Right Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 420 },
            bgcolor: '#FDFCFB',
            borderLeft: '1px solid #E8E5E1',
          },
        }}
      >
        {selectedClientId && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box
              sx={{
                p: 4,
                bgcolor: '#FAF8F6',
                borderBottom: '1px solid #E8E5E1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: clients.find((c) => c.id === selectedClientId)?.avatarColor,
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '20px',
                    }}
                  >
                    {clients.find((c) => c.id === selectedClientId)?.initials}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#4A4542', mb: 0.5 }}>
                      {clients.find((c) => c.id === selectedClientId)?.name}
                    </Typography>
                    <Chip
                      label={
                        clients.find((c) => c.id === selectedClientId)?.status.charAt(0).toUpperCase() +
                        clients.find((c) => c.id === selectedClientId)?.status.slice(1)
                      }
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(clients.find((c) => c.id === selectedClientId)?.status as Client['status']).bg,
                        color: getStatusColor(clients.find((c) => c.id === selectedClientId)?.status as Client['status']).text,
                        fontWeight: 600,
                        fontSize: '12px',
                        height: 24,
                        borderRadius: '6px',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              <IconButton onClick={handleDrawerClose} sx={{ color: '#7A746F' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Drawer Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
              {/* Tabs */}
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{
                  mb: 4,
                  '& .MuiTabs-indicator': {
                    bgcolor: '#9B8B9E',
                  },
                }}
              >
                <Tab
                  label="Overview"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#7A746F',
                    '&.Mui-selected': {
                      color: '#9B8B9E',
                    },
                  }}
                />
                <Tab
                  label="Sessions"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#7A746F',
                    '&.Mui-selected': {
                      color: '#9B8B9E',
                    },
                  }}
                />
                <Tab
                  label="Notes"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#7A746F',
                    '&.Mui-selected': {
                      color: '#9B8B9E',
                    },
                  }}
                />
              </Tabs>

              {/* Tab Content: Overview */}
              {tabValue === 0 && (
                <Box>
                  {/* Contact Information */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}
                    >
                      Contact Information
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#F5F3F1',
                        borderRadius: '12px',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EmailIcon sx={{ color: '#9B8B9E', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#4A4542' }}>
                          {clients.find((c) => c.id === selectedClientId)?.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PhoneIcon sx={{ color: '#9B8B9E', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#4A4542' }}>
                          {clients.find((c) => c.id === selectedClientId)?.phone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EventIcon sx={{ color: '#9B8B9E', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#4A4542' }}>
                          Started: {clients.find((c) => c.id === selectedClientId)?.startDate}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Program Details */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}
                    >
                      Program Details
                    </Typography>
                    <Box sx={{ bgcolor: '#F5F3F1', borderRadius: '12px', p: 3 }}>
                      <Typography
                        variant="body1"
                        sx={{ color: '#4A4542', fontWeight: 600, mb: 2 }}
                      >
                        {clients.find((c) => c.id === selectedClientId)?.program}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#7A746F', fontSize: '13px' }}>
                          Progress
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#4A4542', fontSize: '13px', fontWeight: 600 }}
                        >
                          {clients.find((c) => c.id === selectedClientId)?.sessionsCompleted}/{clients.find((c) => c.id === selectedClientId)?.totalSessions}{' '}
                          sessions
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={clients.find((c) => c.id === selectedClientId)?.progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(155, 139, 158, 0.12)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: clients.find((c) => c.id === selectedClientId)?.avatarColor,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Next Session */}
                  {clients.find((c) => c.id === selectedClientId)?.nextSession && (
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}
                      >
                        Next Session
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: 'rgba(168, 181, 160, 0.08)',
                          border: '1px solid rgba(168, 181, 160, 0.2)',
                          borderRadius: '12px',
                          p: 3,
                        }}
                      >
                        <Typography variant="body1" sx={{ color: '#4A4542', fontWeight: 600 }}>
                          {clients.find((c) => c.id === selectedClientId)?.nextSession}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Notes */}
                  {clients.find((c) => c.id === selectedClientId)?.notes && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}
                      >
                        Notes
                      </Typography>
                      <Box sx={{ bgcolor: '#F5F3F1', borderRadius: '12px', p: 3 }}>
                        <Typography variant="body2" sx={{ color: '#4A4542', lineHeight: 1.6 }}>
                          {clients.find((c) => c.id === selectedClientId)?.notes}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab Content: Sessions */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#7A746F', mb: 3 }}>
                    Session history and upcoming sessions will be displayed here.
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: '#F5F3F1',
                      borderRadius: '12px',
                      p: 4,
                      textAlign: 'center',
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 48, color: '#9B9691', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#7A746F' }}>
                      Session details coming soon
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tab Content: Notes */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#7A746F', mb: 3 }}>
                    Session notes and client observations.
                  </Typography>
                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    placeholder="Add notes about this client..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#F5F3F1',
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: '#E8E5E1',
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Drawer Footer */}
            <Box
              sx={{
                p: 4,
                borderTop: '1px solid #E8E5E1',
                bgcolor: '#FAF8F6',
              }}
            >
              <Button
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: '#9B8B9E',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#8A7A8D',
                  },
                }}
              >
                Schedule Session
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Add Client Modal */}
      <AddClientModal
        open={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSave={(clientData) => {
          console.log('New client data:', clientData);
          // In a real app, this would save to a backend
          setIsAddClientModalOpen(false);
        }}
      />
    </Box>
  );
}