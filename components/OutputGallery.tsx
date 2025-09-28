"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileImage, Download } from "lucide-react"

interface OutputGalleryProps {
  outputFolderPath: string
  outputImages: string[]
  isProcessing: boolean
  onRefresh: () => void
}

export function OutputGallery({
  outputFolderPath,
  outputImages,
  isProcessing,
  onRefresh
}: OutputGalleryProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>IOPaint Output Gallery</span>
          <div className="flex gap-2">
            {isProcessing && (
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                Processing...
              </div>
            )}
            <Button 
              onClick={onRefresh} 
              disabled={!outputFolderPath || isProcessing}
              size="sm"
              variant="outline"
            >
              <FileImage className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardTitle>
        {outputFolderPath && (
          <p className="text-sm text-muted-foreground">
            📁 {outputFolderPath}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg bg-muted/20" style={{ height: '600px', overflow: 'auto', overflowX: 'hidden' }}>
          {!outputFolderPath ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chọn Output Folder và chạy IOPaint để xem kết quả</p>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-muted-foreground mb-2">Đang xử lý IOPaint...</p>
                <p className="text-sm text-muted-foreground">Vui lòng chờ...</p>
              </div>
            </div>
          ) : outputImages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Chưa có output images</p>
                <p className="text-sm text-muted-foreground">Bấm "Chạy IOPaint" để tạo kết quả</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {outputImages.map((imagePath, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                    <img
                      src={`http://localhost:8000/api/serve-image?path=${encodeURIComponent(imagePath)}`}
                      alt={`Output ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => {
                        window.open(`http://localhost:8000/api/serve-image?path=${encodeURIComponent(imagePath)}`, '_blank')
                      }}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-6 h-6 p-0"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = `http://localhost:8000/api/serve-image?path=${encodeURIComponent(imagePath)}`
                        link.download = `output_${index + 1}.png`
                        link.click()
                      }}
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    Output {index + 1}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
