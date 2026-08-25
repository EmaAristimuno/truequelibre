"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Star, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/image-limits";

type Cover = { type: "existing"; url: string } | { type: "new"; file: File } | null;

function fileKey(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function ImageUploader({
  name = "images",
  keepImagesName = "keep_images",
  coverFieldName = "cover",
  existingImages = [],
}: {
  name?: string;
  keepImagesName?: string;
  coverFieldName?: string;
  existingImages?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keptExisting, setKeptExisting] = useState<string[]>(existingImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [cover, setCover] = useState<Cover>(null);
  const [isDragging, setIsDragging] = useState(false);

  const slotsLeft = Math.max(0, MAX_IMAGES - keptExisting.length - newFiles.length);

  const previews = useMemo(() => {
    const entries = newFiles.map(
      (file, index) => [fileKey(file, index), URL.createObjectURL(file)] as const,
    );
    return Object.fromEntries(entries);
  }, [newFiles]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function syncInputFiles(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((file) => dt.items.add(file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function addFiles(incoming: FileList | File[]) {
    const incomingArr = Array.from(incoming);
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of incomingArr) {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} no es una imagen`);
      } else if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name} pesa más de 5MB`);
      } else {
        accepted.push(file);
      }
    }

    const room = Math.max(0, MAX_IMAGES - keptExisting.length - newFiles.length);
    const toAdd = accepted.slice(0, room);
    if (accepted.length > toAdd.length) {
      rejected.push(`Máximo ${MAX_IMAGES} fotos por publicación`);
    }
    if (rejected.length > 0) {
      toast.error(rejected.join(" · "));
    }
    if (toAdd.length === 0) return;

    const merged = [...newFiles, ...toAdd];
    setNewFiles(merged);
    syncInputFiles(merged);
  }

  function removeExisting(url: string) {
    setKeptExisting((prev) => prev.filter((entry) => entry !== url));
    setCover((prev) => (prev?.type === "existing" && prev.url === url ? null : prev));
  }

  function removeNew(file: File) {
    const merged = newFiles.filter((entry) => entry !== file);
    setNewFiles(merged);
    syncInputFiles(merged);
    setCover((prev) => (prev?.type === "new" && prev.file === file ? null : prev));
  }

  const items = [
    ...keptExisting.map((url) => ({ kind: "existing" as const, url, key: url })),
    ...newFiles.map((file, index) => ({
      kind: "new" as const,
      file,
      key: fileKey(file, index),
    })),
  ];

  function tokenFor(entry: (typeof items)[number]) {
    return entry.kind === "existing"
      ? `existing:${entry.url}`
      : `new:${newFiles.indexOf(entry.file)}`;
  }

  const coverToken =
    cover?.type === "existing"
      ? `existing:${cover.url}`
      : cover?.type === "new"
        ? `new:${newFiles.indexOf(cover.file)}`
        : "";

  const ordered = [...items].sort((a, b) => {
    const aCover = tokenFor(a) === coverToken;
    const bCover = tokenFor(b) === coverToken;
    return aCover === bCover ? 0 : aCover ? -1 : 1;
  });

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple
        onChange={(event) => event.target.files && addFiles(event.target.files)}
        className="hidden"
      />
      {keptExisting.map((url) => (
        <input key={url} type="hidden" name={keepImagesName} value={url} />
      ))}
      <input type="hidden" name={coverFieldName} value={coverToken} />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (event.dataTransfer.files) addFiles(event.dataTransfer.files);
        }}
        onClick={() => slotsLeft > 0 && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          slotsLeft > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60"
        } ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-stone-300 bg-stone-50 hover:bg-stone-100"
        }`}
      >
        <Upload className="h-5 w-5 text-stone-400" />
        <p className="text-sm font-medium text-stone-700">
          {slotsLeft > 0 ? "Arrastrá fotos acá o hacé clic para elegir" : `Máximo ${MAX_IMAGES} fotos`}
        </p>
        <p className="text-xs text-stone-400">
          {slotsLeft > 0
            ? `Hasta ${slotsLeft} más · JPG/PNG, máx 5MB c/u`
            : "Quitá alguna para agregar otra"}
        </p>
      </div>

      {ordered.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {ordered.map((entry) => {
            const url = entry.kind === "existing" ? entry.url : previews[entry.key];
            const isCover = tokenFor(entry) === coverToken;
            return (
              <div
                key={entry.key}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
              >
                {url && <Image src={url} alt="" fill className="object-cover" />}
                {isCover && (
                  <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCover(
                      entry.kind === "existing"
                        ? { type: "existing", url: entry.url }
                        : { type: "new", file: entry.file },
                    )
                  }
                  title="Marcar como principal"
                  className="absolute bottom-1 left-1 rounded-full bg-white/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      isCover ? "fill-amber-400 text-amber-400" : "text-stone-500"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    entry.kind === "existing" ? removeExisting(entry.url) : removeNew(entry.file)
                  }
                  title="Quitar"
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-stone-500 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
