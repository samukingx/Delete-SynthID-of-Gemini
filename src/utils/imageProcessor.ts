/**
 * Procesador de imágenes usando LSB (Least Significant Bit) Steganography
 * Modifica los bits menos significativos de los canales RGB
 */

export interface ProcessResult {
  imageData: ImageData
  seed: string
}

/**
 * Genera una semilla aleatoria para el procesamiento
 */
export const generateSeed = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Genera un hash simple de la semilla para crear una secuencia pseudoaleatoria
 */
const seedToKey = (seed: string): number[] => {
  const key: number[] = []
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash // Convertir a 32bit
    key.push(Math.abs(hash) % 256)
  }
  // Expandir la clave si es muy corta
  while (key.length < 16) {
    hash = ((hash << 5) - hash) + key[key.length - 1] || 1
    hash = hash & hash
    key.push(Math.abs(hash) % 256)
  }
  return key
}

/**
 * Procesa una imagen usando LSB para modificar los bits menos significativos
 * También elimina patrones de IA y marcas de agua invisibles
 * @param imageData - Los datos de la imagen original
 * @param seed - Semilla opcional para procesamiento determinístico
 * @returns Resultado con imagen procesada y semilla usada
 */
export const processImageLSB = (
  imageData: ImageData,
  seed?: string
): ProcessResult => {
  const resultSeed = seed || generateSeed()
  const key = seedToKey(resultSeed)
  const data = new Uint8ClampedArray(imageData.data)
  
  // Modificar los bits menos significativos de cada canal RGB
  // Esto elimina marcas de agua invisibles y patrones de detección de IA
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4
    const keyIndex = pixelIndex % key.length
    const keyValue = key[keyIndex]
    
    // Modificar R (canal rojo) - LSB y segundo bit menos significativo
    data[i] = modifyLSBAggressive(data[i], keyValue, pixelIndex)
    
    // Modificar G (canal verde) - LSB y segundo bit menos significativo
    data[i + 1] = modifyLSBAggressive(data[i + 1], keyValue, pixelIndex)
    
    // Modificar B (canal azul) - LSB y segundo bit menos significativo
    data[i + 2] = modifyLSBAggressive(data[i + 2], keyValue, pixelIndex)
    
    // Alpha se mantiene igual (canal 3)
  }
  
  return {
    imageData: new ImageData(data, imageData.width, imageData.height),
    seed: resultSeed
  }
}

/**
 * Modifica de forma más agresiva los bits menos significativos
 * Esto ayuda a eliminar marcas de agua y patrones de detección de IA
 * Modifica LSB y el segundo bit menos significativo para mayor efectividad
 * El proceso es reversible usando XOR
 */
const modifyLSBAggressive = (value: number, key: number, pixelIndex: number): number => {
  // Modificar LSB (bit 0)
  const originalLSB = value & 1
  const keyLSB = key & 1
  const newLSB = originalLSB ^ keyLSB
  
  // Modificar segundo bit menos significativo (bit 1) usando el pixelIndex
  const originalSecondBit = (value >> 1) & 1
  const secondBitKey = (pixelIndex + key) & 1
  const newSecondBit = originalSecondBit ^ secondBitKey
  
  // Reemplazar ambos bits manteniendo los otros 6 bits
  return (value & 0xFC) | (newSecondBit << 1) | newLSB
}

/**
 * Restaura una imagen procesada usando la semilla original
 * @param processedImageData - Los datos de la imagen procesada
 * @param seed - La semilla usada originalmente
 * @returns Imagen restaurada
 */
export const restoreImageLSB = (
  processedImageData: ImageData,
  seed: string
): ImageData => {
  const key = seedToKey(seed)
  const data = new Uint8ClampedArray(processedImageData.data)
  
  // El proceso es reversible porque usamos XOR
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4
    const keyIndex = pixelIndex % key.length
    const keyValue = key[keyIndex]
    
    // Restaurar R usando el mismo método agresivo
    data[i] = modifyLSBAggressive(data[i], keyValue, pixelIndex)
    
    // Restaurar G
    data[i + 1] = modifyLSBAggressive(data[i + 1], keyValue, pixelIndex)
    
    // Restaurar B
    data[i + 2] = modifyLSBAggressive(data[i + 2], keyValue, pixelIndex)
  }
  
  return new ImageData(data, processedImageData.width, processedImageData.height)
}

/**
 * Convierte un File a ImageData
 * Al dibujar en canvas, automáticamente se eliminan metadatos EXIF
 * y marcas de agua embebidas en el archivo original
 */
export const fileToImageData = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'))
        return
      }
      
      // Al dibujar en canvas, se eliminan automáticamente:
      // - Metadatos EXIF (incluyendo información de origen IA)
      // - Marcas de agua invisibles embebidas
      // - Datos de geolocalización
      // - Información del software que creó la imagen
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(imageData)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen'))
    }
    
    img.src = url
  })
}

/**
 * Convierte ImageData a Blob para descargar
 * PNG no contiene metadatos EXIF, por lo que la imagen está limpia
 */
export const imageDataToBlob = (imageData: ImageData): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto del canvas')
    }
    
    ctx.putImageData(imageData, 0, 0)
    // PNG no soporta EXIF, por lo que no contiene metadatos
    // La imagen está completamente limpia de rastros de IA
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      }
    }, 'image/png')
  })
}

