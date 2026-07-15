export const DEMO_BANK_DETAILS = {
  bankName: "Proxima Demo Bank",
  accountHolder: "Proxima Laboratory Supplies Sp. z o.o.",
  iban: "PL12 3456 7890 1234 5678 9012 3456",
  swift: "PRXMDEMO",
} as const;

export function formatTransferTitle(orderId: string): string {
  return `ORDER-${orderId.slice(0, 8).toUpperCase()}`;
}
