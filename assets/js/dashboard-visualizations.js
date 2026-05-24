(function (globalScope) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getUpSetSources(data) {
    return [...new Set(data.flatMap((item) => item.combination))];
  }

  function getReportMinutes(report) {
    const period = report.period || '';
    const timeMatch = period.match(/^(\d{2})-(\d{2})/);
    if (timeMatch) {
      return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    }

    const periodMinutes = {
      morning: 8 * 60,
      noon: 12 * 60,
      'a-close': 15 * 60,
      evening: 18 * 60,
      'us-premarket': 21 * 60,
      weekly: 18 * 60,
      weekend: 10 * 60,
    };

    return periodMinutes[period] ?? 0;
  }

  function getLatestReports(reports, limit = 5) {
    return [...reports]
      .sort((left, right) => {
        const dateCompare = String(right.date || '').localeCompare(String(left.date || ''));
        if (dateCompare !== 0) return dateCompare;
        return getReportMinutes(right) - getReportMinutes(left);
      })
      .slice(0, limit);
  }

  function formatReportTime(report) {
    const period = report.period || '';
    const timeMatch = period.match(/^(\d{2})-(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }

    const labels = {
      morning: '晨间',
      noon: '午间',
      evening: '晚间',
      'a-close': '收盘',
      'us-premarket': '美股盘前',
      weekly: '周度',
      weekend: '周末',
    };

    return labels[period] || period || '日报';
  }

  function getReportTopic(report) {
    if (report.keywords?.length) {
      return report.keywords.slice(0, 2).join(' · ');
    }

    const filename = String(report.path || '').split('/').pop()?.replace(/\.html$/, '') || '';
    return filename
      .replace(/^\d{2}-\d{2}-/, '')
      .replace(/-/g, ' ')
      .trim() || '未命名主题';
  }

  function renderLatestReportLinks(reports) {
    return `
      <div class="latest-report-list">
        ${reports.map((report) => `
          <a class="latest-report-link" href="${escapeHtml(report.path)}">
            <span class="latest-report-meta">${escapeHtml(report.date)} · ${escapeHtml(formatReportTime(report))}</span>
            <span class="latest-report-topic">${escapeHtml(getReportTopic(report))}</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  function renderUpSetPlotMarkup(data) {
    const maxCount = Math.max(...data.map((item) => item.count));
    const allSources = getUpSetSources(data);

    const bars = data.map((item, index) => {
      const height = (item.count / maxCount * 100).toFixed(0);
      const combinationLabel = escapeHtml(item.combination.join(' + '));
      const barLabel = `组合 ${index + 1}`;
      return `
        <div class="upset-column" aria-label="${barLabel}：${combinationLabel}">
          <div class="upset-bar" style="height:${height}%" title="${combinationLabel}: ${item.count}" aria-label="${combinationLabel}，命中 ${item.count} 份报告">
            <span class="upset-bar-value">${item.count}</span>
          </div>
          <span class="upset-column-label">${index + 1}</span>
        </div>
      `;
    }).join('');

    const matrixRows = allSources.map((source) => {
      const dots = data.map((item, index) => {
        const isActive = item.combination.includes(source);
        return `<div class="upset-dot ${isActive ? 'active' : ''}" aria-label="组合 ${index + 1}${isActive ? '包含' : '不包含'} ${escapeHtml(source)}"></div>`;
      }).join('');

      return `
        <div class="upset-matrix-row">
          <span class="upset-matrix-label" title="${escapeHtml(source)}">${escapeHtml(source)}</span>
          <div class="upset-dots">${dots}</div>
        </div>
      `;
    }).join('');

    const comboList = data.map((item, index) => `
      <li><span class="upset-combo-index">${index + 1}.</span> ${escapeHtml(item.combination.join(' + '))} <span class="upset-combo-count">(${item.count})</span></li>
    `).join('');

    return `
      <div class="upset-container">
        <p class="upset-description">每一列代表一个订阅组合。上方柱形表示该组合出现次数，下方点阵展示这一列包含哪些订阅。</p>
        <div class="upset-chart" role="img" aria-label="跨订阅共振图，上方柱形表示组合频次，下方点阵表示订阅是否包含在该组合中">
          <div class="upset-combinations">${bars}</div>
          <div class="upset-matrix">${matrixRows}</div>
        </div>
        <div class="upset-legend">
          <div class="upset-legend-item"><span class="upset-legend-dot active"></span> 包含该订阅</div>
          <div class="upset-legend-item"><span class="upset-legend-dot"></span> 不包含</div>
          <div class="upset-legend-item"><span class="upset-legend-bar"></span> 同时命中该组合的报告数</div>
        </div>
        <ol class="upset-combo-list">${comboList}</ol>
      </div>
    `;
  }

  const exportsObject = {
    formatReportTime,
    getLatestReports,
    getUpSetSources,
    renderLatestReportLinks,
    renderUpSetPlotMarkup,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObject;
  }

  globalScope.dashboardVisualizations = Object.assign(
    {},
    globalScope.dashboardVisualizations || {},
    exportsObject
  );
})(typeof window !== 'undefined' ? window : globalThis);
