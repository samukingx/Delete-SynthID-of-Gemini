import { useState, useRef, type DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { Upload, Image as ImageIcon } from 'lucide-react'

interface ImageDropZoneProps {
  onImageDrop: (file: File) => void
  className?: string
}

export default function ImageDropZone({ onImageDrop, className }: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        handleFile(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    onImageDrop(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {preview ? (
        <div className="space-y-4">
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 mx-auto rounded-lg"
          />
          <p className="text-sm text-muted-foreground">
            Clic o arrastra otra imagen para cambiar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto">
            {isDragging ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-medium mb-1">
              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra y suelta tu imagen'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar un archivo
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-muted">PNG</span>
              <span className="px-2 py-1 rounded bg-muted">JPG</span>
              <span className="px-2 py-1 rounded bg-muted">WEBP</span>
              <span>hasta 10MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
