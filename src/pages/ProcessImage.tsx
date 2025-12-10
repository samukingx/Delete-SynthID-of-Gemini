import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ImageDropZone from '@/components/ImageDropZone'
import {
  fileToImageData,
  removeAllAIWatermarks,
  restoreImageLSB,
  imageDataToBlob,
  type ProcessResult
} from '@/utils/imageProcessor'
import { 
  Download, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Save,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Info,
  FileX,
  Shield,
  Cpu,
  Lock,
  Zap,
  Settings
} from 'lucide-react'

type AggressivenessLevel = 'low' | 'medium' | 'high' | 'extreme'

export default function ProcessImage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null)
  const [seed, setSeed] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aggressiveness, setAggressiveness] = useState<AggressivenessLevel>('high')
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('jpeg')

  const handleImageDrop = async (file: File) => {
    setOriginalFile(file)
    setIsProcessing(true)
    
    try {
      const imageData = await fileToImageData(file)
      setOriginalImageData(imageData)
      
      const canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(imageData, 0, 0)
        setPreviewUrl(canvas.toDataURL())
      }
    } catch (error) {
      console.error('Error al procesar imagen:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = async () => {
    if (!originalImageData) return

    setIsProcessing(true)
    try {
      // Usar la nueva función que combina todas las técnicas
      const result: ProcessResult = removeAllAIWatermarks(
        originalImageData, 
        seed || undefined,
        aggressiveness
      )
      setProcessedImageData(result.imageData)
      setSeed(result.seed)

      const canvas = document.createElement('canvas')
      canvas.width = result.imageData.width
      canvas.height = result.imageData.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(result.imageData, 0, 0)
        setPreviewUrl(canvas.toDataURL())
      }
    } catch (error) {
      console.error('Error al procesar:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async () => {
    if (!processedImageData || !seed) return

    setIsProcessing(true)
    try {
      const restored = restoreImageLSB(processedImageData, seed)
      setProcessedImageData(null)
      setOriginalImageData(restored)

      const canvas = document.createElement('canvas')
      canvas.width = restored.width
      canvas.height = restored.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(restored, 0, 0)
        setPreviewUrl(canvas.toDataURL())
      }
    } catch (error) {
      console.error('Error al restaurar:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!processedImageData) return

    try {
      const blob = await imageDataToBlob(processedImageData, outputFormat, 0.92)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = outputFormat === 'jpeg' ? 'jpg' : 'png'
      a.download = `processed-${originalFile?.name?.replace(/\.[^.]+$/, '') || 'image'}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar:', error)
    }
  }

  const handleDownloadSeed = () => {
    if (!seed) return
    const blob = new Blob([seed], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seed.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopySeed = () => {
    if (!seed) return
    navigator.clipboard.writeText(seed)
  }

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Remove AI traces
          </h1>
          <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">
            Upload your image and remove watermarks, metadata and detection patterns
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload image
              </CardTitle>
              <CardDescription>
                Drag or select an image to process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageDropZone
                onImageDrop={handleImageDrop}
                className="min-h-[280px]"
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>
                Processing result
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[280px] rounded-lg bg-muted/50 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Image will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* Processing Options */}
            <div className="mb-6 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4" />
                <span className="font-medium text-sm">Processing options</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Aggressiveness */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Intensity level
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {(['low', 'medium', 'high', 'extreme'] as const).map((level) => (
                      <Button
                        key={level}
                        variant={aggressiveness === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAggressiveness(level)}
                        className="flex-1 min-w-[70px]"
                      >
                        {level === 'low' && '🔹 Low'}
                        {level === 'medium' && '🔸 Med'}
                        {level === 'high' && '🔴 High'}
                        {level === 'extreme' && '💀 Max'}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {aggressiveness === 'low' && 'Minimal changes, best quality'}
                    {aggressiveness === 'medium' && 'Balanced SynthID removal'}
                    {aggressiveness === 'high' && 'Strong removal, recommended'}
                    {aggressiveness === 'extreme' && 'Maximum attack, may affect quality'}
                  </p>
                </div>
                {/* Output Format */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Output format
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={outputFormat === 'png' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOutputFormat('png')}
                      className="flex-1"
                    >
                      PNG (lossless)
                    </Button>
                    <Button
                      variant={outputFormat === 'jpeg' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOutputFormat('jpeg')}
                      className="flex-1"
                    >
                      JPEG (extra clean)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {outputFormat === 'png' && 'Lossless, no metadata'}
                    {outputFormat === 'jpeg' && 'Recompression removes more patterns'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleProcess}
                disabled={!originalImageData || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove AI traces
                  </>
                )}
              </Button>

              {processedImageData && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRestore}
                    disabled={!seed || isProcessing}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
            </div>

            {/* Seed */}
            {seed && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Seed (save it to restore)
                  </label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopySeed}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadSeed}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
                  {seed}
                </div>
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-500 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Without this seed you won't be able to restore the original image.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              How does it work?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <FileX className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Metadata removal</h4>
                    <p className="text-sm text-muted-foreground">
                      EXIF, origin, software and geolocation are removed.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">LSB modification</h4>
                    <p className="text-sm text-muted-foreground">
                      We alter bits to remove invisible watermarks.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Cpu className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">AI anti-detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Alters patterns used by AI detectors.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">100% Private</h4>
                    <p className="text-sm text-muted-foreground">
                      Everything is processed in your browser, no servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
