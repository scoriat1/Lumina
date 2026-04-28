import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Alert, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Switch, Typography, InputAdornment, Avatar, Chip, IconButton } from '@mui/material';
import { Add, Edit, CloudUpload, Download } from '@mui/icons-material';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../styles/colors';
import { NotesTemplateSettings } from '../components/NotesTemplateSettings';
import { apiClient } from '../api/client';
import { usePracticePackages } from '../contexts/PracticePackagesContext';
import type { BillingSettingsDto, PracticePackageDto, ProviderDto } from '../api/types';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '../notifications/preferences';

type SettingsTab = 
  | 'providers'
  | 'packages'
  | 'billing'
  | 'notifications'
  | 'notes'
  | 'data-management';

export function SettingsPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const [isDirty, setIsDirty] = useState(false);
  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const { packages, createPackage, updatePackage } = usePracticePackages();
  const [billingSaveError, setBillingSaveError] = useState<string | null>(null);
  const [packageSaveError, setPackageSaveError] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [newPackageDraft, setNewPackageDraft] = useState({
    name: '',
    sessionCount: '4',
    price: '',
    enabled: true,
  });

  // Handle URL hash navigation (e.g., /settings#notes)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['providers', 'packages', 'billing', 'notifications', 'notes', 'data-management'].includes(hash)) {
      setActiveTab(hash as SettingsTab);
    }
  }, [location.hash]);


  useEffect(() => {
    apiClient.getProviders().then(setProviders).catch(() => setProviders([]));
    apiClient.getBillingSettings()
      .then((settings) => {
        setDefaultDueDays(String(settings.defaultDueDays));
        setDefaultSessionAmount(String(settings.defaultSessionAmount));
        setInitialBillingSettings(settings);
      })
      .catch(() => {
        setDefaultDueDays('30');
        setDefaultSessionAmount('125');
        setInitialBillingSettings({ defaultDueDays: 30, defaultSessionAmount: 125 });
      });
  }, []);

  // Notification settings state
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(() => loadNotificationPreferences());
  const [initialNotificationPreferences, setInitialNotificationPreferences] =
    useState<NotificationPreferences>(() => loadNotificationPreferences());

  // Billing settings state
  const [defaultDueDays, setDefaultDueDays] = useState('30');
  const [defaultSessionAmount, setDefaultSessionAmount] = useState('125');
  const [initialBillingSettings, setInitialBillingSettings] = useState<BillingSettingsDto>({
    defaultDueDays: 30,
    defaultSessionAmount: 125,
  });

  const handleSave = async () => {
    if (activeTab === 'notifications') {
      saveNotificationPreferences(notificationPreferences);
      setInitialNotificationPreferences(notificationPreferences);
      setIsDirty(false);
      return;
    }

    if (activeTab !== 'billing') {
      setIsDirty(false);
      return;
    }

    try {
      const updated = await apiClient.updateBillingSettings({
        defaultDueDays: Number(defaultDueDays),
        defaultSessionAmount: Number(defaultSessionAmount),
      });

      setDefaultDueDays(String(updated.defaultDueDays));
      setDefaultSessionAmount(String(updated.defaultSessionAmount));
      setInitialBillingSettings(updated);
      setBillingSaveError(null);
      setIsDirty(false);
    } catch (error) {
      setBillingSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save billing settings.',
      );
    }
  };

  const handleCancel = () => {
    if (activeTab === 'billing') {
      setDefaultDueDays(String(initialBillingSettings.defaultDueDays));
      setDefaultSessionAmount(String(initialBillingSettings.defaultSessionAmount));
      setBillingSaveError(null);
    }

    if (activeTab === 'notifications') {
      setNotificationPreferences(initialNotificationPreferences);
    }

    setIsDirty(false);
  };

  const handleOpenPackageModal = () => {
    setNewPackageDraft({
      name: '',
      sessionCount: '4',
      price: '',
      enabled: true,
    });
    setEditingPackageId(null);
    setPackageSaveError(null);
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackageModal = (pkg: PracticePackageDto) => {
    setNewPackageDraft({
      name: pkg.name,
      sessionCount: String(pkg.sessionCount),
      price: String(pkg.price),
      enabled: pkg.enabled,
    });
    setEditingPackageId(pkg.id);
    setPackageSaveError(null);
    setIsPackageModalOpen(true);
  };

  const handleClosePackageModal = () => {
    if (isCreatingPackage) {
      return;
    }

    setIsPackageModalOpen(false);
    setPackageSaveError(null);
    setEditingPackageId(null);
  };

  const handleSavePackage = async () => {
    try {
      setIsCreatingPackage(true);
      const payload = {
        name: newPackageDraft.name.trim(),
        sessionCount: Number(newPackageDraft.sessionCount),
        price: Number(newPackageDraft.price),
        enabled: newPackageDraft.enabled,
      };

      if (editingPackageId) {
        await updatePackage(editingPackageId, payload);
      } else {
        await createPackage(payload);
      }

      setIsPackageModalOpen(false);
      setPackageSaveError(null);
      setEditingPackageId(null);
    } catch (error) {
      setPackageSaveError(
        error instanceof Error ? error.message : 'Unable to save package.',
      );
    } finally {
      setIsCreatingPackage(false);
    }
  };

  const handleTogglePackage = async (pkg: PracticePackageDto, enabled: boolean) => {
    try {
      await updatePackage(pkg.id, {
        name: pkg.name,
        sessionCount: pkg.sessionCount,
        price: pkg.price,
        enabled,
      });
    } catch (error) {
      setPackageSaveError(
        error instanceof Error ? error.message : 'Unable to update package.',
      );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader 
        title="Settings" 
        subtitle="Manage the parts of Lumina available today"
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
            label="Data Management"
            isActive={activeTab === 'data-management'}
            onClick={() => setActiveTab('data-management')}
          />
        </Box>

        {/* Right Content Panel */}
        <Box sx={{ flexGrow: 1, maxWidth: '800px' }}>
          {activeTab === 'providers' && (
            <ProvidersSettings providers={providers} />
          )}

          {activeTab === 'packages' && (
            <PackagesSettings
              packages={packages}
              saveError={packageSaveError}
              onCreatePackage={handleOpenPackageModal}
              onEditPackage={handleOpenEditPackageModal}
              onTogglePackage={handleTogglePackage}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSettings
              defaultDueDays={defaultDueDays}
              setDefaultDueDays={setDefaultDueDays}
              defaultSessionAmount={defaultSessionAmount}
              setDefaultSessionAmount={setDefaultSessionAmount}
              saveError={billingSaveError}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSettings
              preferences={notificationPreferences}
              setPreferences={setNotificationPreferences}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {activeTab === 'notes' && (
            <NotesSettings />
          )}

          {activeTab === 'data-management' && (
            <DataManagementSettings />
          )}
        </Box>
      </Box>

      <Dialog
        open={isPackageModalOpen}
        onClose={handleClosePackageModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingPackageId ? 'Edit Package' : 'Create Package'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '20px !important' }}>
          <TextField
            label="Package Name"
            value={newPackageDraft.name}
            onChange={(event) =>
              setNewPackageDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="3-Month Package"
            fullWidth
          />
          <TextField
            label="Sessions"
            type="number"
            value={newPackageDraft.sessionCount}
            onChange={(event) =>
              setNewPackageDraft((current) => ({ ...current, sessionCount: event.target.value }))
            }
            inputProps={{ min: 1 }}
            fullWidth
          />
          <TextField
            label="Price"
            type="number"
            value={newPackageDraft.price}
            onChange={(event) =>
              setNewPackageDraft((current) => ({ ...current, price: event.target.value }))
            }
            inputProps={{ min: 0, step: '0.01' }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            fullWidth
          />
          {packageSaveError ? <Alert severity="error">{packageSaveError}</Alert> : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClosePackageModal} disabled={isCreatingPackage} sx={cancelButtonStyles}>
            Cancel
          </Button>
          <Button
            onClick={handleSavePackage}
            disabled={
              isCreatingPackage ||
              !newPackageDraft.name.trim() ||
              Number(newPackageDraft.sessionCount) <= 0 ||
              Number(newPackageDraft.price) <= 0
            }
            variant="contained"
            sx={saveButtonStyles}
          >
            {editingPackageId ? 'Save Package' : 'Create Package'}
          </Button>
        </DialogActions>
      </Dialog>
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

// Providers Settings Section
function ProvidersSettings({ providers }: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <SectionHeader title="Providers" />
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

            </Box>
          ))}
        </Box>
      </ContentCard>
    </Box>
  );
}

// Packages Settings Section
function PackagesSettings({
  packages,
  saveError,
  onCreatePackage,
  onEditPackage,
  onTogglePackage,
}: {
  packages: PracticePackageDto[];
  saveError: string | null;
  onCreatePackage: () => void;
  onEditPackage: (pkg: PracticePackageDto) => void;
  onTogglePackage: (pkg: PracticePackageDto, enabled: boolean) => void | Promise<void>;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <SectionHeader title="Packages" />
          <Button
            variant="outlined"
            onClick={onCreatePackage}
            data-testid="create-package-button"
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
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}
          {packages.map((pkg) => (
            <Box
              key={pkg.id}
              data-testid="package-card"
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
                <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: colors.text.secondary, mb: 0.25 }}>
                      Sessions
                    </Typography>
                    <Typography data-testid="package-session-count" sx={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary }}>
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
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '13px', color: colors.text.secondary }}>
                    {pkg.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Switch
                    checked={pkg.enabled}
                    onChange={(event) => onTogglePackage(pkg, event.target.checked)}
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
                  onClick={() => onEditPackage(pkg)}
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
  defaultDueDays,
  setDefaultDueDays,
  defaultSessionAmount,
  setDefaultSessionAmount,
  saveError,
  isDirty,
  setIsDirty,
  onSave,
  onCancel,
}: any) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <SectionHeader title="Billing Defaults" />
        <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mt: 1, lineHeight: 1.6 }}>
          These defaults are used when Lumina creates invoices and pay-per-session billing records.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
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

          <FormField label="Default session amount">
            <TextField
              fullWidth
              type="number"
              value={defaultSessionAmount}
              onChange={(e) => {
                setDefaultSessionAmount(e.target.value);
                setIsDirty(true);
              }}
              placeholder="125"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={textFieldStyles}
            />
          </FormField>
        </Box>
      </ContentCard>

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}

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
// Notifications Settings Section
function NotificationsSettings({
  preferences,
  setPreferences,
  isDirty,
  setIsDirty,
  onSave,
  onCancel,
}: any) {
  const updatePreference = (key: keyof NotificationPreferences, checked: boolean) => {
    setPreferences((current: NotificationPreferences) => ({
      ...current,
      [key]: checked,
    }));
    setIsDirty(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <SectionHeader title="In-App Notifications" />
        <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mt: 1, lineHeight: 1.6 }}>
          These settings control the notification bell and Notifications page.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <ToggleRow
            label="Session reminders"
            description="Show sessions scheduled in the next 24 hours"
            checked={preferences.sessionReminders}
            onChange={(checked) => updatePreference('sessionReminders', checked)}
          />

          <ToggleRow
            label="Billing reminders"
            description="Show unpaid and pending session or package payments"
            checked={preferences.billingReminders}
            onChange={(checked) => updatePreference('billingReminders', checked)}
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

// Data Management Settings Section
function DataManagementSettings() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      await apiClient.exportPracticeData();
      setSuccessMessage('Your export is ready.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      await apiClient.downloadImportTemplate();
      setSuccessMessage('Import template downloaded.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to download the import template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ContentCard>
        <SectionHeader title="Data Management" />
        <Typography sx={{ fontSize: '13px', color: colors.text.secondary, mt: 1.25, lineHeight: 1.6 }}>
          Export a copy of your practice data or prepare for a future import.
        </Typography>

        <Alert severity="warning" sx={{ mt: 3, borderRadius: '10px' }}>
          Exports may contain private client information. Store downloaded files carefully.
        </Alert>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
          <Box
            sx={{
              p: 3,
              border: `1px solid ${colors.neutral.gray200}`,
              borderRadius: '12px',
              bgcolor: colors.surface.card,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary, mb: 0.75 }}>
                Export Data
              </Typography>
              <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.6 }}>
                Download a copy of your clients, sessions, notes, billing records, packages, and templates.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <Download sx={{ fontSize: '18px' }} />}
              disabled={isExporting}
              onClick={handleExport}
              sx={{ ...saveButtonStyles, alignSelf: 'flex-start' }}
            >
              {isExporting ? 'Preparing export...' : 'Export all practice data'}
            </Button>
          </Box>

          <Box
            sx={{
              p: 3,
              border: `1px solid ${colors.neutral.gray200}`,
              borderRadius: '12px',
              bgcolor: colors.neutral.gray50,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary }}>
                  Import Data
                </Typography>
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
              <Typography sx={{ fontSize: '13px', color: colors.text.secondary, lineHeight: 1.6 }}>
                Import clients, sessions, and notes from a prepared CSV template.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<CloudUpload sx={{ fontSize: '18px' }} />}
                disabled
                sx={outlinedButtonStyles}
              >
                Upload CSV
              </Button>
              <Button
                variant="text"
                startIcon={isDownloadingTemplate ? <CircularProgress size={16} color="inherit" /> : <Download sx={{ fontSize: '18px' }} />}
                disabled={isDownloadingTemplate}
                onClick={handleDownloadTemplate}
                sx={cancelButtonStyles}
              >
                {isDownloadingTemplate ? 'Downloading...' : 'Download Import Template'}
              </Button>
            </Box>
          </Box>
        </Box>
      </ContentCard>

      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
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

const cancelButtonStyles = {
  color: colors.text.secondary,
  textTransform: 'none' as const,
  fontWeight: 500,
  px: 2.5,
  py: 1,
  '&:hover': { bgcolor: colors.neutral.gray100 },
};

const outlinedButtonStyles = {
  borderColor: colors.neutral.gray200,
  color: colors.text.primary,
  textTransform: 'none' as const,
  fontWeight: 500,
  px: 2.5,
  py: 1,
  '&:hover': {
    borderColor: colors.neutral.gray300,
    bgcolor: colors.neutral.gray100,
  },
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
