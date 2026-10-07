import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NoticeBanner } from './components/NoticeBanner';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Resources } from './pages/Resources';
import { ResourceDetails } from './pages/ResourceDetails';
import { Simulation } from './pages/Simulation';
import { ScenarioComparison } from './pages/ScenarioComparison';
import { SensitivityAnalysis } from './pages/SensitivityAnalysis';
import { Recommendations } from './pages/Recommendations';
import { ChangeReview } from './pages/ChangeReview';
import { AuditTrail } from './pages/AuditTrail';
import { RollbackHistory } from './pages/RollbackHistory';
import { ExperimentResults } from './pages/ExperimentResults';
import { StakeholderFeedback } from './pages/StakeholderFeedback';
import { EthicsMethodology } from './pages/EthicsMethodology';
import { DeploymentChecklist } from './pages/DeploymentChecklist';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState('cloud.engineer');

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <NoticeBanner />
        <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login currentUser={currentUser} onUserChange={setCurrentUser} />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/:id" element={<ResourceDetails />} />
              <Route path="/simulation" element={<Simulation currentUser={currentUser} />} />
              <Route path="/scenario-comparison" element={<ScenarioComparison />} />
              <Route path="/sensitivity" element={<SensitivityAnalysis />} />
              <Route path="/recommendations" element={<Recommendations currentUser={currentUser} />} />
              <Route path="/changes" element={<ChangeReview currentUser={currentUser} />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/rollback-history" element={<RollbackHistory currentUser={currentUser} />} />
              <Route path="/experiment-results" element={<ExperimentResults />} />
              <Route path="/feedback" element={<StakeholderFeedback />} />
              <Route path="/ethics" element={<EthicsMethodology />} />
              <Route path="/checklist" element={<DeploymentChecklist />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};
