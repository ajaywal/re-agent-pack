export const ALL_VIEWS = [
  { id: 'dashboard',   icon: '📊', title: 'Dashboard',             sub: 'Platform overview' },
  { id: 'loanmgmt',   icon: '🏦', title: 'Loan Management',        sub: '5 active records — LOAN_MASTER KSDS' },
  { id: 'screens',    icon: '🖥',  title: 'C++ Application Screens', sub: 'Win32/MFC dialogs — LNMAIN01 / LNSRCH01 / LNCRT01 / LNUPD01' },
  { id: 'codeviewer', icon: '📄', title: 'Source Code Viewer',      sub: 'lnmain.cpp + qlotcalc.cbl' },
  { id: 'calltree',   icon: '🌿', title: 'Call Tree Analysis',      sub: 'QLOTCALC §1000–§9900 + IPC graph' },
  { id: 'process',    icon: '🔀', title: 'Process Flow Diagrams',   sub: 'Interactive — Create / Search / Update' },
  { id: 'dependency', icon: '🔗', title: 'Dependency Matrix',       sub: 'Module coupling analysis' },
  { id: 'impact',     icon: '⚡', title: 'Impact Analysis',         sub: 'Migration change impact assessment' },
  { id: 'crud',       icon: '📋', title: 'CRUD Report',             sub: 'File operations per program per paragraph' },
  { id: 'dbconn',     icon: '🗄',  title: 'DB Connections & Schema', sub: 'KSDS → Azure SQL migration DDL' },
  { id: 'testcases',  icon: '✅', title: 'Test Cases',              sub: 'TC-001–TC-010 functional equivalence' },
  { id: 'decomp',     icon: '🧩', title: 'Functional Decomposition', sub: 'Program hierarchy' },
  { id: 'bizrules',   icon: '📐', title: 'Business Rules',          sub: 'BR-001–BR-009 with .NET migration notes' },
  { id: 'reqdoc',     icon: '📝', title: 'Requirements Document',   sub: 'FR / NFR / DM / AC specification' },
  { id: 'testexec',   icon: '▶',  title: 'Test Execution Engine',   sub: 'Run TC-001–TC-010 live equivalence tests' },
  { id: 'testdash',   icon: '📈', title: 'Testing Dashboard',       sub: 'Coverage metrics, pass/fail trends' },
];

export const ROLE_VIEWS = {
  PM:  ['dashboard','loanmgmt','screens','codeviewer','calltree','process','dependency','impact','crud','dbconn','testcases','decomp','bizrules','reqdoc','testexec','testdash'],
  BA:  ['dashboard','loanmgmt','screens','calltree','process','decomp','bizrules','reqdoc','testexec','testdash'],
  DBA: ['dashboard','loanmgmt','screens','crud','dbconn','testdash'],
  DEV: ['dashboard','loanmgmt','screens','codeviewer','calltree','process','dependency','impact','testcases','decomp','bizrules','testexec','testdash'],
};

export const NAV_STRUCTURE = [
  { type: 'standalone', id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { type: 'sep' },
  {
    type: 'group', icon: '🔬', label: 'Reverse Engineering', color: '#58a6ff',
    items: [
      { id: 'screens',    icon: '🖥',  label: 'Screens' },
      { id: 'codeviewer', icon: '📄', label: 'Code' },
      { id: 'calltree',   icon: '🌿', label: 'Calls' },
      { id: 'process',    icon: '🔀', label: 'Flow' },
      { id: 'dependency', icon: '🔗', label: 'Dependency' },
      { id: 'bizrules',   icon: '📐', label: 'Rules' },
      { id: 'impact',     icon: '⚡', label: 'Impact Analysis' },
      { id: 'crud',       icon: '📋', label: 'CRUD' },
      { id: 'dbconn',     icon: '🗄',  label: 'DB' },
      { id: 'loanmgmt',   icon: '🏦', label: 'Loans' },
    ],
  },
  { type: 'sep' },
  {
    type: 'group', icon: '⚙', label: 'Forward Engineering', color: '#3fb950',
    items: [
      { id: 'decomp',     icon: '🧩', label: 'Decomp' },
      { id: 'reqdoc',     icon: '📝', label: 'Req Document' },
    ],
  },
  { type: 'sep' },
  {
    type: 'group', icon: '🧪', label: 'Testing', color: '#e3b341',
    items: [
      { id: 'testcases',  icon: '✅', label: 'Test Cases' },
      { id: 'testexec',   icon: '▶',  label: 'Execution Engine' },
      { id: 'testdash',   icon: '📈', label: 'Dashboard' },
    ],
  },
  { type: 'sep' },
  {
    type: 'group', icon: '💾', label: 'Data', color: '#f85149',
    items: [
      { id: 'dbconn',   icon: '🗄',  label: 'DB' },
      { id: 'impact',   icon: '⚡', label: 'Impact' },
      { id: 'loanmgmt', icon: '🏦', label: 'Loans' },
    ],
  },
];
