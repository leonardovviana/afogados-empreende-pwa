// Desenvolvido por Leonardo Viana (leonardovviana) — 2025

export const STAND_OPTIONS = ["1", "2", "3", "4", "5"] as const;
export const FORMATTED_PAYMENT_METHODS = [
  "R$ 700,00 No lançamento",
  "R$ 850,00 Após o lançamento",
  "R$ 750,00 Dois ou mais stands",
] as const;

export type StandOption = (typeof STAND_OPTIONS)[number];
export type FormattedPaymentMethod = (typeof FORMATTED_PAYMENT_METHODS)[number];

export const PAYMENT_UNIT_PRICES: Record<FormattedPaymentMethod, number> = {
  "R$ 700,00 No lançamento": 700,
  "R$ 850,00 Após o lançamento": 850,
  "R$ 750,00 Dois ou mais stands": 750,
};

export const PAYMENT_METHOD_DISPLAY_LABELS: Record<FormattedPaymentMethod, string> = {
  "R$ 700,00 No lançamento": "R$ 700,00",
  "R$ 850,00 Após o lançamento": "R$ 850,00",
  "R$ 750,00 Dois ou mais stands": "R$ 750,00",
};

export const getPaymentMethodDisplayLabel = (method: string): string => {
  const normalized = FORMATTED_PAYMENT_METHODS.find((option) => option === method);
  if (!normalized) {
    return method;
  }

  return PAYMENT_METHOD_DISPLAY_LABELS[normalized];
};

export const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

export const clampStandQuantity = (value: number) => {
  if (Number.isNaN(value) || value < 1) return 1;
  if (value > STAND_OPTIONS.length) return STAND_OPTIONS.length;
  return value;
};

export const calculateTotalAmount = (
  standsQuantity: number,
  paymentMethod: string | null | undefined,
): number => {
  const normalizedMethod = FORMATTED_PAYMENT_METHODS.find((method) => method === paymentMethod);
  if (!normalizedMethod) {
    return 0;
  }

  const quantity = clampStandQuantity(standsQuantity);
  const unitPrice = PAYMENT_UNIT_PRICES[normalizedMethod] ?? 0;
  return unitPrice * quantity;
};
