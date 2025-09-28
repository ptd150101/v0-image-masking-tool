"use client"

import { DrawingControls } from "./DrawingControls"
import { DrawingCanvas } from "./DrawingCanvas"

type DrawingTool = "brush" | "pen"

interface DrawingPoint {
  x: number
  y: number
}

interface DrawingToolsTabProps {
  drawingTool: DrawingTool
  brushSize: number
  penPoints: DrawingPoint[]
  historyIndex: number
  drawingHistoryLength: number
  isDrawing: boolean
  drawingBaseImage: HTMLImageElement | null
  canvasRef: React.RefObject<HTMLCanvasElement>
  onDrawingToolChange: (tool: DrawingTool) => void
  onBrushSizeChange: (size: number) => void
  onDrawingImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCompletePenPath: () => void
  onClearPenPoints: () => void
  onUndo: () => void
  onRedo: () => void
  onExportMask: () => void
  onMouseDown: (event: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: () => void
  onMouseLeave: () => void
}

export function DrawingToolsTab({
  drawingTool,
  brushSize,
  penPoints,
  historyIndex,
  drawingHistoryLength,
  isDrawing,
  drawingBaseImage,
  canvasRef,
  onDrawingToolChange,
  onBrushSizeChange,
  onDrawingImageUpload,
  onCompletePenPath,
  onClearPenPoints,
  onUndo,
  onRedo,
  onExportMask,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave
}: DrawingToolsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DrawingControls
          drawingTool={drawingTool}
          brushSize={brushSize}
          penPoints={penPoints}
          historyIndex={historyIndex}
          drawingHistoryLength={drawingHistoryLength}
          drawingBaseImage={drawingBaseImage}
          onDrawingToolChange={onDrawingToolChange}
          onBrushSizeChange={onBrushSizeChange}
          onDrawingImageUpload={onDrawingImageUpload}
          onCompletePenPath={onCompletePenPath}
          onClearPenPoints={onClearPenPoints}
          onUndo={onUndo}
          onRedo={onRedo}
          onExportMask={onExportMask}
        />

        <DrawingCanvas
          drawingTool={drawingTool}
          brushSize={brushSize}
          penPoints={penPoints}
          isDrawing={isDrawing}
          drawingBaseImage={drawingBaseImage}
          canvasRef={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  )
}
