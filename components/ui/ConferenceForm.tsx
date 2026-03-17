"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

export interface ConferenceFormValues {
  name?: string | null;
  year?: number | null;
  location?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_current?: boolean;
  sessionize_api_key?: string | null;
  sessionize_event_id?: string | null;
}

type FormAction = (
  prevState: { error: string } | null | void,
  formData: FormData
) => Promise<{ error: string } | null | void>;

interface Props {
  serverAction: FormAction;
  initialValues?: ConferenceFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
}

const inputClass =
  "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function toDateInput(v: string | null | undefined) {
  return v ? v.slice(0, 10) : "";
}

function Field({
  label,
  name,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-800">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function ConferenceForm({
  serverAction,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: Props) {
  const [state, action] = useActionState(serverAction, null);
  const v = initialValues ?? {};

  return (
    <form action={action} className="mt-8 space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 border border-red-200">
          {state.error}
        </div>
      )}

      {/* Name */}
      <Field label="Conference name" name="name" required>
        <input
          type="text"
          name="name"
          id="name"
          required
          placeholder="IRE 2026"
          defaultValue={v.name ?? ""}
          className={inputClass}
        />
      </Field>

      {/* Year + Location */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year" name="year">
          <input
            type="number"
            name="year"
            id="year"
            placeholder="2026"
            min="2000"
            max="2100"
            defaultValue={v.year ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Location" name="location">
          <input
            type="text"
            name="location"
            id="location"
            placeholder="Baltimore, MD"
            defaultValue={v.location ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" name="starts_at">
          <input
            type="date"
            name="starts_at"
            id="starts_at"
            defaultValue={toDateInput(v.starts_at)}
            className={inputClass}
          />
        </Field>
        <Field label="End date" name="ends_at">
          <input
            type="date"
            name="ends_at"
            id="ends_at"
            defaultValue={toDateInput(v.ends_at)}
            className={inputClass}
          />
        </Field>
      </div>

      <hr className="border-gray-200" />

      {/* Sessionize */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-900">Sessionize</h2>
        <p className="text-xs text-gray-600">
          Both IDs are on the Sessionize event page. Leave blank to configure later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="API key"
          name="sessionize_api_key"
          hint="Short key in the /view/All URL — e.g. r332qxb5"
        >
          <input
            type="text"
            name="sessionize_api_key"
            id="sessionize_api_key"
            placeholder="r332qxb5"
            defaultValue={v.sessionize_api_key ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label="Event ID"
          name="sessionize_event_id"
          hint="Numeric ID in organizer deep links — e.g. 22653"
        >
          <input
            type="text"
            name="sessionize_event_id"
            id="sessionize_event_id"
            placeholder="22653"
            defaultValue={v.sessionize_event_id ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <hr className="border-gray-200" />

      {/* Is current */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="is_current"
          id="is_current"
          defaultChecked={v.is_current ?? false}
          className="mt-0.5 h-4 w-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">
            Mark as current conference
          </span>
          <p className="text-xs text-gray-600">
            The current conference is the default when you open the app. Only one
            conference can be current at a time — this will unset any existing one.
          </p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
        <Link
          href={cancelHref}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
