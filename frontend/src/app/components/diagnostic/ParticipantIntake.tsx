import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, LoaderCircle } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { getParticipantIntake, submitParticipantIntake } from "../../../lib/api/diagnostic";
import { getErrorMessage } from "../../../lib/api/errors";
import {
  INTAKE_STRAND_OPTIONS,
  civilStatusChoices,
  initialIntakeForm,
  intakeFormFromIntake,
  toIntakeUpsert,
} from "./intakeForm";
import { primaryButton } from "./StrandTestCard";
import { INTAKE_SAVED_FLAG } from "./attemptDraft";

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible (18px) for what learners read and fill in.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";

// 48px tall, 12px corners, field-stroke border; focus turns the border deep blue with a 30% ring.
const inputClass = "block w-full h-12 rounded-xl border border-[#8A8F9C] bg-white px-4 text-lg text-[#1B1D26] placeholder:text-[#6B7080] outline-none transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-[#00538A] focus:ring-2 focus:ring-[#00538A]/30 disabled:border-[#E2E0DA] disabled:bg-[#F2F1ED] disabled:text-[#4A4F5C] disabled:cursor-not-allowed";
const selectClass = `${inputClass} appearance-none pr-11`;

// The server reports rule violations as "Value error, <rule>"; show just the rule.
const readable = (message) => message.replace(/^Value error,\s*/, "");

export function ParticipantIntake({ navigate, user, onLogout }) {
  const [form, setForm] = useState(initialIntakeForm);
  const [existingIntake, setExistingIntake] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Pre-fill from the learner's saved intake. No saved intake (null) is not an
  // error - the form just starts empty.
  useEffect(() => {
    let cancelled = false;
    getParticipantIntake()
      .then((intake) => {
        if (cancelled || !intake) return;
        setForm(intakeFormFromIntake(intake));
        setExistingIntake(true);
      })
      .catch(() => {
        if (!cancelled) setError("Your saved intake could not be loaded. You can still fill in the form.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleStrand = (code) => setForm((current) => ({
    ...current,
    als_learning_strands: current.als_learning_strands.includes(code)
      ? current.als_learning_strands.filter((value) => value !== code)
      : [...current.als_learning_strands, code],
  }));

  // The backend upserts, so first submission and later edits are the same call.
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const saved = await submitParticipantIntake(toIntakeUpsert(form));
      setForm(intakeFormFromIntake(saved));
      setExistingIntake(true);
      // The hub shows a one-time "Part I saved" note on arrival (navigate() carries no state).
      try { window.sessionStorage.setItem(INTAKE_SAVED_FLAG, "1"); } catch { /* the hub just shows no note */ }
      navigate("diagnostic-test");
      return;
    } catch (err) {
      setError(readable(getErrorMessage(err, "Your intake could not be saved. Please try again.")));
    } finally { setSaving(false); }
  };

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="participant-intake">
      <div className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
        <button onClick={() => navigate("diagnostic-test")} className={`inline-flex items-center gap-2 min-h-11 -ml-1 px-1 rounded-lg text-[0.9375rem] font-bold tracking-[0.01em] text-[#00538A] hover:text-[#004270] hover:underline underline-offset-4 ${focusRing}`}>
          <ArrowLeft className="w-5 h-5" aria-hidden="true" /> Back to Readiness Profiling
        </button>

        <h2 className="mt-4 text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Participant intake</h2>
        <p className="mt-3 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
          Part I of Readiness Profiling. Answer these questions once before the Learner Readiness Inventory and diagnostic exams. All fields are required, and you can come back and update your answers at any time.
        </p>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
          {loading ? (
            <div role="status" className="py-12 flex items-center justify-center gap-3 text-lg text-[#4A4F5C]" style={reading}>
              <LoaderCircle className="w-6 h-6 text-[#00538A] motion-safe:animate-spin" aria-hidden="true" /> Loading your intake...
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              {message && (
                <div role="status" className="flex items-start gap-3 rounded-xl border border-[#00538A] bg-[#CFE4FF] p-5 text-[#1B1D26]">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#00538A]" aria-hidden="true" />
                  <p className="text-lg leading-snug" style={reading}>{message}</p>
                </div>
              )}
              {error && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-lg leading-snug" style={reading}>{error}</p>
                </div>
              )}

              <section aria-labelledby="intake-about" className="rounded-2xl border border-[#E2E0DA] bg-white p-6 sm:p-8">
                <h3 id="intake-about" className={cardTitle} style={display}>About you</h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  <Field label="Age"><input required min="15" max="120" type="number" value={form.age} onChange={(event) => update("age", event.target.value)} className={inputClass} style={reading} /></Field>
                  <Field label="Sex"><SelectBox><select required value={form.sex} onChange={(event) => update("sex", event.target.value)} className={selectClass} style={reading}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></SelectBox></Field>
                  <Field label="Civil status"><SelectBox><select required value={form.civil_status} onChange={(event) => update("civil_status", event.target.value)} className={selectClass} style={reading}><option value="">Select</option>{civilStatusChoices(form.civil_status).map((status) => <option key={status} value={status}>{status}</option>)}</select></SelectBox></Field>
                </div>
              </section>

              <section aria-labelledby="intake-als" className="rounded-2xl border border-[#E2E0DA] bg-white p-6 sm:p-8">
                <h3 id="intake-als" className={cardTitle} style={display}>Your ALS learning</h3>
                <div className="mt-6 space-y-6">
                  <Field label="Highest educational attainment prior to ALS"><input required value={form.highest_educational_attainment} onChange={(event) => update("highest_educational_attainment", event.target.value)} className={inputClass} style={reading} placeholder="e.g., Grade 10" /></Field>
                  <fieldset>
                    <legend className="text-[1.125rem] font-bold leading-snug text-[#1B1D26]" style={reading}>ALS learning strand(s) currently enrolled in</legend>
                    <p className="mt-1 text-base leading-snug text-[#4A4F5C]" style={reading}>Choose at least one.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {INTAKE_STRAND_OPTIONS.map(({ code, label }) => (
                        <label key={code} className="flex min-h-14 items-center gap-3 rounded-xl border border-[#8A8F9C] bg-white px-4 py-3 text-lg text-[#1B1D26] cursor-pointer transition-[background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#00538A] has-[:checked]:border-[#00538A] has-[:checked]:bg-[#CFE4FF] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#00538A]" style={reading}>
                          <input type="checkbox" checked={form.als_learning_strands.includes(code)} onChange={() => toggleStrand(code)} className="w-6 h-6 shrink-0 accent-[#00538A]" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Field label="Length of time enrolled in ALS (months)"><input required min="0" max="1200" type="number" value={form.als_enrollment_months} onChange={(event) => update("als_enrollment_months", event.target.value)} className={`${inputClass} sm:max-w-48`} style={reading} /></Field>
                </div>
              </section>

              <section aria-labelledby="intake-ae" className="rounded-2xl border border-[#E2E0DA] bg-white p-6 sm:p-8">
                <h3 id="intake-ae" className={cardTitle} style={display}>A&amp;E test history</h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <Field label="Have you taken the A&E test before?"><SelectBox><select required value={form.has_taken_ae_test} onChange={(event) => { update("has_taken_ae_test", event.target.value); if (event.target.value === "false") update("ae_test_attempt_count", "0"); }} className={selectClass} style={reading}><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></SelectBox></Field>
                  <Field label="Number of previous A&E attempts"><input required min={form.has_taken_ae_test === "true" ? "1" : "0"} max="100" disabled={form.has_taken_ae_test !== "true"} type="number" value={form.ae_test_attempt_count} onChange={(event) => update("ae_test_attempt_count", event.target.value)} className={inputClass} style={reading} /></Field>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button disabled={saving || form.als_learning_strands.length === 0} aria-busy={saving} className={primaryButton}>
                  {saving ? <><LoaderCircle className="w-5 h-5 mr-2 motion-safe:animate-spin" aria-hidden="true" />Saving…</> : existingIntake ? "Update intake" : "Submit participant intake"}
                </button>
                {form.als_learning_strands.length === 0 && <p className="text-base leading-snug text-[#4A4F5C]" style={reading}>Choose at least one learning strand to continue.</p>}
              </div>
            </form>
          )}
          </div>

          <aside aria-label="About this part" className="grid gap-6 content-start self-start lg:grid-cols-3 xl:grid-cols-1 xl:sticky xl:top-6">
            <section aria-labelledby="intake-progress" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
              <h3 id="intake-progress" className={cardTitle} style={display}>Part I of 4</h3>
              <div className="mt-4 flex gap-2" aria-hidden="true">
                {[0, 1, 2, 3].map((part) => <span key={part} className={`h-2 flex-1 rounded-full ${part === 0 ? (existingIntake ? "bg-[#00538A]" : "bg-[#FFAB2E]") : "bg-[#E1E2E7]"}`} />)}
              </div>
              <p className="mt-3 text-lg leading-snug text-[#4A4F5C]" style={reading}>{existingIntake ? "Intake saved. You can still update it." : "You are here"}</p>
            </section>

            <section aria-labelledby="intake-why" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
              <h3 id="intake-why" className={cardTitle} style={display}>Why we ask</h3>
              <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>These answers are for the research study and are kept private.</p>
            </section>

            <section aria-labelledby="intake-next" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
              <h3 id="intake-next" className={cardTitle} style={display}>What's next</h3>
              <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>The Learner Readiness Inventory. It opens once your intake is saved.</p>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }) {
  return <label className="block text-[1.125rem] font-bold leading-snug text-[#1B1D26]" style={reading}>{label}<div className="mt-2 font-normal">{children}</div></label>;
}

/** A native select with the chevron drawn over it, so every field in the form has the same 48px shape. */
function SelectBox({ children }) {
  return <div className="relative">{children}<ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A4F5C]" aria-hidden="true" /></div>;
}
