/**
 * Procesador de imágenes ULTRA-AGRESIVO para eliminar SynthID de Google
 * 
 * SynthID embebe marcas de agua en:
 * 1. Dominio espacial (píxeles) - bits menos significativos
 * 2. Dominio de frecuencias (DCT/DFT) - coeficientes de frecuencia
 * 3. Patrones estadísticos - distribución de valores
 * 4. Correlaciones entre canales RGB
 * 5. Bloques 8x8 (similar a JPEG)
 * 6. Información de textura y bordes
 * 
 * Este procesador ataca TODOS estos vectores simultáneamente
 */

export interface ProcessResult {
  imageData: ImageData
  seed: string
}

export interface ProcessingOptions {
  noiseIntensity: number  // 1-10
}

/**
 * Genera una semilla aleatoria
 */
export const generateSeed = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36)
}

/**
 * Generador de números pseudoaleatorios con semilla
 */
class SeededRandom {
  private seed: number

  constructor(seed: string) {
    this.seed = this.hashString(seed)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash) || 1
  }

  next(): number {
    let t = this.seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  nextSigned(): number {
    return this.next() * 2 - 1
  }

  nextGaussian(): number {
    const u1 = this.next() || 0.0001
    const u2 = this.next()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * TÉCNICA 1: Modificación de 4 bits menos significativos
 * SynthID usa LSB, atacamos más bits para asegurar
 */
const destroyLSB = (value: number, rng: SeededRandom, intensity: number): number => {
  // Modificar los 4 bits menos significativos con ruido aleatorio
  const mask = 0xF0 // Mantener los 4 bits más significativos
  const highBits = value & mask
  const newLowBits = Math.floor(rng.next() * 16) // Nuevos 4 bits aleatorios
  
  // Mezclar con intensidad
  const randomized = highBits | newLowBits
  return Math.round(value * (1 - intensity * 0.3) + randomized * intensity * 0.3)
}

/**
 * TÉCNICA 2: Ruido gaussiano fuerte
 */
const addGaussianNoise = (value: number, rng: SeededRandom, intensity: number): number => {
  const noise = rng.nextGaussian() * intensity * 8
  return clamp(value + noise, 0, 255)
}

/**
 * TÉCNICA 3: Perturbación de correlación entre canales
 * SynthID puede usar correlaciones R-G-B, las rompemos
 */
const perturbChannelCorrelation = (
  r: number, g: number, b: number, 
  rng: SeededRandom, 
  intensity: number
): [number, number, number] => {
  // Añadir ruido independiente a cada canal para romper correlaciones
  const noiseR = rng.nextGaussian() * intensity * 5
  const noiseG = rng.nextGaussian() * intensity * 5
  const noiseB = rng.nextGaussian() * intensity * 5
  
  // También intercambiar pequeñas cantidades entre canales
  const swap = intensity * 3
  const swapRG = rng.nextSigned() * swap
  const swapGB = rng.nextSigned() * swap
  const swapBR = rng.nextSigned() * swap
  
  return [
    clamp(r + noiseR + swapBR - swapRG, 0, 255),
    clamp(g + noiseG + swapRG - swapGB, 0, 255),
    clamp(b + noiseB + swapGB - swapBR, 0, 255)
  ]
}

/**
 * TÉCNICA 4: Disrupción de bloques 8x8 (anti-DCT)
 * SynthID probablemente usa DCT como JPEG
 */
const disruptBlock = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  blockX: number,
  blockY: number,
  rng: SeededRandom,
  intensity: number
): void => {
  const blockSize = 8
  
  // Añadir patrón de ruido específico para cada bloque
  const blockNoise = rng.nextGaussian() * intensity * 4
  
  // Crear patrón de interferencia DCT (frecuencias específicas)
  for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
    for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
      const x = blockX + dx
      const y = blockY + dy
      const idx = (y * width + x) * 4
      
      // Patrón que interfiere con coeficientes DCT
      // Usamos múltiples frecuencias para atacar diferentes coeficientes
      let dctNoise = 0
      for (let freq = 1; freq <= 4; freq++) {
        dctNoise += Math.cos(dx * freq * Math.PI / blockSize) * 
                   Math.cos(dy * freq * Math.PI / blockSize) * 
                   rng.nextSigned() * intensity * 2
      }
      
      const totalNoise = blockNoise + dctNoise
      
      data[idx] = clamp(data[idx] + totalNoise + rng.nextSigned() * intensity * 3, 0, 255)
      data[idx + 1] = clamp(data[idx + 1] + totalNoise + rng.nextSigned() * intensity * 3, 0, 255)
      data[idx + 2] = clamp(data[idx + 2] + totalNoise + rng.nextSigned() * intensity * 3, 0, 255)
    }
  }
}

/**
 * TÉCNICA 5: Blur + Sharpen selectivo (ataca frecuencias medias)
 */
const applySelectiveFilter = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  rng: SeededRandom,
  intensity: number
): void => {
  const original = new Uint8ClampedArray(data)
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      // Aplicar solo al 30% de píxeles aleatoriamente
      if (rng.next() > 0.3 * intensity) continue
      
      const idx = (y * width + x) * 4
      
      for (let c = 0; c < 3; c++) {
        // Calcular blur 5x5
        let sum = 0
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            sum += original[((y + dy) * width + (x + dx)) * 4 + c]
          }
        }
        const blurred = sum / 25
        
        // Mezclar blur con sharpen y original
        const current = original[idx + c]
        const sharpened = current * 2 - blurred
        
        // Elegir aleatoriamente entre blur, sharpen, o mezcla
        const choice = rng.next()
        let newValue: number
        if (choice < 0.33) {
          newValue = blurred + rng.nextSigned() * intensity * 2
        } else if (choice < 0.66) {
          newValue = sharpened + rng.nextSigned() * intensity * 2
        } else {
          newValue = current + rng.nextGaussian() * intensity * 4
        }
        
        data[idx + c] = clamp(newValue, 0, 255)
      }
    }
  }
}

/**
 * TÉCNICA 6: Perturbación de patrones de frecuencia específicos
 */
const perturbFrequencies = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  rng: SeededRandom,
  intensity: number
): void => {
  // SynthID puede embeber en frecuencias específicas
  // Añadimos ruido en múltiples frecuencias para interferir
  const frequencies = [2, 3, 4, 5, 7, 8, 11, 13, 16]
  
  for (const freq of frequencies) {
    const amplitude = rng.next() * intensity * 3
    const phaseX = rng.next() * Math.PI * 2
    const phaseY = rng.next() * Math.PI * 2
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        
        // Patrón de onda 2D
        const wave = Math.sin(x * 2 * Math.PI / freq + phaseX) *
                    Math.sin(y * 2 * Math.PI / freq + phaseY) *
                    amplitude
        
        if (Math.abs(wave) > 0.5) {
          const noise = wave * rng.nextSigned()
          data[idx] = clamp(data[idx] + noise, 0, 255)
          data[idx + 1] = clamp(data[idx + 1] + noise * rng.next(), 0, 255)
          data[idx + 2] = clamp(data[idx + 2] + noise * rng.next(), 0, 255)
        }
      }
    }
  }
}

/**
 * TÉCNICA 7: Dithering Floyd-Steinberg modificado
 */
const applyRandomDithering = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  rng: SeededRandom,
  intensity: number
): void => {
  for (let y = 0; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (rng.next() > intensity * 0.5) continue
      
      const idx = (y * width + x) * 4
      
      for (let c = 0; c < 3; c++) {
        const oldVal = data[idx + c]
        const noise = rng.nextSigned() * intensity * 6
        const newVal = clamp(oldVal + noise, 0, 255)
        const error = (oldVal - newVal) * 0.2
        
        data[idx + c] = newVal
        
        // Difundir error a vecinos (versión modificada)
        if (x + 1 < width) {
          data[idx + 4 + c] = clamp(data[idx + 4 + c] + error * rng.next(), 0, 255)
        }
        if (y + 1 < height) {
          const below = ((y + 1) * width + x) * 4 + c
          data[below] = clamp(data[below] + error * rng.next(), 0, 255)
        }
      }
    }
  }
}

/**
 * TÉCNICA 8: Rotación de bits aleatoria
 */
const rotateBits = (value: number, rng: SeededRandom, intensity: number): number => {
  if (rng.next() > intensity * 0.4) return value
  
  // Rotar algunos bits
  const bit0 = value & 1
  const bit1 = (value >> 1) & 1
  const bit2 = (value >> 2) & 1
  const bit3 = (value >> 3) & 1
  
  // XOR con patrón aleatorio
  const xorPattern = Math.floor(rng.next() * 16)
  const lowBits = ((bit0 | (bit1 << 1) | (bit2 << 2) | (bit3 << 3)) ^ xorPattern) & 0x0F
  
  return (value & 0xF0) | lowBits
}

/**
 * TÉCNICA 9: Scramble de valores en ventanas
 */
const scrambleWindows = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  rng: SeededRandom,
  intensity: number
): void => {
  const windowSize = 4
  
  for (let wy = 0; wy < height; wy += windowSize) {
    for (let wx = 0; wx < width; wx += windowSize) {
      if (rng.next() > intensity * 0.4) continue
      
      // Recolectar valores de la ventana
      const values: number[][] = [[], [], []]
      
      for (let dy = 0; dy < windowSize && wy + dy < height; dy++) {
        for (let dx = 0; dx < windowSize && wx + dx < width; dx++) {
          const idx = ((wy + dy) * width + (wx + dx)) * 4
          values[0].push(data[idx])
          values[1].push(data[idx + 1])
          values[2].push(data[idx + 2])
        }
      }
      
      // Mezclar ligeramente los valores dentro de la ventana
      for (let c = 0; c < 3; c++) {
        for (let i = values[c].length - 1; i > 0; i--) {
          if (rng.next() < intensity * 0.3) {
            const j = rng.nextInt(0, i)
            // Intercambiar parcialmente
            const temp = values[c][i]
            values[c][i] = Math.round(values[c][i] * 0.7 + values[c][j] * 0.3)
            values[c][j] = Math.round(values[c][j] * 0.7 + temp * 0.3)
          }
        }
      }
      
      // Escribir valores mezclados
      let idx2 = 0
      for (let dy = 0; dy < windowSize && wy + dy < height; dy++) {
        for (let dx = 0; dx < windowSize && wx + dx < width; dx++) {
          const idx = ((wy + dy) * width + (wx + dx)) * 4
          data[idx] = values[0][idx2]
          data[idx + 1] = values[1][idx2]
          data[idx + 2] = values[2][idx2]
          idx2++
        }
      }
    }
  }
}

/**
 * FUNCIÓN PRINCIPAL: Elimina SynthID con todas las técnicas
 */
export const removeAllAIWatermarks = (
  imageData: ImageData,
  seed?: string,
  aggressiveness: 'low' | 'medium' | 'high' | 'extreme' = 'high'
): ProcessResult => {
  const resultSeed = seed || generateSeed()
  const rng = new SeededRandom(resultSeed)
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height
  
  // Intensidad basada en agresividad
  const intensity = {
    'low': 0.3,
    'medium': 0.5,
    'high': 0.7,
    'extreme': 1.0
  }[aggressiveness]
  
  console.log(`Procesando imagen ${width}x${height} con intensidad ${intensity}`)
  
  // PASO 1: Procesar cada píxel individualmente
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    
    // Destruir LSB
    r = destroyLSB(r, rng, intensity)
    g = destroyLSB(g, rng, intensity)
    b = destroyLSB(b, rng, intensity)
    
    // Ruido gaussiano
    r = addGaussianNoise(r, rng, intensity)
    g = addGaussianNoise(g, rng, intensity)
    b = addGaussianNoise(b, rng, intensity)
    
    // Rotación de bits
    r = rotateBits(r, rng, intensity)
    g = rotateBits(g, rng, intensity)
    b = rotateBits(b, rng, intensity)
    
    // Perturbación de correlación entre canales
    ;[r, g, b] = perturbChannelCorrelation(r, g, b, rng, intensity)
    
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
  
  // PASO 2: Disrupción de bloques 8x8 (anti-DCT)
  for (let blockY = 0; blockY < height; blockY += 8) {
    for (let blockX = 0; blockX < width; blockX += 8) {
      disruptBlock(data, width, height, blockX, blockY, rng, intensity)
    }
  }
  
  // PASO 3: Perturbación de frecuencias
  perturbFrequencies(data, width, height, rng, intensity)
  
  // PASO 4: Filtro selectivo blur/sharpen
  applySelectiveFilter(data, width, height, rng, intensity)
  
  // PASO 5: Dithering aleatorio
  applyRandomDithering(data, width, height, rng, intensity)
  
  // PASO 6: Scramble de ventanas
  scrambleWindows(data, width, height, rng, intensity)
  
  // PASO 7: Segunda pasada de ruido para mayor seguridad
  const rng2 = new SeededRandom(resultSeed + '_pass2')
  for (let i = 0; i < data.length; i += 4) {
    if (rng2.next() < intensity * 0.4) {
      data[i] = clamp(data[i] + rng2.nextGaussian() * intensity * 5, 0, 255)
      data[i + 1] = clamp(data[i + 1] + rng2.nextGaussian() * intensity * 5, 0, 255)
      data[i + 2] = clamp(data[i + 2] + rng2.nextGaussian() * intensity * 5, 0, 255)
    }
  }
  
  // PASO 8: Tercera pasada con diferentes bloques (16x16)
  const rng3 = new SeededRandom(resultSeed + '_pass3')
  for (let blockY = 0; blockY < height; blockY += 16) {
    for (let blockX = 0; blockX < width; blockX += 16) {
      if (rng3.next() < intensity * 0.5) {
        const blockNoise = rng3.nextGaussian() * intensity * 3
        for (let dy = 0; dy < 16 && blockY + dy < height; dy++) {
          for (let dx = 0; dx < 16 && blockX + dx < width; dx++) {
            const idx = ((blockY + dy) * width + (blockX + dx)) * 4
            data[idx] = clamp(data[idx] + blockNoise + rng3.nextSigned() * intensity * 2, 0, 255)
            data[idx + 1] = clamp(data[idx + 1] + blockNoise + rng3.nextSigned() * intensity * 2, 0, 255)
            data[idx + 2] = clamp(data[idx + 2] + blockNoise + rng3.nextSigned() * intensity * 2, 0, 255)
          }
        }
      }
    }
  }
  
  console.log('Procesamiento completado')
  
  return {
    imageData: new ImageData(data, width, height),
    seed: resultSeed
  }
}

/**
 * Versión simplificada para compatibilidad
 */
export const processImageLSB = removeAllAIWatermarks

/**
 * Restauración (limitada - muchas técnicas no son reversibles)
 */
export const restoreImageLSB = (
  processedImageData: ImageData,
  _seed: string
): ImageData => {
  // La restauración completa no es posible con las nuevas técnicas
  console.warn('Restauración no disponible con el nuevo procesador')
  return new ImageData(
    new Uint8ClampedArray(processedImageData.data),
    processedImageData.width,
    processedImageData.height
  )
}

/**
 * Convierte un File a ImageData
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
      
      // Dibujar elimina metadatos EXIF automáticamente
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
 * Convierte ImageData a Blob
 * IMPORTANTE: JPEG con recompresión ayuda a eliminar más patrones
 */
export const imageDataToBlob = (
  imageData: ImageData,
  format: 'png' | 'jpeg' = 'jpeg',
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto del canvas'))
      return
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    
    canvas.toBlob((blob) => {
      if (blob) {
        // Para JPEG, hacer doble recompresión para eliminar más patrones
        if (format === 'jpeg') {
          recompressJPEG(blob, quality * 0.95).then(resolve).catch(() => resolve(blob))
        } else {
          resolve(blob)
        }
      } else {
        reject(new Error('Error al crear blob'))
      }
    }, mimeType, quality)
  })
}

/**
 * Doble recompresión JPEG para eliminar más patrones
 */
const recompressJPEG = (blob: Blob, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Error'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      
      canvas.toBlob((newBlob) => {
        if (newBlob) {
          resolve(newBlob)
        } else {
          reject(new Error('Error en recompresión'))
        }
      }, 'image/jpeg', quality)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error cargando imagen'))
    }
    
    img.src = url
  })
}

