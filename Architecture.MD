# 📐 Arquitectura y Funcionalidades - Stock Flow Tracker

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────┐
│         FRONTEND (Browser)          │
│  HTML5 + CSS3 + Vanilla JavaScript  │
└──────────────┬──────────────────────┘
               │ HTTP/JSON
┌──────────────▼──────────────────────┐
│         BACKEND (Flask)             │
│     Python 3.7+ Web Server          │
└──────────────┬──────────────────────┘
               │ SQL
┌──────────────▼──────────────────────┐
│       DATABASE (SQLite)             │
│    Almacenamiento Persistente       │
└─────────────────────────────────────┘
```

## 🗄️ Modelo de Base de Datos

### Tablas y Relaciones

```
┌─────────────┐
│    days     │
├─────────────┤
│ id (PK)     │◄───────┐
│ date        │        │
│ created_at  │        │
└─────────────┘        │
                       │
┌─────────────┐        │
│   symbols   │        │
├─────────────┤        │
│ id (PK)     │◄───┐   │
│ symbol      │    │   │
└─────────────┘    │   │
                   │   │
        ┌──────────┴───┴──────────┐
        │     symbol_days         │
        ├─────────────────────────┤
        │ id (PK)                 │
        │ symbol_id (FK)          │
        │ day_id (FK)             │
        │ is_new                  │
        │ is_removed              │
        └──────────┬──────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼─────────┐
│options_prints  │   │darkpool_prints  │
├────────────────┤   ├─────────────────┤
│ id (PK)        │   │ id (PK)         │
│ symbol_day_id  │   │ symbol_day_id   │
│ data (JSON)    │   │ data (JSON)     │
│ timestamp      │   │ timestamp       │
└────────────────┘   └─────────────────┘
```

### Estrategia de Datos

**Ventana de 5 días rodante**:
- Día 1: Datos iniciales
- Día 2-5: Acumulación de historial
- Día 6+: Eliminación automática del día más antiguo

## 📊 Flujo de Procesamiento de Datos

### 1. Carga de Archivos (Upload)

```
Usuario sube 8 archivos CSV
         │
         ▼
┌────────────────────────┐
│  Validación de        │
│  archivos requeridos  │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Procesamiento CSV    │
│  - Trendspider: 6     │
│  - Options: 1         │
│  - Dark Pool: 1       │
└────────┬───────────────┘
         │
         ▼
    Extracción
    de símbolos
```

### 2. Procesamiento de Símbolos

```
┌──────────────────┐
│ Símbolos Día N   │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ Comparar con Día N-1   │
│                        │
│ • Nuevos: N - (N-1)    │
│ • Eliminados: (N-1) - N│
│ • Continuos: N ∩ (N-1) │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Guardar en DB          │
│ - Crear día            │
│ - Registrar símbolos   │
│ - Marcar estado        │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Asociar Prints         │
│ - Options por símbolo  │
│ - Dark Pool por símbolo│
└────────────────────────┘
```

### 3. Limpieza Automática

```
Verificar fecha
      │
      ▼
┌─────────────────┐
│ Días > 5?       │
└─────┬───────────┘
      │ Sí
      ▼
┌─────────────────┐
│ Eliminar:       │
│ • Día antiguo   │
│ • Symbol_days   │
│ • Prints        │
└─────────────────┘
```

## 🎨 Interfaz de Usuario

### Componentes Principales

1. **Header con Estadísticas**
   - Total de símbolos
   - Símbolos nuevos (verde)
   - Símbolos eliminados (rojo)

2. **Sección de Carga**
   - Selector de fecha
   - 6 inputs para Trendspider
   - 1 input para Options
   - 1 input para Dark Pool
   - Botón de procesamiento

3. **Sistema de Pestañas**
   - Master Flow
   - Dark Pool
   - Unusual Options

4. **Controles de Tabla**
   - Búsqueda en tiempo real
   - Filtros: Todos, Nuevos, Eliminados, Con Opciones, Con Dark Pool
   - Ordenación: Por símbolo, por cantidad de prints

5. **Tabla Expandible**
   - Fila principal con resumen
   - Botón de expansión (▶)
   - Fila expandida con detalles completos de 5 días

## 🔄 API Endpoints

### GET `/`
**Propósito**: Servir interfaz web
**Respuesta**: HTML de la aplicación

### POST `/upload`
**Propósito**: Procesar archivos CSV diarios

**Request**:
```javascript
FormData {
  date: "2025-11-02",
  trendspider_1: File,
  trendspider_2: File,
  trendspider_3: File,
  trendspider_4: File,
  trendspider_5: File,
  trendspider_6: File,
  options: File,
  darkpool: File
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "date": "2025-11-02",
  "total_symbols": 15,
  "new_symbols": 3,
  "removed_symbols": 2
}
```

**Response Error (400/500)**:
```json
{
  "error": "Descripción del error"
}
```

### GET `/data`
**Propósito**: Obtener datos actuales

**Response**:
```json
{
  "symbols": [
    {
      "symbol": "AAPL",
      "is_new": false,
      "is_removed": false,
      "options_prints": [...],
      "darkpool_prints": [...],
      "total_options": 5,
      "total_darkpool": 3
    }
  ],
  "stats": {
    "total": 15,
    "new": 3,
    "removed": 2
  },
  "days": ["2025-11-02", "2025-11-01", ...]
}
```

## 🎯 Lógica de Negocio

### Identificación de Símbolos

```python
# Nombres de columna aceptados (case-insensitive):
VALID_SYMBOL_COLUMNS = ['symbol', 'ticker', 'stock', 'underlying']

# Normalización
symbol = symbol.strip().upper()
```

### Detección de Cambios

```python
current_symbols = set(symbols_from_trendspider)
previous_symbols = get_previous_day_symbols()

new_symbols = current_symbols - previous_symbols
removed_symbols = previous_symbols - current_symbols
continuing_symbols = current_symbols & previous_symbols
```

### Almacenamiento de Prints

Los prints (operaciones) se guardan como JSON:

```python
print_data = {
    "date": "2025-11-02",
    "Type": "CALL",
    "Strike": "180.00",
    "Volume": "15000",
    # ... resto de columnas CSV
}
```

## 🔍 Características Avanzadas

### 1. Búsqueda Inteligente
- Búsqueda en tiempo real sin recargar
- Case-insensitive
- Búsqueda parcial (ej: "AP" encuentra "AAPL")

### 2. Filtrado Multi-criterio
- Combina búsqueda con filtros
- Filtros disponibles:
  - Estado (nuevo/eliminado/activo)
  - Presencia de datos (opciones/dark pool)

### 3. Ordenación Flexible
- Por símbolo (alfabético)
- Por cantidad de actividad
- Ascendente/descendente

### 4. Vista Expandible
- Expansión suave con animación CSS
- Cierre automático de otras filas
- Muestra historial completo de 5 días
- Separación visual entre opciones y dark pool

### 5. Indicadores Visuales
- Badges de colores para estados
- Contadores de prints
- Gradientes para mejor UX

## 🔐 Seguridad y Validación

### Validación de Entrada
- Límite de tamaño de archivo: 16MB
- Validación de presencia de 8 archivos
- Validación de formato CSV

### Sanitización
- Escape de datos en HTML
- JSON encoding para prints
- Normalización de símbolos

### Manejo de Errores
- Try-catch en todas las operaciones críticas
- Mensajes de error específicos
- Logging de errores en servidor

## 🚀 Rendimiento

### Optimizaciones
- Consultas SQL indexadas
- Uso de transacciones para inserts múltiples
- Carga lazy de datos expandidos
- Renderizado eficiente con JavaScript vanilla

### Escalabilidad
- SQLite adecuado para hasta ~100,000 registros
- Limpieza automática mantiene DB ligera
- Sin dependencias pesadas

## 📱 Responsive Design

### Breakpoints
- Desktop: > 768px (vista completa)
- Mobile: ≤ 768px (columnas apiladas)

### Adaptaciones móviles
- Grilla de archivos: 2 columnas → 1 columna
- Controles: Horizontal → Vertical
- Estadísticas: Horizontal → Vertical

## 🧪 Testing Recomendado

### Casos de Prueba

1. **Carga Inicial**
   - Cargar 8 archivos
   - Verificar procesamiento exitoso
   - Comprobar estadísticas

2. **Día Subsecuente**
   - Cargar mismos símbolos → Todos "activos"
   - Agregar símbolos → Aparecen "nuevos"
   - Quitar símbolos → Aparecen "eliminados"

3. **Ventana de 5 días**
   - Cargar datos por 6 días
   - Verificar eliminación del día 1
   - Comprobar que solo hay 5 días

4. **Búsqueda y Filtros**
   - Buscar símbolo específico
   - Aplicar cada filtro
   - Combinar búsqueda + filtro

5. **Vista Expandida**
   - Expandir símbolo
   - Verificar prints de 5 días
   - Verificar separación opciones/dark pool

## 🛠️ Mantenimiento

### Respaldo de Base de Datos
```bash
cp stock_flow.db stock_flow_backup_$(date +%Y%m%d).db
```

### Limpiar y Reiniciar
```bash
rm stock_flow.db
python app.py
```

### Logs
Flask proporciona logs automáticos en consola:
- Requests HTTP
- Errores de servidor
- Warnings

## 📈 Métricas de Éxito

### KPIs
- ✅ Procesamiento exitoso de 8 archivos
- ✅ Identificación correcta de nuevos/eliminados
- ✅ Retención de 5 días exactos
- ✅ Carga < 2 segundos
- ✅ Búsqueda instantánea

---

**Arquitectura robusta, escalable y fácil de mantener** 🚀
