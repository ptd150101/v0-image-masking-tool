"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Brush, Edit3, Undo, Redo, Download } from "lucide-react"

type DrawingTool = "brush" | "pen"

interface DrawingPoint {
  x: number
  y: number
}

interface DrawingControlsProps {
  drawingTool: DrawingTool
  brushSize: number
  penPoints: DrawingPoint[]
  historyIndex: number
  drawingHistoryLength: number
  drawingBaseImage: HTMLImageElement | null
  onDrawingToolChange: (tool: DrawingTool) => void
  onBrushSizeChange: (size: number) => void
  onDrawingImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCompletePenPath: () => void
  onClearPenPoints: () => void
  onUndo: () => void
  onRedo: () => void
  onExportMask: () => void
}

export function DrawingControls({
  drawingTool,
  brushSize,
  penPoints,
  historyIndex,
  drawingHistoryLength,
  drawingBaseImage,
  onDrawingToolChange,
  onBrushSizeChange,
  onDrawingImageUpload,
  onCompletePenPath,
  onClearPenPoints,
  onUndo,
  onRedo,
  onExportMask
}: DrawingControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brush className="w-5 h-5" />
          Drawing Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="drawing-image">Ảnh gốc để vẽ mask</Label>
          <Input
            id="drawing-image"
            type="file"
            accept="image/*"
            onChange={onDrawingImageUpload}
            className="mt-1"
          />
        </div>

        <div className="space-y-2">
          <Label>Chọn công cụ</Label>
          <div className="flex gap-2">
            <Button
              variant={drawingTool === "brush" ? "default" : "outline"}
              size="sm"
              onClick={() => onDrawingToolChange("brush")}
              className="flex-1"
            >
              <Brush className="w-4 h-4 mr-1" />
              Brush
            </Button>
            <Button
              variant={drawingTool === "pen" ? "default" : "outline"}
              size="sm"
              onClick={() => onDrawingToolChange("pen")}
              className="flex-1"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Pen
            </Button>
          </div>
        </div>

        {drawingTool === "brush" && (
          <div className="space-y-2">
            <Label>Kích thước brush: {brushSize}px</Label>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => onBrushSizeChange(value[0])}
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {drawingTool === "pen" && penPoints.length > 0 && (
          <div className="space-y-2">
            <Label>Pen Tool - {penPoints.length} điểm</Label>
            <div className="flex gap-2">
              <Button onClick={onCompletePenPath} size="sm" className="flex-1" disabled={penPoints.length < 3}>
                Hoàn thành
              </Button>
              <Button onClick={onClearPenPoints} size="sm" variant="outline" className="flex-1">
                Hủy
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onUndo}
            disabled={historyIndex <= 0}
            size="sm"
            variant="outline"
            className="flex-1 bg-transparent"
          >
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={onRedo}
            disabled={historyIndex >= drawingHistoryLength - 1}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Redo className="w-4 h-4 mr-1" />
            Redo
          </Button>
        </div>

        <Button onClick={onExportMask} disabled={!drawingBaseImage} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Xuất mask đã vẽ
        </Button>
      </CardContent>
    </Card>
  )
}
