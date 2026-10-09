import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { FileText, Upload, X } from "lucide-react";

interface FileDropProps {
  /** The chosen file, or null. */
  file: File | null;
  /** Called with the dropped or browsed file, or null when it is removed. */
  onChange: (file: File | null) => void;
  /** The file input's accept list, e.g. ".mp4,.pdf". Dropped files are not filtered by it; check them in onChange. */
  accept?: string;
  /** The grey line under the prompt, e.g. the supported types. */
  hint?: ReactNode;
  /** Shown beside the chosen file's name, e.g. its size and what it will be listed as. */
  fileDetail?: ReactNode;
  disabled?: boolean;
}

/**
 * A drop zone for one file, in the look of the mockup's upload step: a dashed
 * panel to drop onto or click to browse, with the chosen file shown as a small
 * chip that can be removed. The prompt is a real button, so it is reachable by
 * keyboard, and the chip's remove button sits beside it rather than inside it.
 */
export function FileDrop({ file, onChange, accept, hint, fileDetail, disabled = false }: FileDropProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) onChange(picked);
    // Lets the same file be picked again after it was removed.
    event.target.value = "";
  };

  const tone = disabled
    ? "border-gray-200 bg-gray-50 opacity-60"
    : dragging
      ? "border-[#3535C5] bg-indigo-50"
      : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40";

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-2xl text-center transition-all duration-200 focus-within:border-[#3535C5] ${tone}`}
    >
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={onInputChange} disabled={disabled} tabIndex={-1} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={file ? `Chosen file: ${file.name}. Choose another file` : "Choose a file"}
        className={`w-full px-6 pt-6 ${file ? "pb-2" : "pb-6"} rounded-2xl focus:outline-none disabled:cursor-not-allowed`}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
        <span className="block text-gray-700 text-sm font-medium mb-0.5">Drop your file here or browse</span>
        {hint && <span className="block text-gray-400 text-xs">{hint}</span>}
      </button>
      {file && (
        <div className="px-6 pb-5">
          <div className="inline-flex items-center gap-2 max-w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-[#3535C5] flex-shrink-0" aria-hidden="true" />
            <span className="text-gray-700 text-xs font-medium truncate">{file.name}</span>
            {fileDetail && <span className="text-gray-400 text-xs whitespace-nowrap">{fileDetail}</span>}
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label="Remove the file"
              className="text-gray-300 hover:text-red-400 ml-1 transition-colors disabled:hover:text-gray-300 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
