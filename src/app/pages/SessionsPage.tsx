import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  IconButton,
  Typography,
  Button,
  Avatar,
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Menu,
  FormControlLabel,
  Checkbox,
  Divider,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import RepeatIcon from '@mui/icons-material/Repeat';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { PageHeader } from '../components/PageHeader';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { NewSessionModal } from '../components/NewSessionModal';
import { sessionsData as initialSessionsData, Session, StatusFilter } from '../data/sessionsData';
import { useLocation } from 'react-router';

export function SessionsPage() {
  const location = useLocation();
  const [sessionsData, setSessionsData] = useState(initialSessionsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [customDateFilter, setCustomDateFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSessionDetailsDrawerOpen, setIsSessionDetailsDrawerOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Check if we navigated from calendar or dashboard with a specific session ID
  const highlightSessionId = location.state?.sessionId;

  // Apply filters from navigation state if coming from calendar or dashboard
  useEffect(() => {
    if (location.state?.sessionId && (location.state?.fromCalendar || location.state?.fromDashboard)) {
      // Find the session by ID
      const session = sessionsData.find((s) => s.id === location.state.sessionId);
      if (session) {
        // Apply filters to show this specific session
        setCustomDateFilter(format(session.date, 'yyyy-MM-dd'));
        setDateRangeFilter('custom');
        setClientFilter(session.client);
        if (location.state?.fromDashboard) {
          setStatusFilter('upcoming');
        }
      }
    }
    
    // Apply date range filter from dashboard
    if (location.state?.dateRange && location.state?.fromDashboard) {
      setDateRangeFilter(location.state.dateRange);
    }
  }, [location.state]);

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(
    new Set(sessionsData.map((session) => session.client))
  ).sort();

  // Get date range based on filter selection
  const getDateRange = (): { start: Date; end: Date } | null => {
    const now = new Date();
    
    switch (dateRangeFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'this-week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        if (customDateFilter) {
          const customDate = new Date(customDateFilter);
          return { start: startOfDay(customDate), end: endOfDay(customDate) };
        }
        return null;
      default:
        return null;
    }
  };

  const handleSessionClick = (session: typeof sessionsData[0]) => {
    setSelectedSessionId(session.id);
    setIsSessionDetailsDrawerOpen(true);
  };

  const handleUpdateSession = (sessionId: string, updates: Partial<typeof sessionsData[0]>) => {
    setSessionsData(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setClientFilter('all');
    setDateRangeFilter('all');
    setCustomDateFilter('');
    setLocationFilter('all');
    setPaymentFilter('all');
    setStatusFilter('upcoming');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    clientFilter !== 'all' || 
    dateRangeFilter !== 'all' || 
    locationFilter !== 'all' || 
    paymentFilter !== 'all' || 
    statusFilter !== 'upcoming';

  // Filter sessions
  const dateRange = getDateRange();
  
  const filteredSessions = sessionsData
    .filter((session) => {
      const matchesSearch =
        session.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sessionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.focus.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClient = clientFilter === 'all' || session.client === clientFilter;
      
      const matchesDateRange = !dateRange || isWithinInterval(session.date, { start: dateRange.start, end: dateRange.end });
      
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      
      const matchesLocation = locationFilter === 'all' || session.location === locationFilter;
      
      const matchesPayment = paymentFilter === 'all' || session.paymentStatus === paymentFilter;
      
      return matchesSearch && matchesClient && matchesDateRange && matchesStatus && matchesLocation && matchesPayment;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Chronological order

  // Separate upcoming and past sessions
  const upcomingSessions = filteredSessions.filter((s) => s.status === 'upcoming');
  const pastSessions = filteredSessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  // Limit upcoming sessions to 6 unless showAllUpcoming is true
  const displayedUpcomingSessions = showAllUpcoming ? upcomingSessions : upcomingSessions.slice(0, 6);
  const hasMoreUpcoming = upcomingSessions.length > 6;

  const getStatusStyles = (status: string) => {
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

  const getPaymentStyles = (payment: string) => {
    switch (payment) {
      case 'paid':
        return { bgcolor: 'rgba(168, 181, 160, 0.12)', color: '#5B7052', border: '1px solid rgba(168, 181, 160, 0.2)' };
      case 'package':
        return { bgcolor: 'rgba(155, 139, 158, 0.12)', color: '#7A6B7D', border: '1px solid rgba(155, 139, 158, 0.2)' };
      case 'unpaid':
        return { bgcolor: 'rgba(212, 184, 138, 0.12)', color: '#8B7444', border: '1px solid rgba(212, 184, 138, 0.2)' };
      default:
        return { bgcolor: '#F5F3F1', color: '#7A746F', border: '1px solid #E8E5E1' };
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'zoom':
        return <VideocamIcon sx={{ fontSize: 18, color: '#9A9490' }} />;
      case 'phone':
        return <PhoneIcon sx={{ fontSize: 18, color: '#9A9490' }} />;
      case 'office':
        return <BusinessIcon sx={{ fontSize: 18, color: '#9A9490' }} />;
      default:
        return <BusinessIcon sx={{ fontSize: 18, color: '#9A9490' }} />;
    }
  };

  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'zoom':
        return 'Zoom';
      case 'phone':
        return 'Phone';
      case 'office':
        return 'Office';
      default:
        return location.charAt(0).toUpperCase() + location.slice(1);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header - Title + Action */}
      <PageHeader
        title="Sessions"
        action={{
          label: 'New Session',
          icon: <AddIcon />,
          onClick: () => setIsNewSessionModalOpen(true),
        }}
      />

      {/* Controls - Search and Filters */}
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
          placeholder="Search by client, session type, or focus..."
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

        <FormControl sx={{ minWidth: 160, flexShrink: 0 }}>
          <InputLabel sx={{ fontSize: '15px' }}>Date Range</InputLabel>
          <Select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              if (e.target.value !== 'custom') {
                setCustomDateFilter('');
              }
            }}
            label="Date Range"
            sx={{
              borderRadius: '10px',
              fontSize: '15px',
              bgcolor: '#FFFFFF',
              height: '56px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E8E5E1',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#9B8B9E',
              },
            }}
          >
            <MenuItem value="all">
              <em>All dates</em>
            </MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="this-week">This week</MenuItem>
            <MenuItem value="this-month">This month</MenuItem>
            <MenuItem value="last-month">Last month</MenuItem>
            <MenuItem value="custom">Custom date</MenuItem>
          </Select>
        </FormControl>

        {dateRangeFilter === 'custom' && (
          <TextField
            label="Select Date"
            variant="outlined"
            value={customDateFilter}
            onChange={(e) => setCustomDateFilter(e.target.value)}
            type="date"
            InputLabelProps={{ shrink: true }}
            sx={{
              minWidth: 180,
              flexShrink: 0,
              bgcolor: '#FFFFFF',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: '#E8E5E1',
                },
                '&:hover fieldset': {
                  borderColor: '#9B8B9E',
                },
              },
            }}
          />
        )}

        <Badge
          badgeContent={(clientFilter !== 'all' ? 1 : 0) + (statusFilter !== 'upcoming' ? 1 : 0) + (locationFilter !== 'all' ? 1 : 0) + (paymentFilter !== 'all' ? 1 : 0)}
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
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
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
          >
            Filter
          </Button>
        </Badge>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              bgcolor: '#FDFCFB',
              border: '1px solid #E8E5E1',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(74, 69, 66, 0.08)',
              minWidth: '280px',
              mt: 1,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
              Client
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                sx={{
                  fontSize: '14px',
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E8E5E1',
                  },
                }}
              >
                <MenuItem value="all">
                  <em>All clients</em>
                </MenuItem>
                {uniqueClients.map((client) => (
                  <MenuItem key={client} value={client}>
                    {client}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
              Status
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilter === 'upcoming'}
                    onChange={() => setStatusFilter('upcoming')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Upcoming"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilter === 'completed'}
                    onChange={() => setStatusFilter('completed')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Completed"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilter === 'cancelled'}
                    onChange={() => setStatusFilter('cancelled')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Cancelled"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilter === 'all'}
                    onChange={() => setStatusFilter('all')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="All Statuses"
              />
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
              Location
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={locationFilter === 'zoom'}
                    onChange={() => setLocationFilter(locationFilter === 'zoom' ? 'all' : 'zoom')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Zoom"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={locationFilter === 'phone'}
                    onChange={() => setLocationFilter(locationFilter === 'phone' ? 'all' : 'phone')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Phone"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={locationFilter === 'office'}
                    onChange={() => setLocationFilter(locationFilter === 'office' ? 'all' : 'office')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Office"
              />
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
              Payment
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentFilter === 'paid'}
                    onChange={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Paid"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentFilter === 'unpaid'}
                    onChange={() => setPaymentFilter(paymentFilter === 'unpaid' ? 'all' : 'unpaid')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Unpaid"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentFilter === 'invoiced'}
                    onChange={() => setPaymentFilter(paymentFilter === 'invoiced' ? 'all' : 'invoiced')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Invoiced"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentFilter === 'package'}
                    onChange={() => setPaymentFilter(paymentFilter === 'package' ? 'all' : 'package')}
                    sx={{
                      color: '#7A746F',
                      '&.Mui-checked': {
                        color: '#9B8B9E',
                      },
                    }}
                  />
                }
                label="Package"
              />
            </Stack>
          </Box>

          {hasActiveFilters && (
            <>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    handleClearFilters();
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    borderColor: '#E8E5E1',
                    color: '#7A746F',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '8px',
                    '&:hover': {
                      borderColor: '#9B8B9E',
                      bgcolor: 'rgba(155, 139, 158, 0.04)',
                    },
                  }}
                >
                  Clear All Filters
                </Button>
              </Box>
            </>
          )}
        </Menu>
      </Box>

      {/* Upcoming Sessions */}
      {displayedUpcomingSessions.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#4A4542',
              mb: 3,
              fontSize: '18px',
              letterSpacing: '-0.01em',
            }}
          >
            Upcoming Sessions
          </Typography>
          <Stack spacing={2}>
            {displayedUpcomingSessions.map((session) => {
              const isHighlighted = session.id === highlightSessionId;
              const statusStyles = getStatusStyles(session.status);
              const paymentStyles = getPaymentStyles(session.payment);

              return (
                <Box
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 3,
                    bgcolor: isHighlighted ? 'rgba(155, 139, 158, 0.04)' : '#FFFFFF',
                    border: isHighlighted ? '1.5px solid #9B8B9E' : '1px solid #E8E5E1',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(74, 69, 66, 0.08)',
                      borderColor: '#9B8B9E',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {/* Primary Row: Avatar + Client/Type + Metadata */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Avatar */}
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: session.avatarColor,
                        fontSize: '18px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {session.initials}
                    </Avatar>

                    {/* Client & Session Type */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
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
                        {session.client} • {session.sessionType}
                      </Typography>
                      
                      {/* Secondary line: Date • Time • Duration • Method */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ color: '#6B6762', fontWeight: 500, fontSize: '14px' }}>
                          {format(session.date, 'EEE, MMM d')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#D8D5D2', fontWeight: 300, fontSize: '12px' }}>
                          •
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B6762', fontWeight: 500, fontSize: '14px' }}>
                          {format(session.date, 'h:mm a')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#D8D5D2', fontWeight: 300, fontSize: '12px' }}>
                          •
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B6762', fontWeight: 500, fontSize: '14px' }}>
                          {session.duration} min
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#D8D5D2', fontWeight: 300, fontSize: '12px' }}>
                          •
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getLocationIcon(session.location)}
                          <Typography variant="body2" sx={{ color: '#6B6762', fontSize: '14px' }}>
                            {getLocationLabel(session.location)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Right-side metadata: Billing + Payment + Recurring */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                      {/* Status Badge */}
                      <Chip
                        label={session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        sx={{
                          ...statusStyles,
                          fontWeight: 600,
                          fontSize: '11px',
                          height: 24,
                          borderRadius: '6px',
                        }}
                      />

                      {/* Billing Type Badge */}
                      <Chip
                        label={
                          session.billingSource === 'pay-per-session'
                            ? 'Pay per session'
                            : session.billingSource === 'package' && session.packageRemaining !== undefined
                            ? `Package • ${session.packageRemaining} left`
                            : 'Included'
                        }
                        sx={{
                          bgcolor: 'rgba(122, 116, 111, 0.06)',
                          color: '#7A746F',
                          border: '1px solid rgba(122, 116, 111, 0.1)',
                          fontWeight: 500,
                          fontSize: '12px',
                          height: 24,
                          borderRadius: '6px',
                        }}
                      />

                      {/* Payment Status Badge */}
                      <Chip
                        label={session.paymentStatus?.charAt(0).toUpperCase() + session.paymentStatus?.slice(1) || 'Paid'}
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
                          borderRadius: '6px',
                        }}
                      />

                      {/* Recurring Indicator */}
                      {session.isRecurring && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                          <RepeatIcon sx={{ fontSize: 16, color: '#9B8B9E' }} />
                          <Typography variant="caption" sx={{ color: '#9B8B9E', fontSize: '11px', textTransform: 'capitalize', fontWeight: 600 }}>
                            {session.recurringType}
                          </Typography>
                        </Box>
                      )}

                      {/* Session Log Indicator */}
                      {session.notes && (
                        <Tooltip title="Session log available" placement="top" arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <DescriptionOutlinedIcon sx={{ fontSize: 18, color: '#C7C2BD' }} />
                          </Box>
                        </Tooltip>
                      )}

                      {/* Arrow indicator */}
                      <ArrowForwardIcon sx={{ color: '#D0CCC7', fontSize: 20, flexShrink: 0, ml: 1 }} />
                    </Box>
                  </Box>
                </Box>
              );
            })}
            {hasMoreUpcoming && !showAllUpcoming && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="text"
                  onClick={() => setShowAllUpcoming(true)}
                  sx={{
                    color: '#9B8B9E',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '15px',
                    '&:hover': {
                      bgcolor: 'rgba(155, 139, 158, 0.08)',
                    },
                  }}
                >
                  Show All Upcoming Sessions ({upcomingSessions.length})
                </Button>
              </Box>
            )}
          </Stack>
        </Box>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#7A746F',
              mb: 3,
              fontSize: '16px',
              letterSpacing: '-0.01em',
            }}
          >
            Past Sessions
          </Typography>
          <Card
            elevation={0}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #E8E5E1',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: '#FDFCFB',
                        borderBottom: '1.5px solid #E8E5E1',
                        fontWeight: 600,
                        color: '#7A746F',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        py: 2,
                      }}
                    >
                      Client
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: '#FDFCFB',
                        borderBottom: '1.5px solid #E8E5E1',
                        fontWeight: 600,
                        color: '#7A746F',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        py: 2,
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: '#FDFCFB',
                        borderBottom: '1.5px solid #E8E5E1',
                        fontWeight: 600,
                        color: '#7A746F',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        py: 2,
                      }}
                    >
                      Session Type
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: '#FDFCFB',
                        borderBottom: '1.5px solid #E8E5E1',
                        fontWeight: 600,
                        color: '#7A746F',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        py: 2,
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pastSessions.map((session) => {
                    const statusStyles = getStatusStyles(session.status);
                    const isHighlighted = session.id === highlightSessionId;

                    return (
                      <TableRow
                        key={session.id}
                        onClick={() => handleSessionClick(session)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isHighlighted ? 'rgba(155, 139, 158, 0.04)' : 'transparent',
                          '&:hover': {
                            bgcolor: '#FDFCFB',
                          },
                          '&:last-child td': {
                            borderBottom: 0,
                          },
                        }}
                      >
                        <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F5F3F1' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: session.avatarColor,
                                fontSize: '14px',
                                fontWeight: 600,
                              }}
                            >
                              {session.initials}
                            </Avatar>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: '#4A4542', fontSize: '14px' }}
                            >
                              {session.client}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F5F3F1' }}>
                          <Typography variant="body2" sx={{ color: '#7A746F', fontSize: '14px' }}>
                            {format(session.date, 'MMM d, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F5F3F1' }}>
                          <Typography variant="body2" sx={{ color: '#7A746F', fontSize: '14px' }}>
                            {session.sessionType}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F5F3F1' }}>
                          <Chip
                            label={session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            size="small"
                            sx={{
                              ...statusStyles,
                              fontWeight: 600,
                              fontSize: '12px',
                              height: 26,
                              borderRadius: '6px',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: '#7A746F', mb: 2, fontWeight: 500 }}>
            No sessions found
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0ABA6', mb: 4 }}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating your first session'}
          </Typography>
          {!hasActiveFilters && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsNewSessionModalOpen(true)}
            >
              Create First Session
            </Button>
          )}
        </Box>
      )}

      {/* Session Details Drawer */}
      <SessionDetailsDrawer
        open={isSessionDetailsDrawerOpen}
        onClose={() => setIsSessionDetailsDrawerOpen(false)}
        sessionId={selectedSessionId}
        sessions={sessionsData}
        onUpdateSession={handleUpdateSession}
      />

      {/* New Session Modal */}
      <NewSessionModal
        open={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
      />
    </Box>
  );
}