import { ChatFile } from "@/app/types";
import { X } from "lucide-react";

interface AttachedFileProps extends ChatFile {
  onRemove?: (fileName: string) => void;
}

export default function AttachedFile({ name, isUploaded, onRemove }: AttachedFileProps) {
  return (
    <div className="flex mr-2 mb-2">
      <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center">
        <p className="mr-2">{name}</p>
        {!isUploaded && onRemove && (
          <button 
            onClick={() => onRemove(name)}
            className="hover:bg-gray-300 p-1 rounded-full"
            title="Remove file"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}