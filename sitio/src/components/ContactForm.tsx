"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Info, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useId, useState, useSyncExternalStore } from "react";
import { type Locale, pathFor } from "@/i18n/config";
import type { Dictionary } from "@/i18n/es";
import { type ContactValues, validateContact } from "./contactValidation";

/**
 * Destino de las solicitudes (por ejemplo, un servicio de formularios). Mientras no se configure,
 * el formulario valida pero no envía nada, y lo dice.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_FORMULARIO_URL ?? "";

type Status = "idle" | "sending" | "sent" | "error" | "inactive";

/** Qué busca quien escribe: el piloto gratis, una demostración u otra cosa. */
export type Interest = "piloto" | "demo" | "otro";
const INTERESTS: Interest[] = ["piloto", "demo", "otro"];
type InterestTexts = { interestLabel: string; interests: Record<Interest, string> };

const noSubscription = () => () => {};
function readAskedInterest(): Interest | null {
  const asked = new URLSearchParams(window.location.search).get("interes");
  return asked && (INTERESTS as string[]).includes(asked) ? (asked as Interest) : null;
}

export function ContactForm({ locale, t, offer }: { locale: Locale; t: Dictionary["contact"]; offer: InterestTexts }) {
  const id = useId();
  // Quien llega desde «Quiero un piloto» (?interes=piloto) lo encuentra ya elegido. Se lee de la
  // dirección sin efecto: en la compilación estática no hay dirección y vale «demo».
  const asked = useSyncExternalStore(noSubscription, readAskedInterest, () => null);
  const [chosen, setInterest] = useState<Interest | null>(null);
  const interest: Interest = chosen ?? asked ?? "demo";
  const [values, setValues] = useState<ContactValues>({
    name: "",
    organization: "",
    role: "",
    email: "",
    phone: "",
    message: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactValues, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = <K extends keyof ContactValues>(key: K, value: ContactValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateContact(values, t);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    // Campo trampa para robots: si viene relleno, se da por enviado sin enviar nada.
    if (values.website) {
      setStatus("sent");
      return;
    }
    if (!ENDPOINT) {
      setStatus("inactive");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          nombre: values.name,
          empresa: values.organization,
          perfil: values.role,
          correo: values.email,
          telefono: values.phone,
          mensaje: values.message,
          interes: interest,
          idioma: locale,
        }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="label flex items-start gap-3 px-6 py-8" role="status">
        <CheckCircle2 size={24} className="mt-0.5 shrink-0" aria-hidden />
        <p className="text-xl font-bold">{t.sent}</p>
      </div>
    );
  }

  const field = (key: keyof ContactValues) => ({
    id: `${id}-${key}`,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-error` : undefined,
  });

  const error = (key: keyof ContactValues) =>
    errors[key] ? (
      <p id={`${id}-${key}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-fruit">
        <AlertTriangle size={15} aria-hidden />
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="label flex flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9">
      {!ENDPOINT && (
        <p className="flex items-start gap-2.5 border-2 border-dashed border-ink bg-trap px-4 py-3 text-sm font-semibold" role="note">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t.inactive}
        </p>
      )}

      <fieldset>
        <legend className="mb-2 font-semibold">{offer.interestLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((option) => (
            <label
              key={option}
              className="flex min-h-11 cursor-pointer items-center gap-2 border-2 border-ink px-3.5 font-semibold has-[:checked]:bg-ink has-[:checked]:text-trap has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
            >
              <input
                type="radio"
                name="interest"
                value={option}
                checked={interest === option}
                onChange={() => setInterest(option)}
                className="sr-only"
              />
              {offer.interests[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block font-semibold">
            {t.name}
          </label>
          <input {...field("name")} className="field" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
          {error("name")}
        </div>
        <div>
          <label htmlFor={`${id}-organization`} className="mb-1.5 block font-semibold">
            {t.organization}
          </label>
          <input
            {...field("organization")}
            className="field"
            autoComplete="organization"
            value={values.organization}
            onChange={(e) => set("organization", e.target.value)}
          />
          {error("organization")}
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 font-semibold">{t.role}</legend>
        <div className="flex flex-wrap gap-2" id={`${id}-role`} tabIndex={-1}>
          {t.roles.map((role) => (
            <label
              key={role}
              className="flex min-h-11 cursor-pointer items-center gap-2 border-2 border-ink px-3.5 font-semibold has-[:checked]:bg-ink has-[:checked]:text-trap has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={values.role === role}
                onChange={() => set("role", role)}
                className="sr-only"
              />
              {role}
            </label>
          ))}
        </div>
        {error("role")}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block font-semibold">
            {t.email}
          </label>
          <input
            {...field("email")}
            type="email"
            className="field"
            autoComplete="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
          {error("email")}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="mb-1.5 block font-semibold">
            {t.phone}
          </label>
          <input
            {...field("phone")}
            type="tel"
            className="field"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-message`} className="mb-1.5 block font-semibold">
          {t.message}
        </label>
        <textarea {...field("message")} className="field" value={values.message} onChange={(e) => set("message", e.target.value)} />
      </div>

      {/* Campo oculto para robots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Web
          <input tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            {...field("consent")}
            type="checkbox"
            className="check"
            checked={values.consent}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <span>
            {t.consent.split(t.privacyLink)[0]}
            <Link href={pathFor(locale, "privacidad")} className="font-semibold underline">
              {t.privacyLink}
            </Link>
            {t.consent.split(t.privacyLink)[1]}
          </span>
        </label>
        {error("consent")}
      </div>

      {status === "inactive" && (
        <p className="flex items-start gap-2 font-semibold" role="alert">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t.inactive}
        </p>
      )}

      {status === "error" && (
        <p className="flex items-center gap-2 font-semibold text-fruit" role="alert">
          <AlertTriangle size={18} aria-hidden />
          {t.error}
        </p>
      )}

      <div>
        <button type="submit" className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />
              {t.sending}
            </>
          ) : (
            <>
              {t.submit}
              <ArrowRight size={18} aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
