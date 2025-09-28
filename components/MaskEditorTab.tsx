"use client"

import { IOPaintSetup } from "./IOPaintSetup"
import { OutputGallery } from "./OutputGallery"
import { MaskList } from "./MaskList"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Label } from "@/components/ui/label"

interface MaskItem {
  id: string
  image: HTMLImageElement
  x: number
  y: number
  scale: number
  isDragging: boolean
}

interface CreatedMask {
  id: string
  name: string
  dataUrl: string
  createdAt: Date
}

interface MaskEditorTabProps {
  // IOPaint Setup props
  imageFolderPath: string
  maskFolderPath: string
  outputFolderPath: string
  isProcessing: boolean
  successMessage: string
  onImageFolderChange: (path: string) => void
  onMaskFolderChange: (path: string) => void
  onOutputFolderChange: (path: string) => void
  onExecuteIOPaint: () => void
  
  // Output Gallery props
  outputImages: string[]
  onRefreshOutput: () => void
  
  // Mask props
  masks: MaskItem[]
  createdMasks: CreatedMask[]
  selectedMask: string | null
  onRemoveMask: (maskId: string) => void
  onImportMask: (createdMask: CreatedMask) => void
  onDeleteCreatedMask: (maskId: string) => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export function MaskEditorTab({
  imageFolderPath,
  maskFolderPath,
  outputFolderPath,
  isProcessing,
  successMessage,
  onImageFolderChange,
  onMaskFolderChange,
  onOutputFolderChange,
  onExecuteIOPaint,
  outputImages,
  onRefreshOutput,
  masks,
  createdMasks,
  selectedMask,
  onRemoveMask,
  onImportMask,
  onDeleteCreatedMask,
  onZoomIn,
  onZoomOut
}: MaskEditorTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <IOPaintSetup
            imageFolderPath={imageFolderPath}
            maskFolderPath={maskFolderPath}
            outputFolderPath={outputFolderPath}
            isProcessing={isProcessing}
            successMessage={successMessage}
            onImageFolderChange={onImageFolderChange}
            onMaskFolderChange={onMaskFolderChange}
            onOutputFolderChange={onOutputFolderChange}
            onExecute={onExecuteIOPaint}
          />
          
          {selectedMask && (
            <div className="space-y-2">
              <Label>Zoom mask đã chọn</Label>
              <div className="flex gap-2">
                <Button onClick={onZoomOut} size="sm" variant="outline" className="flex-1 bg-transparent">
                  <ZoomOut className="w-4 h-4 mr-1" />
                  Zoom Out
                </Button>
                <Button onClick={onZoomIn} size="sm" variant="outline" className="flex-1 bg-transparent">
                  <ZoomIn className="w-4 h-4 mr-1" />
                  Zoom In
                </Button>
              </div>
            </div>
          )}
        </div>

        <OutputGallery
          outputFolderPath={outputFolderPath}
          outputImages={outputImages}
          isProcessing={isProcessing}
          onRefresh={onRefreshOutput}
        />
      </div>

      <MaskList
        masks={masks}
        createdMasks={createdMasks}
        onRemoveMask={onRemoveMask}
        onImportMask={onImportMask}
        onDeleteCreatedMask={onDeleteCreatedMask}
      />
    </div>
  )
}
