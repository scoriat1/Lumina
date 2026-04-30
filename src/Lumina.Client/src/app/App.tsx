import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from '@mui/material';
import { RouterProvider } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { theme } from './theme';
import { router } from './routes';
import { NotesTemplateProvider } from './contexts/NotesTemplateContext';
import { PracticePackagesProvider } from './contexts/PracticePackagesContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Clean theme provider wrapper
function CleanThemeProvider({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}

function AppContent() {
  return (
    <CleanThemeProvider>
      <CssBaseline />
      <HelmetProvider>
        <AuthProvider>
          <PracticePackagesProvider>
            <NotesTemplateProvider>
              <Box sx={{ height: '100%', width: '100%' }}>
                <RouterProvider router={router} />
              </Box>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 2000,
                }}
              />
            </NotesTemplateProvider>
          </PracticePackagesProvider>
        </AuthProvider>
      </HelmetProvider>
    </CleanThemeProvider>
  );
}

// Root component
export default function App(props: any) {
  const { style, className } = props || {};

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        ...style,
      }}
      className={className}
    >
      <AppContent />
    </div>
  );
}
