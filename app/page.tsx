"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Download, Upload, Plus } from "lucide-react"

interface MaskItem {
  id: string
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  isDragging: boolean
  isResizing: boolean
  resizeHandle: string | null
}

const HANDLE_SIZE = 8
const getResizeHandle = (x: number, y: number, mask: MaskItem): string | null => {
  const handles = [
    { name: "nw", x: mask.x, y: mask.y },
    { name: "ne", x: mask.x + mask.width, y: mask.y },
    { name: "sw", x: mask.x, y: mask.y + mask.height },
    { name: "se", x: mask.x + mask.width, y: mask.y + mask.height },
  ]

  for (const handle of handles) {
    if (
      x >= handle.x - HANDLE_SIZE &&
      x <= handle.x + HANDLE_SIZE &&
      y >= handle.y - HANDLE_SIZE &&
      y <= handle.y + HANDLE_SIZE
    ) {
      return handle.name
    }
  }
  return null
}

export default function ImageMaskTool() {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [masks, setMasks] = useState<MaskItem[]>([])
  const [draggedMask, setDraggedMask] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingMask, setResizingMask] = useState<string | null>(null)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseImageInputRef = useRef<HTMLInputElement>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw base image if exists
    if (baseImage) {
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height)
    }

    // Draw masks with semi-transparent overlay
    masks.forEach((mask) => {
      ctx.save()
      ctx.globalAlpha = 0.7
      ctx.drawImage(mask.image, mask.x, mask.y, mask.width, mask.height)

      ctx.globalAlpha = 1
      if (mask.isDragging || mask.isResizing) {
        ctx.strokeStyle = "#ef4444" // Red when dragging/resizing
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
      } else {
        ctx.strokeStyle = "#3b82f6" // Blue normally
        ctx.lineWidth = 2
        ctx.setLineDash([])
      }
      ctx.strokeRect(mask.x, mask.y, mask.width, mask.height)

      if (!mask.isDragging && !mask.isResizing) {
        ctx.fillStyle = "#3b82f6"
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.setLineDash([])

        // Draw 4 corner handles
        const handles = [
          { x: mask.x, y: mask.y }, // top-left
          { x: mask.x + mask.width, y: mask.y }, // top-right
          { x: mask.x, y: mask.y + mask.height }, // bottom-left
          { x: mask.x + mask.width, y: mask.y + mask.height }, // bottom-right
        ]

        handles.forEach((handle) => {
          ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
          ctx.strokeRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
        })
      }

      ctx.restore()
    })
  }, [baseImage, masks])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleBaseImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const img = new Image()
    img.onload = () => {
      setBaseImage(img)

      // Resize canvas to fit image
      const canvas = canvasRef.current
      if (canvas) {
        const maxWidth = 800
        const maxHeight = 600
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)

        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
      }
    }
    img.src = URL.createObjectURL(file)
  }

  const handleMaskUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const img = new Image()
      img.onload = () => {
        const newMask: MaskItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          image: img,
          x: 50,
          y: 50,
          width: img.width * 0.3,
          height: img.height * 0.3,
          isDragging: false,
          isResizing: false,
          resizeHandle: null,
        }
        setMasks((prev) => [...prev, newMask])
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check if clicking on any mask (reverse order to check top masks first)
    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i]

      const resizeHandle = getResizeHandle(x, y, mask)
      if (resizeHandle) {
        setResizingMask(mask.id)
        setResizeStartPos({ x, y })
        setResizeStartSize({
          width: mask.width,
          height: mask.height,
          x: mask.x,
          y: mask.y,
        })
        setMasks((prev) =>
          prev.map((m) =>
            m.id === mask.id
              ? { ...m, isResizing: true, resizeHandle }
              : { ...m, isResizing: false, resizeHandle: null },
          ),
        )
        return
      }

      // Check if clicking inside mask for dragging
      if (x >= mask.x && x <= mask.x + mask.width && y >= mask.y && y <= mask.y + mask.height) {
        setDraggedMask(mask.id)
        setDragOffset({
          x: x - mask.x,
          y: y - mask.y,
        })
        setMasks((prev) =>
          prev.map((m) => (m.id === mask.id ? { ...m, isDragging: true } : { ...m, isDragging: false })),
        )
        break
      }
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (resizingMask) {
      const deltaX = x - resizeStartPos.x
      const deltaY = y - resizeStartPos.y

      setMasks((prev) =>
        prev.map((mask) => {
          if (mask.id !== resizingMask) return mask

          let newX = mask.x
          let newY = mask.y
          let newWidth = mask.width
          let newHeight = mask.height

          switch (mask.resizeHandle) {
            case "nw": // top-left
              newX = resizeStartSize.x + deltaX
              newY = resizeStartSize.y + deltaY
              newWidth = resizeStartSize.width - deltaX
              newHeight = resizeStartSize.height - deltaY
              break
            case "ne": // top-right
              newY = resizeStartSize.y + deltaY
              newWidth = resizeStartSize.width + deltaX
              newHeight = resizeStartSize.height - deltaY
              break
            case "sw": // bottom-left
              newX = resizeStartSize.x + deltaX
              newWidth = resizeStartSize.width - deltaX
              newHeight = resizeStartSize.height + deltaY
              break
            case "se": // bottom-right
              newWidth = resizeStartSize.width + deltaX
              newHeight = resizeStartSize.height + deltaY
              break
          }

          // Minimum size constraints
          if (newWidth < 20) newWidth = 20
          if (newHeight < 20) newHeight = 20

          return { ...mask, x: newX, y: newY, width: newWidth, height: newHeight }
        }),
      )
      return
    }

    // Handle dragging
    if (draggedMask) {
      setMasks((prev) =>
        prev.map((mask) => (mask.id === draggedMask ? { ...mask, x: x - dragOffset.x, y: y - dragOffset.y } : mask)),
      )
      return
    }

    let cursor = "default"
    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i]
      const resizeHandle = getResizeHandle(x, y, mask)

      if (resizeHandle) {
        switch (resizeHandle) {
          case "nw":
          case "se":
            cursor = "nw-resize"
            break
          case "ne":
          case "sw":
            cursor = "ne-resize"
            break
        }
        break
      } else if (x >= mask.x && x <= mask.x + mask.width && y >= mask.y && y <= mask.y + mask.height) {
        cursor = "grab"
        break
      }
    }

    if (canvas.style.cursor !== cursor) {
      canvas.style.cursor = cursor
    }
  }

  const handleMouseUp = () => {
    setMasks((prev) => prev.map((mask) => ({ ...mask, isDragging: false, isResizing: false, resizeHandle: null })))
    setDraggedMask(null)
    setDragOffset({ x: 0, y: 0 })
    setResizingMask(null)
    setResizeStartPos({ x: 0, y: 0 })
    setResizeStartSize({ width: 0, height: 0, x: 0, y: 0 })
  }

  const removeMask = (maskId: string) => {
    setMasks((prev) => prev.filter((mask) => mask.id !== maskId))
  }

  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas || !baseImage) return

    // Create a new canvas for export
    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")
    if (!exportCtx) return

    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height

    // Fill with black background
    exportCtx.fillStyle = "#000000"
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

    // Draw masks in white
    masks.forEach((mask) => {
      // Create a temporary canvas to process the mask
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      tempCanvas.width = mask.width
      tempCanvas.height = mask.height

      // Draw the mask
      tempCtx.drawImage(mask.image, 0, 0, mask.width, mask.height)

      // Get image data and convert to white where there's content
      const imageData = tempCtx.getImageData(0, 0, mask.width, mask.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]
        if (alpha > 0) {
          data[i] = 255 // R
          data[i + 1] = 255 // G
          data[i + 2] = 255 // B
          data[i + 3] = 255 // A
        }
      }

      tempCtx.putImageData(imageData, 0, 0)
      exportCtx.drawImage(tempCanvas, mask.x, mask.y)
    })

    // Download the result
    const link = document.createElement("a")
    link.download = "mask-result.png"
    link.href = exportCanvas.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Image Mask Tool</h1>
          <p className="text-muted-foreground">
            Upload ảnh gốc và mask, kéo thả để định vị, resize để thay đổi kích thước
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base-image">Ảnh gốc</Label>
                <Input
                  id="base-image"
                  type="file"
                  accept="image/*"
                  ref={baseImageInputRef}
                  onChange={handleBaseImageUpload}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mask-images">Ảnh mask (có thể chọn nhiều)</Label>
                <Input
                  id="mask-images"
                  type="file"
                  accept="image/png"
                  multiple
                  ref={maskInputRef}
                  onChange={handleMaskUpload}
                  className="mt-1"
                />
              </div>

              <Button onClick={exportImage} disabled={!baseImage || masks.length === 0} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Xuất ảnh kết quả
              </Button>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Canvas - Kéo thả và resize mask</CardTitle>
              {draggedMask && <p className="text-sm text-orange-600 font-medium">🔄 Đang kéo mask...</p>}
              {resizingMask && <p className="text-sm text-purple-600 font-medium">📏 Đang resize mask...</p>}
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="max-w-full h-auto border border-border rounded"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              {!baseImage && (
                <p className="text-center text-muted-foreground mt-4">Vui lòng upload ảnh gốc để bắt đầu</p>
              )}
              {baseImage && masks.length === 0 && (
                <p className="text-center text-muted-foreground mt-4">Upload mask để bắt đầu kéo thả</p>
              )}
              {baseImage && masks.length > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  💡 Click và kéo mask để di chuyển. Kéo các góc để resize. Mask đang thao tác sẽ có viền đỏ đứt nét.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mask List */}
        {masks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Danh sách Mask ({masks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {masks.map((mask, index) => (
                  <div key={mask.id} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      <canvas
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                        ref={(canvas) => {
                          if (canvas) {
                            const ctx = canvas.getContext("2d")
                            if (ctx) {
                              ctx.clearRect(0, 0, 100, 100)
                              ctx.drawImage(mask.image, 0, 0, 100, 100)
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMask(mask.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-center mt-1 text-muted-foreground">Mask {index + 1}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload ảnh gốc (JPG, PNG, etc.)</li>
              <li>Upload một hoặc nhiều ảnh mask (định dạng PNG với background trong suốt)</li>
              <li>Kéo thả các mask trên canvas để định vị chính xác</li>
              <li>Kéo các góc của mask (hình vuông xanh) để thay đổi kích thước</li>
              <li>Click "Xuất ảnh kết quả" để tải về ảnh với nền đen và mask trắng</li>
              <li>Có thể xóa mask bằng cách hover và click nút trash</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
