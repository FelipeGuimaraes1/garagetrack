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
        <button onClick={() => setIsOpen(true)} className="button-primary">
          Nova despesa
        </button>
      </div>

      <ExpenseFilters />
      <ExpenseList />

      <ExpenseCreateModal open={isOpen} onClose={() => setIsOpen(false)} />
    </section>
  );
}
