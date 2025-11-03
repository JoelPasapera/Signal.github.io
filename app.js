// Global state
let allSymbols = [];
let currentTab = 'masterFlow';
let searchTerm = '';
let filterType = 'all';
let sortType = 'symbol_asc';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('uploadDate').valueAsDate = new Date();
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', function() {
        searchTerm = this.value.toLowerCase();
        renderCurrentTab();
    });
    
    document.getElementById('filterSelect').addEventListener('change', function() {
        filterType = this.value;
        renderCurrentTab();
    });
    
    document.getElementById('sortSelect').addEventListener('change', function() {
        sortType = this.value;
        renderCurrentTab();
    });
    
    // Load initial data
    loadData();
});

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    renderCurrentTab();
}

async function handleUpload(e) {
    e.preventDefault();
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = 'Procesando archivos...';
    statusDiv.className = 'status-message';
    statusDiv.style.display = 'block';
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            statusDiv.textContent = `✅ Éxito! Fecha: ${result.date} | Total: ${result.total_symbols} | Nuevos: ${result.new_symbols} | Eliminados: ${result.removed_symbols}`;
            statusDiv.className = 'status-message success';
            
            // Reload data
            await loadData();
            
            // Reset form
            e.target.reset();
            document.getElementById('uploadDate').valueAsDate = new Date();
        } else {
            statusDiv.textContent = `❌ Error: ${result.error}`;
            statusDiv.className = 'status-message error';
        }
    } catch (error) {
        statusDiv.textContent = `❌ Error de conexión: ${error.message}`;
        statusDiv.className = 'status-message error';
    }
}

async function loadData() {
    try {
        const response = await fetch('/data');
        const data = await response.json();
        
        if (response.ok) {
            allSymbols = data.symbols;
            updateStats(data.stats);
            renderCurrentTab();
        } else {
            console.error('Error loading data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function updateStats(stats) {
    document.getElementById('totalSymbols').textContent = stats.total;
    document.getElementById('newSymbols').textContent = stats.new;
    document.getElementById('removedSymbols').textContent = stats.removed;
}

function filterAndSortSymbols(symbols) {
    // Filter
    let filtered = symbols.filter(symbol => {
        // Search filter
        if (searchTerm && !symbol.symbol.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Type filter
        switch (filterType) {
            case 'new':
                return symbol.is_new;
            case 'removed':
                return symbol.is_removed;
            case 'with_options':
                return symbol.total_options > 0;
            case 'with_darkpool':
                return symbol.total_darkpool > 0;
            default:
                return true;
        }
    });
    
    // Sort
    filtered.sort((a, b) => {
        switch (sortType) {
            case 'symbol_asc':
                return a.symbol.localeCompare(b.symbol);
            case 'symbol_desc':
                return b.symbol.localeCompare(a.symbol);
            case 'options_desc':
                return b.total_options - a.total_options;
            case 'darkpool_desc':
                return b.total_darkpool - a.total_darkpool;
            default:
                return 0;
        }
    });
    
    return filtered;
}

function renderCurrentTab() {
    const filtered = filterAndSortSymbols(allSymbols);
    
    switch (currentTab) {
        case 'masterFlow':
            renderMasterFlow(filtered);
            break;
        case 'darkPool':
            renderDarkPool(filtered.filter(s => s.total_darkpool > 0));
            break;
        case 'unusualOptions':
            renderUnusualOptions(filtered.filter(s => s.total_options > 0));
            break;
    }
}

function renderMasterFlow(symbols) {
    const tbody = document.getElementById('masterTableBody');
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay datos disponibles. Carga archivos CSV para comenzar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = symbols.map((symbol, index) => {
        const statusBadge = symbol.is_new ? '<span class="status-badge new">NUEVO</span>' :
                          symbol.is_removed ? '<span class="status-badge removed">ELIMINADO</span>' :
                          '<span class="status-badge active">ACTIVO</span>';
        
        return `
            <tr data-symbol-index="${index}">
                <td><button class="expand-btn" onclick="toggleExpand(${index}, 'master')">▶</button></td>
                <td><span class="symbol-badge">${symbol.symbol}</span></td>
                <td>${statusBadge}</td>
                <td><span class="count-badge">${symbol.total_options}</span></td>
                <td><span class="count-badge">${symbol.total_darkpool}</span></td>
                <td>Ver prints expandidos</td>
            </tr>
            <tr class="expanded-row" id="expanded-master-${index}">
                <td colspan="6">
                    <div class="expanded-content">
                        ${renderExpandedContent(symbol)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderDarkPool(symbols) {
    const tbody = document.getElementById('darkPoolTableBody');
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay actividad de Dark Pool para mostrar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = symbols.map((symbol, index) => {
        const statusBadge = symbol.is_new ? '<span class="status-badge new">NUEVO</span>' :
                          symbol.is_removed ? '<span class="status-badge removed">ELIMINADO</span>' :
                          '<span class="status-badge active">ACTIVO</span>';
        
        const latestPrints = symbol.darkpool_prints.slice(0, 3).map(print => 
            `<div class="print-date">${print.date}</div>`
        ).join('');
        
        return `
            <tr data-symbol-index="${index}">
                <td><button class="expand-btn" onclick="toggleExpand(${index}, 'darkpool')">▶</button></td>
                <td><span class="symbol-badge">${symbol.symbol}</span></td>
                <td>${statusBadge}</td>
                <td><span class="count-badge">${symbol.total_darkpool}</span></td>
                <td>${latestPrints || 'Ver detalles'}</td>
            </tr>
            <tr class="expanded-row" id="expanded-darkpool-${index}">
                <td colspan="5">
                    <div class="expanded-content">
                        ${renderDarkPoolPrints(symbol.darkpool_prints)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderUnusualOptions(symbols) {
    const tbody = document.getElementById('optionsTableBody');
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay actividad de opciones inusuales para mostrar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = symbols.map((symbol, index) => {
        const statusBadge = symbol.is_new ? '<span class="status-badge new">NUEVO</span>' :
                          symbol.is_removed ? '<span class="status-badge removed">ELIMINADO</span>' :
                          '<span class="status-badge active">ACTIVO</span>';
        
        const latestPrints = symbol.options_prints.slice(0, 3).map(print => 
            `<div class="print-date">${print.date}</div>`
        ).join('');
        
        return `
            <tr data-symbol-index="${index}">
                <td><button class="expand-btn" onclick="toggleExpand(${index}, 'options')">▶</button></td>
                <td><span class="symbol-badge">${symbol.symbol}</span></td>
                <td>${statusBadge}</td>
                <td><span class="count-badge">${symbol.total_options}</span></td>
                <td>${latestPrints || 'Ver detalles'}</td>
            </tr>
            <tr class="expanded-row" id="expanded-options-${index}">
                <td colspan="5">
                    <div class="expanded-content">
                        ${renderOptionsPrints(symbol.options_prints)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderExpandedContent(symbol) {
    let content = '';
    
    if (symbol.options_prints.length > 0) {
        content += `
            <div class="prints-section">
                <h4>📈 Unusual Options (${symbol.options_prints.length})</h4>
                ${renderOptionsPrints(symbol.options_prints)}
            </div>
        `;
    }
    
    if (symbol.darkpool_prints.length > 0) {
        content += `
            <div class="prints-section">
                <h4>🌑 Dark Pool (${symbol.darkpool_prints.length})</h4>
                ${renderDarkPoolPrints(symbol.darkpool_prints)}
            </div>
        `;
    }
    
    if (content === '') {
        content = '<p class="no-data">No hay prints disponibles para este símbolo.</p>';
    }
    
    return content;
}

function renderOptionsPrints(prints) {
    if (prints.length === 0) {
        return '<p class="no-data">No hay prints de opciones.</p>';
    }
    
    return `
        <div class="prints-grid">
            ${prints.map(print => `
                <div class="print-card">
                    <div class="print-date">📅 ${print.date}</div>
                    <div class="print-details">
                        ${Object.entries(print)
                            .filter(([key]) => key !== 'date')
                            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                            .join(' | ')
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDarkPoolPrints(prints) {
    if (prints.length === 0) {
        return '<p class="no-data">No hay prints de dark pool.</p>';
    }
    
    return `
        <div class="prints-grid">
            ${prints.map(print => `
                <div class="print-card darkpool">
                    <div class="print-date">📅 ${print.date}</div>
                    <div class="print-details">
                        ${Object.entries(print)
                            .filter(([key]) => key !== 'date')
                            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                            .join(' | ')
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function toggleExpand(index, type) {
    const expandedRow = document.getElementById(`expanded-${type}-${index}`);
    const button = event.target;
    
    if (expandedRow.classList.contains('show')) {
        expandedRow.classList.remove('show');
        button.classList.remove('expanded');
    } else {
        // Close all other expanded rows
        document.querySelectorAll('.expanded-row.show').forEach(row => {
            row.classList.remove('show');
        });
        document.querySelectorAll('.expand-btn.expanded').forEach(btn => {
            btn.classList.remove('expanded');
        });
        
        // Open this row
        expandedRow.classList.add('show');
        button.classList.add('expanded');
    }
}
