/**
 * Hands a file the app already holds to the browser as a download, under the
 * given name. The object URL made for it is released afterwards.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Released a moment later, not at once: some browsers cancel the download
  // if the URL is gone before they have started reading it.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
