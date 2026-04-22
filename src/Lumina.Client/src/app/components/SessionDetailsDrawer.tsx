import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import VideocamIcon from "@mui/icons-material/Videocam";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import PaymentIcon from "@mui/icons-material/Payment";
import RepeatIcon from "@mui/icons-material/Repeat";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TimerIcon from "@mui/icons-material/Timer";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { apiClient } from "../api/client";
import type {
    PaymentStatusValue,
    SessionDto,
    SessionStructuredNoteDto,
} from "../api/types";
import { useNotesTemplate } from "../contexts/NotesTemplateContext";
import { SessionNotes, SessionNote } from "./SessionNotes";
import { PreviousSessionPreview } from "./PreviousSessionPreview";
import {
    allSessionStatusOptions,
    getSessionStatusBadgeStyles,
    getSessionStatusLabel,
} from "../lib/sessionStatus";

const sessionTypes = [
    "Initial Consultation",
    "Weekly Check-in",
    "Progress Check-in",
    "Follow-up Session",
    "Values Alignment",
    "Leadership Growth",
    "Career Strategy",
    "Confidence Building",
    "Work-Life Balance",
];

const durations = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "60 min" },
    { value: 90, label: "90 min" },
];

const statusOptions = allSessionStatusOptions;

type SessionLike = Omit<SessionDto, "date"> & {
    date: Date;
    sessionNotes?: SessionNote[];
};

type SessionNotesPayload = {
    version: 1;
    notes: SessionNote[];
};

type SessionInput = Omit<SessionDto, "date"> & {
    date: string | Date;
    sessionNotes?: SessionNote[];
};

type ReplacementBookingSeed = Pick<
    SessionDto,
    'clientId' | 'packageId' | 'clientPackageId' | 'sessionType' | 'duration' | 'location'
>;

interface SessionDetailsDrawerProps {
    open: boolean;
    onClose: () => void;
    sessionId: string | null;
    sessions: SessionInput[];
    onBookReplacement?: (session: ReplacementBookingSeed) => void;
    onUpdateSession?: (
        sessionId: string,
        updates: Partial<SessionLike>,
    ) => void;
    onSaved?: () => Promise<void> | void;
    surfaceVariant?: "default" | "client-detail";
}

const normalizeSession = (session: SessionInput): SessionLike => ({
    ...session,
    date:
        session.date instanceof Date
            ? session.date
            : new Date(session.date),
});

const createEditFormData = (session: SessionLike) => ({
    sessionType: session.sessionType || "",
    date: format(session.date, "yyyy-MM-dd"),
    time: format(session.date, "HH:mm"),
    duration: session.duration || 60,
    method: session.location || ("zoom" as const),
    status: session.status || ("upcoming" as const),
});

const getSessionPaymentStatusValue = (
    session: SessionLike,
): PaymentStatusValue =>
    session.paymentStatus ??
    (session.billingSource === "package" ? "paid" : "unpaid");

const createPaymentFormData = (session: SessionLike) => ({
    paymentStatus: getSessionPaymentStatusValue(session),
    amount:
        session.paymentAmount != null
            ? String(session.paymentAmount)
            : "",
    paymentMethod: session.paymentMethod ?? "",
    paymentDate: session.paymentDate
        ? format(new Date(session.paymentDate), "yyyy-MM-dd")
        : "",
});

const createLegacyNote = (
    content: string,
    timestamp: string,
): SessionNote => ({
    id: "legacy-note",
    content,
    timestamp,
    isTemplate: false,
});

const getFallbackSessionNotes = (session: SessionLike | null) => {
    if (!session) {
        return [];
    }

    if (
        session.sessionNotes &&
        Array.isArray(session.sessionNotes)
    ) {
        return session.sessionNotes;
    }

    if (session.notes?.trim()) {
        return [
            createLegacyNote(
                session.notes.trim(),
                format(session.date, "MMM d, yyyy h:mm a"),
            ),
        ];
    }

    return [];
};

const normalizePersistedNotes = (
    notes: SessionNote[],
    resolveTemplateName: (
        templateId?: string | number,
    ) => string | undefined,
) =>
    notes.map((note, index) => ({
        ...note,
        id: note.id || `note-${index + 1}`,
        timestamp:
            note.timestamp ||
            format(new Date(), "MMM d, yyyy h:mm a"),
        isTemplate: note.isTemplate ?? Boolean(note.templateId),
        templateId: note.templateId
            ? String(note.templateId)
            : undefined,
        templateName:
            note.templateName ||
            resolveTemplateName(note.templateId),
    }));

const deserializeSessionNotes = (
    structuredNote: SessionStructuredNoteDto | null,
    fallbackLegacyNotes: string | null | undefined,
    resolveTemplateName: (
        templateId?: string | number,
    ) => string | undefined,
) => {
    const fallbackTimestamp = structuredNote
        ? format(
              new Date(
                  structuredNote.updatedAt ||
                      structuredNote.createdAt,
              ),
              "MMM d, yyyy h:mm a",
          )
        : format(new Date(), "MMM d, yyyy h:mm a");

    if (!structuredNote?.content?.trim()) {
        return fallbackLegacyNotes?.trim()
            ? [
                  createLegacyNote(
                      fallbackLegacyNotes.trim(),
                      fallbackTimestamp,
                  ),
              ]
            : [];
    }

    try {
        const parsed = JSON.parse(structuredNote.content) as
            | SessionNotesPayload
            | SessionNote[]
            | Record<string, string>
            | { freeform?: string };

        if (Array.isArray(parsed)) {
            return normalizePersistedNotes(
                parsed,
                resolveTemplateName,
            );
        }

        if (
            parsed &&
            typeof parsed === "object" &&
            "notes" in parsed &&
            Array.isArray(parsed.notes)
        ) {
            return normalizePersistedNotes(
                parsed.notes,
                resolveTemplateName,
            );
        }

        if (
            parsed &&
            typeof parsed === "object" &&
            "freeform" in parsed &&
            typeof parsed.freeform === "string" &&
            parsed.freeform.trim()
        ) {
            return [
                {
                    id: structuredNote.id,
                    content: parsed.freeform.trim(),
                    timestamp: fallbackTimestamp,
                    isTemplate: false,
                },
            ];
        }

        if (structuredNote.templateId) {
            return [
                {
                    id: structuredNote.id,
                    content: structuredNote.content,
                    timestamp: fallbackTimestamp,
                    isTemplate: true,
                    templateId: String(structuredNote.templateId),
                    templateName: resolveTemplateName(
                        structuredNote.templateId,
                    ),
                },
            ];
        }
    } catch {
        // Fall through to plain-text handling.
    }

    return structuredNote.content.trim()
        ? [
              {
                  id: structuredNote.id,
                  content: structuredNote.content.trim(),
                  timestamp: fallbackTimestamp,
                  isTemplate: Boolean(structuredNote.templateId),
                  templateId: structuredNote.templateId
                      ? String(structuredNote.templateId)
                      : undefined,
                  templateName: resolveTemplateName(
                      structuredNote.templateId,
                  ),
              },
          ]
        : [];
};

const serializeSessionNotes = (notes: SessionNote[]) =>
    JSON.stringify({
        version: 1,
        notes,
    } satisfies SessionNotesPayload);

const buildLegacyNotes = (notes: SessionNote[]) =>
    notes
        .map((note) => {
            if (!note.isTemplate || !note.templateId) {
                return note.content.trim();
            }

            try {
                const parsed = JSON.parse(note.content) as Record<
                    string,
                    string
                >;
                const fields = Object.entries(parsed)
                    .map(([field, value]) => [
                        field,
                        value?.trim() || "",
                    ] as const)
                    .filter(([, value]) => value);

                if (fields.length === 0) {
                    return note.templateName || "Template note";
                }

                const lines = fields
                    .map(([field, value]) => `${field}: ${value}`)
                    .join("\n");

                return note.templateName
                    ? `${note.templateName}\n${lines}`
                    : lines;
            } catch {
                return note.content.trim();
            }
        })
        .filter(Boolean)
        .join("\n\n");

const getPersistedTemplateId = (
    notes: SessionNote[],
    persistableTemplateIds: ReadonlySet<string>,
) => {
    const templateNote = notes.find(
        (note) =>
            note.isTemplate &&
            note.templateId &&
            persistableTemplateIds.has(note.templateId),
    );

    if (!templateNote?.templateId) {
        return undefined;
    }

    const parsedTemplateId = Number(templateNote.templateId);
    return Number.isNaN(parsedTemplateId)
        ? undefined
        : parsedTemplateId;
};

const getPersistedNoteType = (notes: SessionNote[]) => {
    if (notes.length === 0) {
        return "general";
    }

    const hasTemplateNotes = notes.some((note) => note.isTemplate);
    const hasFreeNotes = notes.some((note) => !note.isTemplate);

    if (hasTemplateNotes && hasFreeNotes) {
        return "mixed";
    }

    return hasTemplateNotes ? "template" : "free";
};

export function SessionDetailsDrawer({
    open,
    onClose,
    sessionId,
    sessions,
    onBookReplacement,
    onUpdateSession,
    onSaved,
}: SessionDetailsDrawerProps) {
    const { customTemplates, presetTemplates } = useNotesTemplate();
    const [isCancelDialogOpen, setIsCancelDialogOpen] =
        useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] =
        useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sessionDetail, setSessionDetail] =
        useState<SessionLike | null>(null);
    const [sessionNotes, setSessionNotes] = useState<
        SessionNote[]
    >([]);
    const [previousSessionNotes, setPreviousSessionNotes] =
        useState<SessionNote[]>([]);

    const session = useMemo(() => {
        if (sessionDetail) {
            return sessionDetail;
        }

        if (!sessionId) {
            return null;
        }

        const matchingSession = sessions.find(
            (candidate) => candidate.id === sessionId,
        );

        return matchingSession
            ? normalizeSession(matchingSession)
            : null;
    }, [sessionDetail, sessionId, sessions]);

    const templateNameLookup = useMemo(() => {
        const lookup = new Map<string, string>();

        [...presetTemplates, ...customTemplates].forEach(
            (template) => {
                lookup.set(template.id, template.name);
            },
        );

        return lookup;
    }, [customTemplates, presetTemplates]);

    const persistableTemplateIds = useMemo(
        () => new Set(customTemplates.map((template) => template.id)),
        [customTemplates],
    );

    // Edit form state
    const [editFormData, setEditFormData] = useState<
        ReturnType<typeof createEditFormData>
    >({
        sessionType: "",
        date: "",
        time: "",
        duration: 60,
        method: "zoom" as "zoom" | "phone" | "office",
        status: "upcoming" as SessionLike["status"],
    });
    const [paymentFormData, setPaymentFormData] = useState<
        ReturnType<typeof createPaymentFormData>
    >({
        paymentStatus: "unpaid",
        amount: "",
        paymentMethod: "",
        paymentDate: "",
    });

    useEffect(() => {
        if (!open || !sessionId) {
            setSessionDetail(null);
            setSessionNotes([]);
            setPreviousSessionNotes([]);
            setIsEditMode(false);
            return;
        }

        let isActive = true;
        const fallbackSession = sessions.find(
            (candidate) => candidate.id === sessionId,
        );
        const normalizedFallback = fallbackSession
            ? normalizeSession(fallbackSession)
            : null;

        setSessionDetail(normalizedFallback);
        setSessionNotes(
            getFallbackSessionNotes(normalizedFallback),
        );

        if (normalizedFallback) {
            setEditFormData(createEditFormData(normalizedFallback));
            setPaymentFormData(createPaymentFormData(normalizedFallback));
        }

        setIsEditMode(false);

        void Promise.all([
            apiClient.getSession(sessionId),
            apiClient.getSessionStructuredNote(sessionId),
        ])
            .then(([detail, structuredNote]) => {
                if (!isActive) {
                    return;
                }

                const normalizedDetail = normalizeSession({
                    ...detail,
                    date: detail.date,
                });

                setSessionDetail(normalizedDetail);
                setSessionNotes(
                    deserializeSessionNotes(
                        structuredNote,
                        detail.notes,
                        (templateId) =>
                            templateId
                                ? templateNameLookup.get(
                                      String(templateId),
                                  )
                                : undefined,
                    ),
                );
                setEditFormData(
                    createEditFormData(normalizedDetail),
                );
                setPaymentFormData(
                    createPaymentFormData(normalizedDetail),
                );
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                if (!normalizedFallback) {
                    setSessionDetail(null);
                    setSessionNotes([]);
                }

                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to load session details.",
                );
            });

        return () => {
            isActive = false;
        };
    }, [open, sessionId, sessions, templateNameLookup]);

    useEffect(() => {
        if (!session || isPaymentDialogOpen) {
            return;
        }

        setPaymentFormData(createPaymentFormData(session));
    }, [
        session,
        isPaymentDialogOpen,
    ]);

    const previousSession = useMemo(() => {
        if (!session) {
            return null;
        }

        return sessions
            .filter(
                (candidate) =>
                    candidate.clientId === session.clientId &&
                    candidate.id !== session.id,
            )
            .map(normalizeSession)
            .sort(
                (left, right) =>
                    right.date.getTime() - left.date.getTime(),
            )
            .find(
                (candidate) =>
                    candidate.date.getTime() < session.date.getTime(),
            );
    }, [session, sessions]);

    useEffect(() => {
        if (!open || !previousSession) {
            setPreviousSessionNotes([]);
            return;
        }

        let isActive = true;
        setPreviousSessionNotes(
            getFallbackSessionNotes(previousSession),
        );

        void apiClient
            .getSessionStructuredNote(previousSession.id)
            .then((structuredNote) => {
                if (!isActive) {
                    return;
                }

                setPreviousSessionNotes(
                    deserializeSessionNotes(
                        structuredNote,
                        previousSession.notes,
                        (templateId) =>
                            templateId
                                ? templateNameLookup.get(
                                      String(templateId),
                                  )
                                : undefined,
                    ),
                );
            })
            .catch(() => undefined);

        return () => {
            isActive = false;
        };
    }, [open, previousSession, templateNameLookup]);

    if (!session) return null;

    const handleEditChange = <
        TField extends keyof ReturnType<typeof createEditFormData>,
    >(
        field: TField,
        value: ReturnType<typeof createEditFormData>[TField],
    ) => {
        setEditFormData((prev) => ({ ...prev, [field]: value }));
    };

    const persistSessionUpdates = async (
        updates: Partial<SessionLike>,
    ) => {
        if (onUpdateSession) {
            onUpdateSession(session.id, updates);
            setSessionDetail((current) =>
                current ? { ...current, ...updates } : current,
            );
            return;
        }

        await apiClient.updateSession(session.id, {
            sessionType: updates.sessionType,
            date: updates.date?.toISOString(),
            duration: updates.duration,
            location: updates.location,
            status: updates.status,
            focus: updates.focus,
            notes: updates.notes,
        });

        setSessionDetail((current) =>
            current ? { ...current, ...updates } : current,
        );
        await onSaved?.();
    };

    const handleSaveEdit = async () => {
        const updatedDateTime = new Date(
            `${editFormData.date}T${editFormData.time}`,
        );

        try {
            await persistSessionUpdates({
                sessionType: editFormData.sessionType,
                date: updatedDateTime,
                duration: editFormData.duration,
                location: editFormData.method,
                status: editFormData.status,
            });

            setEditFormData(
                createEditFormData({
                    ...session,
                    sessionType: editFormData.sessionType,
                    date: updatedDateTime,
                    duration: editFormData.duration,
                    location: editFormData.method,
                    status: editFormData.status,
                }),
            );
            setIsEditMode(false);
            toast.success("Session updated");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update session.",
            );
        }
    };

    const handleCancelEdit = () => {
        setEditFormData(createEditFormData(session));
        setIsEditMode(false);
    };

    const handleNotesChange = (updatedNotes: SessionNote[]) => {
        const previousNotes = sessionNotes;
        const legacyNotes = buildLegacyNotes(updatedNotes);

        setSessionNotes(updatedNotes);

        void apiClient
            .saveSessionStructuredNote(session.id, {
                templateId: getPersistedTemplateId(
                    updatedNotes,
                    persistableTemplateIds,
                ),
                noteType: getPersistedNoteType(updatedNotes),
                content: serializeSessionNotes(updatedNotes),
                legacyNotes,
            })
            .then(async () => {
                setSessionDetail((current) =>
                    current
                        ? {
                              ...current,
                              notes: legacyNotes,
                              sessionNotes: updatedNotes,
                          }
                        : current,
                );

                if (onUpdateSession) {
                    onUpdateSession(session.id, {
                        notes: legacyNotes,
                        sessionNotes: updatedNotes,
                    });
                } else {
                    await onSaved?.();
                }
            })
            .catch((error) => {
                setSessionNotes(previousNotes);
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to save session notes.",
                );
            });
    };

    const handleStatusChange = async (
        status: SessionLike["status"],
    ) => {
        try {
            await persistSessionUpdates({ status });
            setEditFormData((current) => ({
                ...current,
                status,
            }));
            return true;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update session status.",
            );
            return false;
        }
    };

    const handleMarkSessionPaid = async () => {
        try {
            const updatedSession = await apiClient.markSessionPaid(session.id, {
                amount: session.paymentAmount,
                paymentMethod: "manual",
            });
            const normalizedSession = normalizeSession(updatedSession);
            setSessionDetail(normalizedSession);
            await onSaved?.();
            toast.success("Session marked paid");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to mark session paid.",
            );
        }
    };

    const handlePaymentChange = <
        TField extends keyof ReturnType<typeof createPaymentFormData>,
    >(
        field: TField,
        value: ReturnType<typeof createPaymentFormData>[TField],
    ) => {
        setPaymentFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleOpenPaymentDialog = () => {
        setPaymentFormData(createPaymentFormData(session));
        setIsPaymentDialogOpen(true);
    };

    const handleSavePayment = async () => {
        const amountText = paymentFormData.amount.trim();
        const amount = amountText ? Number(amountText) : null;

        if (amountText && (!Number.isFinite(amount) || amount <= 0)) {
            toast.error("Enter a payment amount greater than 0.");
            return;
        }

        try {
            const updatedSession = await apiClient.updateSessionPayment(
                session.id,
                {
                    paymentStatus: paymentFormData.paymentStatus,
                    amount,
                    paymentMethod:
                        paymentFormData.paymentMethod.trim() || null,
                    paymentDate: paymentFormData.paymentDate
                        ? new Date(
                              `${paymentFormData.paymentDate}T12:00:00`,
                          ).toISOString()
                        : null,
                },
            );
            const normalizedSession = normalizeSession(updatedSession);
            setSessionDetail(normalizedSession);
            setPaymentFormData(createPaymentFormData(normalizedSession));
            setIsPaymentDialogOpen(false);
            await onSaved?.();
            toast.success("Payment updated");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update payment.",
            );
        }
    };

    const getStatusColor = (status: SessionLike["status"]) => {
        const styles = getSessionStatusBadgeStyles(status);
        return {
            bgcolor: styles.bg,
            color: styles.text,
            border: `1px solid ${styles.border}`,
        };
    };

    const statusColors = getStatusColor(
        isEditMode ? editFormData.status : session.status,
    );

    const getLocationIcon = (location: string) => {
        switch (location) {
            case "zoom":
                return (
                    <VideocamIcon
                        sx={{ fontSize: 20, color: "#7A746F" }}
                    />
                );
            case "phone":
                return (
                    <PhoneIcon sx={{ fontSize: 20, color: "#7A746F" }} />
                );
            case "office":
                return (
                    <BusinessIcon
                        sx={{ fontSize: 20, color: "#7A746F" }}
                    />
                );
            default:
                return (
                    <BusinessIcon
                        sx={{ fontSize: 20, color: "#7A746F" }}
                    />
                );
        }
    };

    const getLocationLabel = (location: string) => {
        switch (location) {
            case "zoom":
                return "Zoom";
            case "phone":
                return "Phone";
            case "office":
                return "In Person";
            default:
                return (
                    location.charAt(0).toUpperCase() + location.slice(1)
                );
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 500 },
                    bgcolor: "#FDFCFB",
                },
            }}
        >
            <Box
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Compact Header */}
                <Box
                    sx={{
                        p: 2.5,
                        bgcolor: "#FFFFFF",
                        borderBottom: "1px solid #E8E5E1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 48,
                                height: 48,
                                bgcolor: session.avatarColor,
                                fontSize: "18px",
                                fontWeight: 700,
                            }}
                        >
                            {session.initials}
                        </Avatar>
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: "#2C2825",
                                    fontSize: "18px",
                                    mb: 0.25,
                                }}
                            >
                                {session.client}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#7A746F", fontSize: "13px" }}
                            >
                                {isEditMode && !editFormData.sessionType
                                    ? "No title"
                                    : isEditMode
                                        ? editFormData.sessionType
                                        : session.sessionType}
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: "#C7C2BD",
                            "&:hover": {
                                bgcolor: "rgba(155, 139, 158, 0.06)",
                                color: "#9A9490",
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Content - Scrollable */}
                <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
                    <Stack spacing={3}>
                        {/* Session Notes - PROMINENT FIRST */}
                        <SessionNotes
                            notes={sessionNotes}
                            onNotesChange={handleNotesChange}
                        />

                        {/* Previous Session Preview - Only show if exists */}
                        {previousSession &&
                            previousSessionNotes.length > 0 && (
                                <PreviousSessionPreview
                                    sessionType={
                                        previousSession.sessionType
                                    }
                                    date={previousSession.date}
                                    notes={previousSessionNotes}
                                />
                            )}

                        <Divider sx={{ borderColor: "#E8E5E1" }} />

                        {/* Session Details */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: "#7A746F",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    mb: 2.5,
                                    display: "block",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                }}
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
                                                color: "#4A4542",
                                                fontWeight: 600,
                                                mb: 0.75,
                                                display: "block",
                                                fontSize: "11px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Session Title{" "}
                                            <Box
                                                component="span"
                                                sx={{
                                                    color: "#9A9490",
                                                    fontStyle: "italic",
                                                    fontWeight: 400,
                                                }}
                                            >
                                                (optional)
                                            </Box>
                                        </Typography>
                                        <Autocomplete
                                            freeSolo
                                            options={sessionTypes}
                                            value={editFormData.sessionType}
                                            onChange={(event, newValue) => {
                                                handleEditChange(
                                                    "sessionType",
                                                    newValue || "",
                                                );
                                            }}
                                            onInputChange={(event, newInputValue) => {
                                                handleEditChange(
                                                    "sessionType",
                                                    newInputValue,
                                                );
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    size="small"
                                                    placeholder="No title"
                                                    sx={{
                                                        bgcolor: "#FFFFFF",
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: "8px",
                                                            "& fieldset": {
                                                                borderColor: "#E8E5E1",
                                                                borderWidth: "1.5px",
                                                            },
                                                            "&:hover fieldset": {
                                                                borderColor: "#9B8B9E",
                                                            },
                                                            "&.Mui-focused fieldset": {
                                                                borderColor: "#9B8B9E",
                                                                borderWidth: "2px",
                                                            },
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>
                                )}

                                {/* Date */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "8px",
                                            bgcolor: "#F9F8F7",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <CalendarTodayIcon
                                            sx={{ fontSize: 18, color: "#7A746F" }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#9A9490",
                                                fontSize: "11px",
                                                mb: 0.5,
                                                display: "block",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            Date
                                        </Typography>
                                        {isEditMode ? (
                                            <TextField
                                                type="date"
                                                fullWidth
                                                size="small"
                                                value={editFormData.date}
                                                onChange={(e) =>
                                                    handleEditChange(
                                                        "date",
                                                        e.target.value,
                                                    )
                                                }
                                                sx={{
                                                    bgcolor: "#FFFFFF",
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "8px",
                                                        "& fieldset": {
                                                            borderColor: "#E8E5E1",
                                                            borderWidth: "1.5px",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#9B8B9E",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#9B8B9E",
                                                            borderWidth: "2px",
                                                        },
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: "#4A4542",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {format(
                                                    session.date,
                                                    "EEEE, MMMM d, yyyy",
                                                )}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Time & Duration */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "8px",
                                            bgcolor: "#F9F8F7",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <AccessTimeIcon
                                            sx={{ fontSize: 18, color: "#7A746F" }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#9A9490",
                                                fontSize: "11px",
                                                mb: 0.5,
                                                display: "block",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            Time & Duration
                                        </Typography>
                                        {isEditMode ? (
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                            <TextField
                                                type="time"
                                                size="small"
                                                value={editFormData.time}
                                                onChange={(e) =>
                                                        handleEditChange(
                                                            "time",
                                                            e.target.value,
                                                        )
                                                    }
                                                    sx={{
                                                        flex: 1,
                                                        bgcolor: "#FFFFFF",
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: "8px",
                                                            "& fieldset": {
                                                                borderColor: "#E8E5E1",
                                                                borderWidth: "1.5px",
                                                            },
                                                            "&:hover fieldset": {
                                                                borderColor: "#9B8B9E",
                                                            },
                                                            "&.Mui-focused fieldset": {
                                                                borderColor: "#9B8B9E",
                                                                borderWidth: "2px",
                                                        },
                                                    },
                                                }}
                                                inputProps={{
                                                    'data-testid': 'session-edit-time-input',
                                                }}
                                            />
                                                <TextField
                                                    select
                                                    size="small"
                                                    value={editFormData.duration}
                                                    onChange={(e) =>
                                                        handleEditChange(
                                                            "duration",
                                                            Number(
                                                                e.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                    sx={{
                                                        flex: 1,
                                                        bgcolor: "#FFFFFF",
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: "8px",
                                                            "& fieldset": {
                                                                borderColor: "#E8E5E1",
                                                                borderWidth: "1.5px",
                                                            },
                                                            "&:hover fieldset": {
                                                                borderColor: "#9B8B9E",
                                                            },
                                                            "&.Mui-focused fieldset": {
                                                                borderColor: "#9B8B9E",
                                                                borderWidth: "2px",
                                                            },
                                                        },
                                                    }}
                                                >
                                                    {durations.map((duration) => (
                                                        <MenuItem
                                                            key={duration.value}
                                                            value={duration.value}
                                                        >
                                                            {duration.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: "#4A4542",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {format(session.date, "h:mm a")} {" - "}
                                                {session.duration} minutes
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Method */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "8px",
                                            bgcolor: "#F9F8F7",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {getLocationIcon(
                                            isEditMode
                                                ? editFormData.method
                                                : session.location,
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#9A9490",
                                                fontSize: "11px",
                                                mb: 0.5,
                                                display: "block",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            Method
                                        </Typography>
                                        {isEditMode ? (
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={editFormData.method}
                                                onChange={(e) =>
                                                    handleEditChange(
                                                        "method",
                                                        e.target.value as SessionLike["location"],
                                                    )
                                                }
                                                sx={{
                                                    bgcolor: "#FFFFFF",
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "8px",
                                                        "& fieldset": {
                                                            borderColor: "#E8E5E1",
                                                            borderWidth: "1.5px",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#9B8B9E",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#9B8B9E",
                                                            borderWidth: "2px",
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="zoom">
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <VideocamIcon
                                                            sx={{
                                                                fontSize: 16,
                                                                color: "#9B8B9E",
                                                            }}
                                                        />
                                                        <span>Zoom</span>
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="phone">
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <PhoneIcon
                                                            sx={{
                                                                fontSize: 16,
                                                                color: "#9B8B9E",
                                                            }}
                                                        />
                                                        <span>Phone</span>
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="office">
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <BusinessIcon
                                                            sx={{
                                                                fontSize: 16,
                                                                color: "#9B8B9E",
                                                            }}
                                                        />
                                                        <span>In Person</span>
                                                    </Box>
                                                </MenuItem>
                                            </TextField>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: "#4A4542",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {getLocationLabel(session.location)}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Billing & Payment */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "8px",
                                            bgcolor: "#F9F8F7",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PaymentIcon
                                            sx={{ fontSize: 18, color: "#7A746F" }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#9A9490",
                                                fontSize: "11px",
                                                mb: 0.75,
                                                display: "block",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            Billing & Payment
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Chip
                                                label={
                                                    session.billingSource ===
                                                        "pay-per-session"
                                                        ? "Pay per session"
                                                        : session.billingSource ===
                                                            "monthly"
                                                            ? "Monthly"
                                                        : session.billingSource ===
                                                            "package" &&
                                                            session.packageRemaining !==
                                                            undefined
                                                            ? `Package - ${session.packageRemaining} available`
                                                            : "Included"
                                                }
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(122, 116, 111, 0.06)",
                                                    color: "#7A746F",
                                                    border:
                                                        "1px solid rgba(122, 116, 111, 0.1)",
                                                    fontWeight: 500,
                                                    fontSize: "12px",
                                                    height: 24,
                                                }}
                                            />
                                            <Chip
                                                label={
                                                    session.paymentStatus
                                                        ?.charAt(0)
                                                        .toUpperCase() +
                                                    session.paymentStatus?.slice(1) ||
                                                    "Paid"
                                                }
                                                size="small"
                                                sx={{
                                                    ...(session.paymentStatus === "paid"
                                                        ? {
                                                            bgcolor:
                                                                "rgba(168, 181, 160, 0.12)",
                                                            color: "#5B7052",
                                                            border:
                                                                "1px solid rgba(168, 181, 160, 0.2)",
                                                        }
                                                        : session.paymentStatus === "pending"
                                                            ? {
                                                                bgcolor:
                                                                    "rgba(212, 184, 138, 0.12)",
                                                                color: "#8B7444",
                                                                border:
                                                                    "1px solid rgba(212, 184, 138, 0.2)",
                                                            }
                                                            : {
                                                                bgcolor:
                                                                    "#F5F3F1",
                                                                color: "#7A746F",
                                                                border:
                                                                    "1px solid #E8E5E1",
                                                            }),
                                                    fontWeight: 600,
                                                    fontSize: "11px",
                                                    height: 24,
                                                }}
                                            />
                                            {session.paymentAmount ? (
                                                <Chip
                                                    label={`$${session.paymentAmount}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "rgba(122, 116, 111, 0.06)",
                                                        color: "#7A746F",
                                                        fontWeight: 600,
                                                        fontSize: "11px",
                                                        height: 24,
                                                    }}
                                                />
                                            ) : null}
                                            {isEditMode &&
                                                session.billingSource !== "package" &&
                                                session.paymentStatus !== "paid" ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        void handleMarkSessionPaid();
                                                    }}
                                                    sx={{
                                                        textTransform: "none",
                                                        borderRadius: "999px",
                                                        fontWeight: 600,
                                                        fontSize: "11px",
                                                        py: 0.25,
                                                    }}
                                                >
                                                    Mark paid
                                                </Button>
                                            ) : null}
                                            {isEditMode && session.billingSource !== "package" ? (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={handleOpenPaymentDialog}
                                                    sx={{
                                                        textTransform: "none",
                                                        borderRadius: "999px",
                                                        fontWeight: 600,
                                                        fontSize: "11px",
                                                        py: 0.25,
                                                        color: "#7A746F",
                                                    }}
                                                >
                                                    Edit payment
                                                </Button>
                                            ) : null}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Recurring - Read-only (if applicable) */}
                                {session.isRecurring && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "8px",
                                                bgcolor: "#F9F8F7",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <RepeatIcon
                                                sx={{ fontSize: 18, color: "#7A746F" }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "#9A9490",
                                                    fontSize: "11px",
                                                    mb: 0.5,
                                                    display: "block",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                Recurring
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: "#4A4542",
                                                    fontSize: "14px",
                                                    textTransform: "capitalize",
                                                }}
                                            >
                                                {session.recurringType}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {/* Status */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "8px",
                                            bgcolor: "#F9F8F7",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PersonIcon
                                            sx={{ fontSize: 18, color: "#7A746F" }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#9A9490",
                                                fontSize: "11px",
                                                mb: 0.75,
                                                display: "block",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            Status
                                        </Typography>
                                        {isEditMode ? (
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={editFormData.status}
                                                onChange={(e) =>
                                                    handleEditChange(
                                                        "status",
                                                        e.target.value as SessionLike["status"],
                                                    )
                                                }
                                                sx={{
                                                    bgcolor: "#FFFFFF",
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "8px",
                                                        "& fieldset": {
                                                            borderColor: "#E8E5E1",
                                                            borderWidth: "1.5px",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#9B8B9E",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#9B8B9E",
                                                            borderWidth: "2px",
                                                        },
                                                    },
                                                }}
                                            >
                                                {statusOptions.map((option) => (
                                                    <MenuItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        ) : (
                                            <Chip
                                                label={getSessionStatusLabel(
                                                    session.status,
                                                )}
                                                size="small"
                                                sx={{
                                                    bgcolor:
                                                        statusColors.bgcolor,
                                                    color: statusColors.color,
                                                    border:
                                                        statusColors.border,
                                                    fontWeight: 600,
                                                    fontSize: "12px",
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
                        borderTop: "1.5px solid #E8E5E1",
                        bgcolor: "#FFFFFF",
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
                                    bgcolor: "#9B8B9E",
                                    color: "#FFFFFF",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    py: 1.25,
                                    "&:hover": {
                                        bgcolor: "#8A7A8D",
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
                                    borderColor: "#E8E5E1",
                                    color: "#4A4542",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    py: 1.25,
                                    "&:hover": {
                                        borderColor: "#D0CCC7",
                                        bgcolor: "#F9F8F7",
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
                                    borderColor: "#E8E5E1",
                                    color: "#4A4542",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    py: 1.25,
                                    "&:hover": {
                                        borderColor: "#9B8B9E",
                                        bgcolor: "rgba(155, 139, 158, 0.05)",
                                    },
                                }}
                            >
                                Edit Session
                            </Button>

                            {/* Show Cancel button only if not completed */}
                            {session.status !== "completed" &&
                                session.status !== "cancelled" && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => setIsCancelDialogOpen(true)}
                                        sx={{
                                            borderColor: "#F5E8E8",
                                            color: "#8B4A4A",
                                            fontWeight: 600,
                                            textTransform: "none",
                                            py: 1.25,
                                            "&:hover": {
                                                borderColor: "#8B4A4A",
                                                bgcolor: "#F5E8E8",
                                            },
                                        }}
                                    >
                                        Cancel Session
                                    </Button>
                                )}

                            {/* Keep cancelled sessions in history and book a replacement separately. */}
                            {session.status === "cancelled" &&
                                session.billingSource === "package" && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<EventAvailableIcon />}
                                    onClick={() => {
                                        onBookReplacement?.(session);
                                        onClose();
                                    }}
                                    sx={{
                                        borderColor: "#E8E5E1",
                                        color: "#5B7052",
                                        fontWeight: 600,
                                        textTransform: "none",
                                        py: 1.25,
                                        "&:hover": {
                                            borderColor: "#A8B5A0",
                                            bgcolor: "rgba(168, 181, 160, 0.08)",
                                        },
                                    }}
                                >
                                    Book Replacement
                                </Button>
                            )}
                        </Stack>
                    )}
                </Box>
            </Box>

            <Dialog
                open={isPaymentDialogOpen}
                onClose={() => setIsPaymentDialogOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: "100%", sm: 420 },
                        bgcolor: "#FDFCFB",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: "#2C2825",
                        fontSize: "18px",
                        fontWeight: 600,
                        p: 2.5,
                    }}
                >
                    Edit Payment
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.25} sx={{ pt: 0.5 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Payment status"
                            value={paymentFormData.paymentStatus}
                            onChange={(event) =>
                                handlePaymentChange(
                                    "paymentStatus",
                                    event.target.value as PaymentStatusValue,
                                )
                            }
                        >
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="unpaid">Unpaid</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            size="small"
                            label="Amount"
                            type="number"
                            value={paymentFormData.amount}
                            onChange={(event) =>
                                handlePaymentChange(
                                    "amount",
                                    event.target.value,
                                )
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                            InputProps={{
                                startAdornment: (
                                    <Typography
                                        sx={{
                                            color: "#7A746F",
                                            mr: 0.75,
                                            fontSize: "14px",
                                        }}
                                    >
                                        $
                                    </Typography>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="Payment method"
                            value={paymentFormData.paymentMethod}
                            onChange={(event) =>
                                handlePaymentChange(
                                    "paymentMethod",
                                    event.target.value,
                                )
                            }
                            placeholder="Card, cash, ACH..."
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="Payment date"
                            type="date"
                            value={paymentFormData.paymentDate}
                            onChange={(event) =>
                                handlePaymentChange(
                                    "paymentDate",
                                    event.target.value,
                                )
                            }
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5 }}>
                    <Button
                        onClick={() => setIsPaymentDialogOpen(false)}
                        sx={{
                            color: "#4A4542",
                            fontWeight: 600,
                            textTransform: "none",
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            void handleSavePayment();
                        }}
                        sx={{
                            bgcolor: "#9B8B9E",
                            color: "#FFFFFF",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": {
                                bgcolor: "#8A7A8D",
                            },
                        }}
                    >
                        Save Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog
                open={isCancelDialogOpen}
                onClose={() => setIsCancelDialogOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: "100%", sm: 400 },
                        bgcolor: "#FDFCFB",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: "#2C2825",
                        fontSize: "18px",
                        fontWeight: 600,
                        p: 2.5,
                    }}
                >
                    Cancel Session
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        sx={{
                            color: "#7A746F",
                            fontSize: "14px",
                            lineHeight: 1.6,
                        }}
                    >
                        Are you sure you want to cancel this session with{" "}
                        {session.client}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsCancelDialogOpen(false)}
                        sx={{
                            color: "#4A4542",
                            fontWeight: 600,
                            textTransform: "none",
                            py: 1.25,
                            "&:hover": {
                                bgcolor: "rgba(155, 139, 158, 0.05)",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            void handleStatusChange(
                                "cancelled",
                            ).then((didUpdate) => {
                                if (didUpdate) {
                                    setIsCancelDialogOpen(false);
                                    onClose();
                                }
                            });
                        }}
                        sx={{
                            color: "#8B4A4A",
                            fontWeight: 600,
                            textTransform: "none",
                            py: 1.25,
                            "&:hover": {
                                bgcolor: "#F5E8E8",
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
