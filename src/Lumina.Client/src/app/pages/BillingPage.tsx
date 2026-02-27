import { useEffect, useMemo, useState } from 'react';
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
import { apiClient } from '../api/client';
import type { InvoiceDto } from '../api/types';

interface Invoice extends InvoiceDto {}

export function BillingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, pendingAmount: 0, overdueAmount: 0 });

  useEffect(() => {
    Promise.all([apiClient.getBillingSummary(), apiClient.getBillingInvoices()])
      .then(([billingSummary, billingInvoices]) => {
        setSummary(billingSummary);
        setInvoices(billingInvoices);
      })
      .catch(() => undefined);
  }, []);

  const selectedInvoice = useMemo(() => invoices.find((inv) => inv.id === selectedInvoiceId) ?? null, [invoices, selectedInvoiceId]);

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
              ${summary.totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {invoices.filter((inv) => inv.status === 'paid').length} paid invoices
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
              ${summary.pendingAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {invoices.filter((inv) => inv.status === 'pending').length} pending invoices
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
              ${summary.overdueAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9B9691', mt: 1, display: 'block' }}>
              {invoices.filter((inv) => inv.status === 'overdue').length} overdue invoices
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
        {invoices.map((invoice) => {
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
                  {selectedInvoice?.invoiceNumber}
                </Typography>
                <Chip
                  icon={getStatusStyles(selectedInvoice?.status as Invoice['status']).icon}
                  label={
                    selectedInvoice?.status.charAt(0).toUpperCase() + selectedInvoice?.status.slice(1)
                  }
                  size="small"
                  sx={{
                    bgcolor: getStatusStyles(selectedInvoice?.status as Invoice['status']).bg,
                    color: getStatusStyles(selectedInvoice?.status as Invoice['status']).text,
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
                      bgcolor: selectedInvoice?.clientColor,
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    {selectedInvoice?.clientInitials}
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4A4542' }}>
                    {selectedInvoice?.clientName}
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
                      {selectedInvoice?.date}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#7A746F' }}>
                      Due Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                      {selectedInvoice?.dueDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#7A746F' }}>
                      Sessions
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A4542', fontWeight: 600 }}>
                      {selectedInvoice?.sessionCount}
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
                    {selectedInvoice?.description}
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
                    ${selectedInvoice?.amount}
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
              {selectedInvoice?.status !== 'paid' && (
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