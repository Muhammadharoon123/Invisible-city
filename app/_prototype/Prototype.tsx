"use client";

import { Building2, RotateCcw, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import AuthorityView from "./AuthorityView";
import { Toast } from "./bits";
import CitizenView from "./CitizenView";
import { type Role, reducer, seed } from "./data";
import OfficeView from "./OfficeView";
import SuperAdminView from "./SuperAdminView";

const ROLES = [
  { id: "citizen", label: "Citizen", sub: "phone", icon: Smartphone },
  { id: "authority", label: "Authority", sub: "laptop", icon: Building2 },
  { id: "office", label: "Office", sub: "laptop", icon: Wrench },
  { id: "superadmin", label: "Super Admin", sub: "laptop", icon: ShieldCheck },
] as const;

export default function Prototype() {
  const [state, dispatch] = useReducer(reducer, undefined, seed);
  const [role, setRole] = useState<Role>("citizen");

  useEffect(() => {
    if (!state.toast) return;
    const t = window.setTimeout(() => dispatch({ type: "dismissToast" }), 3500);
    return () => window.clearTimeout(t);
  }, [state.toast]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-accent bg-accent-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Clickable prototype · fake data</div>
            <p className="text-sm text-ink-2">Layouts only. Nothing is saved; switching roles keeps the same fake Issues so you can follow one through.</p>
          </div>
          <button type="button" onClick={() => dispatch({ type: "reset" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
            <RotateCcw size={15} /> Reset data
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Role">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={role === r.id}
              onClick={() => setRole(r.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                role === r.id ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink"
              }`}
            >
              <r.icon size={16} />
              {r.label}
              <span className={`hidden text-[11px] font-medium sm:inline ${role === r.id ? "text-white/60" : "text-muted"}`}>{r.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {role === "citizen" && <CitizenView state={state} dispatch={dispatch} />}
      {role === "authority" && <AuthorityView state={state} dispatch={dispatch} />}
      {role === "office" && <OfficeView state={state} dispatch={dispatch} />}
      {role === "superadmin" && <SuperAdminView state={state} dispatch={dispatch} />}

      {state.toast && <Toast text={state.toast} onClose={() => dispatch({ type: "dismissToast" })} />}
    </div>
  );
}
