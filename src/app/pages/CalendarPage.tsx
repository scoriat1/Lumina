import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  addWeeks,
  subWeeks,
  getHours,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate, useLocation } from 'react-router';
import { SessionDetailsDrawer } from '../components/SessionDetailsDrawer';
import { NewSessionModal } from '../components/NewSessionModal';
import { calendarEvents } from '../data/calendarEvents';
import { PageHeader } from '../components/PageHeader';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarPage() {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionInitialDate, setNewSessionInitialDate] = useState<string | undefined>();
  const [newSessionInitialTime, setNewSessionInitialTime] = useState<string | undefined>();
  const navigate = useNavigate();

  // Set to current month if navigating from dashboard
  useEffect(() => {
    if (location.state?.viewMonth === 'current' && location.state?.fromDashboard) {
      setCurrentDate(new Date());
      setViewMode('month');
    }
  }, [location.state]);

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter((event) => isSameDay(event.date, day));
  };

  const handleSessionClick = (sessionId: string) => {
    const session = calendarEvents.find(s => s.id === sessionId);
    if (session) {
      navigate('/sessions', { 
        state: { 
          sessionId,
          fromCalendar: true,
        } 
      });
    }
  };

  const handleDayClick = (day: Date) => {
    // Don't allow scheduling on past dates
    if (isBefore(startOfDay(day), startOfDay(new Date()))) {
      return;
    }
    setNewSessionInitialDate(format(day, 'yyyy-MM-dd'));
    setNewSessionInitialTime(undefined);
    setIsNewSessionModalOpen(true);
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    // Don't allow scheduling on past dates/times
    const slotDateTime = new Date(day);
    slotDateTime.setHours(hour, 0, 0, 0);
    if (isBefore(slotDateTime, new Date())) {
      return;
    }
    setNewSessionInitialDate(format(day, 'yyyy-MM-dd'));
    setNewSessionInitialTime(format(new Date().setHours(hour, 0), 'HH:mm'));
    setIsNewSessionModalOpen(true);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Day headers */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #E8E5E1', bgcolor: '#F9F8F7' }}>
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <Box
              key={day}
              sx={{
                flex: 1,
                py: 2,
                textAlign: 'center',
                borderRight: '1px solid #E8E5E1',
                '&:last-child': { borderRight: 'none' },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4542', fontSize: '14px' }}>
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar grid - rows grow to fit content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {weeks.map((week, weekIndex) => (
            <Box 
              key={weekIndex} 
              sx={{ 
                display: 'flex', 
                minHeight: 120,
                borderBottom: '1px solid #E8E5E1' 
              }}
            >
              {week.map((day) => {
                const events = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isPastDate = isBefore(startOfDay(day), startOfDay(new Date()));

                return (
                  <Box
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      width: `${100 / 7}%`,
                      borderRight: '1px solid #E8E5E1',
                      bgcolor: isCurrentMonth ? '#FFFFFF' : '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:last-child': { borderRight: 'none' },
                      '&:hover': {
                        bgcolor: isPastDate ? (isCurrentMonth ? '#FFFFFF' : '#FAFAFA') : (isCurrentMonth ? '#FDFCFB' : '#F9F8F7'),
                      },
                      cursor: isPastDate ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {/* Day number - top left */}
                    <Box 
                      sx={{ 
                        pt: 2, 
                        px: 1.5, 
                        pb: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isTodayDate ? '#6E5BCE' : 'transparent',
                          color: isTodayDate ? '#FFFFFF' : isCurrentMonth ? '#7A746F' : '#B0ABA6',
                          fontWeight: isTodayDate ? 600 : 500,
                          fontSize: '13px',
                        }}
                      >
                        {format(day, 'd')}
                      </Box>
                    </Box>

                    {/* Events - all visible, no limit */}
                    <Box
                      sx={{
                        px: 1.5,
                        pb: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      {events.map((event) => (
                        <Box
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(event.id);
                          }}
                          sx={{
                            px: 1.25,
                            py: 0.5,
                            borderRadius: '4px',
                            bgcolor: event.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'pointer',
                            flexShrink: 0,
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {format(event.date, 'h:mm a')} {event.client}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Day headers */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #E8E5E1', bgcolor: '#F9F8F7' }}>
          {weekDays.map((day) => {
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDay(day);
            return (
              <Box
                key={day.toString()}
                sx={{
                  flex: 1,
                  py: 2.5,
                  textAlign: 'center',
                  borderRight: '1px solid #E8E5E1',
                  bgcolor: isTodayDate ? 'rgba(155, 139, 158, 0.05)' : '#F9F8F7',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:last-child': { borderRight: 'none' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#7A746F', fontSize: '11px', textTransform: 'uppercase' }}>
                  {format(day, 'EEE')}
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isTodayDate ? '#9B8B9E' : 'transparent',
                    color: isTodayDate ? '#FFFFFF' : '#4A4542',
                    fontWeight: isTodayDate ? 700 : 600,
                    fontSize: '18px',
                  }}
                >
                  {format(day, 'd')}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 500, color: '#7A746F', fontSize: '11px' }}>
                  {dayEvents.length} {dayEvents.length === 1 ? 'session' : 'sessions'}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Day columns with events */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day).sort((a, b) => a.date.getTime() - b.date.getTime());
            const isTodayDate = isToday(day);
            const isPastDate = isBefore(startOfDay(day), startOfDay(new Date()));

            return (
              <Box
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                sx={{
                  flex: 1,
                  borderRight: '1px solid #E8E5E1',
                  bgcolor: isTodayDate ? 'rgba(155, 139, 158, 0.02)' : '#FFFFFF',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  '&:last-child': { borderRight: 'none' },
                  '&:hover': {
                    bgcolor: isPastDate ? (isTodayDate ? 'rgba(155, 139, 158, 0.02)' : '#FFFFFF') : (isTodayDate ? 'rgba(155, 139, 158, 0.05)' : '#FDFCFB'),
                  },
                  cursor: isPastDate ? 'not-allowed' : 'pointer',
                }}
              >
                {dayEvents.length === 0 ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#B0ABA6',
                      textAlign: 'center',
                      mt: 2,
                      fontStyle: 'italic',
                    }}
                  >
                    No sessions
                  </Typography>
                ) : (
                  dayEvents.map((event) => (
                    <Paper
                      key={event.id}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        bgcolor: event.avatarColor,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          elevation: 3,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleSessionClick(event.id)}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '13px',
                          mb: 0.5,
                        }}
                      >
                        {format(event.date, 'h:mm a')}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '13px',
                          mb: 0.25,
                        }}
                      >
                        {event.client}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '11px',
                          display: 'block',
                        }}
                      >
                        {event.sessionType}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontSize: '10px',
                          display: 'block',
                          mt: 0.25,
                        }}
                      >
                        {event.duration} min
                      </Typography>
                    </Paper>
                  ))
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
    const dayEvents = getEventsForDay(currentDate);

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Day header */}
        <Box
          sx={{
            p: 3,
            bgcolor: '#F9F8F7',
            borderBottom: '2px solid #E8E5E1',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#4A4542', mb: 0.5 }}>
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#7A746F' }}>
            {dayEvents.length} {dayEvents.length === 1 ? 'session' : 'sessions'} scheduled
          </Typography>
        </Box>

        {/* Time slots */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => getHours(event.date) === hour);

            return (
              <Box
                key={hour}
                sx={{
                  display: 'flex',
                  minHeight: 100,
                  borderBottom: '1px solid #E8E5E1',
                }}
              >
                {/* Time label */}
                <Box
                  sx={{
                    width: 120,
                    flexShrink: 0,
                    py: 2,
                    px: 3,
                    bgcolor: '#F9F8F7',
                    borderRight: '1px solid #E8E5E1',
                  }}
                >
                  <Typography variant="body1" sx={{ color: '#7A746F', fontWeight: 600 }}>
                    {format(new Date().setHours(hour, 0), 'h:mm a')}
                  </Typography>
                </Box>

                {/* Event area */}
                <Box 
                  sx={{ flex: 1, p: 2, bgcolor: '#FFFFFF', cursor: 'pointer', transition: 'background-color 0.2s ease', '&:hover': { bgcolor: '#FDFCFB' } }}
                  onClick={() => handleTimeSlotClick(currentDate, hour)}
                >
                  <Stack spacing={2}>
                    {hourEvents.map((event) => (
                      <Paper
                        key={event.id}
                        elevation={2}
                        sx={{
                          p: 3,
                          borderRadius: '12px',
                          border: `3px solid ${event.avatarColor}`,
                          bgcolor: '#FDFCFB',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            elevation: 6,
                            transform: 'translateX(4px)',
                            bgcolor: '#FFFFFF',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionClick(event.id);
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: event.avatarColor,
                              fontWeight: 700,
                              fontSize: '18px',
                            }}
                          >
                            {event.initials}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, color: '#4A4542', fontSize: '18px', mb: 0.5 }}
                            >
                              {event.client}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#7A746F', mb: 1 }}>
                              {event.sessionType}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <Chip
                                label={`${format(event.date, 'h:mm a')} • ${event.duration} min`}
                                size="small"
                                sx={{
                                  bgcolor: '#FFFFFF',
                                  border: '1px solid #E8E5E1',
                                  color: '#4A4542',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <PageHeader title="Calendar" />

      {/* Navigation Controls */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#4A4542',
              fontSize: '18px',
              letterSpacing: '-0.2px',
            }}
          >
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
            {viewMode === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={handlePrevious}
              sx={{
                bgcolor: '#F9F8F7',
                border: '1px solid #E8E5E1',
                '&:hover': { bgcolor: '#F5F3F0' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Button
              onClick={handleToday}
              variant="outlined"
              startIcon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E8E5E1',
                color: '#4A4542',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                '&:hover': {
                  bgcolor: '#F9F8F7',
                  border: '1px solid #E8E5E1',
                },
              }}
            >
              Today
            </Button>
            <IconButton
              onClick={handleNext}
              sx={{
                bgcolor: '#F9F8F7',
                border: '1px solid #E8E5E1',
                '&:hover': { bgcolor: '#F5F3F0' },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            sx={{
              '& .MuiToggleButton-root': {
                border: '1px solid #E8E5E1',
                color: '#7A746F',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: '#9B8B9E',
                  color: '#FFFFFF',
                  border: '1px solid #9B8B9E',
                  '&:hover': {
                    bgcolor: '#8A7A8D',
                  },
                },
                '&:hover': {
                  bgcolor: '#F9F8F7',
                },
              },
            }}
          >
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="day">Day</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsNewSessionModalOpen(true)}
          >
            New Session
          </Button>
        </Box>
      </Box>

      {/* Calendar Views */}
      <Card
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          border: '2px solid #E8E5E1',
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </Card>

      {/* New Session Modal */}
      <NewSessionModal
        open={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        initialDate={newSessionInitialDate}
        initialTime={newSessionInitialTime}
      />
    </Box>
  );
}