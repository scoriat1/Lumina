import { Box, Typography } from '@mui/material';
import { format, isSameDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  date: Date;
  client: string;
  clientName?: string;
  initials: string;
  avatarColor: string;
  sessionType: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface TimelineAvailabilityProps {
  selectedDate: Date;
  events: CalendarEvent[];
  selectedTime?: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

const BUSINESS_HOURS = { start: 8, end: 18 }; // 8 AM to 6 PM
const SLOT_HEIGHT = 34; // Compressed height per 30-min slot - no scrolling needed
const HOURS_RANGE = Array.from(
  { length: BUSINESS_HOURS.end - BUSINESS_HOURS.start },
  (_, i) => BUSINESS_HOURS.start + i
);

export function TimelineAvailability({
  selectedDate,
  events,
  selectedTime,
  onDateChange,
  onTimeSelect,
}: TimelineAvailabilityProps) {
  const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate));
  const now = new Date();

  const getEventAtSlot = (hour: number, minute: number) => {
    return dayEvents.find((event) => {
      const eventHour = event.date.getHours();
      const eventMinute = event.date.getMinutes();
      const slotTime = hour * 60 + minute;
      const eventStartTime = eventHour * 60 + eventMinute;
      const eventEndTime = eventStartTime + event.duration;
      
      return slotTime >= eventStartTime && slotTime < eventEndTime;
    });
  };

  const isTimeSelected = (hour: number, minute: number) => {
    if (!selectedTime) return false;
    const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number);
    return selectedHour === hour && selectedMinute === minute;
  };

  const isPastTime = (hour: number, minute: number) => {
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hour, minute, 0, 0);
    return slotDate < now;
  };

  const handleSlotClick = (hour: number, minute: number) => {
    const event = getEventAtSlot(hour, minute);
    const isPast = isPastTime(hour, minute);
    if (!event && !isPast) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      onTimeSelect(timeString);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Timeline - NO duplicate date navigation, NO bottom instruction text */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          border: '1px solid #E8E5E1',
          borderRadius: '10px',
          bgcolor: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
          {HOURS_RANGE.map((hour) => (
            <Box key={hour} sx={{ display: 'flex', mb: 0.5 }}>
              {/* Hour Label */}
              <Box
                sx={{
                  width: 50,
                  flexShrink: 0,
                  pr: 1,
                  pt: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#9A9490',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}
                >
                  {format(new Date().setHours(hour, 0), 'h a')}
                </Typography>
              </Box>

              {/* Time Slots */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[0, 30].map((minute) => {
                  const event = getEventAtSlot(hour, minute);
                  const isSelected = isTimeSelected(hour, minute);
                  const isPast = isPastTime(hour, minute);
                  const isFirstSlotOfEvent = event && event.date.getHours() === hour && event.date.getMinutes() === minute;

                  // Skip rendering slots that are part of an event (except the first slot)
                  if (event && !isFirstSlotOfEvent) {
                    return null;
                  }

                  // Calculate height for event blocks
                  const slotHeight = event ? (event.duration / 30) * SLOT_HEIGHT : SLOT_HEIGHT;

                  return (
                    <Box
                      key={minute}
                      onClick={() => handleSlotClick(hour, minute)}
                      sx={{
                        height: slotHeight,
                        borderRadius: '6px',
                        cursor: event ? 'default' : isPast ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        ...(event
                          ? {
                              bgcolor: event.avatarColor,
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                            }
                          : isSelected
                          ? {
                              bgcolor: '#6E5BCE',
                              border: '2px solid #6E5BCE',
                              boxShadow: '0 2px 6px rgba(110, 91, 206, 0.25)',
                            }
                          : isPast
                          ? {
                              bgcolor: '#FAFAFA',
                              border: '1px solid #E8E5E1',
                              opacity: 0.5,
                            }
                          : {
                              bgcolor: '#F9F8F7',
                              border: '1px solid #E8E5E1',
                              '&:hover': {
                                bgcolor: 'rgba(110, 91, 206, 0.08)',
                                borderColor: '#6E5BCE',
                                transform: 'translateX(2px)',
                              },
                            }),
                      }}
                    >
                      {event ? (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '13px',
                              mb: 0.25,
                            }}
                          >
                            {event.clientName || event.client}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.85)',
                              fontSize: '11px',
                            }}
                          >
                            {event.duration} min • {event.sessionType}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            color: isSelected ? '#FFFFFF' : isPast ? '#B0ABA6' : '#9A9490',
                            fontSize: '12px',
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {format(new Date().setHours(hour, minute), 'h:mm a')}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}