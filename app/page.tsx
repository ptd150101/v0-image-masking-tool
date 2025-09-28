"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Download, Upload, Plus, ZoomIn, ZoomOut, Brush, Edit3, Undo, Redo, FileImage } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

interface MaskItem {
  id: string
  image: HTMLImageElement
  x: number
  y: number
  scale: number
  isDragging: boolean
}

interface DrawingPoint {
  x: number
  y: number
}

interface CreatedMask {
  id: string
  name: string
  dataUrl: string
  createdAt: Date
}

type DrawingTool = "brush" | "pen"

export default function ImageMaskTool() {
  const [activeTab, setActiveTab] = useState("mask-editor")
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("brush")
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [penPoints, setPenPoints] = useState<DrawingPoint[]>([])
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [drawingBaseImage, setDrawingBaseImage] = useState<HTMLImageElement | null>(null)
  const [createdMasks, setCreatedMasks] = useState<CreatedMask[]>([])

  // Existing code
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [masks, setMasks] = useState<MaskItem[]>([])
  const [draggedMask, setDraggedMask] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedMask, setSelectedMask] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null) // Added drawing canvas ref
  const baseImageInputRef = useRef<HTMLInputElement>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)
  const drawingImageInputRef = useRef<HTMLInputElement>(null) // Added drawing image input ref

  const saveDrawingState = useCallback(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = drawingHistory.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setDrawingHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [drawingHistory, historyIndex])

  const drawDrawingCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw base image if exists
    if (drawingBaseImage) {
      ctx.drawImage(drawingBaseImage, 0, 0, canvas.width, canvas.height)
    }

    if (drawingTool === "pen" && penPoints.length > 0) {
      ctx.save()
      penPoints.forEach((point, index) => {
        // Draw point as bright yellow circle
        ctx.fillStyle = "#FFD700"
        ctx.strokeStyle = "#FF6B00"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // Draw point number
        ctx.fillStyle = "#000000"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText((index + 1).toString(), point.x, point.y + 4)
      })

      // Draw lines connecting points
      if (penPoints.length > 1) {
        ctx.strokeStyle = "#FF6B00"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(penPoints[0].x, penPoints[0].y)
        for (let i = 1; i < penPoints.length; i++) {
          ctx.lineTo(penPoints[i].x, penPoints[i].y)
        }
        // Draw line back to first point to show closure
        if (penPoints.length > 2) {
          ctx.lineTo(penPoints[0].x, penPoints[0].y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()
    }
  }, [drawingBaseImage, drawingTool, penPoints])

  const handleDrawingImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const img = new Image()
    img.onload = () => {
      setDrawingBaseImage(img)

      // Resize canvas to fit image
      const canvas = drawingCanvasRef.current
      if (canvas) {
        const maxWidth = 800
        const maxHeight = 600
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)

        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Clear drawing history when new image is loaded
        setDrawingHistory([])
        setHistoryIndex(-1)
        setPenPoints([])
      }
    }
    img.src = URL.createObjectURL(file)
  }

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (drawingTool === "brush") {
      setIsDrawing(true)
      saveDrawingState()

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = "#00FFFF"
        ctx.strokeStyle = "#00FFFF"
        ctx.lineWidth = brushSize
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    } else if (drawingTool === "pen") {
      setPenPoints((prev) => [...prev, { x, y }])
    }
  }

  const continueDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingTool !== "brush") return

    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#00FFFF"
      ctx.strokeStyle = "#00FFFF"
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const completePenPath = () => {
    if (penPoints.length < 3) return

    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    saveDrawingState()

    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "#00FFFF"
    ctx.beginPath()
    ctx.moveTo(penPoints[0].x, penPoints[0].y)

    for (let i = 1; i < penPoints.length; i++) {
      ctx.lineTo(penPoints[i].x, penPoints[i].y)
    }

    ctx.closePath()
    ctx.fill()

    setPenPoints([])
  }

  const undoDrawing = () => {
    if (historyIndex > 0) {
      const canvas = drawingCanvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const newIndex = historyIndex - 1
      ctx.putImageData(drawingHistory[newIndex], 0, 0)
      setHistoryIndex(newIndex)
    }
  }

  const redoDrawing = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const canvas = drawingCanvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const newIndex = historyIndex + 1
      ctx.putImageData(drawingHistory[newIndex], 0, 0)
      setHistoryIndex(newIndex)
    }
  }

  const exportDrawnMask = () => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    // Create a new canvas for mask export
    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")
    if (!exportCtx) return

    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height

    // Fill with black background
    exportCtx.fillStyle = "#000000"
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

    // Get the drawing canvas data
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Create mask: white where drawn, black elsewhere
    const maskData = exportCtx.createImageData(canvas.width, canvas.height)
    const maskPixels = maskData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if ((r < 50 && g > 200 && b > 200) || (r > 200 && g > 200 && b > 200)) {
        maskPixels[i] = 255 // R
        maskPixels[i + 1] = 255 // G
        maskPixels[i + 2] = 255 // B
        maskPixels[i + 3] = 255 // A
      } else {
        maskPixels[i] = 0 // R
        maskPixels[i + 1] = 0 // G
        maskPixels[i + 2] = 0 // B
        maskPixels[i + 3] = 255 // A
      }
    }

    exportCtx.putImageData(maskData, 0, 0)

    const maskName = `Mask_${new Date().toLocaleTimeString()}`
    const dataUrl = exportCanvas.toDataURL()
    const newMask: CreatedMask = {
      id: Date.now().toString(),
      name: maskName,
      dataUrl: dataUrl,
      createdAt: new Date(),
    }
    setCreatedMasks((prev) => [...prev, newMask])

    // Download the mask
    const link = document.createElement("a")
    link.download = `${maskName}.png`
    link.href = dataUrl
    link.click()
  }

  const importMaskToEditor = (createdMask: CreatedMask) => {
    const img = new Image()
    img.onload = () => {
      const newMask: MaskItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        image: img,
        x: 50,
        y: 50,
        scale: 0.3,
        isDragging: false,
      }
      setMasks((prev) => [...prev, newMask])
      setActiveTab("mask-editor") // Switch to mask editor tab
    }
    img.src = createdMask.dataUrl
  }

  const deleteCreatedMask = (maskId: string) => {
    setCreatedMasks((prev) => prev.filter((mask) => mask.id !== maskId))
  }

  useEffect(() => {
    drawDrawingCanvas()
  }, [drawDrawingCanvas])

  // Existing code
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

      const width = mask.image.width * mask.scale
      const height = mask.image.height * mask.scale

      ctx.drawImage(mask.image, mask.x, mask.y, width, height)

      ctx.globalAlpha = 1
      if (mask.isDragging) {
        ctx.strokeStyle = "#ef4444" // Red when dragging
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
      } else if (selectedMask === mask.id) {
        ctx.strokeStyle = "#10b981" // Green when selected
        ctx.lineWidth = 2
        ctx.setLineDash([])
      } else {
        ctx.strokeStyle = "#3b82f6" // Blue normally
        ctx.lineWidth = 2
        ctx.setLineDash([])
      }
      ctx.strokeRect(mask.x, mask.y, width, height)

      ctx.restore()
    })
  }, [baseImage, masks, selectedMask])

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
          scale: 0.3,
          isDragging: false,
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
      const width = mask.image.width * mask.scale
      const height = mask.image.height * mask.scale

      // Check if clicking inside mask for dragging
      if (x >= mask.x && x <= mask.x + width && y >= mask.y && y <= mask.y + height) {
        setDraggedMask(mask.id)
        setSelectedMask(mask.id)
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

    // Handle dragging
    if (draggedMask) {
      setMasks((prev) =>
        prev.map((mask) => (mask.id === draggedMask ? { ...mask, x: x - dragOffset.x, y: y - dragOffset.y } : mask)),
      )
      return
    }

    // Update cursor
    let cursor = "default"
    for (let i = masks.length - 1; i >= 0; i--) {
      const mask = masks[i]
      const width = mask.image.width * mask.scale
      const height = mask.image.height * mask.scale

      if (x >= mask.x && x <= mask.x + width && y >= mask.y && y <= mask.y + height) {
        cursor = "grab"
        break
      }
    }

    if (canvas.style.cursor !== cursor) {
      canvas.style.cursor = cursor
    }
  }

  const handleMouseUp = () => {
    setMasks((prev) => prev.map((mask) => ({ ...mask, isDragging: false })))
    setDraggedMask(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const zoomIn = () => {
    if (!selectedMask) return
    setMasks((prev) =>
      prev.map((mask) => (mask.id === selectedMask ? { ...mask, scale: Math.min(mask.scale * 1.2, 3) } : mask)),
    )
  }

  const zoomOut = () => {
    if (!selectedMask) return
    setMasks((prev) =>
      prev.map((mask) => (mask.id === selectedMask ? { ...mask, scale: Math.max(mask.scale * 0.8, 0.1) } : mask)),
    )
  }

  const removeMask = (maskId: string) => {
    setMasks((prev) => prev.filter((mask) => mask.id !== maskId))
    if (selectedMask === maskId) {
      setSelectedMask(null)
    }
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

      const width = mask.image.width * mask.scale
      const height = mask.image.height * mask.scale

      tempCanvas.width = width
      tempCanvas.height = height

      // Draw the mask
      tempCtx.drawImage(mask.image, 0, 0, width, height)

      // Get image data and convert to white where there's content
      const imageData = tempCtx.getImageData(0, 0, width, height)
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
            Chỉnh sửa mask với drag & drop hoặc vẽ mask trực tiếp bằng brush/pen tool
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mask-editor">Mask Editor</TabsTrigger>
            <TabsTrigger value="drawing-tools">Drawing Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="mask-editor" className="space-y-6">
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

                  {selectedMask && (
                    <div className="space-y-2">
                      <Label>Zoom mask đã chọn</Label>
                      <div className="flex gap-2">
                        <Button onClick={zoomOut} size="sm" variant="outline" className="flex-1 bg-transparent">
                          <ZoomOut className="w-4 h-4 mr-1" />
                          Zoom Out
                        </Button>
                        <Button onClick={zoomIn} size="sm" variant="outline" className="flex-1 bg-transparent">
                          <ZoomIn className="w-4 h-4 mr-1" />
                          Zoom In
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button onClick={exportImage} disabled={!baseImage || masks.length === 0} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất ảnh kết quả
                  </Button>
                </CardContent>
              </Card>

              {/* Canvas */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Canvas - Kéo thả và zoom mask</CardTitle>
                  {draggedMask && <p className="text-sm text-orange-600 font-medium">🔄 Đang kéo mask...</p>}
                  {selectedMask && !draggedMask && (
                    <p className="text-sm text-green-600 font-medium">
                      ✅ Mask đã chọn - Dùng nút Zoom để thay đổi kích thước
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
                      💡 Click mask để chọn (viền xanh lá), kéo để di chuyển. Dùng nút Zoom để thay đổi kích thước.
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

            {createdMasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="w-5 h-5" />
                    Mask đã tạo từ Drawing Tools ({createdMasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {createdMasks.map((createdMask) => (
                      <div key={createdMask.id} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                          <img
                            src={createdMask.dataUrl || "/placeholder.svg"}
                            alt={createdMask.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => importMaskToEditor(createdMask)}
                            title="Import vào Mask Editor"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteCreatedMask(createdMask.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-center mt-1 text-muted-foreground">{createdMask.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drawing-tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Drawing Controls */}
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
                      ref={drawingImageInputRef}
                      onChange={handleDrawingImageUpload}
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chọn công cụ</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={drawingTool === "brush" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDrawingTool("brush")}
                        className="flex-1"
                      >
                        <Brush className="w-4 h-4 mr-1" />
                        Brush
                      </Button>
                      <Button
                        variant={drawingTool === "pen" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDrawingTool("pen")}
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
                        onValueChange={(value) => setBrushSize(value[0])}
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
                        <Button onClick={completePenPath} size="sm" className="flex-1" disabled={penPoints.length < 3}>
                          Hoàn thành
                        </Button>
                        <Button onClick={() => setPenPoints([])} size="sm" variant="outline" className="flex-1">
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={undoDrawing}
                      disabled={historyIndex <= 0}
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                    >
                      <Undo className="w-4 h-4 mr-1" />
                      Undo
                    </Button>
                    <Button
                      onClick={redoDrawing}
                      disabled={historyIndex >= drawingHistory.length - 1}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Redo className="w-4 h-4 mr-1" />
                      Redo
                    </Button>
                  </div>

                  <Button onClick={exportDrawnMask} disabled={!drawingBaseImage} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất mask đã vẽ
                  </Button>
                </CardContent>
              </Card>

              {/* Drawing Canvas */}
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
                      ref={drawingCanvasRef}
                      width={800}
                      height={600}
                      className="max-w-full h-auto border border-border rounded"
                      style={{
                        cursor:
                          drawingTool === "brush"
                            ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${brushSize / 2 - 1}" fill="none" stroke="%2300FFFF" strokeWidth="2"/></svg>') ${brushSize / 2} ${brushSize / 2}, crosshair`
                            : "crosshair",
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={continueDrawing}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
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
            </div>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Mask Editor</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Upload ảnh gốc và mask có sẵn</li>
                  <li>Kéo thả mask để định vị</li>
                  <li>Zoom in/out để thay đổi kích thước</li>
                  <li>Import mask từ Drawing Tools</li>
                  <li>Xuất ảnh kết quả (nền đen, mask trắng)</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Drawing Tools</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Upload ảnh gốc để vẽ mask</li>
                  <li>Chọn Brush Tool để vẽ tự do (màu cyan)</li>
                  <li>Chọn Pen Tool để tạo vùng chính xác (điểm vàng)</li>
                  <li>Dùng Undo/Redo để chỉnh sửa</li>
                  <li>Xuất mask đã vẽ và import vào Mask Editor</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
