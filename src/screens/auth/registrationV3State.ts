export type RegistrationCountry = "VE" | "CO";
export type RegistrationProvider = "google" | "apple" | "facebook";
export type LoginResult = {
  paid: boolean;
  country?: RegistrationCountry;
};

/** Las implementaciones deben autenticar en el servidor y guardar la clave en almacenamiento cifrado. */
export interface RegistrationServices {
  lookupEmail(email: string): Promise<"new" | "existing">;
  requestOtp(email: string): Promise<void>;
  verifyOtp(email: string, code: string): Promise<boolean>;
  savePin(
    email: string,
    pin: string,
    country: RegistrationCountry,
  ): Promise<void>;
  loginWithPin(email: string, pin: string): Promise<LoginResult>;
  loginWithProvider(provider: RegistrationProvider): Promise<LoginResult>;
}
export const isValidEmail = (value: string) => {
  const trimmed = value.trim();
  const match = /^[^\s@]+@[^\s@]+\.[^\s@]+/.exec(trimmed);
  return match?.[0] === trimmed;
};
export const normalizeCode = (value: string) =>
  value.replace(/\D/g, "").slice(0, 6);
export const isWeakPin = (pin: string) =>
  pin.length === 6 &&
  (new Set(pin).size === 1 ||
    "01234567890123456789".includes(pin) ||
    "98765432109876543210".includes(pin));

/** Los datos de prueba solo están disponibles en una compilación de desarrollo habilitada explícitamente. */
export function registrationPreview(
  name: string | undefined,
  devToolsEnabled: boolean,
) {
  const enabled = devToolsEnabled && !!name;
  const active = enabled ? name : undefined;
  return {
    enabled,
    stage: active?.startsWith("login")
      ? ("login" as const)
      : active?.startsWith("otp")
        ? ("otp" as const)
        : active?.startsWith("pin")
          ? ("pin" as const)
          : ("start" as const),
    sheet:
      active === "privacy"
        ? ("privacy" as const)
        : active === "country"
          ? ("country" as const)
          : active === "providers"
            ? ("providers" as const)
            : active === "otp-country"
              ? ("country" as const)
              : null,
    slide: active === "carousel" ? 1 : 0,
    repeat: active === "pin-repeat",
    error:
      active === "login-error"
        ? ("login" as const)
        : active === "otp-error"
          ? ("otp" as const)
          : active === "pin-error"
            ? ("mismatch" as const)
            : active === "pin-weak"
              ? ("weak" as const)
              : null,
  };
}
