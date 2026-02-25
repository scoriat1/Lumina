import { Box, Typography, Stack } from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

interface CalendarEvent {
  id: string;
  date: Date;
  client: string;
  initials: string;
  avatarColor: string;
  sessionType: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface MonthCalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSessionClick?: (sessionId: string) => void;
  selectedDateTime?: Date | null;
}

export function MonthCalendar({ currentDate, events, onSessionClick, selectedDateTime }: MonthCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

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

      {/* Calendar grid */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {weeks.map((week, weekIndex) => (
          <Box key={weekIndex} sx={{ display: 'flex', flex: 1, borderBottom: '1px solid #E8E5E1' }}>
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSelectedDay = selectedDateTime && isSameDay(day, selectedDateTime);

              return (
                <Box
                  key={day.toString()}
                  sx={{
                    flex: 1,
                    borderRight: '1px solid #E8E5E1',
                    bgcolor: isSelectedDay 
                      ? 'rgba(155, 139, 158, 0.08)' 
                      : isCurrentMonth 
                      ? '#FFFFFF' 
                      : '#FAFAFA',
                    p: 1.5,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { borderRight: 'none' },
                    '&:hover': {
                      bgcolor: isSelectedDay 
                        ? 'rgba(155, 139, 158, 0.08)' 
                        : isCurrentMonth 
                        ? '#FDFCFB' 
                        : '#F9F8F7',
                    },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {/* Day number */}
                  <Box sx={{ mb: 1, flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isTodayDate ? '#9B8B9E' : 'transparent',
                        color: isTodayDate ? '#FFFFFF' : isCurrentMonth ? '#4A4542' : '#B0ABA6',
                        fontWeight: isTodayDate ? 600 : 500,
                        fontSize: '14px',
                      }}
                    >
                      {format(day, 'd')}
                    </Box>
                  </Box>

                  {/* Events - scrollable */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      '&::-webkit-scrollbar': {
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        bgcolor: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#E8E5E1',
                        borderRadius: '4px',
                        '&:hover': {
                          bgcolor: '#D0CCC7',
                        },
                      },
                    }}
                  >
                    <Stack spacing={0.5}>
                      {dayEvents.map((event) => (
                        <Box
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClick && onSessionClick(event.id);
                          }}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '4px',
                            bgcolor: event.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            transition: 'transform 0.2s ease',
                            cursor: onSessionClick ? 'pointer' : 'default',
                            '&:hover': onSessionClick ? {
                              transform: 'scale(1.02)',
                            } : {},
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {format(event.date, 'h:mm a')} {event.client}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
