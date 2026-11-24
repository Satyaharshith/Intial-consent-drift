import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { NewConsent } from './pages/NewConsent';
import { ConsentDetail } from './pages/ConsentDetail';
import { AnalysisDetail } from './pages/AnalysisDetail';
import { Evaluation } from './pages/Evaluation';
import { api } from './api';

export const App: React.FC = () => {
  const [llmAvailable, setLlmAvailable] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setLlmAvailable(res.llm_available);
    } catch (err) {
      console.warn('Backend currently offline or unreachable:', err);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar
          llmAvailable={llmAvailable}
          onDataRefresh={handleDataRefresh}
        />

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  llmAvailable={llmAvailable}
                  refreshTrigger={refreshTrigger}
                />
              }
            />
            <Route path="/consents/new" element={<NewConsent />} />
            <Route path="/consents/:id" element={<ConsentDetail />} />
            <Route path="/analyses/:id" element={<AnalysisDetail />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
