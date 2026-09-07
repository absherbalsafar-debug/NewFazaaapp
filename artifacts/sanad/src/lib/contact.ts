export function maskPhone(phone: string | null | undefined, visibleDigits = 4): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return "غير مضاف";

  const visible = digits.slice(0, visibleDigits);
  const hiddenCount = Math.max(4, digits.length - visible.length);
  return `${visible}${"×".repeat(hiddenCount)}`;
}

export function toTelHref(phone: string): string {
  return `tel:${phone.trim().replace(/[^\d+]/g, "")}`;
}

export function toWhatsAppHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("00")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? `967${digits.slice(1)}`
      : digits.length === 9 && digits.startsWith("7")
        ? `967${digits}`
        : digits;

  return `https://wa.me/${international}`;
}