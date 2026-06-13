"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Phone, MapPin, Trash2, MoreVertical } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  payageImageUrl: string | null;
}

interface ClientCardProps {
  client: Client;
  onUpdate: () => void;
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Error deleting client");
      } else {
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/clientes/${client.id}`}
      className="group block rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 transition-all hover:shadow-[var(--shadow-md)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]"
            style={{ width: 44, height: 44, fontSize: 14, fontWeight: 600 }}
          >
            {initials}
          </div>
          <div>
            <h3
              className="font-display text-[var(--text-primary)] group-hover:text-[var(--brand-500)] transition-colors"
              style={{ fontSize: 16, fontWeight: 600 }}
            >
              {client.name}
            </h3>
          </div>
        </div>
        <div className="relative" onClick={(e) => e.preventDefault()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-full p-1 text-[var(--text-tertiary-new)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-8 z-10 w-36 rounded-lg bg-[var(--surface-1)] py-1 shadow-lg"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--danger-500)] hover:bg-[var(--surface-2)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Eliminar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas eliminar a {client.name}? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-[var(--danger-500)] hover:bg-[var(--danger-600)]"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
          <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          <span>{client.phoneNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
          <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          <span className="truncate">{client.address}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
        <span className="text-[12px] font-medium text-[var(--brand-500)]">
          Ver detalle →
        </span>
      </div>
    </Link>
  );
}
