interface ITransactionProps {
  id: number;
  sellerId: number | null;
  amount: number;
  currency: string;
  status: string;
  method: string;
  customerName: string;
  customerEmail: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  pixCode: string | null;
  isLocked: boolean;
  isFakeRefund: boolean;
  lockReason: string | null;
  refundReason: string | null;
  acquirer: string | null;
  feeAmount: number;
  netAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  private props: ITransactionProps;

  constructor(props: ITransactionProps) {
    this.props = props;
  }

  static restore(props: ITransactionProps): Transaction {
    return new Transaction(props);
  }

  isPaid() {
    return this.props.status === "paid" || this.props.status === "completed";
  }

  isRefunded() {
    return this.props.status === "refunded";
  }

  /** Valor creditado ao seller (respeita split do dono e desconta a taxa). */
  getCreditedAmount(): number {
    const meta = this.props.metadata;
    if (meta.type === "split_credit") {
      return this.props.amount;
    }

    const split = meta.split;
    if (
      split !== null &&
      typeof split === "object" &&
      !Array.isArray(split) &&
      typeof (split as { seller_amount?: unknown }).seller_amount === "number"
    ) {
      const sellerAmount = (split as { seller_amount: number }).seller_amount;
      const isNetBased =
        meta.split_base === "net" ||
        (split as { base?: unknown }).base === "net";
      if (isNetBased) {
        return Math.max(0, sellerAmount);
      }
      return Math.max(0, sellerAmount - this.props.feeAmount);
    }

    return Math.max(0, this.props.amount - this.props.feeAmount);
  }

  get id() {
    return this.props.id;
  }

  get sellerId() {
    return this.props.sellerId;
  }

  get amount() {
    return this.props.amount;
  }

  get currency() {
    return this.props.currency;
  }

  get status() {
    return this.props.status;
  }

  get method() {
    return this.props.method;
  }

  get customerName() {
    return this.props.customerName;
  }

  get customerEmail() {
    return this.props.customerEmail;
  }

  get description() {
    return this.props.description;
  }

  get metadata() {
    return this.props.metadata;
  }

  get pixCode() {
    return this.props.pixCode;
  }

  get isLocked() {
    return this.props.isLocked;
  }

  get isFakeRefund() {
    return this.props.isFakeRefund;
  }

  get lockReason() {
    return this.props.lockReason;
  }

  get refundReason() {
    return this.props.refundReason;
  }

  get acquirer() {
    return this.props.acquirer;
  }

  get feeAmount() {
    return this.props.feeAmount;
  }

  get netAmount() {
    return this.props.netAmount;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
