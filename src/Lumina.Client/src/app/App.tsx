import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from '@mui/material';
import { RouterProvider } from 'react-router';
import { theme } from './theme';
import { router } from './routes';
import { NotesTemplateProvider } from './contexts/NotesTemplateContext';
import { AuthProvider } from './contexts/AuthContext';

// Clean theme provider wrapper
function CleanThemeProvider({ children }: { children: React.ReactNode }) {
  return MuiThemeProvider({ theme, children });
}

function AppContent() {
  return (
    <CleanThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <NotesTemplateProvider>
          <Box sx={{ height: '100%', width: '100%' }}>
            <RouterProvider router={router} />
          </Box>
        </NotesTemplateProvider>
      </AuthProvider>
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
