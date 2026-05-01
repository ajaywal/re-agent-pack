export const ALL_VIEWS = [
  { id: 'dashboard',    icon: '📊', title: 'Dashboard',               sub: 'TrackAll LSS — system overview' },
  { id: 'sourceupload', icon: '⬆', title: 'Source Upload',            sub: 'GitHub repo or ZIP — select analyses to run' },
  { id: 'playground',  icon: '🤖', title: 'Agent Playground',         sub: 'Drag & drop agent flow builder — multi-model' },
  { id: 'governance',  icon: '⚖', title: 'Governance (watsonx.gov)', sub: 'KPI tracking, model risk, drift, audit trail' },
  { id: 'runhistory',  icon: '🕐', title: 'Run History',              sub: 'Historical analysis runs — compare iterations' },
  { id: 'loanmgmt',   icon: '🏦', title: 'Loan Management',         sub: '5 seed loans — LSS_LOAN_T / rule enforcement demo' },
  { id: 'screens',    icon: '🖥',  title: 'C++ Application Screens', sub: 'Win32/MFC dialogs — Search / Add Loan / Modify Loan' },
  { id: 'codeviewer', icon: '📄', title: 'Source Code Viewer',       sub: 'LoanRules.cpp + TKA900.cbl + TKA901/TKA902' },
  { id: 'calltree',   icon: '🌿', title: 'Call Tree Analysis',       sub: 'TrackAllClientManagerLegacy → TKA900/901/902/920' },
  { id: 'process',    icon: '🔀', title: 'Process Flow Diagrams',    sub: 'Interactive — Search / Add Loan / Modify Loan' },
  { id: 'dependency', icon: '🔗', title: 'Dependency Matrix',        sub: 'Module coupling — MFC / TME / RataBase / EDI' },
  { id: 'impact',     icon: '⚡', title: 'Impact Analysis',          sub: 'Migration risk — TME / fgatetcp / COBOL precision' },
  { id: 'crud',       icon: '📋', title: 'CRUD Report',              sub: 'LSS_LOAN_T / LSS_CYCLE_STEP_T / LSS001T operations' },
  { id: 'dbconn',     icon: '🗄',  title: 'DB Connections & Schema',  sub: 'Tandem SQL/MP → Azure SQL migration DDL' },
  { id: 'testcases',  icon: '✅', title: 'Test Cases',               sub: 'TC-001–TC-014 mapped to R-L-001–R-L-014' },
  { id: 'decomp',     icon: '🧩', title: 'Functional Decomposition',  sub: 'VC++ MFC / TME IPC / Tandem COBOL / Azure target' },
  { id: 'bizrules',   icon: '📐', title: 'Business Rules',           sub: 'R-L-001–R-L-014 with C++ + COBOL evidence' },
  { id: 'reqdoc',     icon: '📝', title: 'Requirements Document',    sub: 'FR / NFR / Data Model / Acceptance Criteria' },
  { id: 'testexec',   icon: '▶',  title: 'Test Execution Engine',    sub: 'Run TC-001–TC-014 live rule validation tests' },
  { id: 'testdash',   icon: '📈', title: 'Testing Dashboard',        sub: 'Rule coverage, pass/fail, acceptance criteria' },
];

export const ROLE_VIEWS = {
  PM:  ['dashboard','sourceupload','playground','governance','runhistory','loanmgmt','screens','codeviewer','calltree','process','dependency','impact','crud','dbconn','testcases','decomp','bizrules','reqdoc','testexec','testdash'],
  BA:  ['dashboard','sourceupload','playground','governance','runhistory','loanmgmt','screens','calltree','process','decomp','bizrules','reqdoc','testexec','testdash'],
  DBA: ['dashboard','sourceupload','runhistory','loanmgmt','screens','crud','dbconn','testdash'],
  DEV: ['dashboard','sourceupload','playground','runhistory','loanmgmt','screens','codeviewer','calltree','process','dependency','impact','testcases','decomp','bizrules','testexec','testdash'],
};

export const NAV_STRUCTURE = [
  { type: 'standalone', id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { type: 'sep' },
  {
    type: 'group', icon: '🤖', label: 'Agentic RE', color: '#a371f7',
    items: [
      { id: 'sourceupload', icon: '⬆',  label: 'Source Upload' },
      { id: 'playground',   icon: '🎮', label: 'Agent Playground' },
      { id: 'governance',   icon: '⚖',  label: 'Governance' },
      { id: 'runhistory',   icon: '🕐', label: 'Run History' },
    ],
  },
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
      { id: 'decomp',  icon: '🧩', label: 'Decomp' },
      { id: 'reqdoc',  icon: '📝', label: 'Req Document' },
    ],
  },
  { type: 'sep' },
  {
    type: 'group', icon: '🧪', label: 'Testing', color: '#e3b341',
    items: [
      { id: 'testcases', icon: '✅', label: 'Test Cases' },
      { id: 'testexec',  icon: '▶',  label: 'Execution Engine' },
      { id: 'testdash',  icon: '📈', label: 'Dashboard' },
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
