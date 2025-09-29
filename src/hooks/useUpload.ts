"use client";

import { useState } from "react";
import { useToast } from "./useToast";

export type UploadedAttachment = {
  url: string;
  contentType: string | null;
  size: number | null;
};

// Tipo mínimo do retorno do Cloudinary que usamos aqui
type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

export function useUpload() {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  async function uploadToCloudinary(file: File): Promise<UploadedAttachment> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      throw new Error(
        "Cloudinary não configurado. Verifique as variáveis NEXT_PUBLIC_*."
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    setIsUploading(true);
    setProgress(0);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    // ✅ TIPAGEM EXPLÍCITA NA PROMISE
    const attachment = await new Promise<UploadedAttachment>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        });

        xhr.onerror = () =>
          reject(new Error("Falha de rede durante o upload."));
        xhr.onabort = () => reject(new Error("Upload abortado."));
        xhr.ontimeout = () => reject(new Error("Tempo de upload esgotado."));

        xhr.onreadystatechange = () => {
          if (xhr.readyState !== XMLHttpRequest.DONE) return;

          try {
            const json = JSON.parse(
              xhr.responseText
            ) as CloudinaryUploadResponse;

            if (xhr.status >= 200 && xhr.status < 300 && json.secure_url) {
              resolve({
                url: json.secure_url,
                contentType: file.type || null,
                size: typeof file.size === "number" ? file.size : null,
              });
            } else {
              const message =
                json?.error?.message || "Falha no upload para Cloudinary.";
              reject(new Error(message));
            }
          } catch {
            reject(new Error("Resposta inválida do Cloudinary."));
          }
        };

        xhr.open("POST", endpoint, true);
        xhr.send(formData);
      }
    ).finally(() => {
      setIsUploading(false);
      // limpa a barra de progresso depois de um pequeno delay
      setTimeout(() => setProgress(0), 400);
    });

    showToast("Upload concluído!", "success");
    return attachment;
  }

  return { isUploading, progress, uploadToCloudinary };
}
