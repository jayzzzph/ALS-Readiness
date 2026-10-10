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
    ? "border-[#E2E0DA] bg-[#F2F1ED] opacity-60"
    : dragging
      ? "border-[#00538A] bg-[#CFE4FF]"
      : "border-[#8A8F9C] bg-[#F2F1ED] hover:border-[#00538A] hover:bg-[#CFE4FF]/40";

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-2xl text-center transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-within:border-[#00538A] focus-within:ring-2 focus-within:ring-[#00538A]/30 ${tone}`}
    >
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={onInputChange} disabled={disabled} tabIndex={-1} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={file ? `Chosen file: ${file.name}. Choose another file` : "Choose a file"}
        className={`w-full px-6 pt-6 ${file ? "pb-2" : "pb-6"} rounded-2xl focus:outline-none disabled:cursor-not-allowed`}
      >
        <Upload className="w-8 h-8 text-[#4A4F5C] mx-auto mb-2" aria-hidden="true" />
        <span className="block text-[#1B1D26] text-base font-bold mb-1">Drop your file here or browse</span>
        {hint && <span className="block text-[#4A4F5C] text-[0.9375rem]">{hint}</span>}
      </button>
      {file && (
        <div className="px-6 pb-5">
          <div className="inline-flex items-center gap-2 max-w-full bg-white border border-[#E2E0DA] rounded-lg px-3 py-2">
            <FileText className="w-4 h-4 text-[#00538A] flex-shrink-0" aria-hidden="true" />
            <span className="text-[#1B1D26] text-[0.9375rem] font-bold truncate">{file.name}</span>
            {fileDetail && <span className="text-[#4A4F5C] text-[0.9375rem] whitespace-nowrap">{fileDetail}</span>}
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label="Remove the file"
              className="grid place-items-center w-7 h-7 -mr-1 rounded-md text-[#4A4F5C] hover:text-[#B42318] hover:bg-[#FDECEA] transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#4A4F5C] flex-shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
