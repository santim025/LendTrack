"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, MapPin, ImagePlus } from "lucide-react";

interface ClientFormProps {
  onSuccess: () => void;
}

export function ClientForm({ onSuccess }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    address: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let imageUrl = null;

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error uploading image");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          payageImageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear cliente");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="form-label flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Nombre
        </label>
        <Input
          id="name"
          name="name"
          placeholder="Juan Pérez"
          value={formData.name}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phoneNumber" className="form-label flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Celular
        </label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          placeholder="+57 300 1234567"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="form-label flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Dirección
        </label>
        <Textarea
          id="address"
          name="address"
          placeholder="Calle 123 #45-67"
          value={formData.address}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="payage_image" className="form-label flex items-center gap-2">
          <ImagePlus className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Imagen del Pagaré (opcional)
        </label>
        <Input
          id="payage_image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--danger-50)] border border-[var(--danger-500)]/20 p-3">
          <p className="text-[12px] text-[var(--danger-500)]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-[var(--brand-500)] py-3 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-60"
        style={{ fontWeight: 600 }}
      >
        {isLoading ? "Guardando..." : "Guardar Cliente"}
      </button>
    </form>
  );
}
