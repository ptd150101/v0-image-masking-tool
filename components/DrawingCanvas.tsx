"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DrawingTool = "brush" | "pen"

interface DrawingPoint {
  x: number
  y: number
}

interface DrawingCanvasProps {
  drawingTool: DrawingTool
  brushSize: number
  penPoints: DrawingPoint[]
  isDrawing: boolean
  drawingBaseImage: HTMLImageElement | null
  canvasRef: React.RefObject<HTMLCanvasElement>
  onMouseDown: (event: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: () => void
  onMouseLeave: () => void
}

export function DrawingCanvas({
  drawingTool,
  brushSize,
  penPoints,
  isDrawing,
  drawingBaseImage,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave
}: DrawingCanvasProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Canvas - Vẽ mask bằng {drawingTool === "brush" ? "Brush" : "Pen"} Tool</CardTitle>
        {isDrawing && <p className="text-sm text-cyan-600 font-medium">🎨 Đang vẽ với brush...</p>}
        {drawingTool === "pen" && penPoints.length > 0 && (
          <p className="text-sm text-orange-600 font-medium">
            ✏️ Pen Tool - {penPoints.length} điểm đã chọn. Cần ít nhất 3 điểm để hoàn thành.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg p-4 bg-muted/20">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="max-w-full h-auto border border-border rounded"
            style={{
              cursor:
                drawingTool === "brush"
                  ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${brushSize / 2 - 1}" fill="none" stroke="%2300FFFF" strokeWidth="2"/></svg>') ${brushSize / 2} ${brushSize / 2}, crosshair`
                  : "crosshair",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          />
        </div>

        {!drawingBaseImage && (
          <p className="text-center text-muted-foreground mt-4">Vui lòng upload ảnh gốc để bắt đầu vẽ</p>
        )}
        {drawingBaseImage && (
          <div className="text-center text-sm text-muted-foreground mt-2 space-y-1">
            <p>
              💡 <strong>Brush Tool (Cyan):</strong> Click và kéo để vẽ mask màu xanh cyan
            </p>
            <p>
              💡 <strong>Pen Tool (Orange):</strong> Click để tạo các điểm vàng, cần ít nhất 3 điểm để tạo
              vùng mask
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
