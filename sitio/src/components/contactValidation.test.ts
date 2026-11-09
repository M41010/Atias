import { describe, expect, it } from "vitest";
import { type ContactValues, validateContact } from "./contactValidation";

const messages = { required: "obligatorio", invalidEmail: "correo", consentRequired: "permiso" };
const valid: ContactValues = {
  name: "Ana",
  organization: "Cooperativa",
  role: "Técnico",
  email: "ana@coop.es",
  phone: "",
  message: "",
  consent: true,
  website: "",
};

describe("formulario de contacto", () => {
  it("acepta una solicitud completa; teléfono y mensaje son opcionales", () => {
    expect(validateContact(valid, messages)).toEqual({});
  });

  it("pide los obligatorios, un correo válido y el permiso", () => {
    expect(validateContact({ ...valid, name: " ", role: "", consent: false }, messages)).toEqual({
      name: "obligatorio",
      role: "obligatorio",
      consent: "permiso",
    });
    expect(validateContact({ ...valid, email: "ana@coop" }, messages).email).toBe("correo");
  });
});
