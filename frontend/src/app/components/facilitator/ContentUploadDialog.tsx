import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import { createContent, requestUploadUrl, uploadFileToUrl } from "../../../lib/api/facilitatorContent";
import type { ContentVisibility } from "../../../lib/api/types";
import {
  ALLOWED_EXTENSIONS_TEXT,
  CONTENT_FILE_ACCEPT,
  CONTENT_TITLE_MAX_LENGTH,
  UPLOAD_STEPS,
  VISIBILITY_EXPLANATION,
  VISIBILITY_OPTIONS,
  checkContentFile,
  contentErrorMessage,
  formatFileSize,
  isLessonUnusable,
  keepsUploadedFile,
  storageUploadFailureMessage,
  titleFromFileName,
  uploadStepState,
  visibilityLabel,
  type UploadPhase,
} from "../../../lib/contentText";
import { requiredError } from "../../../lib/formText";
import { contentTypeLabel } from "../../../lib/labels";
import { toast } from "../../../lib/toast";
import { Button, FIELD_CLASS, Field, FileDrop, LessonPicker, Modal, Notice, ProgressBar, Steps } from "./shared";

interface ContentUploadDialogProps {
  onClose: () => void;
  /** Called once the content record exists, before the dialog closes. */
  onUploaded: () => void;
  /** Opens the Curriculum page, where lessons are added. */
  onOpenCurriculum: () => void;
}

const FALLBACK_ERROR = "The content could not be uploaded.";

/**
 * "+ Upload Content": choose a file and its details, then three steps - ask
 * the API for an upload URL, send the file straight to file storage, and
 * create the content record. If the last step fails the file stays uploaded,
 * so the details can be fixed and saved again without uploading twice.
 */
export function ContentUploadDialog({ onClose, onUploaded, onOpenCurriculum }: ContentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<ContentVisibility>(VISIBILITY_OPTIONS[0]);
  // Remounts the lesson pickers, so they reload after a lesson turned out to be unusable.
  const [pickerKey, setPickerKey] = useState(0);

  const [phase, setPhase] = useState<UploadPhase>("form");
  const [percent, setPercent] = useState<number | null>(null);
  // The file already in storage, and the key to register it under.
  const [uploaded, setUploaded] = useState<{ file: File; fileKey: string } | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);
  // What is missing is pointed out once Upload was tried (the title also once its field was left).
  const [titleTouched, setTitleTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  // False once the dialog is gone, so a late response does nothing.
  const openRef = useRef(true);
  useEffect(() => {
    openRef.current = true;
    return () => {
      openRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const running = phase !== "form";
  const fileCheck = file ? checkContentFile(file.name) : null;
  const fileUploaded = uploaded !== null && uploaded.file === file;
  const trimmedTitle = title.trim();
  const canSubmit = file !== null && fileCheck !== null && fileCheck.ok && trimmedTitle !== "" && lessonId !== null && !running;
  // A file of the wrong type still disables Upload: its reason is already shown under the file.
  const fileRefused = fileCheck !== null && !fileCheck.ok;
  const fileError = fileCheck && !fileCheck.ok ? fileCheck.message : requiredError("File", file, attempted);
  const titleError = requiredError("Title", title, titleTouched || attempted);
  const lessonError = requiredError("Lesson", lessonId, attempted);

  const chooseFile = (next: File | null) => {
    setFile(next);
    // A title already typed is kept; an empty one is filled from the file name.
    if (next && title.trim() === "") setTitle(titleFromFileName(next.name));
  };

  const fail = (requestError: unknown) => {
    const code = getErrorCode(requestError);
    toast.error(contentErrorMessage(code, getErrorStatus(requestError), getErrorMessage(requestError, FALLBACK_ERROR)));
    return code;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!canSubmit || file === null || lessonId === null) return;

    let fileKey = fileUploaded && uploaded ? uploaded.fileKey : null;

    if (fileKey === null) {
      // Step 1: ask the API where to send the file.
      setPhase("requesting");
      let uploadUrl: string;
      try {
        const target = await requestUploadUrl(file.name);
        uploadUrl = target.upload_url;
        fileKey = target.file_key;
      } catch (requestError) {
        if (!openRef.current) return;
        fail(requestError);
        setPhase("form");
        return;
      }
      if (!openRef.current) return;

      // Step 2: send the file straight to file storage.
      const controller = new AbortController();
      abortRef.current = controller;
      setPercent(0);
      setPhase("uploading");
      try {
        await uploadFileToUrl(uploadUrl, file, {
          signal: controller.signal,
          onProgress: (progress) => {
            if (openRef.current) setPercent(progress.percent);
          },
        });
      } catch (uploadError) {
        if (!openRef.current) return;
        if (axios.isCancel(uploadError)) toast.error("Upload cancelled. Nothing was added to the library.");
        // This request went to file storage, not to our API, so it has none of our error codes.
        else toast.error(storageUploadFailureMessage(getErrorStatus(uploadError)));
        setPhase("form");
        return;
      } finally {
        abortRef.current = null;
      }
      if (!openRef.current) return;
      setUploaded({ file, fileKey });
    }

    // Step 3: register the uploaded file as content under the lesson.
    setPhase("saving");
    try {
      await createContent({
        lesson_id: lessonId,
        file_key: fileKey,
        title: trimmedTitle,
        description: description.trim() === "" ? null : description.trim(),
        visibility,
      });
    } catch (requestError) {
      if (!openRef.current) return;
      const code = fail(requestError);
      if (!keepsUploadedFile(code)) setUploaded(null);
      if (isLessonUnusable(code)) {
        setLessonId(null);
        setPickerKey((key) => key + 1);
      }
      setPhase("form");
      return;
    }
    if (!openRef.current) return;

    toast.success(`"${trimmedTitle}" added to the Content Library.`);
    onUploaded();
    onClose();
  };

  const cancelUpload = () => abortRef.current?.abort();

  // Closing mid-upload asks first; the two short API steps cannot be interrupted.
  const requestClose = () => {
    if (phase === "uploading") setConfirmingClose(true);
    else onClose();
  };

  const steps = uploadStepState(phase, fileUploaded);

  return (
    <Modal
      title="Upload Content"
      subtitle="Add a file to the Content Library, under a lesson."
      onClose={requestClose}
      busy={phase === "requesting" || phase === "saving"}
      size="lg"
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        <Field
          label="File"
          error={fileError}
          hint={fileUploaded ? "This file is already uploaded. Choosing another file uploads again." : undefined}
        >
          <FileDrop
            file={file}
            onChange={chooseFile}
            accept={CONTENT_FILE_ACCEPT}
            hint={`Supports ${ALLOWED_EXTENSIONS_TEXT}`}
            fileDetail={
              file && (
                <>
                  {formatFileSize(file.size)}
                  {fileCheck && fileCheck.ok ? ` · ${contentTypeLabel(fileCheck.type)}` : ""}
                </>
              )
            }
            disabled={running}
          />
        </Field>

        <Field label="Title" htmlFor="content-title" error={titleError}>
          <input
            id="content-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={CONTENT_TITLE_MAX_LENGTH}
            aria-required="true"
            aria-invalid={titleError !== null}
            disabled={running}
            className={FIELD_CLASS}
          />
        </Field>

        <Field label="Description (optional)" htmlFor="content-description">
          <textarea
            id="content-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            disabled={running}
            className={FIELD_CLASS}
          />
        </Field>

        <Field label="Lesson" error={lessonError}>
          <LessonPicker key={pickerKey} lessonId={lessonId} onChange={setLessonId} disabled={running} onOpenCurriculum={onOpenCurriculum} />
        </Field>

        <Field label="Visibility">
          <div className="space-y-2" role="radiogroup" aria-label="Visibility">
            {VISIBILITY_OPTIONS.map((option) => (
              <label key={option} className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="content-visibility"
                  value={option}
                  checked={visibility === option}
                  onChange={() => setVisibility(option)}
                  disabled={running}
                  className="mt-1 accent-orange-500"
                />
                <span>
                  <span className="block text-gray-800 text-sm font-medium">{visibilityLabel(option)}</span>
                  <span className="block text-gray-500 text-xs">{VISIBILITY_EXPLANATION[option]}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        {(running || fileUploaded) && (
          <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <Steps labels={UPLOAD_STEPS.map((step) => step.label)} active={steps.active} done={steps.done} />
            {phase === "uploading" &&
              (percent === null ? (
                <p className="text-gray-500 text-xs" role="status">Uploading the file…</p>
              ) : (
                <ProgressBar value={percent} size="md" label="Upload progress" />
              ))}
            {phase === "form" && fileUploaded && (
              <p className="text-gray-500 text-xs">The file is uploaded, but its details were not saved. Fix them and save again; the file will not be uploaded twice.</p>
            )}
          </div>
        )}

        {confirmingClose && phase === "uploading" && (
          <Notice tone="warning" title="Stop the upload and close?">
            The file will not be added to the library.{" "}
            <Button variant="link" onClick={() => setConfirmingClose(false)}>Keep uploading</Button>{" "}
            <Button
              variant="link"
              onClick={() => {
                cancelUpload();
                onClose();
              }}
            >
              Stop and close
            </Button>
          </Notice>
        )}

        <div className="flex gap-3">
          {phase === "uploading" ? (
            <Button onClick={cancelUpload} className="flex-1">Cancel upload</Button>
          ) : (
            <Button onClick={onClose} disabled={running} className="flex-1">Cancel</Button>
          )}
          <Button type="submit" variant="accent" disabled={running || fileRefused} className="flex-1">
            {phase === "requesting" ? "Preparing…" : phase === "uploading" ? "Uploading…" : phase === "saving" ? "Saving…" : fileUploaded ? "Save details" : "Upload"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
