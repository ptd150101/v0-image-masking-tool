import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface FolderInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  onFolderSelect: (folderPath: string) => void
}

const FolderInput = React.forwardRef<HTMLInputElement, FolderInputProps>(
  ({ className, label, onFolderSelect, id, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        const fullPath = files[0].webkitRelativePath
        const folderPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
        
        const file = files[0] as any
        const actualPath = file.path ? file.path.substring(0, file.path.lastIndexOf('/')) : folderPath
        
        onFolderSelect(actualPath || folderPath)
      }
    }

    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="file"
          {...({ webkitdirectory: "", directory: "" } as any)}
          multiple
          onChange={handleChange}
          className={cn("mt-1", className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
FolderInput.displayName = "FolderInput"

export { FolderInput }
