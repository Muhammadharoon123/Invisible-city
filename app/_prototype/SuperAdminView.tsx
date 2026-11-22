"use client";

import { Check, Mail, Phone, X } from "lucide-react";
import { useState } from "react";
import { Card, Segmented, btn, field } from "@/components/ui";
import type { AccessRequest, Action, State } from "./data";

export default function SuperAdminView({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const [tab, setTab] = useState<"requests" | "form">("requests");
  const pending = state.requests.filter((r) => r.decision === "pending");
  const done = state.requests.filter((r) => r.decision !== "pending");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Access requests</h2>
          <p className="text-sm text-muted">Signed in as a Super Admin. Check each person is a real official before approving.</p>
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "requests", label: `Requests (${pending.length})` },
            { value: "form", label: "Public request form" },
          ]}
        />
      </div>

      {tab === "requests" ? (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-extrabold">Waiting for a decision</h3>
            {pending.length === 0 && <Card className="p-6 text-center text-sm text-muted">No pending Access requests.</Card>}
            <div className="space-y-2">
              {pending.map((r) => (
                <Row key={r.id} r={r}>
                  <button type="button" className={`${btn.primary} px-4 py-2`} onClick={() => dispatch({ type: "decideAccess", id: r.id, approve: true })}>
                    <Check size={15} /> Approve
                  </button>
                  <button type="button" className={`${btn.ghost} px-4 py-2`} onClick={() => dispatch({ type: "decideAccess", id: r.id, approve: false })}>
                    <X size={15} /> Decline
                  </button>
                </Row>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-extrabold">Decided</h3>
            <div className="space-y-2">
              {done.map((r) => (
                <Row key={r.id} r={r}>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${r.decision === "approved" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"}`}
                  >
                    {r.decision === "approved" ? "Approved · Authority" : "Declined"}
                  </span>
                </Row>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <RequestForm
          onSend={(v) => {
            dispatch({ type: "requestAccess", ...v });
            setTab("requests");
          }}
        />
      )}
    </div>
  );
}

function Row({ r, children }: { r: AccessRequest; children: React.ReactNode }) {
  const gmailOnly = !/\.gov\.pk$|\.com\.pk$/.test(r.email);
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="font-bold">{r.name}</div>
        <div className="text-sm text-ink-2">{r.department}</div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Mail size={12} /> {r.email}
            {gmailOnly && <span className="ml-1 rounded-full bg-orange-50 px-1.5 text-[10px] font-bold text-orange-700">not an official domain</span>}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone size={12} /> {r.phone}
          </span>
          <span>Sent {r.at}</span>
        </div>
      </div>
      <div className="flex gap-2">{children}</div>
    </Card>
  );
}

function RequestForm({ onSend }: { onSend: (v: { name: string; department: string; email: string; phone: string }) => void }) {
  const [v, setV] = useState({ name: "", department: "", email: "", phone: "" });
  const ok = v.name.trim() && v.department.trim() && v.email.includes("@") && v.phone.trim();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <Card className="max-w-lg space-y-3 p-5">
      <div>
        <h3 className="font-extrabold">Request Authority access</h3>
        <p className="text-xs text-muted">Anyone signed in can send this. A Super Admin checks it before you become an Authority.</p>
      </div>
      <input className={field} placeholder="Full name" value={v.name} onChange={set("name")} />
      <input className={field} placeholder="Department, e.g. CDA Roads Directorate" value={v.department} onChange={set("department")} />
      <input className={field} placeholder="Official email" value={v.email} onChange={set("email")} />
      <input className={field} placeholder="Phone, +92 3xx xxxxxxx" value={v.phone} onChange={set("phone")} />
      <button type="button" disabled={!ok} className={btn.primary} onClick={() => onSend(v)}>
        Send request
      </button>
    </Card>
  );
}
