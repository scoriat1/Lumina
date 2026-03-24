import { Box, Typography } from '@mui/material';
import { format, isSameDay } from 'date-fns';
import type { SessionStatusValue } from '../api/types';
import { getSessionCalendarStyles } from '../lib/sessionStatus';

interface CalendarEvent {
  id: string;
  date: Date;
  client: string;
  clientName?: string;
  avatarColor: string;
  sessionType: string;
  duration: number;
  status: SessionStatusValue;
}

interface TimelineAvailabilityProps {
  selectedDate: Date;
  events: CalendarEvent[];
  selectedTime?: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  selectionMode?: 'future' | 'past';
}

const BUSINESS_HOURS = { start: 8, end: 18 };
const SLOT_HEIGHT = 34;
const HOURS_RANGE = Array.from(
  { length: BUSINESS_HOURS.end - BUSINESS_HOURS.start },
  (_, index) => BUSINESS_HOURS.start + index,
);

export function TimelineAvailability({
  selectedDate,
  events,
  selectedTime,
  onDateChange,
  onTimeSelect,
  selectionMode = 'future',
}: TimelineAvailabilityProps) {
  const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate));
  const now = new Date();

  const getEventAtSlot = (hour: number, minute: number) =>
    dayEvents.find((event) => {
      const slotTime = hour * 60 + minute;
      const eventStartTime = event.date.getHours() * 60 + event.date.getMinutes();
      const eventEndTime = eventStartTime + event.duration;

      return slotTime >= eventStartTime && slotTime < eventEndTime;
    });

  const isTimeSelected = (hour: number, minute: number) => {
    if (!selectedTime) return false;
    const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number);
    return selectedHour === hour && selectedMinute === minute;
  };

  const isUnavailableTime = (hour: number, minute: number) => {
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hour, minute, 0, 0);
    return selectionMode === 'future' ? slotDate < now : slotDate > now;
  };

  const handleSlotClick = (hour: number, minute: number) => {
    const event = getEventAtSlot(hour, minute);
    const isUnavailable = isUnavailableTime(hour, minute);

    if (!event && !isUnavailable) {
      onTimeSelect(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
              <Box sx={{ width: 50, flexShrink: 0, pr: 1, pt: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#9A9490', fontSize: '11px', fontWeight: 500 }}
                >
                  {format(new Date().setHours(hour, 0), 'h a')}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[0, 30].map((minute) => {
                  const event = getEventAtSlot(hour, minute);
                  const eventColors = event
                    ? getSessionCalendarStyles(event.status)
                    : null;
                  const isSelected = isTimeSelected(hour, minute);
                  const isUnavailable = isUnavailableTime(hour, minute);
                  const isFirstSlotOfEvent =
                    event &&
                    event.date.getHours() === hour &&
                    event.date.getMinutes() === minute;

                  if (event && !isFirstSlotOfEvent) {
                    return null;
                  }

                  const slotHeight = event ? (event.duration / 30) * SLOT_HEIGHT : SLOT_HEIGHT;

                  return (
                    <Box
                      key={minute}
                      onClick={() => handleSlotClick(hour, minute)}
                      sx={{
                        height: slotHeight,
                        borderRadius: '6px',
                        cursor: event ? 'default' : isUnavailable ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        ...(event
                          ? {
                              bgcolor: eventColors!.bg,
                              border: `1px solid ${eventColors!.border}`,
                              borderLeft: `3px solid ${event.avatarColor}`,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                            }
                          : isSelected
                            ? {
                                bgcolor: '#6E5BCE',
                                border: '2px solid #6E5BCE',
                                boxShadow: '0 2px 6px rgba(110, 91, 206, 0.25)',
                              }
                            : isUnavailable
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
                              color: eventColors!.text,
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
                              color: eventColors!.text,
                              fontSize: '11px',
                              opacity: 0.85,
                            }}
                          >
                            {event.duration} min | {event.sessionType}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            color: isSelected ? '#FFFFFF' : isUnavailable ? '#B0ABA6' : '#9A9490',
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
