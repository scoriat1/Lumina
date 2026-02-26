import { Box, Typography, Stack, IconButton } from '@mui/material';
import { format, isSameDay, addDays, subDays, startOfDay, setHours, isBefore, isAfter } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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

interface DayCalendarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  selectedTime?: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

export function DayCalendar({ selectedDate, events, selectedTime, onDateChange, onTimeSelect }: DayCalendarProps) {
  const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate));

  const getEventAtTime = (hour: number) => {
    return dayEvents.find((event) => {
      const eventHour = event.date.getHours();
      const eventEndHour = eventHour + event.duration / 60;
      return hour >= eventHour && hour < eventEndHour;
    });
  };

  const isTimeSelected = (hour: number) => {
    if (!selectedTime) return false;
    const [selectedHour] = selectedTime.split(':').map(Number);
    return selectedHour === hour;
  };

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Date Navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2.5,
          borderBottom: '1px solid #E8E5E1',
          mb: 2.5,
        }}
      >
        <IconButton
          onClick={handlePrevDay}
          size="small"
          sx={{
            color: '#7A746F',
            '&:hover': {
              bgcolor: 'rgba(122, 116, 111, 0.08)',
            },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600, fontSize: '15px' }}>
            {format(selectedDate, 'EEEE')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#7A746F', fontSize: '13px' }}>
            {format(selectedDate, 'MMMM d, yyyy')}
          </Typography>
        </Box>

        <IconButton
          onClick={handleNextDay}
          size="small"
          sx={{
            color: '#7A746F',
            '&:hover': {
              bgcolor: 'rgba(122, 116, 111, 0.08)',
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Time Slots */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
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
          {HOURS.map((hour) => {
            const event = getEventAtTime(hour);
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const isSelected = isTimeSelected(hour);
            const isOccupied = !!event;

            return (
              <Box
                key={hour}
                onClick={() => !isOccupied && onTimeSelect(timeString)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '8px',
                  cursor: isOccupied ? 'default' : 'pointer',
                  bgcolor: isSelected
                    ? 'rgba(155, 139, 158, 0.12)'
                    : isOccupied
                    ? event.avatarColor
                    : '#FFFFFF',
                  border: '1px solid',
                  borderColor: isSelected
                    ? '#9B8B9E'
                    : isOccupied
                    ? 'transparent'
                    : '#E8E5E1',
                  transition: 'all 0.2s ease',
                  '&:hover': !isOccupied
                    ? {
                        bgcolor: isSelected ? 'rgba(155, 139, 158, 0.12)' : '#F9F8F7',
                        borderColor: isSelected ? '#9B8B9E' : '#D0CCC7',
                      }
                    : {},
                }}
              >
                {/* Time */}
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 70,
                    color: isOccupied ? '#FFFFFF' : '#4A4542',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '14px',
                  }}
                >
                  {format(setHours(startOfDay(new Date()), hour), 'h:00 a')}
                </Typography>

                {/* Event or Available */}
                {isOccupied ? (
                  <Box sx={{ flex: 1 }}>
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
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '11px',
                      }}
                    >
                      {event.sessionType} • {event.duration} min
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#9A9490',
                      fontSize: '13px',
                      fontStyle: 'italic',
                    }}
                  >
                    Available
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
