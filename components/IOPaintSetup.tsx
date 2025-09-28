"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, Download } from "lucide-react"

interface IOPaintSetupProps {
  imageFolderPath: string
  maskFolderPath: string
  outputFolderPath: string
  isProcessing: boolean
  successMessage: string
  onImageFolderChange: (path: string) => void
  onMaskFolderChange: (path: string) => void
  onOutputFolderChange: (path: string) => void
  onExecute: () => void
}

export function IOPaintSetup({
  imageFolderPath,
  maskFolderPath,
  outputFolderPath,
  isProcessing,
  successMessage,
  onImageFolderChange,
  onMaskFolderChange,
  onOutputFolderChange,
  onExecute
}: IOPaintSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          IOPaint Folder Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="image-folder">Image Folder Path</Label>
          <Input
            id="image-folder"
            type="text"
            placeholder="D:/project/IOPaint/image"
            value={imageFolderPath}
            onChange={(e) => onImageFolderChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="mask-folder">Mask Folder Path</Label>
          <Input
            id="mask-folder"
            type="text"
            placeholder="D:/project/IOPaint/mask"
            value={maskFolderPath}
            onChange={(e) => onMaskFolderChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="output-folder">Output Folder Path</Label>
          <Input
            id="output-folder"
            type="text"
            placeholder="D:/project/IOPaint/output"
            value={outputFolderPath}
            onChange={(e) => onOutputFolderChange(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* IOPaint Command Preview */}
        <div className="space-y-2">
          <Label>IOPaint Command Preview:</Label>
          <div className="p-3 bg-muted rounded-md text-sm font-mono">
            <div>iopaint run --model=lama --device=cuda \</div>
            <div>  --image="{imageFolderPath || "image"}" \</div>
            <div>  --mask="{maskFolderPath || "mask"}" \</div>
            <div>  --output="{outputFolderPath || "output"}"</div>
          </div>
        </div>

        {/* Execute Button */}
        <Button 
          onClick={onExecute}
          disabled={!imageFolderPath || !maskFolderPath || !outputFolderPath || isProcessing}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {isProcessing ? "Đang xử lý..." : "Chạy IOPaint"}
        </Button>

        {/* Success/Error Message */}
        {successMessage && (
          <div className={`p-3 rounded-md text-sm ${
            successMessage.startsWith('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {successMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
