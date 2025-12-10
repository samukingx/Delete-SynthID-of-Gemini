# DeletePixel - Procesador de Imágenes LSB

Plataforma web moderna para procesamiento de imágenes usando esteganografía LSB (Least Significant Bit). Modifica los bits menos significativos de tus imágenes de forma invisible, manteniendo la apariencia visual idéntica pero cambiando completamente los patrones binarios.

## 🚀 Tecnologías

- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **Tailwind CSS v4** - Framework de estilos con animaciones
- **Canvas API** - Procesamiento de imágenes en el navegador

## ✨ Características Principales

- 🎨 **Procesamiento LSB**: Modifica bits menos significativos de canales RGB
- 🔄 **Reversible**: Restaura imágenes originales usando semilla única
- 🖼️ **Drag & Drop**: Interfaz intuitiva para arrastrar y soltar imágenes
- 🔒 **Privacidad**: Todo el procesamiento se hace en tu navegador, sin servidores
- ⚡ **Rápido**: Procesamiento instantáneo de imágenes
- 🎭 **Diseño Moderno**: Animaciones y efectos visuales atractivos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Layout.tsx           # Layout principal con navegación
│   └── ImageDropZone.tsx    # Componente drag & drop
├── pages/
│   ├── Home.tsx             # Página de inicio
│   ├── ProcessImage.tsx     # Página principal de procesamiento
│   ├── Dashboard.tsx        # Panel de control
│   ├── Login.tsx            # Página de login
│   └── Signup.tsx           # Página de registro
├── utils/
│   └── imageProcessor.ts   # Lógica LSB y procesamiento
├── hooks/
│   └── useAuth.ts           # Hook para autenticación
├── services/
│   └── api.ts               # Cliente API
├── types/
│   └── index.ts             # Definiciones TypeScript
├── App.tsx                  # Componente principal
├── main.tsx                 # Punto de entrada
└── index.css                # Estilos globales con animaciones
```

## 🔬 ¿Cómo Funciona?

### Esteganografía LSB

El algoritmo LSB (Least Significant Bit) modifica los bits menos significativos de cada canal de color (RGB) de la imagen:

1. **Procesamiento**: 
   - Toma cada píxel de la imagen
   - Extrae el bit menos significativo (LSB) de cada canal R, G, B
   - Aplica XOR con bits de una clave generada desde la semilla
   - Reemplaza el LSB modificado

2. **Resultado**:
   - La imagen se ve **idéntica** al ojo humano
   - Los patrones binarios cambian completamente
   - El cambio es invisible visualmente

3. **Reversibilidad**:
   - Usando la misma semilla, el proceso es perfectamente reversible
   - Aplicar el mismo algoritmo restaura la imagen original
   - Sin la semilla, la restauración es imposible

### Uso

1. **Cargar Imagen**: Arrastra y suelta una imagen o haz clic para seleccionar
2. **Procesar**: Haz clic en "Procesar con LSB" para modificar los bits
3. **Guardar Semilla**: Copia o descarga la semilla generada (¡es esencial!)
4. **Descargar**: Descarga la imagen procesada
5. **Restaurar**: Usa la semilla para restaurar la imagen original

## 🎨 Diseño

- **Tema Oscuro**: Interfaz moderna con gradientes y efectos glass
- **Animaciones**: Transiciones suaves y efectos visuales
- **Responsive**: Diseño adaptable a todos los dispositivos
- **UX Intuitiva**: Interfaz clara y fácil de usar

## 🔧 Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

## 📝 Próximos Pasos

- [ ] Implementar autenticación completa
- [ ] Agregar más algoritmos de procesamiento
- [ ] Historial de procesamientos
- [ ] Comparación lado a lado de imágenes
- [ ] Análisis de diferencias entre original y procesada
- [ ] Tests unitarios y de integración

## 📄 Licencia

MIT
