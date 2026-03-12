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
import ReferenceMode from './components/reference/ReferenceMode';
const RootRedirect: React.FC = () => {
  return <Navigate to="/dashboard" replace />;
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
                  <Route
                    path="reference"
                    element={
                      <ErrorBoundary>
                        <ReferenceMode />
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
