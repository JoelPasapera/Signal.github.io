# 💡 Ejemplos de Uso y Troubleshooting

## 📖 Casos de Uso Reales

### Caso 1: Primera Carga (Día 1)

**Situación**: Primer día usando la aplicación

**Pasos**:
1. Inicia la aplicación: `python app.py`
2. Abre `http://localhost:5000`
3. Selecciona fecha: 2025-11-01
4. Carga los 8 archivos CSV
5. Click en "🚀 Procesar Archivos"

**Resultado Esperado**:
```
✅ Éxito! 
Fecha: 2025-11-01
Total: 15 símbolos
Nuevos: 15
Eliminados: 0
```

**En la interfaz verás**:
- 15 símbolos totales
- 15 marcados como "NUEVO" (badge verde)
- 0 eliminados

---

### Caso 2: Segundo Día - Símbolos Idénticos

**Situación**: Día 2, mismos símbolos que el día 1

**Pasos**:
1. Cargar archivos con fecha: 2025-11-02
2. Mismos 15 símbolos en los CSVs

**Resultado Esperado**:
```
✅ Éxito! 
Fecha: 2025-11-02
Total: 15 símbolos
Nuevos: 0
Eliminados: 0
```

**En la interfaz verás**:
- 15 símbolos totales
- Todos marcados como "ACTIVO" (badge azul)
- Historial de 2 días en vistas expandidas

---

### Caso 3: Día 3 - Nuevos Símbolos

**Situación**: Aparecen 3 símbolos nuevos

**Archivos día 3**:
- Día 2: AAPL, TSLA, NVDA (15 símbolos)
- Día 3: AAPL, TSLA, NVDA, MSFT, GOOGL, META (18 símbolos)

**Resultado Esperado**:
```
✅ Éxito! 
Fecha: 2025-11-03
Total: 18 símbolos
Nuevos: 3
Eliminados: 0
```

**En la interfaz verás**:
- 18 símbolos totales
- MSFT, GOOGL, META marcados como "NUEVO"
- Resto marcados como "ACTIVO"

**Filtrar solo nuevos**:
1. Selector de filtro → "Solo Nuevos"
2. Verás solo: MSFT, GOOGL, META

---

### Caso 4: Día 4 - Símbolos Eliminados

**Situación**: Algunos símbolos desaparecen

**Archivos día 4**:
- Día 3: 18 símbolos
- Día 4: 15 símbolos (quitamos TSLA, NVDA, AMD)

**Resultado Esperado**:
```
✅ Éxito! 
Fecha: 2025-11-04
Total: 15 símbolos
Nuevos: 0
Eliminados: 3
```

**En la interfaz verás**:
- 15 símbolos activos
- TSLA, NVDA, AMD marcados como "ELIMINADO" (badge rojo)
- Aún puedes ver su historial de prints

**Filtrar solo eliminados**:
1. Selector → "Solo Eliminados"
2. Verás: TSLA, NVDA, AMD con historial completo

---

### Caso 5: Día 6 - Limpieza Automática

**Situación**: Sexto día, datos del día 1 se eliminan

**Días en sistema**:
- Antes del día 6: Días 1, 2, 3, 4, 5
- Después del día 6: Días 2, 3, 4, 5, 6

**Lo que sucede**:
- Se elimina automáticamente toda la data del día 1
- Los prints del día 1 ya no aparecen en vistas expandidas
- Solo se mantienen los últimos 5 días

**Verificar**:
1. Expande cualquier símbolo
2. Cuenta los días en la vista expandida
3. Deberías ver máximo 5 fechas diferentes

---

### Caso 6: Buscar Símbolo Específico

**Situación**: Quieres encontrar rápidamente AAPL

**Pasos**:
1. En el campo de búsqueda escribe: `aapl`
2. La tabla se filtra instantáneamente

**También funciona**:
- Búsqueda parcial: `aa` → encuentra AAPL
- Case-insensitive: `AAPL`, `aapl`, `AaPl` → todos funcionan

---

### Caso 7: Análisis de Dark Pool

**Situación**: Quieres ver solo símbolos con actividad de dark pool

**Pasos**:
1. Ve a la pestaña "Dark Pool"
2. O en "Master Flow", filtro → "Con Dark Pool"
3. Ordena por → "Más Dark Pool"

**Resultado**:
- Solo símbolos con prints de dark pool
- Ordenados por cantidad de operaciones
- Puedes expandir para ver detalles por día

---

### Caso 8: Tracking de Opciones Inusuales

**Situación**: Identificar patrones en opciones

**Pasos**:
1. Pestaña "Unusual Options"
2. Busca símbolo específico: `nvda`
3. Expande la fila
4. Revisa prints de 5 días

**Análisis**:
```
Día 1: NVDA - CALL $550, Vol: 15000
Día 2: NVDA - CALL $550, Vol: 18000
Día 3: NVDA - CALL $555, Vol: 22000
Día 4: NVDA - PUT  $500, Vol: 9000
Día 5: NVDA - CALL $560, Vol: 25000
```

**Insight**: Tendencia alcista (más CALLs, strikes subiendo)

---

## 🔧 Troubleshooting

### Problema 1: "Missing trendspider_X"

**Error**:
```
❌ Error: Missing trendspider_3
```

**Causa**: No se cargaron los 6 archivos de Trendspider

**Solución**:
1. Verifica que hayas seleccionado exactamente 6 archivos
2. Asegúrate de que los nombres no importan, pero deben ser 6
3. Vuelve a cargar todos los archivos

---

### Problema 2: No aparecen símbolos

**Síntoma**: Carga exitosa pero tabla vacía

**Causas posibles**:

**A) Columna de símbolo no reconocida**
```csv
# ❌ Incorrecto
Ticker_Symbol,Price
AAPL,175.50

# ✅ Correcto
Symbol,Price
AAPL,175.50
```

**Solución**: Renombra la columna a uno de estos nombres:
- Symbol
- Ticker
- Stock
- Underlying

**B) CSV vacío o solo headers**
```csv
Symbol,Price
```

**Solución**: Asegúrate de que el CSV tenga al menos una fila de datos

---

### Problema 3: Símbolos duplicados

**Síntoma**: El mismo símbolo aparece múltiples veces

**Causa**: Este no debería ocurrir, pero si sucede...

**Diagnóstico**:
```bash
# Revisa la base de datos
sqlite3 stock_flow.db
SELECT symbol, COUNT(*) 
FROM symbols 
GROUP BY symbol 
HAVING COUNT(*) > 1;
```

**Solución**:
```bash
# Reinicia la base de datos
rm stock_flow.db
python app.py
# Vuelve a cargar los datos
```

---

### Problema 4: Prints no se asocian correctamente

**Síntoma**: Símbolo aparece pero sin prints de opciones/dark pool

**Causa**: Los símbolos en los archivos no coinciden exactamente

**Ejemplo del problema**:
```
Trendspider.csv: AAPL
Options.csv:     aapl  (minúscula)
```

**Solución**: La app normaliza a mayúsculas automáticamente, pero verifica:
1. No hay espacios extras
2. No hay caracteres especiales
3. Los símbolos son exactamente iguales

**Debug**:
```python
# En app.py, línea 106, agrega:
print(f"Symbol from options: '{symbol}'")
```

---

### Problema 5: Base de datos bloqueada

**Error**:
```
sqlite3.OperationalError: database is locked
```

**Causa**: Múltiples procesos accediendo a la DB

**Solución**:
```bash
# 1. Detén todas las instancias de Flask
pkill -f "python app.py"

# 2. Verifica que no haya procesos
ps aux | grep app.py

# 3. Reinicia
python app.py
```

---

### Problema 6: Puerto 5000 ocupado

**Error**:
```
Address already in use
```

**Solución**:
```bash
# Encuentra el proceso usando el puerto
lsof -i :5000

# Mata el proceso
kill -9 <PID>

# O usa otro puerto
python app.py  # Edita app.py, línea final: port=5001
```

---

### Problema 7: Fecha incorrecta

**Síntoma**: Los datos aparecen en la fecha equivocada

**Solución**:
1. Revisa el selector de fecha antes de cargar
2. El formato debe ser: YYYY-MM-DD
3. Si ya cargaste con fecha incorrecta:

```bash
# Opción A: Eliminar ese día específico
sqlite3 stock_flow.db
DELETE FROM days WHERE date = '2025-11-99';

# Opción B: Reiniciar todo
rm stock_flow.db
python app.py
```

---

### Problema 8: Datos de más de 5 días

**Síntoma**: Veo prints de hace 6+ días

**Causa**: La limpieza automática falló

**Solución manual**:
```bash
sqlite3 stock_flow.db

# Ver todas las fechas
SELECT * FROM days ORDER BY date;

# Eliminar manualmente días antiguos
DELETE FROM days WHERE date < '2025-10-28';
```

---

### Problema 9: CSS/JS no se carga

**Síntoma**: La interfaz se ve rota, sin estilos

**Solución**:
```bash
# Verifica la estructura
ls -la static/css/
ls -la static/js/

# Si faltan archivos, recopia desde el proyecto original
cp -r /ruta/original/static/* ./static/

# Limpia caché del navegador
Ctrl + Shift + R (Chrome/Firefox)
```

---

### Problema 10: Error al expandir filas

**Síntoma**: Click en ▶ no hace nada

**Causa**: Error JavaScript

**Debug**:
1. Abre Consola del Navegador (F12)
2. Busca errores en rojo
3. Si ves: `toggleExpand is not defined`

**Solución**:
```javascript
// Verifica que app.js tenga la función
function toggleExpand(index, type) {
    // ...código...
}
```

---

## 🧪 Testing Manual

### Checklist de Pruebas

#### ✅ Funcionalidad Básica
- [ ] Aplicación inicia sin errores
- [ ] Interfaz carga correctamente
- [ ] Puede cargar 8 archivos
- [ ] Procesamiento exitoso
- [ ] Estadísticas se actualizan

#### ✅ Gestión de Símbolos
- [ ] Símbolos nuevos se marcan correctamente
- [ ] Símbolos eliminados se marcan correctamente
- [ ] Símbolos activos se identifican
- [ ] No hay duplicados

#### ✅ Prints
- [ ] Options prints se asocian al símbolo correcto
- [ ] Dark pool prints se asocian al símbolo correcto
- [ ] Prints muestran todos los campos del CSV
- [ ] Fechas correctas en prints

#### ✅ Interfaz
- [ ] Las 3 pestañas funcionan
- [ ] Búsqueda filtra correctamente
- [ ] Filtros funcionan
- [ ] Ordenación funciona
- [ ] Expansión muestra datos de 5 días

#### ✅ Persistencia
- [ ] Datos persisten al reiniciar app
- [ ] Ventana de 5 días se mantiene
- [ ] Limpieza automática funciona

---

## 📊 Datos de Prueba Avanzados

### Crear Escenario de Breakout

**Objetivo**: Simular un símbolo que aparece y desaparece

```csv
# Día 1 - trendspider_1.csv
Symbol,Price
AAPL,175.50
TSLA,245.30
NVDA,520.80

# Día 2 - trendspider_1.csv
Symbol,Price
AAPL,175.50
TSLA,245.30
NVDA,520.80
MEME,50.00    # ← Nuevo breakout

# Día 3 - trendspider_1.csv
Symbol,Price
AAPL,175.50
TSLA,245.30
NVDA,520.80
MEME,75.00    # ← Continúa

# Día 4 - trendspider_1.csv
Symbol,Price
AAPL,175.50
TSLA,245.30
NVDA,520.80
            # ← MEME eliminado (breakout terminó)
```

**Análisis**:
- Día 1: MEME no existe
- Día 2: MEME marcado como "NUEVO"
- Día 3: MEME marcado como "ACTIVO"
- Día 4: MEME marcado como "ELIMINADO"
- Días 5-8: MEME aún visible en historial
- Día 9+: MEME desaparece (>5 días)

---

## 🎯 Tips Profesionales

### 1. Nomenclatura de Archivos
```
Recomendado:
trendspider_10MA_2025-11-02.csv
trendspider_20MA_2025-11-02.csv
unusual_options_2025-11-02.csv
darkpool_2025-11-02.csv

La fecha en el nombre ayuda a organizarse
```

### 2. Backup Diario
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
cp stock_flow.db backups/stock_flow_$DATE.db
```

### 3. Automatización con Cron
```bash
# Procesar archivos automáticamente cada día a las 16:30
30 16 * * * cd /ruta/app && python process_daily.py
```

### 4. Monitoreo de Símbolos
```python
# Script adicional: monitor.py
# Alerta cuando un símbolo se marca como "NUEVO"
import sqlite3

conn = sqlite3.connect('stock_flow.db')
cursor = conn.cursor()

cursor.execute('''
    SELECT s.symbol FROM symbols s
    JOIN symbol_days sd ON s.id = sd.symbol_id
    WHERE sd.is_new = 1
''')

new_symbols = [row[0] for row in cursor.fetchall()]
if new_symbols:
    print(f"🚨 ALERTAS: Nuevos símbolos: {', '.join(new_symbols)}")
```

---

**¡Listo para ser un experto en Stock Flow Tracker!** 📈✨
