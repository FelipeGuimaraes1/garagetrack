"use client";

import { ExpenseCreateModal } from "@/components/expense/ExpenseCreateModal";
import { ExpenseFilters } from "@/components/expense/ExpenseFilters";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { useState } from "react";

export default function ExpensesPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="panel p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Despesas</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="button-primary cursor-pointer"
        >
          Nova despesa
        </button>
      </div>

      {/* Agora com cabeçalho + botão “Filtrar” visível só no mobile */}
      <div className="sm:hidden flex items-center justify-end">
        <ExpenseFilters variant="mobile" />
      </div>
      <div className="hidden sm:block">
        <ExpenseFilters variant="desktop" />
      </div>

      <ExpenseList />

      <ExpenseCreateModal open={isOpen} onClose={() => setIsOpen(false)} />
    </section>
  );
}
