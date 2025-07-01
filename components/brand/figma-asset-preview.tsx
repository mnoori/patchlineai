'use client'

import { useState } from 'react'
import { Download, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface FigmaAssetPreviewProps {
  assetId: string
  assetName: string
  fileId: string
  hasExportSettings: boolean
}

export function FigmaAssetPreview({ 
  assetId, 
  assetName, 
  fileId,
  hasExportSettings 
}: FigmaAssetPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const fetchAssetImage = async () => {
    if (!hasExportSettings) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/figma/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, nodeIds: [assetId], format: 'png', scale: 2 })
      })
      
      if (!response.ok) throw new Error('Failed to export asset')
      
      const data = await response.json()
      const url = data.images?.[assetId]
      
      if (url) {
        setImageUrl(url)
        setShowPreview(true)
      } else {
        throw new Error('No image URL returned')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!imageUrl) return
    
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${assetName.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="group relative bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-200">{assetName}</p>
        {hasExportSettings && (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
            Exportable
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mb-3 font-mono">{assetId}</p>
      
      {hasExportSettings && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (showPreview) {
                setShowPreview(false)
              } else {
                fetchAssetImage()
              }
            }}
            disabled={loading}
            className="flex-1 bg-transparent border-gray-700 hover:bg-gray-800"
          >
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </>
            )}
          </Button>
          
          {imageUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="bg-transparent border-gray-700 hover:bg-gray-800"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
      
      {showPreview && imageUrl && (
        <div className="mt-4 relative rounded-md overflow-hidden bg-gray-900">
          <Image
            src={imageUrl}
            alt={assetName}
            width={300}
            height={200}
            className="w-full h-auto"
            unoptimized
          />
        </div>
      )}
    </div>
  )
} 