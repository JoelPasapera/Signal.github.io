# 📊 Stock Flow Tracker

Aplicación web profesional para rastrear flujo de acciones mediante análisis de archivos CSV diarios de Trendspider, opciones inusuales y dark pool.


---

## 🌐 Ver Página Web

¡Bienvenido al repositorio! Si deseas ver la página web completa sobre análisis y seguimiento del mercado, haz clic en el siguiente enlace:

**[Acceder a la Web](https://joelpasapera.github.io/Signal.github.io/)**

---


## 🎯 Características

- **Procesamiento de 8 archivos CSV diarios**: 6 de Trendspider, 1 de opciones inusuales, 1 de dark pool
- **Historial de 5 días**: Mantiene automáticamente los últimos 5 días de datos
- **Seguimiento de símbolos**: Identifica símbolos nuevos y eliminados día a día
- **Tres pestañas interactivas**:
  - Master Flow: Vista general de todos los símbolos
  - Dark Pool: Actividad de dark pool filtrada
  - Unusual Options: Opciones inusuales filtradas
- **Funciones avanzadas**: Búsqueda, filtrado y ordenación
- **Interfaz expandible**: Ver prints detallados de cada símbolo de los últimos 5 días
- **Base de datos SQLite**: Persistencia de datos con limpieza automática

## 📋 Requisitos

- Python 3.7 o superior
- Flask

## 🚀 Instalación

### 1. Instalar dependencias

```bash
pip install flask --break-system-packages
```

### 2. Estructura del proyecto

```
stock_flow_tracker/
├── app.py                 # Backend Flask
├── stock_flow.db          # Base de datos (se crea automáticamente)
├── templates/
│   └── index.html         # Interfaz web
├── static/
│   ├── css/
│   │   └── styles.css     # Estilos
│   └── js/
│       └── app.js         # Lógica frontend
├── uploads/               # Carpeta para archivos temporales
└── sample_data/           # Archivos CSV de ejemplo
    ├── trendspider_1.csv
    ├── trendspider_2.csv
    ├── trendspider_3.csv
    ├── trendspider_4.csv
    ├── trendspider_5.csv
    ├── trendspider_6.csv
    ├── unusual_options.csv
    └── darkpool.csv
```

## 🎮 Uso

### 1. Iniciar la aplicación

```bash
cd stock_flow_tracker
python app.py
```

La aplicación estará disponible en: `http://localhost:5000`

### 2. Cargar archivos CSV

1. Selecciona la fecha (por defecto: hoy)
2. Carga los 6 archivos de Trendspider
3. Carga el archivo de opciones inusuales
4. Carga el archivo de dark pool
5. Haz clic en "🚀 Procesar Archivos"

### 3. Explorar los datos

- **Master Flow**: Vista completa de todos los símbolos con estadísticas
- **Dark Pool**: Filtra símbolos con actividad de dark pool
- **Unusual Options**: Filtra símbolos con opciones inusuales

### 4. Funciones disponibles

- **Búsqueda**: Buscar símbolos específicos
- **Filtros**:
  - Todos
  - Solo Nuevos
  - Solo Eliminados
  - Con Opciones
  - Con Dark Pool
- **Ordenación**:
  - Símbolo (A-Z / Z-A)
  - Más Opciones
  - Más Dark Pool
- **Expandir filas**: Click en ▶ para ver todos los prints de los últimos 5 días

## 📊 Formato de archivos CSV

### Trendspider CSVs (6 archivos)
Deben contener una columna con el nombre del símbolo. Nombres aceptados:
- `Symbol`
- `Ticker`
- `Stock`

Ejemplo:
```csv
Symbol,Price,MA_10,MA_20,MA_50,MA_200
AAPL,175.50,174.20,173.80,172.50,170.00
TSLA,245.30,243.10,241.50,238.00,235.00
```

### Unusual Options CSV
Debe contener una columna de símbolo y datos de opciones.

Ejemplo:
```csv
Symbol,Type,Strike,Expiration,Volume,Premium,Sentiment
AAPL,CALL,180.00,2025-11-15,15000,5.50,BULLISH
TSLA,PUT,240.00,2025-11-22,8000,3.20,BEARISH
```

### Dark Pool CSV
Debe contener una columna de símbolo y datos de transacciones.

Ejemplo:
```csv
Symbol,Size,Price,Time,Exchange,Sentiment
AAPL,50000,175.45,10:23:15,DARK,NEUTRAL
TSLA,100000,245.20,09:15:00,DARK,BULLISH
```

## 🔧 Funcionalidad técnica

### Base de datos
La aplicación usa SQLite con las siguientes tablas:
- `days`: Registro de fechas
- `symbols`: Símbolos únicos
- `symbol_days`: Estado de símbolos por día (nuevo/eliminado)
- `options_prints`: Operaciones de opciones
- `darkpool_prints`: Operaciones de dark pool

### Limpieza automática
- Los datos más antiguos de 5 días se eliminan automáticamente
- Solo se mantienen los últimos 5 días (día actual + 4 anteriores)

### API Endpoints

#### `GET /`
Sirve la interfaz web principal

#### `POST /upload`
Procesa archivos CSV
- **Parámetros**: 
  - `date`: Fecha de los datos
  - `trendspider_1` a `trendspider_6`: Archivos CSV
  - `options`: Archivo CSV de opciones
  - `darkpool`: Archivo CSV de dark pool
- **Respuesta**: JSON con estadísticas de procesamiento

#### `GET /data`
Devuelve datos actuales en formato JSON
- **Respuesta**: 
  - `symbols`: Array de símbolos con todos sus prints
  - `stats`: Estadísticas (total, nuevos, eliminados)
  - `days`: Fechas de los últimos 5 días

## 🎨 Personalización

### Colores
Puedes modificar los colores en `static/css/styles.css`:
- Gradiente principal: `#667eea` a `#764ba2`
- Nuevos símbolos: `#4caf50` (verde)
- Eliminados: `#f44336` (rojo)
- Activos: `#2196f3` (azul)

### Columnas de CSV
Si tus archivos CSV tienen nombres de columnas diferentes, modifica las secciones:
- `process_trendspider_files()` en `app.py` línea 88
- `process_options_file()` en `app.py` línea 106
- `process_darkpool_file()` en `app.py` línea 123

## 🐛 Solución de problemas

### Error: "Missing trendspider_X"
Asegúrate de cargar exactamente 6 archivos de Trendspider.

### No se muestran datos
1. Verifica que los archivos CSV tengan el formato correcto
2. Revisa que las columnas de símbolos tengan nombres reconocidos
3. Comprueba la consola del navegador para errores JavaScript

### Base de datos corrupta
Elimina el archivo `stock_flow.db` y reinicia la aplicación:
```bash
rm stock_flow.db
python app.py
```

## 📝 Notas

- Los archivos se procesan en memoria y no se guardan permanentemente
- La base de datos se crea automáticamente en el primer inicio
- Todos los símbolos se convierten a mayúsculas automáticamente
- Los prints se ordenan por fecha (más recientes primero)

## 🔮 Mejoras futuras

- [ ] Exportar datos a Excel
- [ ] Gráficos interactivos
- [ ] Alertas personalizadas
- [ ] Integración con APIs de mercado en tiempo real
- [ ] Sistema de usuarios y autenticación
- [ ] Análisis histórico avanzado

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Desarrollado con ❤️ para traders e inversores**
