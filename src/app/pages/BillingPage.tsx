import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Drawer,
  Divider,
  Avatar,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PageHeader } from '../components/PageHeader';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientInitials: string;
  clientColor: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  sessionCount: number;
  description: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Alex Thompson',
    clientInitials: 'AT',
    clientColor: '#9B8B9E',
    amount: 600,
    date: 'Feb 1, 2026',
    dueDate: 'Feb 15, 2026',
    status: 'paid',
    sessionCount: 4,
    description: 'Executive Leadership - February sessions',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-002',
    clientName: 'Taylor Chen',
    clientInitials: 'TC',
    clientColor: '#A8B5A0',
    amount: 450,
    date: 'Feb 1, 2026',
    dueDate: 'Feb 15, 2026',
    status: 'pending',
    sessionCount: 3,
    description: 'Career Development - February sessions',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2026-003',
    clientName: 'Jamie Patel',
    clientInitials: 'JP',
    clientColor: '#9DAAB5',
    amount: 300,
    date: 'Jan 15, 2026',
    dueDate: 'Jan 30, 2026',
    status: 'overdue',
    sessionCount: 2,
    description: 'Work-Life Balance - January sessions',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2026-004',
    clientName: 'Casey Martinez',
    clientInitials: 'CM',
    clientColor: '#D4B88A',
    amount: 600,
    date: 'Feb 1, 2026',
    dueDate: 'Feb 15, 2026',
    status: 'paid',
    sessionCount: 4,
    description: 'Confidence & Communication - February sessions',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2026-005',
    clientName: 'Morgan Blake',
    clientInitials: 'MB',
    clientColor: '#9B8B9E',
    amount: 450,
    date: 'Feb 5, 2026',
    dueDate: 'Feb 20, 2026',
    status: 'pending',
    sessionCount: 3,
    description: 'Executive Leadership Coaching - February sessions',
  },
  {
    id: '6',
    invoiceNumber: 'INV-2026-006',
    clientName: 'Riley Foster',
    clientInitials: 'RF',
    clientColor: '#A8B5A0',
    amount: 525,
    date: 'Jan 20, 2026',
    dueDate: 'Feb 5, 2026',
    status: 'paid',
    sessionCount: 3.5,
    description: 'Career Transition - January sessions',
  },
];

export function BillingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedInvoiceId(null), 300);
  };

  const getStatusStyles = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return {
          bg: 'rgba(168, 181, 160, 0.12)',
          text: '#7A8873',
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
        };
      case 'pending':
        return {
          bg: 'rgba(212, 184, 138, 0.12)',
          text: '#A88F5F',
          icon: <PendingIcon sx={{ fontSize: 16 }} />,
        };
      case 'overdue':
        return {
          bg: 'rgba(201, 99, 73, 0.12)',
          text: '#C96349',
          icon: <ErrorIcon sx={{ fontSize: 16 }} />,
        };
      default:
        return {
          bg: 'rgba(122, 116, 111, 0.12)',
          text: '#7A746F',
          icon: <PendingIcon sx={{ fontSize: 16 }} />,
        };
    }
  };

  const totalRevenue = mockInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = mockInvoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = mockInvoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <PageHeader title="Billing" />

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        {/* Total Revenue */}
        <Card
          sx={{
            bgcolor: '#FDFCFB',
            border: '1px solid #E8E5E1',
            borderRadius: '16px',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  bgcolor: 'rgba(168, 181, 160, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon sx={{ color: '#7A8873', fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#7A746F', fontWeight: 500 }}>
                Total Revenue
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4A4542' }}>
              ${totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {mockInvoices.filter((inv) => inv.status === 'paid').length} paid invoices
            </Typography>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card
          sx={{
            bgcolor: '#FDFCFB',
            border: '1px solid #E8E5E1',
            borderRadius: '16px',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  bgcolor: 'rgba(212, 184, 138, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PendingIcon sx={{ color: '#A88F5F', fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#7A746F', fontWeight: 500 }}>
                Pending
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4A4542' }}>
              ${pendingAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {mockInvoices.filter((inv) => inv.status === 'pending').length} pending invoices
            </Typography>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card
          sx={{
            bgcolor: '#FDFCFB',
            border: '1px solid #E8E5E1',
            borderRadius: '16px',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  bgcolor: 'rgba(201, 99, 73, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ErrorIcon sx={{ color: '#C96349', fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#7A746F', fontWeight: 500 }}>
                Overdue
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#C96349' }}>
              ${overdueAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {mockInvoices.filter((inv) => inv.status === 'overdue').length} overdue invoices
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Invoices List */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#4A4542',
            fontSize: '18px',
            letterSpacing: '-0.01em',
          }}
        >
          Recent Invoices
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: '#9B8B9E',
            color: '#FFFFFF',
            borderRadius: '10px',
            px: 3,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#8A7A8D',
            },
          }}
        >
          Create Invoice
        </Button>
      </Box>

      {/* Invoice Rows */}
      <Stack spacing={2}>
        {mockInvoices.map((invoice) => {
          const statusStyles = getStatusStyles(invoice.status);
          const isHighlighted = selectedInvoiceId === invoice.id;

          return (
            <Box
              key={invoice.id}
              onClick={() => handleInvoiceClick(invoice)}
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
              {/* Icon */}
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: 'rgba(155, 139, 158, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ReceiptIcon sx={{ color: '#9B8B9E', fontSize: 24 }} />
              </Box>

              {/* Invoice Number & Client */}
              <Box sx={{ minWidth: 200, flexShrink: 0 }}>
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
                  {invoice.invoiceNumber}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#9B9691',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {invoice.clientName}
                </Typography>
              </Box>

              {/* Description */}
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
                  {invoice.description}
                </Typography>
              </Box>

              {/* Amount */}
              <Box sx={{ minWidth: 100, flexShrink: 0, textAlign: 'right' }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: '#4A4542',
                    fontSize: '16px',
                  }}
                >
                  ${invoice.amount}
                </Typography>
              </Box>

              {/* Due Date */}
              <Box sx={{ minWidth: 120, flexShrink: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#9A9490',
                    fontSize: '14px',
                  }}
                >
                  Due {invoice.dueDate}
                </Typography>
              </Box>

              {/* Status Badge */}
              <Box sx={{ flexShrink: 0 }}>
                <Chip
                  icon={statusStyles.icon}
                  label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
              </Box>

              {/* Arrow indicator */}
              <ArrowForwardIcon sx={{ color: '#D0CCC7', fontSize: 20, flexShrink: 0 }} />
            </Box>
          );
        })}
      </Stack>

      {/* Invoice Detail Drawer */}
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
        {selectedInvoiceId && (
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#4A4542', mb: 1 }}>
                  {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.invoiceNumber}
                </Typography>
                <Chip
                  icon={getStatusStyles(mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.status as Invoice['status']).icon}
                  label={
                    mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.status.charAt(0).toUpperCase() + mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.status.slice(1)
                  }
                  size="small"
                  sx={{
                    bgcolor: getStatusStyles(mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.status as Invoice['status']).bg,
                    color: getStatusStyles(mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.status as Invoice['status']).text,
                    fontWeight: 600,
                    fontSize: '12px',
                    height: 24,
                    borderRadius: '6px',
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Box>
              <IconButton onClick={handleDrawerClose} sx={{ color: '#7A746F' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Drawer Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
              {/* Client Information */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
                  Client
                </Typography>
                <Box
                  sx={{
                    bgcolor: '#F5F3F1',
                    borderRadius: '12px',
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.clientColor,
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.clientInitials}
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4A4542' }}>
                    {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.clientName}
                  </Typography>
                </Box>
              </Box>

              {/* Invoice Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
                  Details
                </Typography>
                <Box sx={{ bgcolor: '#F5F3F1', borderRadius: '12px', p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#7A746F' }}>
                      Invoice Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                      {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.date}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#7A746F' }}>
                      Due Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                      {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.dueDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#7A746F' }}>
                      Sessions
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                      {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.sessionCount}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Description */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
                  Description
                </Typography>
                <Box sx={{ bgcolor: '#F5F3F1', borderRadius: '12px', p: 3 }}>
                  <Typography variant="body2" sx={{ color: '#4A4542', lineHeight: 1.6 }}>
                    {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.description}
                  </Typography>
                </Box>
              </Box>

              {/* Amount */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#7A746F', fontWeight: 600, mb: 2 }}>
                  Total Amount
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'rgba(155, 139, 158, 0.08)',
                    border: '1px solid rgba(155, 139, 158, 0.2)',
                    borderRadius: '12px',
                    p: 4,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#4A4542' }}>
                    ${mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.amount}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Drawer Footer */}
            <Box
              sx={{
                p: 4,
                borderTop: '1px solid #E8E5E1',
                bgcolor: '#FAF8F6',
                display: 'flex',
                gap: 2,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  borderColor: '#E8E5E1',
                  color: '#7A746F',
                  borderRadius: '10px',
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#9B8B9E',
                    bgcolor: 'rgba(155, 139, 158, 0.04)',
                  },
                }}
              >
                Download
              </Button>
              {mockInvoices.find((inv) => inv.id === selectedInvoiceId)?.status !== 'paid' && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PaymentIcon />}
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
                  Mark as Paid
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}