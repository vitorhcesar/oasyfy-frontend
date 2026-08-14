export const WOOVI_WEBHOOK_EVENTS = [
  {
    event: "OPENPIX:CHARGE_COMPLETED",
    description: "Cobrança PIX paga",
  },
  {
    event: "OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER",
    description: "PIX pago por outro pagador",
  },
  {
    event: "OPENPIX:TRANSACTION_RECEIVED",
    description: "PIX recebido",
  },
  {
    event: "OPENPIX:MOVEMENT_CONFIRMED",
    description: "Saque PIX confirmado",
  },
  {
    event: "OPENPIX:MOVEMENT_FAILED",
    description: "Saque PIX rejeitado",
  },
  {
    event: "OPENPIX:MOVEMENT_REMOVED",
    description: "Saque PIX removido/cancelado",
  },
  {
    event: "OPENPIX:CHARGE_EXPIRED",
    description: "Cobrança expirada",
  },
  {
    event: "OPENPIX:TRANSACTION_REFUND_RECEIVED",
    description: "Reembolso PIX recebido",
  },
  {
    event: "PIX_TRANSACTION_REFUND_RECEIVED_CONFIRMED",
    description: "Reembolso PIX confirmado",
  },
] as const;
