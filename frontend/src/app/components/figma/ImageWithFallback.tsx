import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";

// The one place image load failures are handled. Callers decide whether there's
// an image at all (a null/absent URL renders nothing - no image was ever meant
// to be there); this component only covers a URL that's present but fails to
// load (network error, 404, an expired presigned URL...), replacing the
// browser's broken-image icon with an explicit "Unable to load image" box.
// The box takes the caller's className, so it keeps the image slot's size and
// spacing and the surrounding layout doesn't shift.

export function ImageWithFallback({ src, alt, className, style, onError, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  // Remembers *which* src failed, not just "failed": the same instance is reused
  // as `src` changes (e.g. moving between questions), and a new image deserves a
  // fresh try rather than inheriting the previous one's failure.
  const [failedSrc, setFailedSrc] = useState<string | undefined>();

  if (src !== undefined && failedSrc === src) {
    return (
      <div role="img" aria-label={alt ? `Unable to load image: ${alt}` : "Unable to load image"} className={`flex flex-col items-center justify-center gap-1.5 p-4 bg-gray-100 text-gray-500 text-xs ${className ?? ""}`} style={style} data-original-url={src}>
        <ImageOff className="w-6 h-6" aria-hidden="true" />
        <span>Unable to load image</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} style={style} {...rest} onError={(event) => { setFailedSrc(src); onError?.(event); }} />;
}
