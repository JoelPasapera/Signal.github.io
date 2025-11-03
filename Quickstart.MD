# 🚀 Guía Rápida de Inicio

## Instalación en 3 pasos

### 1️⃣ Instalar Flask
```bash
pip install flask --break-system-packages
```

### 2️⃣ Iniciar la aplicación
```bash
cd stock_flow_tracker
python app.py
```

### 3️⃣ Abrir en el navegador
```
http://localhost:5000
```

## 📤 Cargar datos de prueba

La carpeta `sample_data/` contiene archivos CSV de ejemplo listos para usar:

1. En la interfaz web, haz clic en cada botón "Elegir archivo"
2. Selecciona los archivos correspondientes:
   - Trendspider 1-6: `trendspider_1.csv` ... `trendspider_6.csv`
   - Unusual Options: `unusual_options.csv`
   - Dark Pool: `darkpool.csv`
3. Haz clic en "🚀 Procesar Archivos"

## 🎯 Funciones principales

### Pestañas
- **Master Flow**: Vista completa de todos los símbolos
- **Dark Pool**: Solo símbolos con actividad de dark pool
- **Unusual Options**: Solo símbolos con opciones inusuales

### Controles
- **Búsqueda**: Filtra por símbolo
- **Filtros**: Nuevos, Eliminados, Con Opciones, Con Dark Pool
- **Ordenar**: Por símbolo o por cantidad de prints

### Ver detalles
- Haz clic en el botón ▶ junto a cualquier símbolo
- Se expandirá mostrando todos los prints de los últimos 5 días
- Incluye fechas y todos los detalles de cada operación

## 📊 Estadísticas en tiempo real

En la parte superior verás:
- **Total Símbolos**: Cantidad total en el sistema
- **Nuevos**: Símbolos que aparecieron hoy
- **Eliminados**: Símbolos que ya no están presentes

## 🔄 Actualización diaria

Cada día:
1. Carga los nuevos archivos CSV con la fecha actual
2. La aplicación automáticamente:
   - Identifica símbolos nuevos y eliminados
   - Mantiene el historial de 5 días
   - Elimina datos de más de 5 días

## 💡 Consejos

- Los símbolos se identifican automáticamente en las columnas: Symbol, Ticker o Stock
- Todos los símbolos se normalizan a MAYÚSCULAS
- Puedes cargar múltiples días de datos históricos
- La base de datos se limpia automáticamente

## ⚡ Atajos

```bash
# Iniciar con script automatizado
./start.sh

# Reiniciar base de datos
rm stock_flow.db
python app.py

# Ver logs en tiempo real
python app.py
```

## 🆘 Soporte

Si encuentras problemas:
1. Revisa el README.md completo
2. Verifica el formato de tus archivos CSV
3. Comprueba los logs en la terminal donde ejecutaste `python app.py`

---

**¡Listo para empezar! 🎉**
