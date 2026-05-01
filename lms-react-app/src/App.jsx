import { useState } from 'react';
import './index.css';

import Login from './components/Login';
import Header from './components/Header';
import Nav from './components/Nav';
import ChatPanel from './components/ChatPanel';
import Toast from './components/Toast';

import Dashboard from './views/Dashboard';
import LoanManagement from './views/LoanManagement';
import AppScreens from './views/AppScreens';
import CodeViewer from './views/CodeViewer';
import CallTree from './views/CallTree';
import ProcessFlow from './views/ProcessFlow';
import Dependency from './views/Dependency';
import ImpactAnalysis from './views/ImpactAnalysis';
import CrudReport from './views/CrudReport';
import DbConnections from './views/DbConnections';
import TestCases from './views/TestCases';
import Decomposition from './views/Decomposition';
import BusinessRules from './views/BusinessRules';
import ReqDocument from './views/ReqDocument';
import TestExecution from './views/TestExecution';
import TestDashboard from './views/TestDashboard';
import SourceUpload from './views/SourceUpload';
import AgentPlayground from './views/AgentPlayground';
import Governance from './views/Governance';
import RunHistory from './views/RunHistory';

const VIEW_MAP = {
  dashboard:    Dashboard,
  loanmgmt:    LoanManagement,
  screens:      AppScreens,
  codeviewer:   CodeViewer,
  calltree:     CallTree,
  process:      ProcessFlow,
  dependency:   Dependency,
  impact:       ImpactAnalysis,
  crud:         CrudReport,
  dbconn:       DbConnections,
  testcases:    TestCases,
  decomp:       Decomposition,
  bizrules:     BusinessRules,
  reqdoc:       ReqDocument,
  testexec:     TestExecution,
  testdash:     TestDashboard,
  sourceupload: SourceUpload,
  playground:   AgentPlayground,
  governance:   Governance,
  runhistory:   RunHistory,
};

export default function App() {
  const [role, setRole] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toast, setToast] = useState('');

  function handleLogin(selectedRole) {
    setRole(selectedRole);
    setCurrentView('dashboard');
  }

  function handleLogout() {
    setRole(null);
    setCurrentView('dashboard');
  }

  function handleNavigate(viewId) {
    if (VIEW_MAP[viewId]) setCurrentView(viewId);
  }

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  const ViewComponent = VIEW_MAP[currentView] || Dashboard;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header role={role} currentView={currentView} onLogout={handleLogout} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Nav role={role} currentView={currentView} onNavigate={handleNavigate} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', background: 'var(--bg)' }}>
          <ViewComponent
            role={role}
            onNavigate={handleNavigate}
            onToast={msg => setToast(msg)}
          />
        </main>
        <ChatPanel onNavigate={handleNavigate} />
      </div>
      <Toast message={toast} onHide={() => setToast('')} />
    </div>
  );
}
