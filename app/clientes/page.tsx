"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import { ClientCard } from "@/components/clients/client-card";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput, normalizeText } from "@/components/ui/search-input";
import { Users, Plus } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  payageImageUrl: string | null;
}

const CLIENTS_PER_PAGE = 9;

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Error fetching clients");
      const data = await response.json();
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientAdded = () => {
    setIsDialogOpen(false);
    fetchClients();
  };

  const normalizedQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);

  const filteredClients = useMemo(() => {
    if (!normalizedQuery) return clients;
    return clients.filter((client) =>
      normalizeText(client.name).includes(normalizedQuery)
    );
  }, [clients, normalizedQuery]);

  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * CLIENTS_PER_PAGE,
    currentPage * CLIENTS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <PageHeader
            title="Clientes"
            subtitle={`${clients.length} cliente${clients.length !== 1 ? "s" : ""} registrado${clients.length !== 1 ? "s" : ""}`}
            action={
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)]"
                    style={{ fontWeight: 600 }}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Nuevo Cliente
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[90%] sm:w-full rounded-xl max-w-lg">
                  <DialogHeader>
                    <DialogTitle
                      className="text-[16px] font-display"
                      style={{ fontWeight: 600 }}
                    >
                      Nuevo Cliente
                    </DialogTitle>
                  </DialogHeader>
                  <ClientForm onSuccess={handleClientAdded} />
                </DialogContent>
              </Dialog>
            }
          />
        </div>

        {clients.length > 3 && (
          <div className="mb-5 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre..."
            />
          </div>
        )}

        {filteredClients.length === 0 ? (
          searchQuery ? (
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-10 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                No se encontraron clientes
              </p>
              <p className="text-[13px] text-[var(--text-tertiary-new)] mt-1">
                Ningún cliente coincide con "{searchQuery}"
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Aún no tienes clientes"
              description="Agrega tu primer cliente para empezar a registrar préstamos y llevar control de pagos."
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {paginatedClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onUpdate={fetchClients}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredClients.length}
                  pageSize={CLIENTS_PER_PAGE}
                />
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
