"use client";

import { VehicleCreateModal } from "@/components/vehicle/VehicleCreateModal";
import { VehicleList } from "@/components/vehicle/VehicleList";
import { useState } from "react";

export default function VehiclesPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="panel p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Veículos</h1>
        <button onClick={() => setIsOpen(true)} className="button-primary">
          Novo veículo
        </button>
      </div>

      <VehicleList />

      <VehicleCreateModal open={isOpen} onClose={() => setIsOpen(false)} />
    </section>
  );
}
