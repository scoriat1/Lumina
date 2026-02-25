import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Box, TextField, Button, Switch, FormControlLabel, Typography, Select, MenuItem, InputAdornment, Avatar, Chip, IconButton } from '@mui/material';
import { Add, Edit, MoreVert, CloudUpload } from '@mui/icons-material';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../styles/colors';
import { NotesTemplateSettings } from '../components/NotesTemplateSettings';

type SettingsTab = 
  | 'practice'
  | 'providers'
  | 'packages'
  | 'billing'
  | 'availability'
  | 'notifications'
  | 'notes'
  | 'roles';

// Mock data for demonstration
const mockProviders = [
  { 
    id: '1', 
    name: 'Sarah Johnson', 
    email: 'sarah@practice.com', 
    role: 'Owner', 
    status: 'Active', 
    hasOverride: false,
    avatar: null
  },
];

const mockPackages = [
  { id: '1', name: '4-Session Package', sessionCount: 4, price: 800, billingType: 'One-time', status: 'Active', enabled: true },
  { id: '2', name: 'Monthly Retainer', sessionCount: 8, price: 1500, billingType: 'Recurring', status: 'Active', enabled: true },
];

const mockRoles = [
  { 
    id: '1', 
    name: 'Owner', 
    description: 'Full access to all features, billing, and practice configuration',
    color: '#6E5BCE'
  },
  { 
    id: '2', 
    name: 'Admin', 
    description: 'Manage providers, clients, sessions, and billing. Cannot modify owner settings.',
    color: '#5F6368'
  },
  { 
    id: '3', 
    name: 'Provider', 
    description: 'Manage own sessions, clients, and availability. Limited administrative access.',
    color: '#6B7280'
  },
];

export function SettingsPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('practice');
  const [isDirty, setIsDirty] = useState(false);

  // Handle URL hash navigation (e.g., /settings#notes)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['practice', 'providers', 'packages', 'billing', 'availability', 'notifications', 'notes', 'roles'].includes(hash)) {
      setActiveTab(hash as SettingsTab);
    }
  }, [location.hash]);

  // Practice settings state
  const [practiceName, setPracticeName] = useState('My Practice');
  const [practiceEmail, setPracticeEmail] = useState('contact@practice.com');
  const [practicePhone, setPracticePhone] = useState('');
  const [practiceAddress, setPracticeAddress] = useState('');
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Default settings
  const [defaultSessionDuration, setDefaultSessionDuration] = useState('60');
  const [defaultSessionMethod, setDefaultSessionMethod] = useState('Zoom');
  const [cancellationPolicy, setCancellationPolicy] = useState('24');
  const [bufferTime, setBufferTime] = useState('15');

  // Notification settings state
  const [sessionReminders, setSessionReminders] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [providerReminderCopy, setProviderReminderCopy] = useState(false);

  // Billing settings state
  const [stripeConnected, setStripeConnected] = useState(false);
  const [defaultDueDays, setDefaultDueDays] = useState('30');
  const [autoSendInvoices, setAutoSendInvoices] = useState(true);
  const [taxRate, setTaxRate] = useState('');
  const [clientPaysProcessingFees, setClientPaysProcessingFees] = useState(false);
  const [allowPayPerSession, setAllowPayPerSession] = useState(true);
  const [allowPackageBilling, setAllowPackageBilling] = useState(true);
  const [allowRecurringSubscriptions, setAllowRecurringSubscriptions] = useState(false);

  // Availability settings
  const [applyToAllProviders, setApplyToAllProviders] = useState(true);

  const handleSave = () => {
    console.log('Saving settings...');
    setIsDirty(false);
  };

  const handleCancel = () => {
    console.log('Canceling changes...');
    setIsDirty(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader 
        title="Settings" 
        subtitle="Manage your practice configuration"
      />

      {/* Main Layout: Left Nav + Content */}
      <Box sx={{ display: 'flex', gap: 4, flexGrow: 1, mt: -2 }}>
        {/* Left Vertical Navigation */}
        <Box
          sx={{
            width: '240px',
            bgcolor: colors.surface.card,
            borderRadius: '12px',
            border: `1px solid ${colors.neutral.gray200}`,
            p: 1.5,
            height: 'fit-content',
            position: 'sticky',
            top: 0,
          }}
        >
          <SettingsNavItem
            label="Practice"
            isActive={activeTab === 'practice'}
            onClick={() => setActiveTab('practice')}
          />
          <SettingsNavItem
            label="Providers"
            isActive={activeTab === 'providers'}
            onClick={() => setActiveTab('providers')}
          />
          <SettingsNavItem
            label="Packages"
            isActive={activeTab === 'packages'}
            onClick={() => setActiveTab('packages')}
          />
          <SettingsNavItem
            label="Billing"
            isActive={activeTab === 'billing'}
            onClick={() => setActiveTab('billing')}
          />
          <SettingsNavItem
            label="Availability"
            isActive={activeTab === 'availability'}
            onClick={() => setActiveTab('availability')}
          />
          <SettingsNavItem
            label="Notifications"
            isActive={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
          />
          <SettingsNavItem
            label="Notes"
            isActive={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
          />
          <SettingsNavItem
            label="Roles & Permissions"
            isActive={activeTab === 'roles'}
            onClick={() => setActiveTab('roles')}
          />
        </Box>

        {/* Right Content Panel */}
        <Box sx={{ flexGrow: 1, maxWidth: '800px' }}>
          {activeTab === 'practice' && (
            <PracticeSettings
              practiceName={practiceName}
              setPracticeName={setPracticeName}
              practiceEmail={practiceEmail}
              setPracticeEmail={setPracticeEmail}
              practicePhone={practicePhone}
              setPracticePhone={setPracticePhone}
              practiceAddress={practiceAddress}
              setPracticeAddress={setPracticeAddress}
              timeZone={timeZone}
              setTimeZone={setTimeZone}
              currency={currency}
              setCurrency={setCurrency}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              defaultSessionDuration={defaultSessionDuration}
              setDefaultSessionDuration={setDefaultSessionDuration}
              defaultSessionMethod={defaultSessionMethod}
              setDefaultSessionMethod={setDefaultSessionMethod}
              cancellationPolicy={cancellationPolicy}
              setCancellationPolicy={setCancellationPolicy}
              bufferTime={bufferTime}
              setBufferTime={setBufferTime}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {activeTab === 'providers' && (
            <ProvidersSettings providers={mockProviders} />
          )}

          {activeTab === 'packages' && (
            <PackagesSettings packages={mockPackages} />
          )}

          {activeTab === 'billing' && (
            <BillingSettings
              stripeConnected={stripeConnected}
              setStripeConnected={setStripeConnected}
              defaultDueDays={defaultDueDays}
              setDefaultDueDays={setDefaultDueDays}
              autoSendInvoices={autoSendInvoices}
              setAutoSendInvoices={setAutoSendInvoices}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              clientPaysProcessingFees={clientPaysProcessingFees}
              setClientPaysProcessingFees={setClientPaysProcessingFees}
              allowPayPerSession={allowPayPerSession}
              setAllowPayPerSession={setAllowPayPerSession}
              allowPackageBilling={allowPackageBilling}
              setAllowPackageBilling={setAllowPackageBilling}
              allowRecurringSubscriptions={allowRecurringSubscriptions}
              setAllowRecurringSubscriptions={setAllowRecurringSubscriptions}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {activeTab === 'availability' && (
            <AvailabilitySettings
              timeZone={timeZone}
              applyToAllProviders={applyToAllProviders}
              setApplyToAllProviders={setApplyToAllProviders}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSettings
              sessionReminders={sessionReminders}
              setSessionReminders={setSessionReminders}
              invoiceReminders={invoiceReminders}
              setInvoiceReminders={setInvoiceReminders}
              overdueAlerts={overdueAlerts}
              setOverdueAlerts={setOverdueAlerts}
              weeklySummary={weeklySummary}
              setWeeklySummary={setWeeklySummary}
              providerReminderCopy={providerReminderCopy}
              setProviderReminderCopy={setProviderReminderCopy}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {activeTab === 'notes' && (
            <NotesSettings />
          )}

          {activeTab === 'roles' && (
            <RolesSettings roles={mockRoles} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Navigation Item Component
function SettingsNavItem({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        px: 2,
        py: 1.75,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        bgcolor: isActive ? 'rgba(110, 91, 206, 0.06)' : 'transparent',
        mb: 0.5,
        '&:hover': {
          bgcolor: isActive ? 'rgba(110, 91, 206, 0.06)' : colors.neutral.gray100,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '20px',
          bgcolor: colors.primary.main,
          borderRadius: '0 2px 2px 0',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? colors.text.primary : colors.text.secondary,
          transition: 'color 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// Practice Settings Section
function PracticeSettings({
  practiceName,
  setPracticeName,
  practiceEmail,
  setPracticeEmail,
  practicePhone,
  setPracticePhone,
  practiceAddress,
  setPracticeAddress,
  timeZone,
  setTimeZone,
  currency,
  setCurrency,
  logoUrl,
  setLogoUrl,
  defaultSessionDuration,
  setDefaultSessionDuration,
  defaultSessionMethod,
  setDefaultSessionMethod,
  cancellationPolicy,
  setCancellationPolicy,
  bufferTime,
  setBufferTime,
  isDirty,
  setIsDirty,
  onSave,
  onCancel,
}: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Practice Information Card */}
      <ContentCard>
        <SectionHeader title="Practice Information" />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          {/* Logo Upload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={logoUrl}
              sx={{
                width: 80,
                height: 80,
                bgcolor: colors.neutral.gray100,
                color: colors.text.secondary,
                fontSize: '32px',
                fontWeight: 600,
              }}
            >
              {practiceName.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.text.primary, mb: 1 }}>
                Practice Logo
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CloudUpload sx={{ fontSize: '18px' }} />}
                sx={{
                  borderColor: colors.neutral.gray200,
                  color: colors.text.primary,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '13px',
                  px: 2,
                  py: 0.75,
                  '&:hover': {
                    borderColor: colors.neutral.gray300,
                    bgcolor: 'transparent',
                  },
                }}
              >
                Upload Logo
              </Button>
            </Box>
          </Box>

          <FormField label="Practice Name">
            <TextField
              fullWidth
              value={practiceName}
              onChange={(e) => {
                setPracticeName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Enter practice name"
              sx={textFieldStyles}
            />
          </FormField>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <FormField label="Practice Email">
              <TextField
                fullWidth
                type="email"
                value={practiceEmail}
                onChange={(e) => {
                  setPracticeEmail(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="contact@practice.com"
                sx={textFieldStyles}
              />
            </FormField>

            <FormField label="Practice Phone">
              <TextField
                fullWidth
                type="tel"
                value={practicePhone}
                onChange={(e) => {
                  setPracticePhone(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="(555) 123-4567"
                sx={textFieldStyles}
              />
            </FormField>
          </Box>

          <FormField label="Practice Address">
            <TextField
              fullWidth
              multiline
              rows={2}
              value={practiceAddress}
              onChange={(e) => {
                setPracticeAddress(e.target.value);
                setIsDirty(true);
              }}
              placeholder="123 Main St, Suite 100, City, State 12345"
              sx={textFieldStyles}
            />
          </FormField>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <FormField label="Time Zone">
              <Select
                fullWidth
                value={timeZone}
                onChange={(e) => {
                  setTimeZone(e.target.value);
                  setIsDirty(true);
                }}
                sx={selectStyles}
              >
                <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </Select>
            </FormField>

            <FormField label="Default Currency">
              <Select
                fullWidth
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setIsDirty(true);
                }}
                sx={selectStyles}
              >
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="CAD">CAD ($)</MenuItem>
              </Select>
            </FormField>
          </Box>
        </Box>
      </ContentCard>

      {/* Defaults Card */}
      <ContentCard>
        <SectionHeader title="Defaults" />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <FormField label="Default Session Duration">
              <Select
                fullWidth
                value={defaultSessionDuration}
                onChange={(e) => {
                  setDefaultSessionDuration(e.target.value);
                  setIsDirty(true);
                }}
                sx={selectStyles}
              >
                <MenuItem value="30">30 minutes</MenuItem>
                <MenuItem value="45">45 minutes</MenuItem>
                <MenuItem value="60">60 minutes</MenuItem>
                <MenuItem value="90">90 minutes</MenuItem>
                <MenuItem value="120">120 minutes</MenuItem>
              </Select>
            </FormField>

            <FormField label="Default Session Method">
              <Select
                fullWidth
                value={defaultSessionMethod}
                onChange={(e) => {
                  setDefaultSessionMethod(e.target.value);
                  setIsDirty(true);
                }}
                sx={selectStyles}
              >
                <MenuItem value="Zoom">Zoom</MenuItem>
                <MenuItem value="Phone">Phone</MenuItem>
                <MenuItem value="In-Person">In-Person</MenuItem>
              </Select>
            </FormField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <FormField label="Default Cancellation Policy">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  value={cancellationPolicy}
                  onChange={(e) => {
                    setCancellationPolicy(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="24"
                  sx={textFieldStyles}
                />
                <Typography sx={{ fontSize: '13px', color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                  hours before
                </Typography>
              </Box>
            </FormField>

            <FormField label="Default Buffer Time">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  value={bufferTime}
                  onChange={(e) => {
                    setBufferTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="15"
                  sx={textFieldStyles}
                />
                <Typography sx={{ fontSize: '13px', color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                  minutes
                </Typography>
              </Box>
            </FormField>
          </Box>
        </Box>
      </ContentCard>

      {isDirty && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            onClick={onCancel}
            sx={cancelButtonStyles}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            sx={saveButtonStyles}
          >
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Providers Settings Section
function ProvidersSettings({ providers }: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <SectionHeader title="Providers" />
          <Button
            variant="outlined"
            startIcon={<Add sx={{ fontSize: '18px' }} />}
            sx={{
              borderColor: colors.neutral.gray200,
              color: colors.text.primary,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              px: 2.5,
              py: 1,
              '&:hover': {
                borderColor: colors.neutral.gray300,
                bgcolor: 'transparent',
              },
            }}
          >
            Invite Provider
          </Button>
        </Box>

        {/* Providers List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {providers.map((provider: any) => (
            <Box
              key={provider.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                p: 2.5,
                border: `1px solid ${colors.neutral.gray200}`,
                borderRadius: '12px',
                transition: 'all 180ms',
                '&:hover': {
                  bgcolor: colors.neutral.gray50,
                  borderColor: colors.neutral.gray300,
                },
              }}
            >
              <Avatar
                src={provider.avatar}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: colors.primary.main,
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {provider.name.split(' ').map((n: string) => n[0]).join('')}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '15px', color: colors.text.primary, mb: 0.5 }}>
                  {provider.name}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: colors.text.secondary }}>
                  {provider.email}
                </Typography>
              </Box>

              <Chip
                label={provider.role}
                size="small"
                sx={{
                  bgcolor: 'rgba(110, 91, 206, 0.08)',
                  color: colors.primary.main,
                  fontWeight: 500,
                  fontSize: '12px',
                  height: '26px',
                  borderRadius: '6px',
                }}
              />

              <Chip
                label={provider.status}
                size="small"
                sx={{
                  bgcolor: 'rgba(46, 125, 50, 0.08)',
                  color: '#2E7D32',
                  fontWeight: 500,
                  fontSize: '12px',
                  height: '26px',
                  borderRadius: '6px',
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '80px' }}>
                <Typography sx={{ fontSize: '13px', color: colors.text.secondary }}>
                  Override:
                </Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.text.primary }}>
                  {provider.hasOverride ? 'Yes' : 'No'}
                </Typography>
              </Box>

              <IconButton size="small" sx={{ color: colors.text.secondary }}>
                <MoreVert sx={{ fontSize: '20px' }} />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Info Box */}
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            bgcolor: colors.neutral.gray50,
            border: `1px solid ${colors.neutral.gray200}`,
            borderRadius: '12px',
          }}
        >
          <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.6 }}>
            If provider overrides are enabled, their availability and rates may differ from practice defaults.
          </Typography>
        </Box>
      </ContentCard>
    </Box>
  );
}

// Packages Settings Section
function PackagesSettings({ packages }: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <SectionHeader title="Packages" />
          <Button
            variant="outlined"
            startIcon={<Add sx={{ fontSize: '18px' }} />}
            sx={{
              borderColor: colors.neutral.gray200,
              color: colors.text.primary,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              px: 2.5,
              py: 1,
              '&:hover': {
                borderColor: colors.neutral.gray300,
                bgcolor: 'transparent',
              },
            }}
          >
            Create Package
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {packages.map((pkg: any) => (
            <Box
              key={pkg.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 3,
                border: `1px solid ${colors.neutral.gray200}`,
                borderRadius: '12px',
                transition: 'all 180ms',
                '&:hover': {
                  bgcolor: colors.neutral.gray50,
                  borderColor: colors.neutral.gray300,
                },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '16px', color: colors.text.primary }}>
                    {pkg.name}
                  </Typography>
                  <Chip
                    label={pkg.status}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(46, 125, 50, 0.08)',
                      color: '#2E7D32',
                      fontWeight: 500,
                      fontSize: '11px',
                      height: '22px',
                      borderRadius: '6px',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: colors.text.secondary, mb: 0.25 }}>
                      Sessions
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary }}>
                      {pkg.sessionCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: colors.text.secondary, mb: 0.25 }}>
                      Price
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary }}>
                      ${pkg.price}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: colors.text.secondary, mb: 0.25 }}>
                      Billing Type
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary }}>
                      {pkg.billingType}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '13px', color: colors.text.secondary }}>
                    {pkg.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Switch
                    checked={pkg.enabled}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colors.primary.main,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colors.primary.main,
                      },
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: colors.text.secondary,
                    '&:hover': { color: colors.primary.main },
                  }}
                >
                  <Edit sx={{ fontSize: '18px' }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </ContentCard>
    </Box>
  );
}

// Billing Settings Section
function BillingSettings({
  stripeConnected,
  setStripeConnected,
  defaultDueDays,
  setDefaultDueDays,
  autoSendInvoices,
  setAutoSendInvoices,
  taxRate,
  setTaxRate,
  clientPaysProcessingFees,
  setClientPaysProcessingFees,
  allowPayPerSession,
  setAllowPayPerSession,
  allowPackageBilling,
  setAllowPackageBilling,
  allowRecurringSubscriptions,
  setAllowRecurringSubscriptions,
  isDirty,
  setIsDirty,
  onSave,
  onCancel,
}: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Stripe Integration */}
      <ContentCard>
        <SectionHeader title="Stripe Integration" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
          <Chip
            label={stripeConnected ? 'Connected' : 'Not Connected'}
            size="small"
            sx={{
              bgcolor: stripeConnected ? 'rgba(46, 125, 50, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: stripeConnected ? '#2E7D32' : colors.text.secondary,
              fontWeight: 500,
              fontSize: '13px',
              height: '28px',
              borderRadius: '6px',
            }}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setStripeConnected(!stripeConnected);
              setIsDirty(true);
            }}
            sx={{
              borderColor: colors.neutral.gray200,
              color: colors.text.primary,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '13px',
              px: 2.5,
              py: 0.75,
              '&:hover': {
                borderColor: colors.neutral.gray300,
                bgcolor: 'transparent',
              },
            }}
          >
            {stripeConnected ? 'Manage' : 'Connect Stripe'}
          </Button>
        </Box>
      </ContentCard>

      {/* Invoice Defaults */}
      <ContentCard>
        <SectionHeader title="Invoice Defaults" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <FormField label="Default due days">
              <TextField
                fullWidth
                type="number"
                value={defaultDueDays}
                onChange={(e) => {
                  setDefaultDueDays(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="30"
                sx={textFieldStyles}
              />
            </FormField>

            <FormField label="Tax rate (%)">
              <TextField
                fullWidth
                type="number"
                value={taxRate}
                onChange={(e) => {
                  setTaxRate(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="0"
                sx={textFieldStyles}
              />
            </FormField>
          </Box>

          <ToggleRow
            label="Auto-send invoices"
            description="Automatically send invoices when created"
            checked={autoSendInvoices}
            onChange={(checked) => {
              setAutoSendInvoices(checked);
              setIsDirty(true);
            }}
          />

          <ToggleRow
            label="Client pays processing fees"
            description="Pass payment processing fees to clients"
            checked={clientPaysProcessingFees}
            onChange={(checked) => {
              setClientPaysProcessingFees(checked);
              setIsDirty(true);
            }}
          />
        </Box>
      </ContentCard>

      {/* Payment Methods */}
      <ContentCard>
        <SectionHeader title="Payment Methods" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <ToggleRow
            label="Allow pay-per-session"
            description="Enable single session payments"
            checked={allowPayPerSession}
            onChange={(checked) => {
              setAllowPayPerSession(checked);
              setIsDirty(true);
            }}
          />

          <ToggleRow
            label="Allow package billing"
            description="Enable multi-session package purchases"
            checked={allowPackageBilling}
            onChange={(checked) => {
              setAllowPackageBilling(checked);
              setIsDirty(true);
            }}
          />

          <ToggleRow
            label="Allow recurring subscriptions"
            description="Enable monthly or weekly subscription billing"
            checked={allowRecurringSubscriptions}
            onChange={(checked) => {
              setAllowRecurringSubscriptions(checked);
              setIsDirty(true);
            }}
          />
        </Box>
      </ContentCard>

      {/* Payout Configuration (Future-ready placeholder) */}
      <ContentCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SectionHeader title="Payout Configuration" />
          <Chip
            label="Coming Soon"
            size="small"
            sx={{
              bgcolor: colors.neutral.gray100,
              color: colors.text.secondary,
              fontWeight: 500,
              fontSize: '11px',
              height: '20px',
              borderRadius: '4px',
            }}
          />
        </Box>
        <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mt: 2 }}>
          Configure automated payouts to providers and payout schedules.
        </Typography>
      </ContentCard>

      {isDirty && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="text" onClick={onCancel} sx={cancelButtonStyles}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSave} sx={saveButtonStyles}>
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Availability Settings Section
function AvailabilitySettings({ timeZone, applyToAllProviders, setApplyToAllProviders }: any) {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <SectionHeader title="Practice Default Availability" />
            <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mt: 1 }}>
              Time zone: {timeZone.replace(/_/g, ' ')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '13px', color: colors.text.secondary }}>
              Apply to all providers
            </Typography>
            <Switch
              checked={applyToAllProviders}
              onChange={(e) => setApplyToAllProviders(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: colors.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: colors.primary.main,
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {weekDays.map((day) => (
            <Box
              key={day}
              sx={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: colors.text.primary }}>
                {day}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  type="time"
                  defaultValue="09:00"
                  size="small"
                  sx={textFieldStyles}
                />
                <Typography sx={{ color: colors.text.secondary, fontSize: '13px' }}>to</Typography>
                <TextField
                  type="time"
                  defaultValue="17:00"
                  size="small"
                  sx={textFieldStyles}
                />
              </Box>
              <Button
                variant="text"
                size="small"
                sx={{
                  color: colors.text.secondary,
                  textTransform: 'none',
                  fontSize: '12px',
                  minWidth: 'auto',
                  '&:hover': { color: colors.semantic.error },
                }}
              >
                Remove
              </Button>
            </Box>
          ))}
        </Box>

        <Button
          variant="text"
          startIcon={<Add sx={{ fontSize: '16px' }} />}
          sx={{
            color: colors.text.secondary,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '13px',
            mt: 2,
            '&:hover': { bgcolor: colors.neutral.gray100 },
          }}
        >
          Add time slot
        </Button>
      </ContentCard>

      {/* Provider Overrides */}
      <ContentCard>
        <SectionHeader title="Provider Overrides" />
        <Box
          sx={{
            mt: 2,
            p: 2.5,
            bgcolor: colors.neutral.gray50,
            border: `1px solid ${colors.neutral.gray200}`,
            borderRadius: '12px',
          }}
        >
          <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.6 }}>
            In single-provider mode, the practice default availability applies.
          </Typography>
        </Box>
      </ContentCard>
    </Box>
  );
}

// Notifications Settings Section
function NotificationsSettings({
  sessionReminders,
  setSessionReminders,
  invoiceReminders,
  setInvoiceReminders,
  overdueAlerts,
  setOverdueAlerts,
  weeklySummary,
  setWeeklySummary,
  providerReminderCopy,
  setProviderReminderCopy,
  isDirty,
  setIsDirty,
  onSave,
  onCancel,
}: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Client Notifications */}
      <ContentCard>
        <SectionHeader title="Client Notifications" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <ToggleRow
            label="Session reminders"
            description="Send reminders 24 hours before scheduled sessions"
            checked={sessionReminders}
            onChange={(checked) => {
              setSessionReminders(checked);
              setIsDirty(true);
            }}
          />

          <ToggleRow
            label="Invoice reminders"
            description="Remind clients of upcoming invoice due dates"
            checked={invoiceReminders}
            onChange={(checked) => {
              setInvoiceReminders(checked);
              setIsDirty(true);
            }}
          />

          <ToggleRow
            label="Overdue alerts"
            description="Notify clients when invoices become overdue"
            checked={overdueAlerts}
            onChange={(checked) => {
              setOverdueAlerts(checked);
              setIsDirty(true);
            }}
          />
        </Box>
      </ContentCard>

      {/* Internal Notifications */}
      <ContentCard>
        <SectionHeader title="Internal Notifications" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <ToggleRow
            label="Weekly summary report"
            description="Receive a weekly summary of your practice activity"
            checked={weeklySummary}
            onChange={(checked) => {
              setWeeklySummary(checked);
              setIsDirty(true);
            }}
          />

          <ToggleRow
            label="Provider receives reminder copy"
            description="Send providers a copy of client session reminders"
            checked={providerReminderCopy}
            onChange={(checked) => {
              setProviderReminderCopy(checked);
              setIsDirty(true);
            }}
          />
        </Box>
      </ContentCard>

      {isDirty && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="text" onClick={onCancel} sx={cancelButtonStyles}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSave} sx={saveButtonStyles}>
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Notes Settings Section
function NotesSettings() {
  return <NotesTemplateSettings />;
}

// Roles Settings Section
function RolesSettings({ roles }: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <SectionHeader title="Roles & Permissions" />
        <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mt: 1, mb: 3 }}>
          Define access levels and permissions for different user roles.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {roles.map((role: any) => (
            <Box
              key={role.id}
              sx={{
                position: 'relative',
                p: 3,
                pl: 3.5,
                border: `1px solid ${colors.neutral.gray200}`,
                borderRadius: '12px',
                transition: 'all 180ms',
                '&:hover': {
                  bgcolor: colors.neutral.gray50,
                  borderColor: colors.neutral.gray300,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  bgcolor: role.color,
                  borderRadius: '12px 0 0 12px',
                  opacity: 0.6,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '16px', color: colors.text.primary, mb: 0.75 }}>
                    {role.name}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.6 }}>
                    {role.description}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: colors.text.secondary,
                    '&:hover': { color: colors.primary.main },
                  }}
                >
                  <Edit sx={{ fontSize: '18px' }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </ContentCard>
    </Box>
  );
}

// Helper Components
function ContentCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: colors.surface.card,
        border: `1px solid ${colors.neutral.gray200}`,
        borderRadius: '14px',
        p: 4,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
      }}
    >
      {children}
    </Box>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography sx={{ fontWeight: 600, fontSize: '18px', color: colors.text.primary }}>
      {title}
    </Typography>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.text.primary, mb: 1.25 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function ToggleRow({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: colors.text.primary, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          ml: 3,
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: colors.primary.main,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: colors.primary.main,
          },
        }}
      />
    </Box>
  );
}

// Shared Styles
const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    fontSize: '14px',
    borderRadius: '8px',
    bgcolor: colors.surface.card,
    '& fieldset': {
      borderColor: colors.neutral.gray200,
    },
    '&:hover fieldset': {
      borderColor: colors.neutral.gray300,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.primary.main,
      borderWidth: '1px',
    },
  },
  '& .MuiInputBase-input': {
    padding: '11px 14px',
  },
};

const selectStyles = {
  fontSize: '14px',
  borderRadius: '8px',
  bgcolor: colors.surface.card,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.neutral.gray200,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.neutral.gray300,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.primary.main,
    borderWidth: '1px',
  },
  '& .MuiSelect-select': {
    padding: '11px 14px',
  },
};

const cancelButtonStyles = {
  color: colors.text.secondary,
  textTransform: 'none' as const,
  fontWeight: 500,
  px: 2.5,
  py: 1,
  '&:hover': { bgcolor: colors.neutral.gray100 },
};

const saveButtonStyles = {
  bgcolor: colors.primary.main,
  color: '#FFFFFF',
  textTransform: 'none' as const,
  fontWeight: 600,
  px: 3,
  py: 1,
  boxShadow: 'none',
  '&:hover': {
    bgcolor: colors.primary.dark,
    boxShadow: 'none',
  },
};