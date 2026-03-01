import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClaudeProvider } from './contexts/ClaudeContext';
import { SpeechProvider } from './contexts/SpeechContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import AppShell from './components/layout/AppShell';
import SettingsPage from './components/settings/SettingsPage';
import ErrorBoundary from './components/shared/ErrorBoundary';
import VocabularyMode from './components/vocabulary/VocabularyMode';
import { getApiKey } from './utils/apiKey';

const Placeholder: React.FC<{ name: string }> = ({ name }) => (
  <div>
    <h1>{name}</h1>
    <p>Coming soon...</p>
  </div>
);

const RootRedirect: React.FC = () => {
  const hasKey = !!getApiKey();
  return <Navigate to={hasKey ? '/dashboard' : '/settings'} replace />;
};

const App: React.FC = () => {
  return (
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
                <Route path="conversation" element={<Placeholder name="Conversation" />} />
                <Route path="exam" element={<Placeholder name="Exam" />} />
                <Route path="dashboard" element={<Placeholder name="Dashboard" />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </DatabaseProvider>
        </SpeechProvider>
      </ClaudeProvider>
    </BrowserRouter>
  );
};

export default App;
