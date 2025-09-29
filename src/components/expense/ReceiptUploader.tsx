"use client";

import { useToast } from "@/hooks/useToast";
import { UploadedAttachment, useUpload } from "@/hooks/useUpload";
import { useState } from "react";

type Props = {
  onAdd: (attachment: UploadedAttachment) => void;
};

export function ReceiptUploader({ onAdd }: Props) {
  const { uploadToCloudinary, isUploading, progress } = useUpload();
  const { showToast } = useToast();
  const [isHover, setIsHover] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      const uploaded = await uploadToCloudinary(file);
      onAdd(uploaded);
    } catch (e: any) {
      showToast(e.message || "Falha no upload.", "error");
    }
  }

  return (
    <div
      className={[
        "rounded-xl border border-[var(--border)] p-3 text-sm",
        isHover ? "ring-1 ring-white/10" : "",
      ].join(" ")}
      onDragOver={(e) => {
        e.preventDefault();
        setIsHover(true);
      }}
      onDragLeave={() => setIsHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsHover(false);
        const file = e.dataTransfer.files?.[0];
        void handleFile(file);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Nota / Comprovante</div>
          <div className="text-[var(--muted)]">
            Arraste e solte aqui, ou clique para selecionar.
          </div>
        </div>

        <label className="px-3 py-2 rounded-lg border border-[var(--border)] cursor-pointer hover:ring-1 hover:ring-white/5">
          Selecionar
          <input
            type="file"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
            accept="image/*,application/pdf"
          />
        </label>
      </div>

      {isUploading && (
        <div className="mt-3">
          <div className="h-2 rounded bg-white/5 overflow-hidden">
            <div
              className="h-2 w-0 bg-[var(--accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-[var(--muted)]">
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}
