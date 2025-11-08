// ============================================================================
// GLOBAL STATE AND CONFIGURATION
// ============================================================================

let historicalData = []; // Array to store up to 5 days of data
let currentTab = 'masterFlow';
let currentFilter = 'all';
let searchTerms = {
    masterFlow: '',
    darkPool: '',
    unusualOptions: ''
};
let sortOptions = {
    masterFlow: 'symbol_asc',
    darkPool: 'symbol_asc',
    unusualOptions: 'symbol_asc'
};

// Copy and expand tracking
let lastCopiedRow = null;
let currentExpandedRow = null;

// Upload section state
let uploadSectionCollapsed = false;

// Common ETFs to filter out (PDF Part 2 - Requirement 4.1)
const COMMON_ETFS = new Set([
    'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'VEA', 'VWO', 'AGG', 'BND',
    'VNQ', 'GLD', 'SLV', 'USO', 'UNG', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG',
    'EMB', 'JNK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLK', 'XLP', 'XLY', 'XLU',
    'XLB', 'XLRE', 'XLC', 'EEM', 'EFA', 'IEFA', 'VGK', 'EWJ', 'EWZ', 'FXI',
    'RSX', 'EWT', 'EWY', 'EWG', 'EWU', 'EWC', 'EWA', 'EWH', 'EWW', 'EZA',
    'SQQQ', 'TQQQ', 'SPXU', 'UPRO', 'TNA', 'TZA', 'UDOW', 'SDOW', 'SOXL', 'SOXS',
    'ARKK', 'ARKG', 'ARKF', 'ARKW', 'ARKQ', 'ARKX'
]);

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set today's date as default
    document.getElementById('uploadDate').valueAsDate = new Date();
    
    // Load historical data from localStorage
    loadHistoricalData();
    
    // Initialize tab switching
    setupTabSwitching();
    
    // Initialize upload form
    setupUploadForm();
    
    // Initialize file input handlers
    setupFileInputs();
    
    // Initialize filter buttons
    setupFilterButtons();
    
    // Initialize search inputs
    setupSearchInputs();
    
    // Initialize sort selects
    setupSortSelects();
    
    // Initialize sortable headers - NEW
    setupSortableHeaders();
    
    // Render initial view
    renderCurrentTab();
    renderHistorySection();
}

function setupTabSwitching() {
    document.querySelectorAll('.main-tab-button').forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
}

function setupUploadForm() {
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
}

function setupFileInputs() {
    const fileInputs = ['trendspider_1', 'trendspider_2', 'trendspider_3', 
                      'trendspider_4', 'trendspider_5', 'trendspider_6', 
                      'options', 'darkpool'];
    
    fileInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', function(e) {
                const statusDiv = document.getElementById(`status_${id}`);
                if (e.target.files.length > 0) {
                    statusDiv.textContent = `✓ ${e.target.files[0].name}`;
                    statusDiv.classList.add('loaded');
                }
            });
        }
    });
}

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderCurrentTab();
        });
    });
}

function setupSearchInputs() {
    document.getElementById('searchInput').addEventListener('input', function() {
        searchTerms.masterFlow = this.value.toLowerCase();
        renderCurrentTab();
    });
    
    document.getElementById('searchInputDP').addEventListener('input', function() {
        searchTerms.darkPool = this.value.toLowerCase();
        renderCurrentTab();
    });
    
    document.getElementById('searchInputOpt').addEventListener('input', function() {
        searchTerms.unusualOptions = this.value.toLowerCase();
        renderCurrentTab();
    });
}

function setupSortSelects() {
    document.getElementById('sortSelect').addEventListener('change', function() {
        sortOptions.masterFlow = this.value;
        renderCurrentTab();
    });
    
    document.getElementById('sortSelectDP').addEventListener('change', function() {
        sortOptions.darkPool = this.value;
        renderCurrentTab();
    });
    
    document.getElementById('sortSelectOpt').addEventListener('change', function() {
        sortOptions.unusualOptions = this.value;
        renderCurrentTab();
    });
}

// ============================================================================
// SORTABLE HEADERS - NEW FEATURE
// ============================================================================

function setupSortableHeaders() {
    // Master Flow table
    setupTableSorting('flowTable', 'masterFlow');
    
    // Dark Pool table
    setupTableSorting('darkPoolTable', 'darkPool');
    
    // Unusual Options table
    setupTableSorting('optionsTable', 'unusualOptions');
}

function setupTableSorting(tableId, tabName) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const sortableHeaders = table.querySelectorAll('th.sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            handleHeaderClick(this, tabName);
        });
    });
}

function handleHeaderClick(header, tabName) {
    const sortKey = header.dataset.sort;
    if (!sortKey) return;
    
    const currentSort = sortOptions[tabName];
    let newSort;
    
    // Determine the next sort state
    if (currentSort === `${sortKey}_desc`) {
        // If currently descending, switch to ascending
        newSort = `${sortKey}_asc`;
    } else {
        // If neutral or ascending, switch to descending
        newSort = `${sortKey}_desc`;
    }
    
    // Update sort option
    sortOptions[tabName] = newSort;
    
    // Update all sort icons in this table
    updateSortIcons(header.closest('table'), sortKey, newSort);
    
    // Re-render the current tab
    renderCurrentTab();
}

function updateSortIcons(table, activeSortKey, sortDirection) {
    // Reset all sort icons in this table
    const allHeaders = table.querySelectorAll('th.sortable');
    
    allHeaders.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        if (!icon) return;
        
        const headerSortKey = header.dataset.sort;
        
        if (headerSortKey === activeSortKey) {
            // This is the active sort column
            if (sortDirection.endsWith('_asc')) {
                icon.textContent = '↑';
                icon.className = 'sort-icon asc';
            } else {
                icon.textContent = '↓';
                icon.className = 'sort-icon desc';
            }
        } else {
            // Inactive column - show neutral icon
            icon.textContent = '⇅';
            icon.className = 'sort-icon neutral';
        }
    });
}

// ============================================================================
// UPLOAD SECTION COLLAPSE/EXPAND (PDF Part 2 - Requirement 1)
// ============================================================================

function toggleUploadSection() {
    uploadSectionCollapsed = !uploadSectionCollapsed;
    const uploadContent = document.getElementById('uploadContent');
    const collapseBtn = document.getElementById('collapseBtn');
    
    if (uploadSectionCollapsed) {
        uploadContent.classList.add('collapsed');
        collapseBtn.classList.add('collapsed');
    } else {
        uploadContent.classList.remove('collapsed');
        collapseBtn.classList.remove('collapsed');
    }
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

function loadHistoricalData() {
    const saved = localStorage.getItem('stockFlowHistoricalData');
    if (saved) {
        try {
            historicalData = JSON.parse(saved);
            console.log('✓ Loaded historical data:', historicalData.length, 'days');
        } catch (e) {
            console.error('Error loading historical data:', e);
            historicalData = [];
        }
    }
}

function saveHistoricalData() {
    // Keep only last 5 days
    if (historicalData.length > 5) {
        historicalData = historicalData.slice(-5);
    }
    localStorage.setItem('stockFlowHistoricalData', JSON.stringify(historicalData));
    console.log('✓ Saved historical data:', historicalData.length, 'days');
}

// ============================================================================
// HISTORY SECTION (PDF Part 2 - Requirement 1)
// ============================================================================

function renderHistorySection() {
    const historyList = document.getElementById('historyList');
    
    if (historicalData.length === 0) {
        historyList.innerHTML = '<p class="no-data">No hay días cargados todavía</p>';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedData = [...historicalData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyList.innerHTML = sortedData.map((day, index) => {
        const isMostRecent = index === 0;
        const totalSymbols = day.symbols.filter(s => !s.is_removed).length;
        const newCount = day.symbols.filter(s => s.is_new).length;
        const removedCount = day.symbols.filter(s => s.is_removed).length;
        
        return `
            <div class="history-item ${isMostRecent ? 'most-recent' : ''}">
                <div>
                    <div class="history-date">
                        📅 ${formatDate(day.date)} 
                        ${isMostRecent ? '<span style="color: #4caf50; font-weight: 600;">(Más reciente)</span>' : ''}
                    </div>
                    <div class="history-info">
                        Total: ${totalSymbols} | Nuevos: ${newCount} | Eliminados: ${removedCount}
                    </div>
                </div>
                <div class="history-actions">
                    ${isMostRecent ? `
                        <button class="btn-delete-day" onclick="deleteMostRecentDay()">
                            🗑️ Borrar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function deleteMostRecentDay() {
    if (historicalData.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres borrar el día más reciente? Esta acción no se puede deshacer.')) {
        // Remove most recent day
        historicalData.pop();
        
        // Save to localStorage
        saveHistoricalData();
        
        // Update UI
        renderHistorySection();
        updateStats();
        renderCurrentTab();
        
        // Show success message
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.textContent = '✅ Día más reciente borrado exitosamente';
        statusDiv.className = 'status-message success';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// ============================================================================
// FILE UPLOAD AND PROCESSING
// ============================================================================

async function handleUpload(e) {
    e.preventDefault();
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = '⏳ Procesando archivos CSV...';
    statusDiv.className = 'status-message info';
    
    try {
        const date = document.getElementById('uploadDate').value;
        
        // Check if date already exists
        if (historicalData.some(day => day.date === date)) {
            if (!confirm(`Ya existe data para ${date}. ¿Deseas sobreescribirla?`)) {
                statusDiv.style.display = 'none';
                return;
            }
            // Remove existing data for this date
            historicalData = historicalData.filter(day => day.date !== date);
        }
        
        statusDiv.textContent = '📖 Leyendo archivos Trendspider...';
        
        // Read Trendspider files
        const trendspiderFiles = [];
        for (let i = 1; i <= 6; i++) {
            const file = document.getElementById(`trendspider_${i}`).files[0];
            if (!file) throw new Error(`Falta archivo Trendspider ${i}`);
            trendspiderFiles.push(file);
        }
        
        const optionsFile = document.getElementById('options').files[0];
        const darkpoolFile = document.getElementById('darkpool').files[0];
        
        if (!optionsFile) throw new Error('Falta archivo de opciones');
        if (!darkpoolFile) throw new Error('Falta archivo de dark pool');
        
        // Process Trendspider files - extract symbols and prices
        const symbolsData = new Map();
        for (const file of trendspiderFiles) {
            const data = await processTrendspiderFile(file);
            data.forEach((value, key) => {
                if (!symbolsData.has(key)) {
                    symbolsData.set(key, value);
                }
            });
        }
        
        statusDiv.textContent = '📊 Procesando opciones y dark pool...';
        
        // Process options and darkpool - PDF Part 3 Fix: Better data processing
        const optionsData = await processOptionsFile(optionsFile);
        const darkpoolData = await processDarkpoolFile(darkpoolFile);
        
        console.log(`📊 Processed Options: ${Object.keys(optionsData).length} symbols`);
        console.log(`🌑 Processed Dark Pool: ${Object.keys(darkpoolData).length} symbols`);
        
        statusDiv.textContent = '🔍 Comparando con días anteriores...';
        
        // Get previous day symbols
        const previousSymbols = historicalData.length > 0 
            ? new Set(historicalData[historicalData.length - 1].symbols.map(s => s.symbol))
            : new Set();
        
        // Identify new and removed symbols
        const currentSymbolsSet = new Set(symbolsData.keys());
        const newSymbols = [...currentSymbolsSet].filter(s => !previousSymbols.has(s));
        const removedSymbols = [...previousSymbols].filter(s => !currentSymbolsSet.has(s));
        
        // Create day data
        const dayData = {
            date: date,
            symbols: []
        };
        
        // Add current symbols with aggregated data
        for (const [symbol, symbolInfo] of symbolsData) {
            const symbolData = {
                symbol: symbol,
                price: symbolInfo.price || '-',
                industry: symbolInfo.industry || '',
                sector: symbolInfo.sector || '',
                is_new: newSymbols.includes(symbol),
                is_removed: false,
                is_etf: isETF(symbol),
                options_prints: optionsData[symbol] || [],
                darkpool_prints: darkpoolData[symbol] || []
            };
            
            // Calculate aggregated metrics
            symbolData.metrics = calculateSymbolMetrics(symbolData);
            
            dayData.symbols.push(symbolData);
        }
        
        // Add removed symbols
        for (const symbol of removedSymbols) {
            dayData.symbols.push({
                symbol: symbol,
                price: '-',
                industry: '',
                sector: '',
                is_new: false,
                is_removed: true,
                is_etf: isETF(symbol),
                options_prints: [],
                darkpool_prints: [],
                metrics: getEmptyMetrics()
            });
        }
        
        // Add to historical data
        historicalData.push(dayData);
        
        // Keep only last 5 days
        if (historicalData.length > 5) {
            historicalData = historicalData.slice(-5);
        }
        
        // Save to localStorage
        saveHistoricalData();
        
        statusDiv.textContent = `✅ ¡Éxito! Fecha: ${date} | Total: ${currentSymbolsSet.size} | Nuevos: ${newSymbols.length} | Eliminados: ${removedSymbols.length}`;
        statusDiv.className = 'status-message success';
        
        // Update views
        renderCurrentTab();
        renderHistorySection();
        
        // Reset form
        e.target.reset();
        document.getElementById('uploadDate').valueAsDate = new Date();
        document.querySelectorAll('.file-status').forEach(div => {
            div.textContent = '';
            div.classList.remove('loaded');
        });
        
        // Collapse upload section after successful upload
        if (!uploadSectionCollapsed) {
            toggleUploadSection();
        }
        
    } catch (error) {
        console.error('Error processing files:', error);
        statusDiv.textContent = `❌ Error: ${error.message}`;
        statusDiv.className = 'status-message error';
    }
}

// ============================================================================
// ETF DETECTION (PDF Part 2 - Requirement 4.1)
// ============================================================================

function isETF(symbol) {
    // Check if symbol is in common ETFs list
    if (COMMON_ETFS.has(symbol.toUpperCase())) {
        return true;
    }
    
    return false; // Default to not ETF unless in list
}

// ============================================================================
// CSV PARSING AND PROCESSING
// ============================================================================

async function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = parseCSV(text);
                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsText(file);
    });
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            rows.push(row);
        }
    }
    
    return rows;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
}

async function processTrendspiderFile(file) {
    const rows = await readCSVFile(file);
    const symbolsData = new Map();
    
    for (const row of rows) {
        let symbol = null;
        let price = null;
        let industry = '';
        let sector = '';
        
        for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase();
            
            if (lowerKey === 'symbol' || lowerKey === 'ticker' || lowerKey === 'stock') {
                symbol = row[key].trim().toUpperCase();
            } else if (lowerKey === 'price' || lowerKey === 'close' || lowerKey === 'last') {
                price = row[key];
            } else if (lowerKey === 'industry') {
                industry = row[key];
            } else if (lowerKey === 'sector') {
                sector = row[key];
            }
        }
        
        if (symbol) {
            symbolsData.set(symbol, { price, industry, sector });
        }
    }
    
    return symbolsData;
}

// PDF Part 3 Fix: Improved options processing to not lose data
async function processOptionsFile(file) {
    const rows = await readCSVFile(file);
    const optionsData = {};
    
    console.log(`📊 Processing ${rows.length} rows from options file...`);
    
    // Debug: Log available columns from first row
    if (rows.length > 0) {
        console.log('📋 Options CSV columns:', Object.keys(rows[0]));
    }
    
    for (const row of rows) {
        let symbol = findSymbolInRow(row);
        
        if (symbol) {
            if (!optionsData[symbol]) {
                optionsData[symbol] = [];
            }
            
            // PDF Part 3 Fix: Extract time with flexible column name search
            const time = findTimeInRow(row);
            
            const optionPrint = {
                time: formatTime(time), // Format time for display
                strike: row['STRIKE'] || row['Strike'] || row['strike'] || '-',
                exp: row['EXP'] || row['Exp'] || row['Expiration'] || row['expiration'] || '-',
                dte: row['DTE'] || row['Dte'] || row['dte'] || '-',
                vol: parseNumber(row['VOL'] || row['Vol'] || row['Volume'] || row['volume'] || '0'),
                premium: parseNumber(row['PREMIUM'] || row['Premium'] || row['premium'] || '0'),
                type: row['TYPE'] || row['Type'] || row['type'] || row['Call/Put'] || row['CALL/PUT'] || '-'
            };
            
            // PDF Part 3 Fix 2.1: Only add if has meaningful volume (avoid 0 prints)
            // More strict filter: must have both volume AND premium
            if (optionPrint.vol > 0 && optionPrint.premium > 0) {
                optionsData[symbol].push(optionPrint);
            }
        }
    }
    
    // Log statistics
    let totalPrints = 0;
    for (const symbol in optionsData) {
        totalPrints += optionsData[symbol].length;
    }
    console.log(`✓ Options data: ${Object.keys(optionsData).length} symbols, ${totalPrints} prints`);
    
    return optionsData;
}

// PDF Part 3 Fix: Improved darkpool processing to not lose data
async function processDarkpoolFile(file) {
    const rows = await readCSVFile(file);
    const darkpoolData = {};
    
    console.log(`🌑 Processing ${rows.length} rows from darkpool file...`);
    
    // Debug: Log available columns from first row
    if (rows.length > 0) {
        console.log('📋 Dark Pool CSV columns:', Object.keys(rows[0]));
    }
    
    for (const row of rows) {
        let symbol = findSymbolInRow(row);
        
        if (symbol) {
            if (!darkpoolData[symbol]) {
                darkpoolData[symbol] = [];
            }
            
            // PDF Part 3 Fix: Extract time with flexible column name search
            const time = findTimeInRow(row);
            
            const dpPrint = {
                time: formatTime(time), // Format time for display
                vol: parseNumber(row['VOL'] || row['Vol'] || row['Volume'] || row['volume'] || '0'),
                price: parseNumber(row['PRICE'] || row['Price'] || row['price'] || '0'),
                notional: parseNumber(row['NOTIONAL'] || row['Notional'] || row['notional'] || '0'),
                pct_avg: row['% AVG'] || row['%AVG'] || row['PctAvg'] || row['pct_avg'] || '-'
            };
            
            // PDF Part 3 Fix 2.1: Only add if has meaningful data (avoid 0 prints)
            // More strict filter: must have volume OR notional > 0
            if (dpPrint.vol > 0 || dpPrint.notional > 0) {
                darkpoolData[symbol].push(dpPrint);
            }
        }
    }
    
    // Log statistics
    let totalPrints = 0;
    for (const symbol in darkpoolData) {
        totalPrints += darkpoolData[symbol].length;
    }
    console.log(`✓ Dark Pool data: ${Object.keys(darkpoolData).length} symbols, ${totalPrints} prints`);
    
    return darkpoolData;
}

// PDF Part 3 Fix: Format time for display - Enhanced version
function formatTime(timeStr) {
    if (!timeStr || timeStr === '-' || timeStr === '' || timeStr === 'undefined' || timeStr === 'null') {
        return '-';
    }
    
    // If already formatted as HH:MM or HH:MM:SS, return as is
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        return timeStr;
    }
    
    // Try to parse as date/timestamp
    try {
        // Handle various date formats
        let date;
        
        // Check if it's a Unix timestamp (number)
        if (!isNaN(timeStr) && timeStr.length >= 10) {
            date = new Date(parseInt(timeStr) * (timeStr.length === 10 ? 1000 : 1));
        } else {
            // Try parsing as date string
            date = new Date(timeStr);
        }
        
        // Validate the date
        if (!isNaN(date.getTime())) {
            // Format as HH:MM
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    } catch (e) {
        console.warn('⚠️ Could not parse time:', timeStr, e);
    }
    
    // If all parsing fails, return the original value
    // This might be a formatted time we don't recognize
    return timeStr;
}

function findSymbolInRow(row) {
    for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'symbol' || lowerKey === 'ticker' || lowerKey === 'stock' || lowerKey === 'underlying') {
            return row[key].trim().toUpperCase();
        }
    }
    return null;
}

// PDF Part 3 Fix: Flexible time column search
function findTimeInRow(row) {
    // Try exact matches first (most common)
    const timeValue = row['TIME'] || row['Time'] || row['time'] || 
                     row['TIMESTAMP'] || row['Timestamp'] || row['timestamp'] ||
                     row['DATE'] || row['Date'] || row['date'] ||
                     row['DATETIME'] || row['DateTime'] || row['datetime'] ||
                     row['TRADE TIME'] || row['Trade Time'] || row['trade time'] ||
                     row['EXECUTION TIME'] || row['Execution Time'] || row['execution time'];
    
    if (timeValue && timeValue !== '' && timeValue !== '-') {
        return timeValue;
    }
    
    // If no exact match, search for any column containing 'time', 'date', or 'stamp'
    for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if ((lowerKey.includes('time') || lowerKey.includes('date') || lowerKey.includes('stamp')) &&
            row[key] && row[key] !== '' && row[key] !== '-') {
            console.log(`⏰ Found time in column: "${key}" = "${row[key]}"`);
            return row[key];
        }
    }
    
    return '-';
}

function parseNumber(value) {
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

function calculateSymbolMetrics(symbolData) {
    const metrics = {
        dp_vol: 0,
        dp_value_millions: 0,
        dp_prints: symbolData.darkpool_prints.length,
        opt_prints: symbolData.options_prints.length,
        call_vol: 0,
        put_vol: 0,
        call_value_millions: 0,
        put_value_millions: 0,
        avg_call_strike: 0,
        avg_put_strike: 0,
        cp_ratio: 0,
        bias: 'neutral'
    };
    
    // Calculate Dark Pool metrics
    symbolData.darkpool_prints.forEach(print => {
        metrics.dp_vol += print.vol;
        metrics.dp_value_millions += (print.vol * print.price) / 1000000;
    });
    
    // Calculate Options metrics
    let callCount = 0;
    let putCount = 0;
    let callStrikeSum = 0;
    let putStrikeSum = 0;
    
    symbolData.options_prints.forEach(print => {
        const type = (print.type || '').toUpperCase();
        
        if (type.includes('CALL') || type === 'C') {
            metrics.call_vol += print.vol;
            metrics.call_value_millions += (print.vol * print.premium) / 1000000;
            callStrikeSum += parseNumber(print.strike);
            callCount++;
        } else if (type.includes('PUT') || type === 'P') {
            metrics.put_vol += print.vol;
            metrics.put_value_millions += (print.vol * print.premium) / 1000000;
            putStrikeSum += parseNumber(print.strike);
            putCount++;
        }
    });
    
    // Calculate averages and ratio
    metrics.avg_call_strike = callCount > 0 ? callStrikeSum / callCount : 0;
    metrics.avg_put_strike = putCount > 0 ? putStrikeSum / putCount : 0;
    metrics.cp_ratio = metrics.put_vol > 0 ? metrics.call_vol / metrics.put_vol : 0;
    
    // Determine bias
    if (metrics.cp_ratio > 1.5) {
        metrics.bias = 'bullish';
    } else if (metrics.cp_ratio < 0.67) {
        metrics.bias = 'bearish';
    } else {
        metrics.bias = 'neutral';
    }
    
    return metrics;
}

function getEmptyMetrics() {
    return {
        dp_vol: 0,
        dp_value_millions: 0,
        dp_prints: 0,
        opt_prints: 0,
        call_vol: 0,
        put_vol: 0,
        call_value_millions: 0,
        put_value_millions: 0,
        avg_call_strike: 0,
        avg_put_strike: 0,
        cp_ratio: 0,
        bias: 'neutral'
    };
}

// ============================================================================
// RENDERING AND UI
// ============================================================================

function switchTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.main-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    renderCurrentTab();
}

function renderCurrentTab() {
    updateStats();
    
    switch (currentTab) {
        case 'masterFlow':
            renderMasterFlow();
            syncSortIcons('flowTable', 'masterFlow');
            break;
        case 'darkPool':
            renderDarkPoolTab();
            syncSortIcons('darkPoolTable', 'darkPool');
            break;
        case 'unusualOptions':
            renderUnusualOptionsTab();
            syncSortIcons('optionsTable', 'unusualOptions');
            break;
    }
}

// Sync sort icons with current sort state
function syncSortIcons(tableId, tabName) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const currentSort = sortOptions[tabName];
    if (!currentSort) return;
    
    // Extract sort key and direction from current sort (e.g., "symbol_asc" -> "symbol", "asc")
    const parts = currentSort.split('_');
    const direction = parts.pop(); // Get last part (asc or desc)
    const sortKey = parts.join('_'); // Rejoin remaining parts
    
    updateSortIcons(table, sortKey, currentSort);
}

function updateStats() {
    if (historicalData.length === 0) {
        document.getElementById('totalSymbols').textContent = '0';
        document.getElementById('newSymbols').textContent = '0';
        document.getElementById('removedSymbols').textContent = '0';
        return;
    }
    
    const latestDay = historicalData[historicalData.length - 1];
    const total = latestDay.symbols.filter(s => !s.is_removed).length;
    const newCount = latestDay.symbols.filter(s => s.is_new).length;
    const removedCount = latestDay.symbols.filter(s => s.is_removed).length;
    
    document.getElementById('totalSymbols').textContent = total;
    document.getElementById('newSymbols').textContent = newCount;
    document.getElementById('removedSymbols').textContent = removedCount;
}

function getCurrentDaySymbols() {
    if (historicalData.length === 0) return [];
    
    const latestDay = historicalData[historicalData.length - 1];
    return latestDay.symbols.map(s => ({...s}));
}

// PDF Part 3 Fix 1.2: Improved sorting with all ascendente/descendente options
function filterAndSortSymbols(symbols, tabName, excludeETFs = false) {
    const searchTerm = searchTerms[tabName] || '';
    const sortOption = sortOptions[tabName] || 'symbol_asc';
    
    // Filter
    let filtered = symbols.filter(symbol => {
        // ETF filter (PDF Part 2 - Requirement 4.1)
        if (excludeETFs && symbol.is_etf) {
            return false;
        }
        
        // Search filter
        if (searchTerm && !symbol.symbol.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Type filter (only for master flow)
        if (tabName === 'masterFlow') {
            switch (currentFilter) {
                case 'new':
                    return symbol.is_new;
                case 'removed':
                    return symbol.is_removed;
                case 'with_options':
                    return symbol.metrics && symbol.metrics.opt_prints > 0;
                case 'with_darkpool':
                    return symbol.metrics && symbol.metrics.dp_prints > 0;
                default:
                    return true;
            }
        }
        
        return true;
    });
    
    // Remove duplicates by symbol
    const uniqueMap = new Map();
    filtered.forEach(symbol => {
        if (!uniqueMap.has(symbol.symbol)) {
            uniqueMap.set(symbol.symbol, symbol);
        }
    });
    filtered = Array.from(uniqueMap.values());
    
    // PDF Part 3 Fix 1.2: Enhanced sorting with asc/desc for all columns
    filtered.sort((a, b) => {
        const aMetrics = a.metrics || getEmptyMetrics();
        const bMetrics = b.metrics || getEmptyMetrics();
        
        switch (sortOption) {
            case 'symbol_asc':
                return a.symbol.localeCompare(b.symbol);
            case 'symbol_desc':
                return b.symbol.localeCompare(a.symbol);
            
            // Dark Pool sorting
            case 'dp_vol_asc':
                return aMetrics.dp_vol - bMetrics.dp_vol;
            case 'dp_vol_desc':
                return bMetrics.dp_vol - aMetrics.dp_vol;
            case 'dp_value_asc':
                return aMetrics.dp_value_millions - bMetrics.dp_value_millions;
            case 'dp_value_desc':
                return bMetrics.dp_value_millions - aMetrics.dp_value_millions;
            case 'dp_prints_asc':
                return aMetrics.dp_prints - bMetrics.dp_prints;
            case 'dp_prints_desc':
                return bMetrics.dp_prints - aMetrics.dp_prints;
            
            // Options sorting
            case 'opt_prints_asc':
                return aMetrics.opt_prints - bMetrics.opt_prints;
            case 'opt_prints_desc':
                return bMetrics.opt_prints - aMetrics.opt_prints;
            case 'opt_vol_asc':
                return (aMetrics.call_vol + aMetrics.put_vol) - (bMetrics.call_vol + bMetrics.put_vol);
            case 'opt_vol_desc':
                return (bMetrics.call_vol + bMetrics.put_vol) - (aMetrics.call_vol + aMetrics.put_vol);
            case 'call_vol_asc':
                return aMetrics.call_vol - bMetrics.call_vol;
            case 'call_vol_desc':
                return bMetrics.call_vol - aMetrics.call_vol;
            case 'put_vol_asc':
                return aMetrics.put_vol - bMetrics.put_vol;
            case 'put_vol_desc':
                return bMetrics.put_vol - aMetrics.put_vol;
            case 'call_value_asc':
                return aMetrics.call_value_millions - bMetrics.call_value_millions;
            case 'call_value_desc':
                return bMetrics.call_value_millions - aMetrics.call_value_millions;
            case 'put_value_asc':
                return aMetrics.put_value_millions - bMetrics.put_value_millions;
            case 'put_value_desc':
                return bMetrics.put_value_millions - aMetrics.put_value_millions;
            case 'cp_ratio_asc':
                return aMetrics.cp_ratio - bMetrics.cp_ratio;
            case 'cp_ratio_desc':
                return bMetrics.cp_ratio - aMetrics.cp_ratio;
            
            default:
                return 0;
        }
    });
    
    return filtered;
}

// ============================================================================
// MASTER FLOW RENDERING
// ============================================================================

function renderMasterFlow() {
    const symbols = getCurrentDaySymbols();
    const filtered = filterAndSortSymbols(symbols, 'masterFlow', false);
    
    const tbody = document.getElementById('flowTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" class="no-data">No hay datos disponibles. Carga archivos CSV para comenzar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((symbol) => {
        const m = symbol.metrics || getEmptyMetrics();
        
        // Determine if + button should show (PDF Part 2 - Requirement 3.1)
        const hasData = (m.opt_prints > 0) || (m.dp_prints > 0);
        
        return `
            <tr id="row-${symbol.symbol}" data-symbol="${symbol.symbol}">
                <td colspan="2">
                    <div class="symbol-cell">
                        <div class="symbol-name">${symbol.symbol}${symbol.is_etf ? ' 📊' : ''}</div>
                        <div class="symbol-price">$${formatNumber(symbol.price)}</div>
                        <div class="symbol-actions">
                            <button class="icon-btn copy-btn" onclick="copySymbol('${symbol.symbol}')" title="Copiar símbolo">
                                📋
                            </button>
                            <button class="icon-btn expand-btn ${hasData ? '' : 'no-data'}" onclick="toggleMatrix('${symbol.symbol}')" title="Ver prints matriz">
                                ➕
                            </button>
                        </div>
                    </div>
                </td>
                <td class="num-value">${formatNumber(m.dp_vol)}</td>
                <td class="num-value">$${formatNumber(m.dp_value_millions, 2)}M</td>
                <td class="num-value">${m.dp_prints}</td>
                <td>${symbol.industry || '-'}</td>
                <td>${symbol.sector || '-'}</td>
                <td class="num-value">${m.opt_prints}</td>
                <td class="num-value">${formatNumber(m.call_vol)}</td>
                <td class="num-value">${formatNumber(m.put_vol)}</td>
                <td class="num-value">$${formatNumber(m.call_value_millions, 2)}M</td>
                <td class="num-value">$${formatNumber(m.put_value_millions, 2)}M</td>
                <td class="num-value">${formatNumber(m.avg_call_strike, 2)}</td>
                <td class="num-value">${formatNumber(m.avg_put_strike, 2)}</td>
                <td class="num-value">${formatNumber(m.cp_ratio, 2)}</td>
                <td><span class="bias-indicator bias-${m.bias}">${m.bias.toUpperCase()}</span></td>
            </tr>
            ${hasData ? renderMatrixRow(symbol) : ''}
        `;
    }).join('');
}

// ============================================================================
// DARK POOL TAB RENDERING (PDF Part 2 - Requirement 4.1)
// ============================================================================

function renderDarkPoolTab() {
    const symbols = getCurrentDaySymbols();
    const withDarkPool = symbols.filter(s => s.metrics && s.metrics.dp_prints > 0);
    const filtered = filterAndSortSymbols(withDarkPool, 'darkPool', true); // Exclude ETFs
    
    const tbody = document.getElementById('darkPoolTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay actividad de Dark Pool para mostrar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((symbol) => {
        const m = symbol.metrics;
        
        return `
            <tr id="row-dp-${symbol.symbol}" data-symbol="${symbol.symbol}">
                <td colspan="2">
                    <div class="symbol-cell">
                        <div class="symbol-name">${symbol.symbol}</div>
                        <div class="symbol-price">$${formatNumber(symbol.price)}</div>
                        <div class="symbol-actions">
                            <button class="icon-btn copy-btn" onclick="copySymbol('${symbol.symbol}')" title="Copiar símbolo">
                                📋
                            </button>
                            <button class="icon-btn expand-btn" onclick="toggleMatrixDP('${symbol.symbol}')" title="Ver prints matriz">
                                ➕
                            </button>
                        </div>
                    </div>
                </td>
                <td class="num-value">${formatNumber(m.dp_vol)}</td>
                <td class="num-value">$${formatNumber(m.dp_value_millions, 2)}M</td>
                <td class="num-value">${m.dp_prints}</td>
                <td>${symbol.industry || '-'}</td>
                <td>${symbol.sector || '-'}</td>
            </tr>
            ${renderMatrixRowDP(symbol)}
        `;
    }).join('');
}

// ============================================================================
// OPTIONS TAB RENDERING (PDF Part 2 - Requirement 4.1)
// ============================================================================

function renderUnusualOptionsTab() {
    const symbols = getCurrentDaySymbols();
    const withOptions = symbols.filter(s => s.metrics && s.metrics.opt_prints > 0);
    const filtered = filterAndSortSymbols(withOptions, 'unusualOptions', true); // Exclude ETFs
    
    const tbody = document.getElementById('optionsTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No hay opciones inusuales para mostrar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((symbol) => {
        const m = symbol.metrics;
        
        return `
            <tr id="row-opt-${symbol.symbol}" data-symbol="${symbol.symbol}">
                <td colspan="2">
                    <div class="symbol-cell">
                        <div class="symbol-name">${symbol.symbol}</div>
                        <div class="symbol-price">$${formatNumber(symbol.price)}</div>
                        <div class="symbol-actions">
                            <button class="icon-btn copy-btn" onclick="copySymbol('${symbol.symbol}')" title="Copiar símbolo">
                                📋
                            </button>
                            <button class="icon-btn expand-btn" onclick="toggleMatrixOpt('${symbol.symbol}')" title="Ver prints matriz">
                                ➕
                            </button>
                        </div>
                    </div>
                </td>
                <td class="num-value">${m.opt_prints}</td>
                <td class="num-value">${formatNumber(m.call_vol)}</td>
                <td class="num-value">${formatNumber(m.put_vol)}</td>
                <td class="num-value">$${formatNumber(m.call_value_millions, 2)}M</td>
                <td class="num-value">$${formatNumber(m.put_value_millions, 2)}M</td>
                <td class="num-value">${formatNumber(m.avg_call_strike, 2)}</td>
                <td class="num-value">${formatNumber(m.avg_put_strike, 2)}</td>
                <td class="num-value">${formatNumber(m.cp_ratio, 2)}</td>
                <td><span class="bias-indicator bias-${m.bias}">${m.bias.toUpperCase()}</span></td>
            </tr>
            ${renderMatrixRowOpt(symbol)}
        `;
    }).join('');
}

// ============================================================================
// MATRIX VIEW RENDERING (PDF Part 2 - Requirements 2, 3.2, 3.3)
// ============================================================================

function renderMatrixRow(symbol) {
    return `
        <tr class="matrix-view" id="matrix-${symbol.symbol}">
            <td colspan="16">
                <div class="matrix-header">
                    <h4>📊 ${symbol.symbol} - Prints de los últimos 5 días</h4>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${symbol.is_new ? '<span class="status-badge new">NUEVO</span>' : ''}
                        ${symbol.is_removed ? '<span class="status-badge removed">ELIMINADO</span>' : ''}
                        <div class="matrix-close-buttons">
                            <button class="matrix-minus-btn" onclick="closeMatrix('${symbol.symbol}')" title="Cerrar (menos)">−</button>
                            <button class="matrix-close-btn" onclick="closeMatrix('${symbol.symbol}')" title="Cerrar (X)">✕</button>
                        </div>
                    </div>
                </div>
                
                ${renderOptionsMatrix(symbol)}
                ${renderDarkPoolMatrix(symbol)}
            </td>
        </tr>
    `;
}

function renderMatrixRowDP(symbol) {
    return `
        <tr class="matrix-view" id="matrix-dp-${symbol.symbol}">
            <td colspan="7">
                <div class="matrix-header">
                    <h4>🌑 ${symbol.symbol} - Dark Pool Prints (5 días)</h4>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${symbol.is_new ? '<span class="status-badge new">NUEVO</span>' : ''}
                        <div class="matrix-close-buttons">
                            <button class="matrix-minus-btn" onclick="closeMatrixDP('${symbol.symbol}')" title="Cerrar (menos)">−</button>
                            <button class="matrix-close-btn" onclick="closeMatrixDP('${symbol.symbol}')" title="Cerrar (X)">✕</button>
                        </div>
                    </div>
                </div>
                
                ${renderDarkPoolMatrix(symbol)}
            </td>
        </tr>
    `;
}

function renderMatrixRowOpt(symbol) {
    return `
        <tr class="matrix-view" id="matrix-opt-${symbol.symbol}">
            <td colspan="11">
                <div class="matrix-header">
                    <h4>📈 ${symbol.symbol} - Options Prints (5 días)</h4>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${symbol.is_new ? '<span class="status-badge new">NUEVO</span>' : ''}
                        <div class="matrix-close-buttons">
                            <button class="matrix-minus-btn" onclick="closeMatrixOpt('${symbol.symbol}')" title="Cerrar (menos)">−</button>
                            <button class="matrix-close-btn" onclick="closeMatrixOpt('${symbol.symbol}')" title="Cerrar (X)">✕</button>
                        </div>
                    </div>
                </div>
                
                ${renderOptionsMatrix(symbol)}
            </td>
        </tr>
    `;
}

// PDF Part 2 - Requirement 2: Always 50/50 split for calls/puts
function renderOptionsMatrix(symbol) {
    if (!symbol.options_prints || symbol.options_prints.length === 0) {
        return `
            <div class="options-matrix-container">
                <div class="matrix-section calls">
                    <h5>📞 CALL OPTIONS (0)</h5>
                    <p class="no-data">No hay calls</p>
                </div>
                
                <div class="matrix-section puts">
                    <h5>📉 PUT OPTIONS (0)</h5>
                    <p class="no-data">No hay puts</p>
                </div>
            </div>
        `;
    }
    
    const calls = symbol.options_prints.filter(p => {
        const type = (p.type || '').toUpperCase();
        return type.includes('CALL') || type === 'C';
    });
    
    const puts = symbol.options_prints.filter(p => {
        const type = (p.type || '').toUpperCase();
        return type.includes('PUT') || type === 'P';
    });
    
    return `
        <div class="options-matrix-container">
            <div class="matrix-section calls">
                <h5>📞 CALL OPTIONS (${calls.length})</h5>
                ${calls.length > 0 ? renderOptionsTable(calls) : '<p class="no-data">No hay calls</p>'}
            </div>
            
            <div class="matrix-section puts">
                <h5>📉 PUT OPTIONS (${puts.length})</h5>
                ${puts.length > 0 ? renderOptionsTable(puts) : '<p class="no-data">No hay puts</p>'}
            </div>
        </div>
    `;
}

function renderOptionsTable(prints) {
    return `
        <table class="matrix-table">
            <thead>
                <tr>
                    <th>TIME</th>
                    <th>STRIKE</th>
                    <th>EXP</th>
                    <th>DTE</th>
                    <th>VOL</th>
                    <th>PREMIUM</th>
                </tr>
            </thead>
            <tbody>
                ${prints.map(p => `
                    <tr>
                        <td>${p.time}</td>
                        <td>${p.strike}</td>
                        <td>${p.exp}</td>
                        <td>${p.dte}</td>
                        <td>${formatNumber(p.vol)}</td>
                        <td>$${formatNumber(p.premium, 2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// PDF Part 2 - Requirement 2: Dark pool same width as calls
// PDF Part 3 Fix 2: Include TIME column
function renderDarkPoolMatrix(symbol) {
    if (!symbol.darkpool_prints || symbol.darkpool_prints.length === 0) {
        return `
            <div class="darkpool-matrix-container">
                <div class="matrix-section">
                    <h5>🌑 DARK POOL PRINTS (0)</h5>
                    <p class="no-data">No hay prints de dark pool para este símbolo.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="darkpool-matrix-container">
            <div class="matrix-section">
                <h5>🌑 DARK POOL PRINTS (${symbol.darkpool_prints.length})</h5>
                <table class="matrix-table">
                    <thead>
                        <tr>
                            <th>TIME</th>
                            <th>VOL</th>
                            <th>PRICE</th>
                            <th>NOTIONAL</th>
                            <th>% AVG</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${symbol.darkpool_prints.map(p => `
                            <tr>
                                <td>${p.time}</td>
                                <td>${formatNumber(p.vol)}</td>
                                <td>$${formatNumber(p.price, 2)}</td>
                                <td>$${formatNumber(p.notional, 0)}</td>
                                <td>${p.pct_avg}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================================================
// USER INTERACTIONS
// ============================================================================

function copySymbol(symbol) {
    navigator.clipboard.writeText(symbol).then(() => {
        resetRowColors();
        
        const rows = document.querySelectorAll(`[data-symbol="${symbol}"]`);
        rows.forEach(row => {
            row.classList.add('row-copied');
            lastCopiedRow = row;
        });
        
        setTimeout(() => {
            rows.forEach(row => {
                row.classList.remove('row-copied');
            });
        }, 2000);
    }).catch(err => {
        console.error('Error copying symbol:', err);
        alert('No se pudo copiar el símbolo');
    });
}

function toggleMatrix(symbol) {
    const matrixRow = document.getElementById(`matrix-${symbol}`);
    const symbolRow = document.querySelector(`#row-${symbol}`);
    
    // Check if this matrix is already open
    if (matrixRow && matrixRow.classList.contains('show')) {
        // If open, close it
        closeMatrix(symbol);
    } else {
        // If closed, close all others first, then open this one
        resetRowColors();
        closeAllMatrices();
        
        if (matrixRow && symbolRow) {
            matrixRow.classList.add('show');
            symbolRow.classList.add('row-expanded');
            currentExpandedRow = symbolRow;
            
            const expandBtn = symbolRow.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.classList.add('expanded');
                expandBtn.textContent = '➖';
            }
        }
    }
}

function toggleMatrixDP(symbol) {
    const matrixRow = document.getElementById(`matrix-dp-${symbol}`);
    const symbolRow = document.querySelector(`#row-dp-${symbol}`);
    
    // Check if this matrix is already open
    if (matrixRow && matrixRow.classList.contains('show')) {
        // If open, close it
        closeMatrixDP(symbol);
    } else {
        // If closed, close all others first, then open this one
        resetRowColors();
        closeAllMatrices();
        
        if (matrixRow && symbolRow) {
            matrixRow.classList.add('show');
            symbolRow.classList.add('row-expanded');
            currentExpandedRow = symbolRow;
            
            const expandBtn = symbolRow.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.classList.add('expanded');
                expandBtn.textContent = '➖';
            }
        }
    }
}

function toggleMatrixOpt(symbol) {
    const matrixRow = document.getElementById(`matrix-opt-${symbol}`);
    const symbolRow = document.querySelector(`#row-opt-${symbol}`);
    
    // Check if this matrix is already open
    if (matrixRow && matrixRow.classList.contains('show')) {
        // If open, close it
        closeMatrixOpt(symbol);
    } else {
        // If closed, close all others first, then open this one
        resetRowColors();
        closeAllMatrices();
        
        if (matrixRow && symbolRow) {
            matrixRow.classList.add('show');
            symbolRow.classList.add('row-expanded');
            currentExpandedRow = symbolRow;
            
            const expandBtn = symbolRow.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.classList.add('expanded');
                expandBtn.textContent = '➖';
            }
        }
    }
}

// PDF Part 2 - Requirement 3.2 & 3.3: Both - and X close the matrix
// PDF Part 3 Fix 1: Both icons are now functional
function closeMatrix(symbol) {
    const matrixRow = document.getElementById(`matrix-${symbol}`);
    const symbolRow = document.querySelector(`#row-${symbol}`);
    
    if (matrixRow) matrixRow.classList.remove('show');
    if (symbolRow) {
        symbolRow.classList.remove('row-expanded');
        const expandBtn = symbolRow.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.classList.remove('expanded');
            expandBtn.textContent = '➕';
        }
    }
    
    currentExpandedRow = null;
}

function closeMatrixDP(symbol) {
    const matrixRow = document.getElementById(`matrix-dp-${symbol}`);
    const symbolRow = document.querySelector(`#row-dp-${symbol}`);
    
    if (matrixRow) matrixRow.classList.remove('show');
    if (symbolRow) {
        symbolRow.classList.remove('row-expanded');
        const expandBtn = symbolRow.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.classList.remove('expanded');
            expandBtn.textContent = '➕';
        }
    }
    
    currentExpandedRow = null;
}

function closeMatrixOpt(symbol) {
    const matrixRow = document.getElementById(`matrix-opt-${symbol}`);
    const symbolRow = document.querySelector(`#row-opt-${symbol}`);
    
    if (matrixRow) matrixRow.classList.remove('show');
    if (symbolRow) {
        symbolRow.classList.remove('row-expanded');
        const expandBtn = symbolRow.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.classList.remove('expanded');
            expandBtn.textContent = '➕';
        }
    }
    
    currentExpandedRow = null;
}

function closeAllMatrices() {
    document.querySelectorAll('.matrix-view.show').forEach(matrix => {
        matrix.classList.remove('show');
    });
    
    document.querySelectorAll('.expand-btn.expanded').forEach(btn => {
        btn.classList.remove('expanded');
        btn.textContent = '➕';
    });
}

function resetRowColors() {
    document.querySelectorAll('.row-copied').forEach(row => {
        row.classList.remove('row-copied');
    });
    
    document.querySelectorAll('.row-expanded').forEach(row => {
        row.classList.remove('row-expanded');
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || value === '-') return '-';
    const num = typeof value === 'number' ? value : parseNumber(value);
    if (num === 0) return '0';
    return num.toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
}
