"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MaskEditorTab } from "@/components/MaskEditorTab"
import { DrawingToolsTab } from "@/components/DrawingToolsTab"

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
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)

  // Thêm state để lưu chỉ drawing layer
  const [pureDrawingCanvas, setPureDrawingCanvas] = useState<HTMLCanvasElement | null>(null)

  // Thêm state để lưu pure drawing history
  const [pureDrawingHistory, setPureDrawingHistory] = useState<ImageData[]>([])

  // Thêm state cho folder paths
  const [imageFolderPath, setImageFolderPath] = useState("")
  const [maskFolderPath, setMaskFolderPath] = useState("")
  const [outputFolderPath, setOutputFolderPath] = useState("")

  // Thêm state cho loading
  const [isProcessing, setIsProcessing] = useState(false)

  // Thêm state để lưu danh sách ảnh từ output folder
  const [outputImages, setOutputImages] = useState<string[]>([])

  // Thêm state cho success message
  const [successMessage, setSuccessMessage] = useState("")

  const saveDrawingState = useCallback(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas || !pureDrawingCanvas) return

    const ctx = canvas.getContext("2d")
    const pureCtx = pureDrawingCanvas.getContext("2d")
    if (!ctx || !pureCtx) return

    // Lưu display canvas history (existing)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = drawingHistory.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setDrawingHistory(newHistory)

    // Lưu pure canvas history (new)
    const pureImageData = pureCtx.getImageData(0, 0, pureDrawingCanvas.width, pureDrawingCanvas.height)
    const newPureHistory = pureDrawingHistory.slice(0, historyIndex + 1)
    newPureHistory.push(pureImageData)
    setPureDrawingHistory(newPureHistory)

    setHistoryIndex(newHistory.length - 1)
  }, [drawingHistory, pureDrawingHistory, historyIndex, pureDrawingCanvas])

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

    // Vẽ lại tất cả nét đã vẽ từ history
    if (drawingHistory.length > 0 && historyIndex >= 0) {
      const currentState = drawingHistory[historyIndex]
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (tempCtx) {
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        tempCtx.putImageData(currentState, 0, 0)
        
        // Chỉ vẽ phần drawing (không vẽ lại base image)
        const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Tạo overlay canvas để vẽ chỉ phần drawing
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1] 
          const b = data[i + 2]
          
          // Chỉ vẽ pixel cyan (brush strokes)
          if (r < 50 && g > 200 && b > 200) {
            // Giữ nguyên màu cyan
          } else {
            // Làm trong suốt pixel khác
            data[i + 3] = 0
          }
        }
        
        tempCtx.putImageData(imageData, 0, 0)
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }

    // Vẽ pen tool preview (chỉ khi đang trong chế độ pen)
    if (drawingTool === "pen" && penPoints.length > 0) {
      ctx.save()
      
      // Vẽ preview polygon với fill semi-transparent
      if (penPoints.length >= 3) {
        ctx.fillStyle = "rgba(0, 255, 255, 0.3)" // Cyan semi-transparent
        ctx.strokeStyle = "#00FFFF"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(penPoints[0].x, penPoints[0].y)
        for (let i = 1; i < penPoints.length; i++) {
          ctx.lineTo(penPoints[i].x, penPoints[i].y)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
      
      // Vẽ connecting lines
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
      
      // Vẽ points
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
      
      ctx.restore()
    }
  }, [drawingBaseImage, drawingTool, penPoints, drawingHistory, historyIndex])

  // Khởi tạo pure drawing canvas khi upload ảnh
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

        // TẠO PURE DRAWING CANVAS
        const pureCanvas = document.createElement("canvas")
        pureCanvas.width = canvas.width
        pureCanvas.height = canvas.height
        setPureDrawingCanvas(pureCanvas)

        // Clear drawing history when new image is loaded
        setDrawingHistory([])
        setPureDrawingHistory([]) // Reset pure history
        setHistoryIndex(-1)
        setPenPoints([])
      }
    }
    img.src = URL.createObjectURL(file)
  }

  // Cập nhật drawing methods để vẽ song song trên pure canvas
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current
    if (!canvas || !pureDrawingCanvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (drawingTool === "brush") {
      setIsDrawing(true)
      saveDrawingState()

      const ctx = canvas.getContext("2d")
      const pureCtx = pureDrawingCanvas.getContext("2d")
      
      if (ctx && pureCtx) {
        // Vẽ trên canvas hiển thị
        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = "#00FFFF"
        ctx.strokeStyle = "#00FFFF"
        ctx.lineWidth = brushSize
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
        ctx.fill()

        // Vẽ song song trên pure drawing canvas
        pureCtx.globalCompositeOperation = "source-over"
        pureCtx.fillStyle = "#FFFFFF"
        pureCtx.strokeStyle = "#FFFFFF"
        pureCtx.lineWidth = brushSize
        pureCtx.lineCap = "round"
        pureCtx.beginPath()
        pureCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
        pureCtx.fill()
      }
    } else if (drawingTool === "pen") {
      // Chỉ thêm point, không vẽ gì cả
      setPenPoints((prev) => [...prev, { x, y }])
    }
  }

  const continueDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingTool !== "brush" || !pureDrawingCanvas) return

    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const ctx = canvas.getContext("2d")
    const pureCtx = pureDrawingCanvas.getContext("2d")
    
    if (ctx && pureCtx) {
      // Vẽ trên canvas hiển thị
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#00FFFF"
      ctx.strokeStyle = "#00FFFF"
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Vẽ song song trên pure drawing canvas
      pureCtx.globalCompositeOperation = "source-over"
      pureCtx.fillStyle = "#FFFFFF"
      pureCtx.strokeStyle = "#FFFFFF"
      pureCtx.lineWidth = brushSize
      pureCtx.lineCap = "round"
      pureCtx.beginPath()
      pureCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
      pureCtx.fill()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const completePenPath = () => {
    if (penPoints.length < 3 || !pureDrawingCanvas) return

    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const pureCtx = pureDrawingCanvas.getContext("2d")
    
    if (!ctx || !pureCtx) return

    // Lưu state trước khi vẽ
    saveDrawingState()

    // Vẽ polygon cyan trên display canvas
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "#00FFFF"
    ctx.beginPath()
    ctx.moveTo(penPoints[0].x, penPoints[0].y)
    for (let i = 1; i < penPoints.length; i++) {
      ctx.lineTo(penPoints[i].x, penPoints[i].y)
    }
    ctx.closePath()
    ctx.fill()

    // Vẽ polygon trắng trên pure canvas
    pureCtx.globalCompositeOperation = "source-over"
    pureCtx.fillStyle = "#FFFFFF"
    pureCtx.beginPath()
    pureCtx.moveTo(penPoints[0].x, penPoints[0].y)
    for (let i = 1; i < penPoints.length; i++) {
      pureCtx.lineTo(penPoints[i].x, penPoints[i].y)
    }
    pureCtx.closePath()
    pureCtx.fill()

    // Clear pen points
    setPenPoints([])
    
    // Lưu state sau khi vẽ xong
    setTimeout(() => saveDrawingState(), 0)
  }

  const undoDrawing = () => {
    if (historyIndex > 0) {
      const canvas = drawingCanvasRef.current
      if (!canvas || !pureDrawingCanvas) return

      const ctx = canvas.getContext("2d")
      const pureCtx = pureDrawingCanvas.getContext("2d")
      if (!ctx || !pureCtx) return

      const newIndex = historyIndex - 1
      
      // Restore display canvas
      ctx.putImageData(drawingHistory[newIndex], 0, 0)
      
      // Restore pure canvas
      if (pureDrawingHistory[newIndex]) {
        pureCtx.putImageData(pureDrawingHistory[newIndex], 0, 0)
      }
      
      setHistoryIndex(newIndex)
    }
  }

  const redoDrawing = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const canvas = drawingCanvasRef.current
      if (!canvas || !pureDrawingCanvas) return

      const ctx = canvas.getContext("2d")
      const pureCtx = pureDrawingCanvas.getContext("2d")
      if (!ctx || !pureCtx) return

      const newIndex = historyIndex + 1
      
      // Restore display canvas
      ctx.putImageData(drawingHistory[newIndex], 0, 0)
      
      // Restore pure canvas
      if (pureDrawingHistory[newIndex]) {
        pureCtx.putImageData(pureDrawingHistory[newIndex], 0, 0)
      }
      
      setHistoryIndex(newIndex)
    }
  }

  // XUẤT MASK ĐƠN GIẢN
  const exportDrawnMask = () => {
    if (!pureDrawingCanvas) return

    // Tạo canvas xuất với nền đen
    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")
    if (!exportCtx) return

    exportCanvas.width = pureDrawingCanvas.width
    exportCanvas.height = pureDrawingCanvas.height

    // Fill nền đen
    exportCtx.fillStyle = "#000000"
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

    // Lấy data từ pure drawing canvas
    const pureCtx = pureDrawingCanvas.getContext("2d")
    if (!pureCtx) return

    const imageData = pureCtx.getImageData(0, 0, pureDrawingCanvas.width, pureDrawingCanvas.height)
    const data = imageData.data

    // Tạo mask data
    const maskData = exportCtx.createImageData(pureDrawingCanvas.width, pureDrawingCanvas.height)
    const maskPixels = maskData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Chỉ kiểm tra pixel trắng trên pure canvas
      if (r > 200 && g > 200 && b > 200 && a > 0) {
        // Vùng đã vẽ → TRẮNG
        maskPixels[i] = 255     // R
        maskPixels[i + 1] = 255 // G
        maskPixels[i + 2] = 255 // B
        maskPixels[i + 3] = 255 // A
      } else {
        // Vùng chưa vẽ → ĐEN
        maskPixels[i] = 0       // R
        maskPixels[i + 1] = 0   // G
        maskPixels[i + 2] = 0   // B
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

  useEffect(() => {
    // Khi chuyển từ pen tool sang tool khác, clear pen points
    if (drawingTool !== "pen") {
      setPenPoints([])
    }
  }, [drawingTool])

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

  // Thêm function để execute IOPaint command
  const executeIOPaintCommand = async () => {
    if (!imageFolderPath || !maskFolderPath || !outputFolderPath) {
      alert("Vui lòng nhập đầy đủ đường dẫn Image, Mask và Output folder!")
      return
    }

    setIsProcessing(true)
    setOutputImages([]) // Clear output images trước khi chạy
    setSuccessMessage("") // Clear previous message
    
    try {
      const response = await fetch('http://localhost:8000/api/iopaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_path: imageFolderPath,
          mask_path: maskFolderPath,
          output_path: outputFolderPath,
          model: 'lama',
          device: 'cuda',
          clear_output: true
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // THAY THẾ alert bằng success message
        setSuccessMessage(`✅ IOPaint completed successfully! Output saved to: ${outputFolderPath}`)
        
        // Load output images sau khi hoàn thành
        setTimeout(async () => {
          await loadOutputImages()
        }, 500) // Delay nhỏ để đảm bảo files đã được ghi xong
        
      } else {
        setSuccessMessage(`❌ IOPaint failed: ${result.error || result.message || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('API Error:', error)
      setSuccessMessage(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Thêm function để load ảnh từ output folder
  const loadOutputImages = async () => {
    if (!outputFolderPath) return
    
    console.log('Loading images from:', outputFolderPath) // Debug log
    
    try {
      const url = `http://localhost:8000/api/list-output?path=${encodeURIComponent(outputFolderPath)}`
      console.log('API URL:', url) // Debug log
      
      const response = await fetch(url)
      const result = await response.json()
      
      console.log('API Response:', result) // Debug log
      
      if (response.ok) {
        setOutputImages(result.images || [])
        console.log('Set images:', result.images) // Debug log
      } else {
        console.error('API Error:', result)
      }
    } catch (error) {
      console.error('Error loading output images:', error)
    }
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
            <MaskEditorTab
              imageFolderPath={imageFolderPath}
              maskFolderPath={maskFolderPath}
              outputFolderPath={outputFolderPath}
              isProcessing={isProcessing}
              successMessage={successMessage}
              onImageFolderChange={setImageFolderPath}
              onMaskFolderChange={setMaskFolderPath}
              onOutputFolderChange={setOutputFolderPath}
              onExecuteIOPaint={executeIOPaintCommand}
              outputImages={outputImages}
              onRefreshOutput={loadOutputImages}
              masks={masks}
              createdMasks={createdMasks}
              selectedMask={selectedMask}
              onRemoveMask={removeMask}
              onImportMask={importMaskToEditor}
              onDeleteCreatedMask={deleteCreatedMask}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
            />
          </TabsContent>

          <TabsContent value="drawing-tools" className="space-y-6">
            <DrawingToolsTab
              drawingTool={drawingTool}
              brushSize={brushSize}
              penPoints={penPoints}
              historyIndex={historyIndex}
              drawingHistoryLength={drawingHistory.length}
              isDrawing={isDrawing}
              drawingBaseImage={drawingBaseImage}
              canvasRef={drawingCanvasRef}
              onDrawingToolChange={setDrawingTool}
              onBrushSizeChange={setBrushSize}
              onDrawingImageUpload={handleDrawingImageUpload}
              onCompletePenPath={completePenPath}
              onClearPenPoints={() => setPenPoints([])}
              onUndo={undoDrawing}
              onRedo={redoDrawing}
              onExportMask={exportDrawnMask}
              onMouseDown={startDrawing}
              onMouseMove={continueDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
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
