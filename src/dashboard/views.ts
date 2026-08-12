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
      --bg-dark: #0d1117;
      --card-bg: rgba(22, 27, 34, 0.75);
      --border-color: #30363d;
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
        radial-gradient(circle at 15% 15%, rgba(63, 185, 80, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(88, 166, 255, 0.12) 0%, transparent 45%);
    }

    .login-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      text-align: center;
    }

    .brand-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, rgba(63, 185, 80, 0.2), rgba(88, 166, 255, 0.2));
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 20px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .btn-github {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 20px;
      background-color: #24292e;
      color: #ffffff;
      border: 1px solid #444c56;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-github:hover {
      background-color: #2f363d;
      border-color: var(--text-muted);
      transform: translateY(-1px);
    }

    .feature-list {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 12px;
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
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="brand-icon">🛡️</div>
    <h1>AI Code Risk Monitor</h1>
    <p class="subtitle">Enterprise Pre-Merge Risk Analytics & Intelligence Dashboard</p>

    <a href="/auth/github" class="btn-github">
      <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Continue with GitHub
    </a>

    <div class="feature-list">
      <div class="feature-item">
        <span class="feature-icon">✓</span> Single Sign-On backed by GitHub permissions
      </div>
      <div class="feature-item">
        <span class="feature-icon">✓</span> Multi-tenant data isolation & live analytics
      </div>
      <div class="feature-item">
        <span class="feature-icon">✓</span> Hotspot tracking & AI intent risk audit logs
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0d1117;
      --card-bg: #161b22;
      --border-color: #30363d;
      --text-main: #f0f6fc;
      --text-muted: #8b949e;
      --tier-high: #f85149;
      --tier-medium: #d29922;
      --tier-low: #3fb950;
      --accent-blue: #58a6ff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: rgba(22, 27, 34, 0.9);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
      padding: 14px 28px;
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
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(63, 185, 80, 0.15);
      color: var(--tier-low);
      border: 1px solid rgba(63, 185, 80, 0.3);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    select, input[type="text"] {
      background-color: #0d1117;
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
    }

    select:focus, input[type="text"]:focus {
      border-color: var(--accent-blue);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 500;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
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
    }

    main {
      flex: 1;
      padding: 28px;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
    }

    .dashboard-layout {
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .dashboard-layout { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 700;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      text-align: left;
      padding: 12px 14px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
    }

    td {
      padding: 14px;
      border-bottom: 1px solid var(--border-color);
    }

    tr:hover {
      background-color: rgba(255, 255, 255, 0.02);
      cursor: pointer;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-high { background: rgba(248, 81, 73, 0.15); color: var(--tier-high); border: 1px solid rgba(248, 81, 73, 0.3); }
    .badge-medium { background: rgba(210, 153, 34, 0.15); color: var(--tier-medium); border: 1px solid rgba(210, 153, 34, 0.3); }
    .badge-low { background: rgba(63, 185, 80, 0.15); color: var(--tier-low); border: 1px solid rgba(63, 185, 80, 0.3); }

    .hotspot-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .hotspot-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    /* Detail Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 200;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      width: 90%;
      max-width: 680px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 28px;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span>🛡️ AI Code Risk Monitor</span>
      <span class="status-badge">● System Operational</span>
    </div>

    <div class="nav-controls">
      <select id="repoFilter">
        <option value="all">All Repositories</option>
      </select>

      <input type="text" id="searchInput" placeholder="Search PR Title or #..." />

      <div class="user-profile">
        <img class="user-avatar" src="${session.avatarUrl || 'https://github.com/github.png'}" alt="Avatar" />
        <span>${session.username}</span>
        <a href="/auth/logout" class="btn-logout">Logout</a>
      </div>
    </div>
  </header>

  <main>
    <!-- Metric Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total PRs Scored</span>
        <span class="stat-value" id="statTotalPRs">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">High Risk PRs (🔴)</span>
        <span class="stat-value" style="color: var(--tier-high)" id="statHighRisk">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Medium Risk PRs (🟡)</span>
        <span class="stat-value" style="color: var(--tier-medium)" id="statMediumRisk">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Low Risk PRs (🟢)</span>
        <span class="stat-value" style="color: var(--tier-low)" id="statLowRisk">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">AI Scan Coverage</span>
        <span class="stat-value" style="color: var(--accent-blue)" id="statAiCoverage">0%</span>
      </div>
    </div>

    <!-- Main Layout Grid -->
    <div class="dashboard-layout">
      <!-- PR Audit Feed -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">📋 PR Risk Audit Logs</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>PR #</th>
              <th>Title</th>
              <th>Stack</th>
              <th>Risk Tier</th>
              <th>Score</th>
              <th>AI Intent Summary</th>
            </tr>
          </thead>
          <tbody id="auditTableBody">
            <tr><td colspan="6" style="text-align: center; color: var(--text-muted)">Loading audit data...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Codebase Hotspots Sidebar -->
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

  <!-- PR Detail Modal -->
  <div class="modal-overlay" id="modalOverlay">
    <div class="modal">
      <div class="panel-header">
        <span class="panel-title" id="modalTitle">PR Details</span>
        <button style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer" onclick="closeModal()">✕</button>
      </div>
      <div id="modalBody" style="font-size: 13px; line-height: 1.6; color: var(--text-muted)"></div>
    </div>
  </div>

  <script>
    let globalStatsData = null;

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return;
        globalStatsData = await res.json();
        renderDashboard(globalStatsData);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    }

    function renderDashboard(data) {
      document.getElementById('statTotalPRs').textContent = data.totalPRsScored;
      document.getElementById('statHighRisk').textContent = data.highRiskCount;
      document.getElementById('statMediumRisk').textContent = data.mediumRiskCount;
      document.getElementById('statLowRisk').textContent = data.lowRiskCount;
      document.getElementById('statAiCoverage').textContent = data.aiCoveragePercentage + '%';

      // Populate repo filter dropdown
      const select = document.getElementById('repoFilter');
      select.innerHTML = '<option value="all">All Repositories</option>' + 
        data.availableRepos.map(r => \`<option value="\${r}">\${r}</option>\`).join('');

      // Wire filter listeners
      document.getElementById('repoFilter').addEventListener('change', filterAndRender);
      document.getElementById('searchInput').addEventListener('input', filterAndRender);

      renderTable(data.auditLogs);
      renderHotspots(data.hotspots);
    }

    function filterAndRender() {
      if (!globalStatsData) return;
      const selectedRepo = document.getElementById('repoFilter').value;
      const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

      let filteredLogs = globalStatsData.auditLogs;
      if (selectedRepo !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.repoFullName === selectedRepo);
      }
      if (searchQuery) {
        filteredLogs = filteredLogs.filter(log => 
          log.prTitle.toLowerCase().includes(searchQuery) || 
          ('#' + log.prNumber).includes(searchQuery) ||
          log.repoFullName.toLowerCase().includes(searchQuery)
        );
      }

      document.getElementById('statTotalPRs').textContent = filteredLogs.length;
      document.getElementById('statHighRisk').textContent = filteredLogs.filter(l => l.tier === 'high').length;
      document.getElementById('statMediumRisk').textContent = filteredLogs.filter(l => l.tier === 'medium').length;
      document.getElementById('statLowRisk').textContent = filteredLogs.filter(l => l.tier === 'low').length;

      renderTable(filteredLogs);
    }

    function renderTable(logs) {
      const tbody = document.getElementById('auditTableBody');
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No PR scans recorded yet</td></tr>';
        return;
      }

      tbody.innerHTML = logs.map((log, idx) => {
        const badgeClass = log.tier === 'high' ? 'badge-high' : log.tier === 'medium' ? 'badge-medium' : 'badge-low';
        const emoji = log.tier === 'high' ? '🔴' : log.tier === 'medium' ? '🟡' : '🟢';
        return \`
          <tr onclick="openModal(\${idx})">
            <td><strong>#\${log.prNumber}</strong></td>
            <td>\${log.prTitle}</td>
            <td><code style="background: #0d1117; padding: 2px 6px; border-radius: 4px">\${log.stack}</code></td>
            <td><span class="badge \${badgeClass}">\${emoji} \${log.tier.toUpperCase()}</span></td>
            <td><strong>\${log.score}/100</strong></td>
            <td style="color: var(--text-muted)">\${log.summary ? log.summary.substring(0, 60) + '...' : 'Rule engine scan'}</td>
          </tr>
        \`;
      }).join('');
    }

    function renderHotspots(hotspots) {
      const list = document.getElementById('hotspotList');
      if (hotspots.length === 0) {
        list.innerHTML = '<div style="color: var(--text-muted); font-size: 13px">No file hotspots detected yet</div>';
        return;
      }

      list.innerHTML = hotspots.map(h => {
        const badgeClass = h.highestTier === 'high' ? 'badge-high' : h.highestTier === 'medium' ? 'badge-medium' : 'badge-low';
        return \`
          <div class="hotspot-item">
            <div>
              <code style="font-size: 12px; font-weight: 600">\${h.filePath}</code>
              <div style="font-size: 11px; color: var(--text-muted)">\${h.scanCount} scan\${h.scanCount !== 1 ? 's' : ''}</div>
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
        <div style="margin-bottom: 16px">
          <strong>Repo:</strong> \${item.repoFullName} &nbsp;|&nbsp; 
          <strong>Stack:</strong> \${item.stack} &nbsp;|&nbsp; 
          <strong>Score:</strong> \${item.score}/100 (\${item.tier.toUpperCase()})
        </div>
        <div style="margin-bottom: 16px; background: #0d1117; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color)">
          <strong>AI Summary:</strong><br>\${item.summary || 'No AI summary available.'}
        </div>
        <a href="https://github.com/\${item.repoFullName}/pull/\${item.prNumber}" target="_blank" style="color: var(--accent-blue); text-decoration: none; font-weight: 600">
          ↗ Open Pull Request on GitHub
        </a>
      \`;
      document.getElementById('modalOverlay').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('modalOverlay').style.display = 'none';
    }

    fetchStats();
  </script>
</body>
</html>`;
}
