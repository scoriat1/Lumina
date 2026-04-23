import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PaymentIcon from '@mui/icons-material/Payment';
import PendingIcon from '@mui/icons-material/Pending';
import { format, endOfMonth, startOfMonth } from 'date-fns';
import { PageHeader } from '../components/PageHeader';
import { apiClient } from '../api/client';
import type { BillingPaymentDto, BillingSummaryDto, ClientDto, PaymentStatusValue } from '../api/types';

const emptySummary: BillingSummaryDto = {
  totalRevenue: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  paidCount: 0,
  dueCount: 0,
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string) =>
  value ? format(new Date(value), 'MMM d, yyyy') : 'Not recorded';

const formatDateInput = (value: Date) => format(value, 'yyyy-MM-dd');
const currentMonthStart = formatDateInput(startOfMonth(new Date()));
const currentMonthEnd = formatDateInput(endOfMonth(new Date()));

type DateFilterValue = 'thisMonth' | 'allTime' | 'custom';

const getPaymentStatusStyles = (status: PaymentStatusValue) => {
  switch (status) {
    case 'paid':
      return {
        bg: 'rgba(168, 181, 160, 0.12)',
        text: '#5B7052',
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
      };
    case 'pending':
      return {
        bg: 'rgba(212, 184, 138, 0.12)',
        text: '#8B7444',
        icon: <PendingIcon sx={{ fontSize: 16 }} />,
      };
    default:
      return {
        bg: '#F5F3F1',
        text: '#7A746F',
        icon: <ErrorIcon sx={{ fontSize: 16 }} />,
      };
  }
};

const getBillingSourceLabel = (source: BillingPaymentDto['billingSource']) => {
  switch (source) {
    case 'pay-per-session':
      return 'Pay per session';
    case 'monthly':
      return 'Monthly';
    case 'package':
      return 'Package';
    default:
      return source;
  }
};

export function BillingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [payments, setPayments] = useState<BillingPaymentDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [summary, setSummary] = useState<BillingSummaryDto>(emptySummary);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isMarkingUnpaid, setIsMarkingUnpaid] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState(currentMonthStart);
  const [customEndDate, setCustomEndDate] = useState(currentMonthEnd);

  const billingFilters = useMemo(() => {
    const baseFilters = {
      clientId: selectedClientId === 'all' ? undefined : selectedClientId,
      startDate: undefined as string | undefined,
      endDate: undefined as string | undefined,
    };

    if (dateFilter === 'thisMonth') {
      return {
        ...baseFilters,
        startDate: currentMonthStart,
        endDate: currentMonthEnd,
      };
    }

    if (dateFilter === 'custom') {
      const normalizedStartDate =
        customStartDate && customEndDate && customStartDate > customEndDate
          ? customEndDate
          : customStartDate;
      const normalizedEndDate =
        customStartDate && customEndDate && customStartDate > customEndDate
          ? customStartDate
          : customEndDate;

      return {
        ...baseFilters,
        startDate: normalizedStartDate || undefined,
        endDate: normalizedEndDate || undefined,
      };
    }

    return baseFilters;
  }, [customEndDate, customStartDate, dateFilter, selectedClientId]);

  const loadBilling = () =>
    Promise.all([
      apiClient.getBillingSummary(billingFilters),
      apiClient.getBillingPayments(billingFilters),
      apiClient.getClients(),
    ])
      .then(([billingSummary, billingPayments, clientList]) => {
        setSummary(billingSummary);
        setPayments(billingPayments);
        setClients(clientList);
      })
      .catch((error) => {
        setBillingMessage(
          error instanceof Error ? error.message : 'Unable to load billing.',
        );
      });

  useEffect(() => {
    void loadBilling();
  }, [billingFilters]);

  const selectedPayment = useMemo(
    () => payments.find((payment) => payment.id === selectedPaymentId) ?? null,
    [payments, selectedPaymentId],
  );

  const paidPayments = payments.filter((payment) => payment.paymentStatus === 'paid');
  const duePayments = payments.filter((payment) => payment.paymentStatus !== 'paid');

  const handlePaymentClick = (payment: BillingPaymentDto) => {
    setSelectedPaymentId(payment.id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedPaymentId(null), 300);
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment || selectedPayment.paymentStatus === 'paid') {
      return;
    }

    setIsMarkingPaid(true);
    setBillingMessage(null);

    try {
      if (selectedPayment.sourceType === 'session') {
        await apiClient.markSessionPaid(selectedPayment.sourceId, {
          amount: selectedPayment.amount,
          paymentMethod: 'manual',
        });
      } else {
        await apiClient.markClientPackagePaid(
          selectedPayment.clientId,
          selectedPayment.sourceId,
          {
            amount: selectedPayment.amount,
            paymentMethod: 'manual',
          },
        );
      }

      await loadBilling();
      setBillingMessage('Payment marked paid.');
    } catch (error) {
      setBillingMessage(
        error instanceof Error ? error.message : 'Unable to mark payment paid.',
      );
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!selectedPayment || selectedPayment.paymentStatus !== 'paid') {
      return;
    }

    const confirmed = window.confirm(
      'Mark this payment unpaid? This will move it back to due and clear the recorded payment date and method.',
    );

    if (!confirmed) {
      return;
    }

    setIsMarkingUnpaid(true);
    setBillingMessage(null);

    try {
      const payload = {
        paymentStatus: 'unpaid' as const,
        amount: selectedPayment.amount,
        paymentMethod: null,
        paymentDate: null,
      };

      if (selectedPayment.sourceType === 'session') {
        await apiClient.updateSessionPayment(selectedPayment.sourceId, payload);
      } else {
        await apiClient.updateClientPackagePayment(
          selectedPayment.clientId,
          selectedPayment.sourceId,
          payload,
        );
      }

      await loadBilling();
      setBillingMessage('Payment marked unpaid.');
    } catch (error) {
      setBillingMessage(
        error instanceof Error ? error.message : 'Unable to mark payment unpaid.',
      );
    } finally {
      setIsMarkingUnpaid(false);
    }
  };

  const renderPaymentRow = (payment: BillingPaymentDto) => {
    const statusStyles = getPaymentStatusStyles(payment.paymentStatus);
    const isHighlighted = payment.id === selectedPaymentId;

    return (
      <Box
        key={payment.id}
        onClick={() => handlePaymentClick(payment)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          p: 3,
          bgcolor: isHighlighted ? 'rgba(155, 139, 158, 0.04)' : '#FFFFFF',
          border: isHighlighted ? '1.5px solid #9B8B9E' : '1px solid #E8E5E1',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(74, 69, 66, 0.08)',
            borderColor: '#9B8B9E',
            transform: 'translateX(4px)',
          },
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: payment.clientColor,
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          {payment.clientInitials}
        </Avatar>

        <Box sx={{ minWidth: 220, flexShrink: 0 }}>
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
            {payment.clientName}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#9B9691', fontSize: '13px', fontWeight: 500 }}
          >
            {getBillingSourceLabel(payment.billingSource)}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: '#6B6762',
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {payment.description}
          </Typography>
          <Typography variant="caption" sx={{ color: '#9A9490' }}>
            Service date {formatDate(payment.serviceDate)}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 110, flexShrink: 0, textAlign: 'right' }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color: '#4A4542', fontSize: '16px' }}
          >
            {formatCurrency(payment.amount)}
          </Typography>
        </Box>

        <Chip
          icon={statusStyles.icon}
          label={payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
          sx={{
            bgcolor: statusStyles.bg,
            color: statusStyles.text,
            fontWeight: 600,
            fontSize: '12px',
            height: 26,
            borderRadius: '8px',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />

        <ArrowForwardIcon sx={{ color: '#D0CCC7', fontSize: 20, flexShrink: 0 }} />
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Billing" subtitle="Paid and due amounts by service date." />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 280px) minmax(220px, 240px) minmax(180px, 220px) minmax(180px, 220px)' },
          gap: 2,
          mb: 3,
        }}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id="billing-client-filter-label">Client</InputLabel>
          <Select
            labelId="billing-client-filter-label"
            value={selectedClientId}
            label="Client"
            onChange={(event) => setSelectedClientId(event.target.value)}
            sx={{ bgcolor: '#FFFFFF' }}
          >
            <MenuItem value="all">All clients</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id="billing-date-filter-label">Date range</InputLabel>
          <Select
            labelId="billing-date-filter-label"
            value={dateFilter}
            label="Date range"
            onChange={(event) => setDateFilter(event.target.value as DateFilterValue)}
            sx={{ bgcolor: '#FFFFFF' }}
          >
            <MenuItem value="thisMonth">Current month</MenuItem>
            <MenuItem value="allTime">All time</MenuItem>
            <MenuItem value="custom">Custom range</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="Start date"
          value={customStartDate}
          onChange={(event) => setCustomStartDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={dateFilter !== 'custom'}
          sx={{ bgcolor: '#FFFFFF' }}
        />

        <TextField
          size="small"
          type="date"
          label="End date"
          value={customEndDate}
          onChange={(event) => setCustomEndDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={dateFilter !== 'custom'}
          sx={{ bgcolor: '#FFFFFF' }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Card sx={{ bgcolor: '#FDFCFB', border: '1px solid #E8E5E1', borderRadius: '16px' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: 'rgba(168, 181, 160, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleIcon sx={{ color: '#5B7052', fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#7A746F', fontWeight: 500 }}>
                Paid
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4A4542' }}>
              {formatCurrency(summary.totalRevenue)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {summary.paidCount ?? paidPayments.length} paid payment{(summary.paidCount ?? paidPayments.length) === 1 ? '' : 's'}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#FDFCFB', border: '1px solid #E8E5E1', borderRadius: '16px' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: 'rgba(212, 184, 138, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PendingIcon sx={{ color: '#8B7444', fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#7A746F', fontWeight: 500 }}>
                Due
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4A4542' }}>
              {formatCurrency(summary.pendingAmount)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {summary.dueCount ?? duePayments.length} payment{(summary.dueCount ?? duePayments.length) === 1 ? '' : 's'} due
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#FDFCFB', border: '1px solid #E8E5E1', borderRadius: '16px' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: 'rgba(155, 139, 158, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AccountBalanceWalletIcon sx={{ color: '#7A5C80', fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#7A746F', fontWeight: 500 }}>
                Tracked
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4A4542' }}>
              {payments.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              Sessions and packages
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: '#4A4542', fontSize: '18px', letterSpacing: '-0.01em' }}
        >
          Payments
        </Typography>
        {billingMessage ? (
          <Typography sx={{ color: '#7A746F', fontSize: '13px' }}>
            {billingMessage}
          </Typography>
        ) : null}
      </Box>

      <Stack spacing={2}>
        {payments.map(renderPaymentRow)}
      </Stack>

      {payments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: '#7A746F' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No billable payments yet
          </Typography>
          <Typography variant="body2">
            Add sessions or packages with payment amounts to start tracking billing.
          </Typography>
        </Box>
      ) : null}

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
        {selectedPayment ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 4, bgcolor: '#FAF8F6', borderBottom: '1px solid #E8E5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#4A4542', mb: 1 }}>
                  {selectedPayment.description}
                </Typography>
                <Chip
                  label={getBillingSourceLabel(selectedPayment.billingSource)}
                  size="small"
                  sx={{ bgcolor: 'rgba(122, 116, 111, 0.08)', color: '#7A746F', fontWeight: 600 }}
                />
              </Box>
              <IconButton onClick={handleDrawerClose} sx={{ color: '#7A746F' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
              <Box sx={{ mb: 4, bgcolor: '#F5F3F1', borderRadius: '12px', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: selectedPayment.clientColor, fontWeight: 600, fontSize: '16px' }}>
                  {selectedPayment.clientInitials}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4A4542' }}>
                    {selectedPayment.clientName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7A746F' }}>
                    {selectedPayment.sourceType === 'package' ? 'Package purchase' : 'Session payment'}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2.5}>
                <Box sx={{ bgcolor: '#F5F3F1', borderRadius: '12px', p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#7A746F', textTransform: 'uppercase', fontWeight: 700 }}>
                    Amount
                  </Typography>
                  <Typography variant="h3" sx={{ mt: 1, fontWeight: 700, color: '#4A4542' }}>
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#7A746F' }}>Status</Typography>
                  <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedPayment.paymentStatus}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#7A746F' }}>Service date</Typography>
                  <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                    {formatDate(selectedPayment.serviceDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#7A746F' }}>Payment date</Typography>
                  <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                    {formatDate(selectedPayment.paymentDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#7A746F' }}>Method</Typography>
                  <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                    {selectedPayment.paymentMethod || 'Not recorded'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ p: 4, borderTop: '1px solid #E8E5E1', bgcolor: '#FAF8F6' }}>
              {selectedPayment.paymentStatus !== 'paid' ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isMarkingPaid}
                  onClick={() => {
                    void handleMarkPaid();
                  }}
                  startIcon={<PaymentIcon />}
                  sx={{
                    bgcolor: '#9B8B9E',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#8A7A8D' },
                  }}
                >
                  {isMarkingPaid ? 'Saving...' : 'Mark Paid'}
                </Button>
              ) : (
                <Stack spacing={1.5}>
                  <Typography sx={{ color: '#5B7052', fontWeight: 600, textAlign: 'center' }}>
                    Payment complete
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={isMarkingUnpaid}
                    onClick={() => {
                      void handleMarkUnpaid();
                    }}
                    startIcon={<MoneyOffIcon />}
                    sx={{
                      color: '#7A746F',
                      borderColor: '#D8D2CB',
                      borderRadius: '10px',
                      py: 1.25,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#9B8B9E',
                        bgcolor: 'rgba(155, 139, 158, 0.06)',
                      },
                    }}
                  >
                    {isMarkingUnpaid ? 'Saving...' : 'Mark unpaid'}
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>
        ) : null}
      </Drawer>
    </Box>
  );
}
