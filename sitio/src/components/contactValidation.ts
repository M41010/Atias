export type ContactValues = {
  name: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  /** Campo trampa para robots: una persona no lo ve ni lo rellena. */
  website: string;
};

type Messages = { required: string; invalidEmail: string; consentRequired: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Errores por campo, en el orden en que aparecen en el formulario. */
export function validateContact(values: ContactValues, t: Messages): Partial<Record<keyof ContactValues, string>> {
  const errors: Partial<Record<keyof ContactValues, string>> = {};
  if (!values.name.trim()) errors.name = t.required;
  if (!values.organization.trim()) errors.organization = t.required;
  if (!values.role) errors.role = t.required;
  if (!values.email.trim()) errors.email = t.required;
  else if (!EMAIL.test(values.email.trim())) errors.email = t.invalidEmail;
  if (!values.consent) errors.consent = t.consentRequired;
  return errors;
}
