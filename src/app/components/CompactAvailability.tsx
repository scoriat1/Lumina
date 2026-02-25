import { Box, Typography, IconButton, Button } from '@mui/material';
import { format, addDays, subDays } from 'date-fns';
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

interface CompactAvailabilityProps {
  selectedDate: Date;
  events: CalendarEvent[];
  selectedTime?: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

// Compact time slots - only showing key hours
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
];

export function CompactAvailability({
  selectedDate,
  events,
  selectedTime,
  onDateChange,
  onTimeSelect,
}: CompactAvailabilityProps) {
  const isTimeBooked = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return events.some((event) => {
      const eventDate = event.date;
      const isSameDay =
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear();
      if (!isSameDay) return false;
      
      const eventHours = eventDate.getHours();
      const eventMinutes = eventDate.getMinutes();
      return eventHours === hours && eventMinutes === minutes;
    });
  };

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Date Navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
        }}
      >
        <IconButton
          onClick={handlePrevDay}
          size="small"
          sx={{
            color: '#7A746F',
            '&:hover': {
              bgcolor: 'rgba(122, 116, 111, 0.06)',
            },
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{ color: '#2C2825', fontWeight: 600, fontSize: '14px' }}
          >
            {format(selectedDate, 'EEE, MMM d')}
          </Typography>
        </Box>

        <IconButton
          onClick={handleNextDay}
          size="small"
          sx={{
            color: '#7A746F',
            '&:hover': {
              bgcolor: 'rgba(122, 116, 111, 0.06)',
            },
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Time Grid - NO SCROLLING */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0.75,
          flex: 1,
        }}
      >
        {TIME_SLOTS.map((time) => {
          const isBooked = isTimeBooked(time);
          const isSelected = selectedTime === time;

          return (
            <Button
              key={time}
              onClick={() => !isBooked && onTimeSelect(time)}
              disabled={isBooked}
              sx={{
                minHeight: 36,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: isSelected ? 600 : 500,
                fontSize: '13px',
                border: '1px solid',
                transition: 'all 0.15s ease',
                padding: '6px 8px',
                ...(isBooked
                  ? {
                      bgcolor: '#F9F8F7',
                      borderColor: '#E8E5E1',
                      color: '#C7C2BD',
                      cursor: 'not-allowed',
                      '&:hover': {
                        bgcolor: '#F9F8F7',
                        borderColor: '#E8E5E1',
                      },
                    }
                  : isSelected
                  ? {
                      bgcolor: '#9B8B9E',
                      borderColor: '#9B8B9E',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 6px rgba(155, 139, 158, 0.25)',
                      '&:hover': {
                        bgcolor: '#8A7A8D',
                        borderColor: '#8A7A8D',
                      },
                    }
                  : {
                      bgcolor: '#FFFFFF',
                      borderColor: '#E8E5E1',
                      color: '#4A4542',
                      '&:hover': {
                        bgcolor: 'rgba(155, 139, 158, 0.04)',
                        borderColor: '#9B8B9E',
                      },
                    }),
              }}
            >
              {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
            </Button>
          );
        })}
      </Box>

      <Typography
        variant="caption"
        sx={{ color: '#9A9490', fontSize: '11px', mt: 2, textAlign: 'center' }}
      >
        Click a time to select
      </Typography>
    </Box>
  );
}
