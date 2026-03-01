import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClaudeProvider } from './contexts/ClaudeContext';
import { SpeechProvider } from './contexts/SpeechContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import AppShell from './components/layout/AppShell';
import SettingsPage from './components/settings/SettingsPage';
import ErrorBoundary from './components/shared/ErrorBoundary';
import VocabularyMode from './components/vocabulary/VocabularyMode';
import ConversationMode from './components/conversation/ConversationMode';
import ExamMode from './components/exam/ExamMode';
import DashboardMode from './components/dashboard/DashboardMode';
import { getApiKey } from './utils/apiKey';

const RootRedirect: React.FC = () => {
  const hasKey = !!getApiKey();
  return <Navigate to={hasKey ? '/dashboard' : '/settings'} replace />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackMessage="The application encountered an unexpected error. Please refresh the page.">
      <BrowserRouter>
        <ClaudeProvider>
          <SpeechProvider>
            <DatabaseProvider>
              <Routes>
                <Route path="/" element={<AppShell />}>
                  <Route index element={<RootRedirect />} />
                  <Route
                    path="vocabulary"
                    element={
                      <ErrorBoundary>
                        <VocabularyMode />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="conversation"
                    element={
                      <ErrorBoundary>
                        <ConversationMode />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="exam"
                    element={
                      <ErrorBoundary>
                        <ExamMode />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <ErrorBoundary>
                        <DashboardMode />
                      </ErrorBoundary>
                    }
                  />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </DatabaseProvider>
          </SpeechProvider>
        </ClaudeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
