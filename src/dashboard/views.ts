import type { UserSession } from "./types.js";

/**
 * Render the Login Page HTML view.
 */
export function renderLoginView(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — AI Code Risk Monitor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --card-bg: rgba(19, 26, 42, 0.75);
      --border-color: #273145;
      --text-main: #f0f6fc;
      --text-muted: #8b949e;
      --accent-green: #3fb950;
      --accent-blue: #58a6ff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(63, 185, 80, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(88, 166, 255, 0.15) 0%, transparent 45%);
    }

    .login-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 44px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      text-align: center;
    }

    .brand-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, rgba(63, 185, 80, 0.25), rgba(88, 166, 255, 0.25));
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 24px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 36px;
      line-height: 1.5;
    }

    .btn-github {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(180deg, #2f363d 0%, #24292e 100%);
      color: #ffffff;
      border: 1px solid #444c56;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .btn-github:hover {
      background: linear-gradient(180deg, #373e45 0%, #2b3137 100%);
      border-color: var(--accent-blue);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(88, 166, 255, 0.2);
    }

    .feature-list {
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-align: left;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .feature-icon {
      color: var(--accent-green);
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="brand-icon">🛡️</div>
    <h1>AI Code Risk Monitor</h1>
    <p class="subtitle">Enterprise Pre-Merge Risk Analytics & Security Intelligence Platform</p>

    <a href="/auth/github" class="btn-github">
      <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Continue with GitHub
    </a>

    <div class="feature-list">
      <div class="feature-item">
        <span class="feature-icon">✓</span> OAuth Single Sign-On backed by GitHub repository access
      </div>
      <div class="feature-item">
        <span class="feature-icon">✓</span> Strict repository-based multi-tenant data isolation
      </div>
      <div class="feature-item">
        <span class="feature-icon">✓</span> AI intent audit, hotspot tracking & CSV export suite
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Render the Main Dashboard View HTML template.
 */
export function renderDashboardView(session: UserSession): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — AI Code Risk Monitor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --card-bg: rgba(19, 26, 42, 0.7);
      --card-hover: rgba(27, 36, 56, 0.85);
      --border-color: #232d3f;
      --border-glow: #384661;
      --text-main: #f0f6fc;
      --text-muted: #8b949e;
      --tier-high: #f85149;
      --tier-medium: #d29922;
      --tier-low: #3fb950;
      --accent-blue: #58a6ff;
      --accent-purple: #bc8cff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-image: 
        radial-gradient(circle at 10% 0%, rgba(88, 166, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 100%, rgba(63, 185, 80, 0.08) 0%, transparent 40%);
    }

    /* Top Navigation Header */
    header {
      background: rgba(13, 18, 30, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 14px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: -0.3px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(63, 185, 80, 0.12);
      color: var(--tier-low);
      border: 1px solid rgba(63, 185, 80, 0.25);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    select, input[type="text"] {
      background-color: #0d1322;
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }

    select:focus, input[type="text"]:focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
    }

    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(180deg, #1f293d 0%, #161e2e 100%);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-export:hover {
      background: linear-gradient(180deg, #27344d 0%, #1c263b 100%);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
      padding-left: 12px;
      border-left: 1px solid var(--border-color);
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid var(--accent-blue);
    }

    .btn-logout {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 12px;
      padding: 6px 10px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      transition: all 0.2s;
    }

    .btn-logout:hover {
      color: var(--tier-high);
      border-color: var(--tier-high);
      background: rgba(248, 81, 73, 0.1);
    }

    /* Main Content Container */
    main {
      flex: 1;
      padding: 32px;
      max-width: 1480px;
      margin: 0 auto;
      width: 100%;
    }

    /* Top Grid: Health Score Ring + Stats */
    .top-overview-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    @media (max-width: 1024px) {
      .top-overview-grid { grid-template-columns: 1fr; }
    }

    .health-score-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }

    .health-ring-container {
      position: relative;
      width: 110px;
      height: 110px;
      margin-bottom: 12px;
    }

    .health-ring-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .health-ring-bg {
      fill: none;
      stroke: #161e2e;
      stroke-width: 8;
    }

    .health-ring-val {
      fill: none;
      stroke: var(--accent-blue);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 283;
      stroke-dashoffset: 28;
      transition: stroke-dashoffset 1s ease-in-out, stroke 0.5s;
    }

    .health-score-number {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 800;
    }

    .health-score-grade {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .health-card-label {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
    }

    .health-card-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Metric Cards Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
    }

    .stat-card:hover {
      background: var(--card-hover);
      border-color: var(--border-glow);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    }

    .stat-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 800;
      margin-top: 8px;
    }

    /* Visual Risk Distribution Bar */
    .risk-distribution-panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dist-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
    }

    .dist-bar-container {
      height: 12px;
      width: 100%;
      background: #121824;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
    }

    .dist-seg-high { background-color: var(--tier-high); transition: width 0.5s ease; }
    .dist-seg-medium { background-color: var(--tier-medium); transition: width 0.5s ease; }
    .dist-seg-low { background-color: var(--tier-low); transition: width 0.5s ease; }

    .dist-legend {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* Filter Tabs & Search Header */
    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-tabs {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #0d1322;
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 7px 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--card-bg);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    /* Main Dashboard Layout */
    .dashboard-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }

    @media (max-width: 1100px) {
      .dashboard-layout { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    /* Audit Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      text-align: left;
      padding: 12px 16px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    tbody tr {
      transition: background 0.15s ease;
    }

    tbody tr:hover {
      background-color: rgba(88, 166, 255, 0.04);
      cursor: pointer;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .badge-high { background: rgba(248, 81, 73, 0.15); color: var(--tier-high); border: 1px solid rgba(248, 81, 73, 0.3); }
    .badge-medium { background: rgba(210, 153, 34, 0.15); color: var(--tier-medium); border: 1px solid rgba(210, 153, 34, 0.3); }
    .badge-low { background: rgba(63, 185, 80, 0.15); color: var(--tier-low); border: 1px solid rgba(63, 185, 80, 0.3); }

    /* Code Risk Hotspots Sidebar */
    .hotspot-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .hotspot-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #0d1322;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      transition: border-color 0.2s;
    }

    .hotspot-item:hover {
      border-color: var(--border-glow);
    }

    /* Modal / Slide-Over Overlay */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 13, 0.8);
      backdrop-filter: blur(6px);
      z-index: 200;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: #111726;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      width: 90%;
      max-width: 720px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 32px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
    }

    .modal-section {
      margin-bottom: 20px;
      background: #0d1322;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .btn-github-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent-blue);
      color: #0d1117;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      text-decoration: none;
      font-size: 13px;
      transition: opacity 0.2s;
    }

    .btn-github-link:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <!-- Top Navigation Header -->
  <header>
    <div class="brand">
      <span>🛡️ AI Code Risk Monitor</span>
      <span class="status-badge">● System Operational</span>
    </div>

    <div class="nav-controls">
      <select id="repoFilter">
        <option value="all">All Repositories</option>
      </select>

      <input type="text" id="searchInput" placeholder="Search PR Title, #, or Repo..." />

      <button class="btn-export" onclick="exportCSV()">
        <span>📥 Export CSV</span>
      </button>

      <div class="user-profile">
        <img class="user-avatar" src="${session.avatarUrl || 'https://github.com/github.png'}" alt="Avatar" />
        <span>${session.username}</span>
        <a href="/auth/logout" class="btn-logout">Logout</a>
      </div>
    </div>
  </header>

  <!-- Main Content Area -->
  <main>
    <!-- Top Overview: Health Gauge + Metric Cards -->
    <div class="top-overview-grid">
      <!-- Codebase Health Ring Card -->
      <div class="health-score-card">
        <div class="health-ring-container">
          <svg class="health-ring-svg" viewBox="0 0 100 100">
            <circle class="health-ring-bg" cx="50" cy="50" r="45"></circle>
            <circle class="health-ring-val" id="healthRingVal" cx="50" cy="50" r="45"></circle>
          </svg>
          <div class="health-score-number">
            <span id="healthScoreNum">100%</span>
            <span class="health-score-grade" id="healthGrade">GRADE A+</span>
          </div>
        </div>
        <div class="health-card-label">Codebase Health Score</div>
        <div class="health-card-sub" id="healthSub">Safe to deploy — 0 high risk signals</div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total PRs Scored</span>
          <span class="stat-value" id="statTotalPRs">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">High Risk PRs</span>
          <span class="stat-value" style="color: var(--tier-high)" id="statHighRisk">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Medium Risk PRs</span>
          <span class="stat-value" style="color: var(--tier-medium)" id="statMediumRisk">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Low Risk PRs</span>
          <span class="stat-value" style="color: var(--tier-low)" id="statLowRisk">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">AI Deep Analysis</span>
          <span class="stat-value" style="color: var(--accent-blue)" id="statAiCoverage">0%</span>
        </div>
      </div>
    </div>

    <!-- Risk Proportion Bar -->
    <div class="risk-distribution-panel">
      <div class="dist-header">
        <span>PR Risk Tier Distribution</span>
        <span id="distTotalLabel">0 Total PRs Analyzed</span>
      </div>
      <div class="dist-bar-container">
        <div class="dist-seg-high" id="segHigh" style="width: 0%"></div>
        <div class="dist-seg-medium" id="segMedium" style="width: 0%"></div>
        <div class="dist-seg-low" id="segLow" style="width: 100%"></div>
      </div>
      <div class="dist-legend">
        <div class="legend-item"><span class="legend-dot" style="background: var(--tier-high)"></span> High Risk (<span id="legHigh">0</span>)</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--tier-medium)"></span> Medium Risk (<span id="legMedium">0</span>)</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--tier-low)"></span> Low Risk (<span id="legLow">0</span>)</div>
      </div>
    </div>

    <!-- Main Dashboard Layout -->
    <div class="dashboard-layout">
      <!-- PR Audit Logs Feed -->
      <div class="panel">
        <div class="table-toolbar">
          <span class="panel-title">📋 PR Risk Audit Ledger</span>
          
          <div class="filter-tabs">
            <button class="tab-btn active" onclick="setRiskFilter('all')">All PRs</button>
            <button class="tab-btn" onclick="setRiskFilter('high')">🔴 High Risk</button>
            <button class="tab-btn" onclick="setRiskFilter('medium')">🟡 Medium Risk</button>
            <button class="tab-btn" onclick="setRiskFilter('low')">🟢 Low Risk</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>PR #</th>
              <th>Repository</th>
              <th>Title</th>
              <th>Stack</th>
              <th>Risk Tier</th>
              <th>Score</th>
              <th>AI Intent Summary</th>
            </tr>
          </thead>
          <tbody id="auditTableBody">
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px">Loading risk audit logs...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Risky Hotspots Sidebar -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">🎯 Code Risk Hotspots</span>
        </div>

        <div class="hotspot-list" id="hotspotList">
          <div style="color: var(--text-muted); font-size: 13px">Loading hotspots...</div>
        </div>
      </div>
    </div>
  </main>

  <!-- PR Detail Modal / Drawer -->
  <div class="modal-overlay" id="modalOverlay" onclick="if(event.target === this) closeModal()">
    <div class="modal">
      <div class="panel-header">
        <span class="panel-title" id="modalTitle">PR Details</span>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 22px; cursor: pointer" onclick="closeModal()">✕</button>
      </div>
      <div id="modalBody"></div>
    </div>
  </div>

  <script>
    let globalStatsData = null;
    let currentRiskFilter = 'all';

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return;
        globalStatsData = await res.json();
        renderDashboard(globalStatsData);
      } catch (e) {
        console.error('Failed to fetch dashboard stats:', e);
      }
    }

    function renderDashboard(data) {
      // Health Score & Grade
      const score = data.healthScore ?? 100;
      const grade = data.healthGrade ?? 'A+';
      document.getElementById('healthScoreNum').textContent = score + '%';
      document.getElementById('healthGrade').textContent = 'GRADE ' + grade;

      // Update ring SVG offset (283 is circle circumference r=45)
      const ring = document.getElementById('healthRingVal');
      const offset = 283 - (283 * score) / 100;
      ring.style.strokeDashoffset = offset;

      if (score < 60) {
        ring.style.stroke = 'var(--tier-high)';
        document.getElementById('healthSub').textContent = 'High risk detected — review recommended';
      } else if (score < 80) {
        ring.style.stroke = 'var(--tier-medium)';
        document.getElementById('healthSub').textContent = 'Medium risk signals present';
      } else {
        ring.style.stroke = 'var(--tier-low)';
        document.getElementById('healthSub').textContent = 'Safe to deploy — codebase healthy';
      }

      // Populate repo filter dropdown
      const select = document.getElementById('repoFilter');
      select.innerHTML = '<option value="all">All Repositories</option>' + 
        data.availableRepos.map(r => \`<option value="\${r}">\${r}</option>\`).join('');

      // Wire event listeners
      document.getElementById('repoFilter').addEventListener('change', filterAndRender);
      document.getElementById('searchInput').addEventListener('input', filterAndRender);

      filterAndRender();
      renderHotspots(data.hotspots);
    }

    function setRiskFilter(tier) {
      currentRiskFilter = tier;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      filterAndRender();
    }

    function filterAndRender() {
      if (!globalStatsData) return;
      const selectedRepo = document.getElementById('repoFilter').value;
      const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

      let filteredLogs = globalStatsData.auditLogs;
      
      if (selectedRepo !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.repoFullName === selectedRepo);
      }

      if (currentRiskFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.tier === currentRiskFilter);
      }

      if (searchQuery) {
        filteredLogs = filteredLogs.filter(log => 
          log.prTitle.toLowerCase().includes(searchQuery) || 
          ('#' + log.prNumber).includes(searchQuery) ||
          log.repoFullName.toLowerCase().includes(searchQuery)
        );
      }

      // Update stat cards based on filtered set
      const total = filteredLogs.length;
      const high = filteredLogs.filter(l => l.tier === 'high').length;
      const med = filteredLogs.filter(l => l.tier === 'medium').length;
      const low = filteredLogs.filter(l => l.tier === 'low').length;

      document.getElementById('statTotalPRs').textContent = total;
      document.getElementById('statHighRisk').textContent = high;
      document.getElementById('statMediumRisk').textContent = med;
      document.getElementById('statLowRisk').textContent = low;
      document.getElementById('statAiCoverage').textContent = globalStatsData.aiCoveragePercentage + '%';

      // Update Risk Proportion Bar
      document.getElementById('distTotalLabel').textContent = total + ' PRs Filtered';
      document.getElementById('legHigh').textContent = high;
      document.getElementById('legMedium').textContent = med;
      document.getElementById('legLow').textContent = low;

      if (total > 0) {
        document.getElementById('segHigh').style.width = (high / total * 100) + '%';
        document.getElementById('segMedium').style.width = (med / total * 100) + '%';
        document.getElementById('segLow').style.width = (low / total * 100) + '%';
      } else {
        document.getElementById('segHigh').style.width = '0%';
        document.getElementById('segMedium').style.width = '0%';
        document.getElementById('segLow').style.width = '100%';
      }

      renderTable(filteredLogs);
    }

    function renderTable(logs) {
      const tbody = document.getElementById('auditTableBody');
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px">No PR risk logs match your filter criteria</td></tr>';
        return;
      }

      tbody.innerHTML = logs.map((log, idx) => {
        const badgeClass = log.tier === 'high' ? 'badge-high' : log.tier === 'medium' ? 'badge-medium' : 'badge-low';
        const tierDot = log.tier === 'high' ? '🔴' : log.tier === 'medium' ? '🟡' : '🟢';
        return \`
          <tr onclick="openModal(\${idx})">
            <td><strong>#\${log.prNumber}</strong></td>
            <td><code style="font-size: 12px; color: var(--accent-blue)">\${log.repoFullName}</code></td>
            <td><strong>\${log.prTitle}</strong></td>
            <td><code style="background: #0d1322; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-color)">\${log.stack}</code></td>
            <td><span class="badge \${badgeClass}">\${tierDot} \${log.tier.toUpperCase()}</span></td>
            <td><strong>\${log.score}/100</strong></td>
            <td style="color: var(--text-muted)">\${log.summary ? log.summary.substring(0, 55) + '...' : 'Rule engine scan'}</td>
          </tr>
        \`;
      }).join('');
    }

    function renderHotspots(hotspots) {
      const list = document.getElementById('hotspotList');
      if (hotspots.length === 0) {
        list.innerHTML = '<div style="color: var(--text-muted); font-size: 13px">No file hotspots recorded yet</div>';
        return;
      }

      list.innerHTML = hotspots.map(h => {
        const badgeClass = h.highestTier === 'high' ? 'badge-high' : h.highestTier === 'medium' ? 'badge-medium' : 'badge-low';
        return \`
          <div class="hotspot-item">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px">
              <code style="font-size: 12px; font-weight: 600; color: var(--text-main)">\${h.filePath}</code>
              <div style="font-size: 11px; color: var(--text-muted)">\${h.scanCount} PR scan\${h.scanCount !== 1 ? 's' : ''}</div>
            </div>
            <span class="badge \${badgeClass}">\${h.maxScore}/100</span>
          </div>
        \`;
      }).join('');
    }

    function openModal(idx) {
      const item = globalStatsData.auditLogs[idx];
      if (!item) return;
      document.getElementById('modalTitle').textContent = \`PR #\${item.prNumber}: \${item.prTitle}\`;
      document.getElementById('modalBody').innerHTML = \`
        <div style="margin-bottom: 20px; display: flex; gap: 16px; font-size: 13px">
          <div><strong>Repo:</strong> <code style="color: var(--accent-blue)">\${item.repoFullName}</code></div>
          <div><strong>Stack:</strong> <code>\${item.stack}</code></div>
          <div><strong>Risk Score:</strong> <strong>\${item.score}/100</strong></div>
        </div>

        <div class="modal-section">
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 8px">🤖 AI Intent Audit Summary</div>
          <div style="color: var(--text-muted); font-size: 13px; line-height: 1.6">\${item.summary || 'Rule engine scan performed.'}</div>
        </div>

        <div style="margin-top: 24px">
          <a href="https://github.com/\${item.repoFullName}/pull/\${item.prNumber}" target="_blank" class="btn-github-link">
            ↗ Open Pull Request on GitHub
          </a>
        </div>
      \`;
      document.getElementById('modalOverlay').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('modalOverlay').style.display = 'none';
    }

    function exportCSV() {
      if (!globalStatsData || !globalStatsData.auditLogs.length) {
        alert('No audit logs available to export.');
        return;
      }
      
      const headers = ['PR Number', 'Repository', 'PR Title', 'Stack', 'Risk Score', 'Risk Tier', 'Scanned At'];
      const rows = globalStatsData.auditLogs.map(l => [
        l.prNumber,
        \`"\${l.repoFullName}"\`,
        \`"\${l.prTitle.replace(/"/g, '""')}"\`,
        l.stack,
        l.score,
        l.tier,
        \`"\${l.scannedAt}"\`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', \`pr-risk-audit-report-\${new Date().toISOString().slice(0,10)}.csv\`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    fetchStats();
  </script>
</body>
</html>`;
}
