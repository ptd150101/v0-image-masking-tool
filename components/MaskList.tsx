"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, FileImage } from "lucide-react"

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

interface MaskListProps {
  masks: MaskItem[]
  createdMasks: CreatedMask[]
  onRemoveMask: (maskId: string) => void
  onImportMask: (createdMask: CreatedMask) => void
  onDeleteCreatedMask: (maskId: string) => void
}

export function MaskList({
  masks,
  createdMasks,
  onRemoveMask,
  onImportMask,
  onDeleteCreatedMask
}: MaskListProps) {
  return (
    <>
      {/* Current Masks */}
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
                    onClick={() => onRemoveMask(mask.id)}
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

      {/* Created Masks from Drawing Tools */}
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
                      onClick={() => onImportMask(createdMask)}
                      title="Import vào Mask Editor"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteCreatedMask(createdMask.id)}
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
    </>
  )
}
