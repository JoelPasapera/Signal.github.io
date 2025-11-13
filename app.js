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
// PROCESADOR DE CSV INTELIGENTE - NUEVA FUNCIONALIDAD
// ============================================================================

/**
 * Extrae información del campo MESSAGE cuando las columnas principales están vacías
 * Busca patrones como "DARK BLOCK $85.0M" o volumen/precio en el mensaje
 */
function extractFromMessage(message) {
    const extracted = {
        volume: null,
        price: null,
        notional: null
    };

    if (!message) return extracted;

    // Extraer valor en millones: $85.0M, $283M, etc.
    const notionalMatch = message.match(/\$(\d+(?:\.\d+)?)\s*M/i);
    if (notionalMatch) {
        extracted.notional = parseFloat(notionalMatch[1]) * 1000000;
    }

    // Extraer valores en formato $4,999,977
    const dollarMatch = message.match(/\$([0-9,]+)/);
    if (dollarMatch && !notionalMatch) {
        extracted.notional = parseFloat(dollarMatch[1].replace(/,/g, ''));
    }

    // Extraer volumen si está en el mensaje
    const volumeMatch = message.match(/Volume[:\s]+([0-9,]+)/i);
    if (volumeMatch) {
        extracted.volume = parseFloat(volumeMatch[1].replace(/,/g, ''));
    }

    // Extraer precio si está en el mensaje
    const priceMatch = message.match(/Price[:\s]+\$?([0-9.]+)/i);
    if (priceMatch) {
        extracted.price = parseFloat(priceMatch[1]);
    }

    return extracted;
}

/**
 * Detecta si un símbolo es ETF/FUND basado en la columna SecurityType
 */
function isETFFromType(securityType) {
    if (!securityType) return false;
    const type = securityType.toUpperCase();
    return type.includes('ETF') || type.includes('FUND');
}

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
    
    // Initialize sortable headers
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
    const masterFlowSort = document.getElementById('sortSelect');
    if (masterFlowSort) {
        masterFlowSort.addEventListener('change', function() {
            sortOptions.masterFlow = this.value;
            renderCurrentTab();
        });
    }
    
    const darkPoolSort = document.getElementById('sortSelectDP');
    if (darkPoolSort) {
        darkPoolSort.addEventListener('change', function() {
            sortOptions.darkPool = this.value;
            renderCurrentTab();
        });
    }
    
    const optionsSort = document.getElementById('sortSelectOpt');
    if (optionsSort) {
        optionsSort.addEventListener('change', function() {
            sortOptions.unusualOptions = this.value;
            renderCurrentTab();
        });
    }
}

// ============================================================================
// SORTABLE HEADERS
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
    if (!table) {
        console.warn(`⚠️ Table ${tableId} not found`);
        return;
    }
    
    const sortableHeaders = table.querySelectorAll('th.sortable');
    console.log(`🔧 Setting up ${sortableHeaders.length} sortable headers for ${tableId}`);
    
    sortableHeaders.forEach(header => {
        // Remove old event listeners by cloning the element
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        // Add new event listener
        newHeader.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`👆 Clicked on: ${this.dataset.sort}`);
            handleHeaderClick(this, tabName);
        });
    });
}

function handleHeaderClick(header, tabName) {
    const sortKey = header.dataset.sort;
    if (!sortKey) return;
    
    const currentSort = sortOptions[tabName];
    let newSort;
    
    console.log(`🔄 Header clicked: ${sortKey}, Current sort: ${currentSort}`);
    
    if (currentSort === `${sortKey}_asc`) {
        newSort = `${sortKey}_desc`;
    } else if (currentSort === `${sortKey}_desc`) {
        newSort = `${sortKey}_asc`;
    } else {
        newSort = `${sortKey}_desc`;
    }
    
    console.log(`✅ New sort: ${newSort}`);
    
    sortOptions[tabName] = newSort;
    updateSortIcons(header.closest('table'), sortKey, newSort);
    renderCurrentTab();
}

function updateSortIcons(table, activeSortKey, sortDirection) {
    const allHeaders = table.querySelectorAll('th.sortable');
    
    allHeaders.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        if (!icon) return;
        
        const headerSortKey = header.dataset.sort;
        
        if (headerSortKey === activeSortKey) {
            if (sortDirection.endsWith('_asc')) {
                icon.textContent = '↑';
                icon.className = 'sort-icon asc';
            } else {
                icon.textContent = '↓';
                icon.className = 'sort-icon desc';
            }
        } else {
            icon.textContent = '⇅';
            icon.className = 'sort-icon neutral';
        }
    });
}

// ============================================================================
// UPLOAD SECTION COLLAPSE/EXPAND
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
    if (historicalData.length > 5) {
        historicalData = historicalData.slice(-5);
    }
    localStorage.setItem('stockFlowHistoricalData', JSON.stringify(historicalData));
    console.log('✓ Saved historical data:', historicalData.length, 'days');
}

// ============================================================================
// HISTORY SECTION
// ============================================================================

function renderHistorySection() {
    const historyList = document.getElementById('historyList');
    
    if (historicalData.length === 0) {
        historyList.innerHTML = '<p class="no-data">No hay días cargados todavía</p>';
        return;
    }
    
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
        historicalData.pop();
        saveHistoricalData();
        renderHistorySection();
        updateStats();
        renderCurrentTab();
        
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
        
        if (historicalData.some(day => day.date === date)) {
            if (!confirm(`Ya existe data para ${date}. ¿Deseas sobreescribirla?`)) {
                statusDiv.style.display = 'none';
                return;
            }
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
        
        // Process Trendspider files
        const symbolsData = new Map();
        for (const file of trendspiderFiles) {
            const data = await processTrendspiderFile(file);
            data.forEach((value, key) => {
                if (!symbolsData.has(key)) {
                    symbolsData.set(key, value);
                }
            });
        }
        
        statusDiv.textContent = '📊 Procesando opciones y dark pool con EXTRACCIÓN INTELIGENTE...';
        
        // NUEVA FUNCIONALIDAD: Usar procesador inteligente
        const optionsData = await processOptionsFileIntelligent(optionsFile);
        const darkpoolData = await processDarkpoolFileIntelligent(darkpoolFile);
        
        console.log(`📊 Processed Options: ${Object.keys(optionsData).length} symbols`);
        console.log(`🌑 Processed Dark Pool: ${Object.keys(darkpoolData).length} symbols`);
        
        statusDiv.textContent = '🔍 Comparando con días anteriores...';
        
        const previousSymbols = historicalData.length > 0 
            ? new Set(historicalData[historicalData.length - 1].symbols.map(s => s.symbol))
            : new Set();
        
        const currentSymbolsSet = new Set(symbolsData.keys());
        const newSymbols = [...currentSymbolsSet].filter(s => !previousSymbols.has(s));
        const removedSymbols = [...previousSymbols].filter(s => !currentSymbolsSet.has(s));
        
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
        
        historicalData.push(dayData);
        
        if (historicalData.length > 5) {
            historicalData = historicalData.slice(-5);
        }
        
        saveHistoricalData();
        
        statusDiv.textContent = `✅ ¡Éxito! Fecha: ${date} | Total: ${currentSymbolsSet.size} | Nuevos: ${newSymbols.length} | Eliminados: ${removedSymbols.length}`;
        statusDiv.className = 'status-message success';
        
        renderCurrentTab();
        renderHistorySection();
        
        e.target.reset();
        document.getElementById('uploadDate').valueAsDate = new Date();
        document.querySelectorAll('.file-status').forEach(div => {
            div.textContent = '';
            div.classList.remove('loaded');
        });
        
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
// ETF DETECTION
// ============================================================================

function isETF(symbol) {
    if (COMMON_ETFS.has(symbol.toUpperCase())) {
        return true;
    }
    return false;
}

// ============================================================================
// CSV PARSING AND PROCESSING - VERSIONES MEJORADAS
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
        if (values.length === headers.length || values.length === headers.length - 1) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
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

/**
 * NUEVA FUNCIÓN: Procesamiento inteligente de opciones
 */
async function processOptionsFileIntelligent(file) {
    const rows = await readCSVFile(file);
    const optionsData = {};
    
    console.log(`📊 Processing ${rows.length} rows from options file with INTELLIGENT EXTRACTION...`);
    
    if (rows.length > 0) {
        console.log('📋 Options CSV columns:', Object.keys(rows[0]));
    }
    
    for (const row of rows) {
        let symbol = findSymbolInRow(row);
        
        if (symbol) {
            if (!optionsData[symbol]) {
                optionsData[symbol] = [];
            }
            
            const time = findTimeInRow(row);
            
            const optionPrint = {
                time: formatTime(time),
                strike: row['STRIKE'] || row['Strike'] || row['strike'] || '-',
                exp: row['EXP'] || row['Exp'] || row['Expiration'] || row['expiration'] || '-',
                dte: row['DTE'] || row['Dte'] || row['dte'] || '-',
                vol: parseNumber(row['VOL'] || row['Vol'] || row['Volume'] || row['volume'] || '0'),
                premium: parseNumber(row['PREMIUM'] || row['Premium'] || row['premium'] || '0'),
                type: row['TYPE'] || row['Type'] || row['type'] || row['Call/Put'] || row['CALL/PUT'] || '-'
            };
            
            if (optionPrint.vol > 0 && optionPrint.premium > 0) {
                optionsData[symbol].push(optionPrint);
            }
        }
    }
    
    let totalPrints = 0;
    for (const symbol in optionsData) {
        totalPrints += optionsData[symbol].length;
    }
    console.log(`✓ Options data: ${Object.keys(optionsData).length} symbols, ${totalPrints} prints`);
    
    return optionsData;
}

/**
 * NUEVA FUNCIÓN: Procesamiento inteligente de Dark Pool con extracción del MESSAGE
 */
async function processDarkpoolFileIntelligent(file) {
    const rows = await readCSVFile(file);
    const darkpoolData = {};
    let etfFilteredCount = 0;
    let extractedFromMessage = 0;
    
    console.log(`🌑 Processing ${rows.length} rows from darkpool file with INTELLIGENT EXTRACTION...`);
    
    if (rows.length > 0) {
        console.log('📋 Dark Pool CSV columns:', Object.keys(rows[0]));
    }
    
    for (const row of rows) {
        // NUEVA FUNCIONALIDAD: Filtrar ETF/FUND por SecurityType
        const securityType = row['SecurityType'] || row['Security Type'] || row['TYPE'] || '';
        if (isETFFromType(securityType)) {
            etfFilteredCount++;
            continue; // Saltar este registro
        }
        
        let symbol = findSymbolInRow(row);
        
        if (symbol) {
            if (!darkpoolData[symbol]) {
                darkpoolData[symbol] = [];
            }
            
            const time = findTimeInRow(row);
            
            // Obtener valores de las columnas principales
            let vol = parseNumber(row['Volume'] || row['VOL'] || row['Vol'] || row['volume'] || '0');
            let price = parseNumber(row['Price'] || row['PRICE'] || row['price'] || '0');
            let notional = parseNumber(row['Notional'] || row['NOTIONAL'] || row['notional'] || '0');
            
            // NUEVA FUNCIONALIDAD: Si faltan datos, extraer del MESSAGE
            const message = row['Message'] || row['MESSAGE'] || row['message'] || '';
            if ((!vol || !price || !notional) && message) {
                const extracted = extractFromMessage(message);
                
                if (extracted.volume || extracted.price || extracted.notional) {
                    extractedFromMessage++;
                    console.log(`🔍 Extracted from MESSAGE for ${symbol}:`, extracted);
                }
                
                vol = vol || extracted.volume || 0;
                price = price || extracted.price || 0;
                notional = notional || extracted.notional || 0;
            }
            
            const dpPrint = {
                time: formatTime(time),
                vol: vol,
                price: price,
                notional: notional,
                pct_avg: row['% AVG'] || row['%AVG'] || row['PctAvg'] || row['pct_avg'] || row['Pct_of_Avg30Day'] || '-'
            };
            
            if (dpPrint.vol > 0 || dpPrint.notional > 0) {
                darkpoolData[symbol].push(dpPrint);
            }
        }
    }
    
    let totalPrints = 0;
    for (const symbol in darkpoolData) {
        totalPrints += darkpoolData[symbol].length;
    }
    
    console.log(`✓ Dark Pool data: ${Object.keys(darkpoolData).length} symbols, ${totalPrints} prints`);
    console.log(`🗑️ ETF/FUND filtered: ${etfFilteredCount} records`);
    console.log(`🔍 Extracted from MESSAGE: ${extractedFromMessage} records`);
    
    return darkpoolData;
}

function formatTime(timeStr) {
    if (!timeStr || timeStr === '-' || timeStr === '' || timeStr === 'undefined' || timeStr === 'null') {
        return '-';
    }
    
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        return timeStr;
    }
    
    try {
        let date;
        
        if (!isNaN(timeStr) && timeStr.length >= 10) {
            date = new Date(parseInt(timeStr) * (timeStr.length === 10 ? 1000 : 1));
        } else {
            date = new Date(timeStr);
        }
        
        if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    } catch (e) {
        console.warn('⚠️ Could not parse time:', timeStr, e);
    }
    
    return timeStr;
}

function findSymbolInRow(row) {
    for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'symbol' || lowerKey === 'ticker' || lowerKey === 'stock' || lowerKey === 'underlying') {
            const symbol = row[key].trim().toUpperCase();
            return symbol;
        }
    }
    return null;
}

function findTimeInRow(row) {
    const timeValue = row['TIME'] || row['Time'] || row['time'] || 
                     row['TIMESTAMP'] || row['Timestamp'] || row['timestamp'] ||
                     row['DATE'] || row['Date'] || row['date'] ||
                     row['DATETIME'] || row['DateTime'] || row['datetime'] ||
                     row['TRADE TIME'] || row['Trade Time'] || row['trade time'] ||
                     row['EXECUTION TIME'] || row['Execution Time'] || row['execution time'];
    
    if (timeValue && timeValue !== '' && timeValue !== '-') {
        return timeValue;
    }
    
    for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if ((lowerKey.includes('time') || lowerKey.includes('date') || lowerKey.includes('stamp')) &&
            row[key] && row[key] !== '' && row[key] !== '-') {
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
    
    metrics.avg_call_strike = callCount > 0 ? callStrikeSum / callCount : 0;
    metrics.avg_put_strike = putCount > 0 ? putStrikeSum / putCount : 0;
    metrics.cp_ratio = metrics.put_vol > 0 ? metrics.call_vol / metrics.put_vol : 0;
    
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
// TAB SWITCHING AND RENDERING
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
    
    if (currentTab === 'masterFlow') {
        renderMasterFlow();
    } else if (currentTab === 'darkPool') {
        renderDarkPool();
    } else if (currentTab === 'unusualOptions') {
        renderUnusualOptions();
    }
}

function updateStats() {
    if (historicalData.length === 0) {
        document.getElementById('totalSymbols').textContent = '0';
        document.getElementById('newSymbols').textContent = '0';
        document.getElementById('removedSymbols').textContent = '0';
        return;
    }
    
    const mostRecentDay = historicalData[historicalData.length - 1];
    const totalSymbols = mostRecentDay.symbols.filter(s => !s.is_removed).length;
    const newSymbols = mostRecentDay.symbols.filter(s => s.is_new).length;
    const removedSymbols = mostRecentDay.symbols.filter(s => s.is_removed).length;
    
    document.getElementById('totalSymbols').textContent = totalSymbols;
    document.getElementById('newSymbols').textContent = newSymbols;
    document.getElementById('removedSymbols').textContent = removedSymbols;
}

function getFilteredSymbols() {
    if (historicalData.length === 0) return [];
    
    const mostRecentDay = historicalData[historicalData.length - 1];
    let symbols = mostRecentDay.symbols;
    
    // Apply filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'new') {
            symbols = symbols.filter(s => s.is_new && !s.is_removed);
        } else if (currentFilter === 'removed') {
            symbols = symbols.filter(s => s.is_removed);
        } else if (currentFilter === 'with_options') {
            symbols = symbols.filter(s => !s.is_removed && s.options_prints.length > 0);
        } else if (currentFilter === 'with_darkpool') {
            symbols = symbols.filter(s => !s.is_removed && s.darkpool_prints.length > 0);
        }
    }
    
    // Apply search
    const searchTerm = searchTerms[currentTab];
    if (searchTerm) {
        symbols = symbols.filter(s => 
            s.symbol.toLowerCase().includes(searchTerm) ||
            (s.industry && s.industry.toLowerCase().includes(searchTerm)) ||
            (s.sector && s.sector.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply sort
    const sortKey = sortOptions[currentTab];
    symbols = sortSymbols(symbols, sortKey);
    
    return symbols;
}

function sortSymbols(symbols, sortKey) {
    const [field, direction] = sortKey.split('_');
    
    return [...symbols].sort((a, b) => {
        let valA, valB;
        
        switch(field) {
            case 'symbol':
                valA = a.symbol;
                valB = b.symbol;
                break;
            case 'dp':
                valA = a.metrics?.dp_vol || 0;
                valB = b.metrics?.dp_vol || 0;
                break;
            case 'dpvalue':
                valA = a.metrics?.dp_value_millions || 0;
                valB = b.metrics?.dp_value_millions || 0;
                break;
            case 'dpprints':
                valA = a.metrics?.dp_prints || 0;
                valB = b.metrics?.dp_prints || 0;
                break;
            case 'optprints':
                valA = a.metrics?.opt_prints || 0;
                valB = b.metrics?.opt_prints || 0;
                break;
            case 'callvol':
                valA = a.metrics?.call_vol || 0;
                valB = b.metrics?.call_vol || 0;
                break;
            case 'putvol':
                valA = a.metrics?.put_vol || 0;
                valB = b.metrics?.put_vol || 0;
                break;
            case 'callvalue':
                valA = a.metrics?.call_value_millions || 0;
                valB = b.metrics?.call_value_millions || 0;
                break;
            case 'putvalue':
                valA = a.metrics?.put_value_millions || 0;
                valB = b.metrics?.put_value_millions || 0;
                break;
            case 'cp':
                valA = a.metrics?.cp_ratio || 0;
                valB = b.metrics?.cp_ratio || 0;
                break;
            default:
                valA = a.symbol;
                valB = b.symbol;
        }
        
        if (typeof valA === 'string') {
            return direction === 'asc' 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }
        
        return direction === 'asc' ? valA - valB : valB - valA;
    });
}

function renderMasterFlow() {
    const tbody = document.getElementById('flowTableBody');
    const symbols = getFilteredSymbols();
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" class="no-data">No hay símbolos para mostrar</td></tr>';
        return;
    }
    
    tbody.innerHTML = symbols.map(symbol => {
        const statusClass = symbol.is_new ? 'new-symbol' : symbol.is_removed ? 'removed-symbol' : '';
        
        return `
            <tr id="row-${symbol.symbol}" class="symbol-row ${statusClass}" data-symbol="${symbol.symbol}">
                <td class="col-symbol">
                    <button class="copy-btn" onclick="copySymbol('${symbol.symbol}')" title="Copiar símbolo">
                        📋
                    </button>
                </td>
                <td class="col-symbol">
                    <div class="symbol-info">
                        <span class="symbol-name">${symbol.symbol}</span>
                        ${symbol.is_new ? '<span class="badge badge-new">NUEVO</span>' : ''}
                        ${symbol.is_removed ? '<span class="badge badge-removed">ELIMINADO</span>' : ''}
                    </div>
                </td>
                <td class="col-darkpool">${formatNumber(symbol.metrics.dp_vol)}</td>
                <td class="col-darkpool">$${formatNumber(symbol.metrics.dp_value_millions, 2)}M</td>
                <td class="col-darkpool">${symbol.metrics.dp_prints || 0}</td>
                <td class="col-info">${symbol.industry || '-'}</td>
                <td class="col-info">${symbol.sector || '-'}</td>
                <td class="col-options">${symbol.metrics.opt_prints || 0}</td>
                <td class="col-options">${formatNumber(symbol.metrics.call_vol)}</td>
                <td class="col-options">${formatNumber(symbol.metrics.put_vol)}</td>
                <td class="col-options">$${formatNumber(symbol.metrics.call_value_millions, 2)}M</td>
                <td class="col-options">$${formatNumber(symbol.metrics.put_value_millions, 2)}M</td>
                <td class="col-options">$${formatNumber(symbol.metrics.avg_call_strike, 2)}</td>
                <td class="col-options">$${formatNumber(symbol.metrics.avg_put_strike, 2)}</td>
                <td class="col-options">${formatNumber(symbol.metrics.cp_ratio, 2)}</td>
                <td class="col-options">
                    <span class="bias-badge bias-${symbol.metrics.bias}">${symbol.metrics.bias.toUpperCase()}</span>
                </td>
            </tr>
            ${renderMatrixRow(symbol)}
        `;
    }).join('');
}

function renderDarkPool() {
    const tbody = document.getElementById('darkPoolTableBody');
    const symbols = getFilteredSymbols().filter(s => !s.is_removed && s.darkpool_prints.length > 0);
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay actividad de Dark Pool</td></tr>';
        return;
    }
    
    tbody.innerHTML = symbols.map(symbol => `
        <tr id="row-dp-${symbol.symbol}" class="symbol-row" data-symbol="${symbol.symbol}">
            <td>
                <button class="copy-btn" onclick="copySymbol('${symbol.symbol}')" title="Copiar símbolo">
                    📋
                </button>
            </td>
            <td>
                <div class="symbol-info">
                    <span class="symbol-name">${symbol.symbol}</span>
                </div>
            </td>
            <td>${formatNumber(symbol.metrics.dp_vol)}</td>
            <td>$${formatNumber(symbol.metrics.dp_value_millions, 2)}M</td>
            <td>${symbol.metrics.dp_prints}</td>
            <td>${symbol.industry || '-'}</td>
            <td>${symbol.sector || '-'}</td>
        </tr>
        ${renderMatrixRowDP(symbol)}
    `).join('');
}

function renderUnusualOptions() {
    const tbody = document.getElementById('optionsTableBody');
    const symbols = getFilteredSymbols().filter(s => !s.is_removed && s.options_prints.length > 0);
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No hay opciones inusuales</td></tr>';
        return;
    }
    
    tbody.innerHTML = symbols.map(symbol => `
        <tr id="row-opt-${symbol.symbol}" class="symbol-row" data-symbol="${symbol.symbol}">
            <td>
                <button class="copy-btn" onclick="copySymbol('${symbol.symbol}')" title="Copiar símbolo">
                    📋
                </button>
            </td>
            <td>
                <div class="symbol-info">
                    <span class="symbol-name">${symbol.symbol}</span>
                </div>
            </td>
            <td>${symbol.metrics.opt_prints}</td>
            <td>${formatNumber(symbol.metrics.call_vol)}</td>
            <td>${formatNumber(symbol.metrics.put_vol)}</td>
            <td>$${formatNumber(symbol.metrics.call_value_millions, 2)}M</td>
            <td>$${formatNumber(symbol.metrics.put_value_millions, 2)}M</td>
            <td>$${formatNumber(symbol.metrics.avg_call_strike, 2)}</td>
            <td>$${formatNumber(symbol.metrics.avg_put_strike, 2)}</td>
            <td>${formatNumber(symbol.metrics.cp_ratio, 2)}</td>
            <td>
                <span class="bias-badge bias-${symbol.metrics.bias}">${symbol.metrics.bias.toUpperCase()}</span>
            </td>
        </tr>
        ${renderMatrixRowOpt(symbol)}
    `).join('');
}

function renderMatrixRow(symbol) {
    return `<tr class="matrix-view" id="matrix-${symbol.symbol}"></tr>`;
}

function renderMatrixRowDP(symbol) {
    return `<tr class="matrix-view" id="matrix-dp-${symbol.symbol}"></tr>`;
}

function renderMatrixRowOpt(symbol) {
    return `<tr class="matrix-view" id="matrix-opt-${symbol.symbol}"></tr>`;
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
