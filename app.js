const missions = [
  { id: 'M-2401', client: 'Chrono Pharma', route: 'Paris → Lille', driver: 'Yassine A.', vehicle: 'Renault Trafic 01', status: 'in_progress', revenue: 540, estimatedCost: 164, departure: '07:10' },
  { id: 'M-2402', client: 'Nord Retail', route: 'Paris → Reims', driver: 'Samir B.', vehicle: 'Berlingo 02', status: 'planned', revenue: 290, estimatedCost: 92, departure: '10:20' },
  { id: 'M-2403', client: 'MediDrop', route: 'Paris → Orléans', driver: 'Nassim K.', vehicle: 'Renault Trafic 02', status: 'delivered', revenue: 410, estimatedCost: 126, departure: '05:55' },
  { id: 'M-2404', client: 'Urban Parts', route: 'Paris → Rouen', driver: 'Karim L.', vehicle: 'Berlingo 04', status: 'issue', revenue: 330, estimatedCost: 140, departure: '08:40' },
]

const expenses = [
  { id: 'E-1101', missionId: 'M-2401', driver: 'Yassine A.', vehicle: 'Renault Trafic 01', type: 'fuel', amount: 84, advancedByDriver: false, receipt: true, date: '2026-03-27' },
  { id: 'E-1102', missionId: 'M-2404', driver: 'Karim L.', vehicle: 'Berlingo 04', type: 'mission', amount: 36, advancedByDriver: true, receipt: false, date: '2026-03-27' },
  { id: 'E-1103', missionId: 'M-2403', driver: 'Nassim K.', vehicle: 'Renault Trafic 02', type: 'tolls', amount: 22, advancedByDriver: true, receipt: true, date: '2026-03-27' },
  { id: 'E-1104', missionId: '—', driver: 'Fleet', vehicle: 'Berlingo 02', type: 'maintenance', amount: 190, advancedByDriver: false, receipt: true, date: '2026-03-25' },
]

const vehicles = [
  { id: 'V-01', name: 'Renault Trafic 01', plate: 'FT-218-KP', mileage: 127430, nextServiceKm: 130000, status: 'watch' },
  { id: 'V-02', name: 'Renault Trafic 02', plate: 'GS-102-LQ', mileage: 91400, nextServiceKm: 100000, status: 'active' },
  { id: 'V-03', name: 'Berlingo 02', plate: 'ER-771-ZD', mileage: 149880, nextServiceKm: 150000, status: 'service_due' },
  { id: 'V-04', name: 'Berlingo 04', plate: 'FP-403-XM', mileage: 110510, nextServiceKm: 120000, status: 'active' },
]

const invoices = [
  { id: 'INV-2026-014', client: 'Chrono Pharma', missionId: 'M-2401', amount: 540, status: 'sent', dueDate: '2026-04-05' },
  { id: 'INV-2026-015', client: 'Nord Retail', missionId: 'M-2402', amount: 290, status: 'draft', dueDate: '2026-04-10' },
  { id: 'INV-2026-011', client: 'Urban Parts', missionId: 'M-2388', amount: 610, status: 'overdue', dueDate: '2026-03-15' },
  { id: 'INV-2026-009', client: 'MediDrop', missionId: 'M-2369', amount: 720, status: 'partial', dueDate: '2026-03-12' },
]

const statusLabels = {
  planned: 'Planned', in_progress: 'In progress', delivered: 'Delivered', issue: 'Issue',
  draft: 'Draft', sent: 'Sent', partial: 'Partial', paid: 'Paid', overdue: 'Overdue',
  active: 'Active', watch: 'Watch', service_due: 'Service due',
}

const statusClasses = {
  planned: 'badge-neutral', in_progress: 'badge-blue', delivered: 'badge-green', issue: 'badge-red',
  draft: 'badge-neutral', sent: 'badge-blue', partial: 'badge-amber', paid: 'badge-green', overdue: 'badge-red',
  active: 'badge-green', watch: 'badge-amber', service_due: 'badge-red',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function renderKpis() {
  const totalRevenue = missions.reduce((sum, item) => sum + item.revenue, 0)
  const totalEstimatedCost = missions.reduce((sum, item) => sum + item.estimatedCost, 0)
  const estimatedMargin = totalRevenue - totalEstimatedCost
  const driverAdvances = expenses.filter((item) => item.advancedByDriver).reduce((sum, item) => sum + item.amount, 0)
  const overdueInvoices = invoices.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + item.amount, 0)
  const missingReceipts = expenses.filter((item) => !item.receipt).length

  const data = [
    ['Today\'s revenue', formatCurrency(totalRevenue), `${missions.length} active / planned missions`, '€'],
    ['Estimated cost', formatCurrency(totalEstimatedCost), 'Fuel, tolls and mission costs', '🧾'],
    ['Estimated margin', formatCurrency(estimatedMargin), 'Revenue minus tracked mission costs', '💼'],
    ['Driver advances', formatCurrency(driverAdvances), 'To reimburse and reconcile', '👥'],
    ['Overdue invoices', formatCurrency(overdueInvoices), `${missingReceipts} missing receipt${missingReceipts > 1 ? 's' : ''} flagged`, '⚠'],
  ]

  document.getElementById('kpi-grid').innerHTML = data.map(([title, value, hint, icon]) => `
    <article class="kpi-card">
      <div>
        <p class="kpi-label">${title}</p>
        <h2 class="kpi-value">${value}</h2>
        <p class="kpi-hint">${hint}</p>
      </div>
      <div class="icon-shell">${icon}</div>
    </article>
  `).join('')
}

function renderMissions(query = '') {
  const lowerQuery = query.trim().toLowerCase()
  const filtered = !lowerQuery ? missions : missions.filter((mission) =>
    [mission.id, mission.client, mission.route, mission.driver, mission.vehicle].join(' ').toLowerCase().includes(lowerQuery)
  )

  document.getElementById('mission-list').innerHTML = filtered.map((mission) => {
    const liveMargin = mission.revenue - mission.estimatedCost
    return `
      <div class="mission-card">
        <div class="mission-main">
          <div class="mission-meta-row">
            <span class="mission-id">${mission.id}</span>
            <span class="badge ${statusClasses[mission.status]}">${statusLabels[mission.status]}</span>
          </div>
          <h3>${mission.client}</h3>
          <div class="mission-details">
            <span>↔ ${mission.route}</span>
            <span>🚚 ${mission.vehicle}</span>
            <span>👤 ${mission.driver}</span>
            <span>🕒 ${mission.departure}</span>
          </div>
        </div>
        <div class="metric-pill-grid">
          <div class="metric-pill"><span>Revenue</span><strong>${formatCurrency(mission.revenue)}</strong></div>
          <div class="metric-pill"><span>Cost</span><strong>${formatCurrency(mission.estimatedCost)}</strong></div>
          <div class="metric-pill"><span>Margin</span><strong>${formatCurrency(liveMargin)}</strong></div>
        </div>
      </div>
    `
  }).join('')
}

function renderFleet() {
  document.getElementById('fleet-list').innerHTML = vehicles.map((vehicle) => {
    const ratio = Math.min(100, Math.round((vehicle.mileage / vehicle.nextServiceKm) * 100))
    return `
      <div class="fleet-card">
        <div class="fleet-head">
          <div>
            <h3>${vehicle.name}</h3>
            <p>${vehicle.plate}</p>
          </div>
          <span class="badge ${statusClasses[vehicle.status]}">${statusLabels[vehicle.status]}</span>
        </div>
        <div class="fleet-meta">
          <span>${vehicle.mileage.toLocaleString('fr-FR')} km</span>
          <span>Service at ${vehicle.nextServiceKm.toLocaleString('fr-FR')} km</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${ratio}%"></div></div>
      </div>
    `
  }).join('')
}

function renderExpenses() {
  document.getElementById('tab-expenses').innerHTML = `
    <article class="panel">
      <div class="panel-header">
        <h2>Expense tracking</h2>
        <p>Mission costs, driver advances and supporting receipts.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Expense</th><th>Mission</th><th>Driver</th><th>Vehicle</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((expense) => `
              <tr>
                <td><div class="expense-type"><span>${iconForExpense(expense.type)}</span><span>${expense.type}</span></div></td>
                <td>${expense.missionId}</td>
                <td>${expense.driver}</td>
                <td>${expense.vehicle}</td>
                <td class="table-amount">${formatCurrency(expense.amount)}</td>
                <td>
                  <div class="table-badges">
                    <span class="badge ${expense.advancedByDriver ? 'badge-amber' : 'badge-neutral'}">${expense.advancedByDriver ? 'Driver advance' : 'Company paid'}</span>
                    <span class="badge ${expense.receipt ? 'badge-green' : 'badge-red'}">${expense.receipt ? 'Receipt OK' : 'Receipt missing'}</span>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `
}

function renderInvoices() {
  document.getElementById('tab-invoices').innerHTML = `
    <article class="panel">
      <div class="panel-header">
        <h2>Invoicing & collections</h2>
        <p>Client billing status linked to missions.</p>
      </div>
      <div class="invoice-list">
        ${invoices.map((invoice) => `
          <div class="invoice-card">
            <div>
              <div class="invoice-title-row">
                <strong>${invoice.id}</strong>
                <span class="badge ${statusClasses[invoice.status]}">${statusLabels[invoice.status]}</span>
              </div>
              <p>${invoice.client} · Linked to ${invoice.missionId}</p>
            </div>
            <div class="invoice-right">
              <div><span class="label">Amount</span><strong>${formatCurrency(invoice.amount)}</strong></div>
              <div><span class="label">Due date</span><strong>${invoice.dueDate}</strong></div>
              <button class="link-button" type="button">Open →</button>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `
}

function renderOverview() {
  document.getElementById('tab-overview').innerHTML = `
    <div class="overview-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>Core workflow</h2>
          <p>The operational backbone of the V1.</p>
        </div>
        <div class="workflow-grid">
          <div class="workflow-card"><strong>Client</strong><p>Account, billing profile and mission history</p></div>
          <div class="workflow-card"><strong>Mission</strong><p>Route, assignment, revenue and cost tracking</p></div>
          <div class="workflow-card"><strong>Expense</strong><p>Fuel, tolls, driver advances and receipts</p></div>
          <div class="workflow-card"><strong>Invoice</strong><p>Billing, due dates and payment status</p></div>
        </div>
      </article>
      <article class="panel">
        <div class="panel-header">
          <h2>V1 priorities</h2>
          <p>What matters first.</p>
        </div>
        <div class="priority-list">
          <div class="priority-card"><strong>1. Dispatch clarity</strong><p>See what is planned, in progress and delivered without calls and spreadsheets.</p></div>
          <div class="priority-card"><strong>2. Cost control</strong><p>Track mission expenses, reimbursements and missing receipts in one place.</p></div>
          <div class="priority-card"><strong>3. Billing follow-up</strong><p>Link missions to invoices and keep overdue amounts visible.</p></div>
        </div>
      </article>
    </div>
  `
}

function iconForExpense(type) {
  return { fuel: '⛽', tolls: '🛣', mission: '💶', maintenance: '🛠' }[type] || '•'
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll('.tab-button'))
  const panels = {
    expenses: document.getElementById('tab-expenses'),
    invoices: document.getElementById('tab-invoices'),
    overview: document.getElementById('tab-overview'),
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab
      buttons.forEach((item) => item.classList.remove('tab-active'))
      button.classList.add('tab-active')
      Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle('hidden', key !== tab))
    })
  })
}

function setupSearch() {
  document.getElementById('mission-search').addEventListener('input', (event) => {
    renderMissions(event.target.value)
  })
}

renderKpis()
renderMissions()
renderFleet()
renderExpenses()
renderInvoices()
renderOverview()
setupTabs()
setupSearch()
