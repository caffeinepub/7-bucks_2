import { TransactionStatus } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCalculateFees,
  useContipayAcquire,
  useContipayDisburse,
  useCreateTransaction,
  useUserTransactions,
} from "@/hooks/useQueries";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  "3": "A technical error occurred with the payment gateway. Please try again.",
  "4": "Your card was declined. Please check your card details or try a different card.",
  "2": "This transaction has been refunded.",
};

function getErrorMessage(code?: string, fallback?: string): string {
  if (code && ERROR_CODE_MESSAGES[code]) return ERROR_CODE_MESSAGES[code];
  return fallback || "Transaction failed. Please try again or contact support.";
}

function dollarsToCents(dollars: string): bigint | null {
  const val = Number.parseFloat(dollars);
  if (Number.isNaN(val) || val <= 0) return null;
  return BigInt(Math.round(val * 100));
}

function formatCardDisplay(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
type FormStep = 1 | 2 | 3;
type ProcessingPhase = 0 | 1 | 2 | 3 | "success" | "error" | "refunded";

interface RecipientForm {
  firstName: string;
  surname: string;
  nationalId: string;
  email: string;
  ecocashNumber: string;
  accountName: string;
}

interface CardForm {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

/* ─── Fee Breakdown ──────────────────────────────────────────────────────── */
function FeeBreakdown({ grossCents }: { grossCents: bigint | null }) {
  const { data: fees, isLoading } = useCalculateFees(grossCents);

  if (!grossCents || grossCents <= 0n) return null;

  if (isLoading) {
    return (
      <div
        className="card-dark p-4 rounded-xl space-y-2 animate-pulse"
        data-ocid="fees.loading_state"
      >
        <div className="h-3 bg-muted/30 rounded w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-muted/20 rounded" />
        ))}
      </div>
    );
  }

  const gross = Number(grossCents) / 100;
  const fee = fees ? Number(fees.fee) / 100 : null;
  const imtt = gross * 0.02;
  const total = fees ? Number(fees.totalCharged) / 100 : null;
  const net = fees ? Number(fees.netToRecipient) / 100 : null;

  return (
    <div
      className="card-dark p-4 rounded-xl space-y-3 text-sm"
      data-ocid="fees.panel"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Fee Breakdown
      </p>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Send Amount</span>
          <span className="font-mono font-medium">${gross.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Service Fee ($1.00 + 6%)
          </span>
          <span className="font-mono font-medium text-destructive">
            −${fee !== null ? fee.toFixed(2) : "—"}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground/70">
          <span>
            IMTT Tax (2%) <em className="text-xs not-italic">(display only)</em>
          </span>
          <span className="font-mono">${imtt.toFixed(2)}</span>
        </div>
        <div className="border-t border-border/40 pt-2 flex justify-between">
          <span className="text-muted-foreground">Total Charged</span>
          <span className="font-mono font-semibold">
            ${total !== null ? total.toFixed(2) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between bg-primary/8 rounded-lg px-3 py-2">
          <span className="font-semibold text-foreground">Recipient Gets</span>
          <span className="font-display font-bold text-xl text-primary">
            ${net !== null ? net.toFixed(2) : "—"}
          </span>
        </div>
      </div>
      <p className="text-xs text-success/80">
        ✓ 15% Digital Tax does <strong>not</strong> apply — local ZW
        transaction.
      </p>
    </div>
  );
}

/* ─── Processing Stepper ─────────────────────────────────────────────────── */
function ProcessingStepper({
  phase,
  ecocashNumber,
  txId,
  grossCents,
  error,
  onReset,
}: {
  phase: ProcessingPhase;
  ecocashNumber: string;
  txId: string | null;
  grossCents: bigint | null;
  error: string | null;
  onReset: () => void;
}) {
  const steps = [
    { num: 1, label: "Authorizing Card", icon: CreditCard },
    { num: 2, label: "Verifying Settlement", icon: Wifi },
    { num: 3, label: "Payout to EcoCash", icon: Banknote },
  ];

  if (phase === "success") {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-dark p-8 rounded-2xl text-center space-y-6 border-success/30 shadow-success-glow animate-success_glow"
        data-ocid="success.panel"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 16,
            delay: 0.1,
          }}
          className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 text-success-foreground" />
        </motion.div>
        <div>
          <h2 className="font-display font-bold text-3xl mb-2">
            Money Sent! 🎉
          </h2>
          <p className="text-muted-foreground">
            Funds dispatched to{" "}
            <span className="font-mono text-foreground">
              {ecocashNumber.slice(0, 4)}***{ecocashNumber.slice(-2)}
            </span>{" "}
            via EcoCash.
          </p>
        </div>
        {grossCents && (
          <div className="inline-block px-6 py-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">Amount Sent</p>
            <p className="font-display font-bold text-3xl text-primary">
              ${(Number(grossCents) / 100).toFixed(2)}
            </p>
          </div>
        )}
        {txId && (
          <p className="text-xs text-muted-foreground font-mono break-all">
            Ref: {txId}
          </p>
        )}
        <p className="text-xs text-warning/90">
          ⚠️ Disbursements to EcoCash are{" "}
          <strong>final and non-reversible</strong> once confirmed.
        </p>
        <Button
          onClick={onReset}
          data-ocid="success.new_transfer.primary_button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        >
          Send Another Transfer
        </Button>
      </motion.div>
    );
  }

  if (phase === "refunded") {
    return (
      <div
        className="card-dark p-8 rounded-2xl text-center space-y-4"
        data-ocid="refund.panel"
      >
        <RefreshCw className="w-12 h-12 text-warning mx-auto" />
        <h2 className="font-display font-bold text-2xl">
          Transaction Refunded
        </h2>
        <p className="text-muted-foreground">
          This transaction has been reversed. No funds were disbursed.
        </p>
        <Button
          variant="outline"
          onClick={onReset}
          data-ocid="refund.retry.secondary_button"
        >
          Start New Transfer
        </Button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <motion.div
        key="error"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-dark p-8 rounded-2xl text-center space-y-6 border-destructive/30"
        data-ocid="error.panel"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 16,
            delay: 0.1,
          }}
          className="w-20 h-20 rounded-full bg-destructive/20 border border-destructive/40 flex items-center justify-center mx-auto"
        >
          <AlertCircle className="w-10 h-10 text-destructive" />
        </motion.div>
        <div>
          <h2 className="font-display font-bold text-2xl mb-2 text-destructive">
            Transaction Failed
          </h2>
          <p className="text-muted-foreground text-sm">
            {error || "An error occurred. Please try again or contact support."}
          </p>
        </div>
        {txId && (
          <p className="text-xs text-muted-foreground font-mono break-all">
            Ref: {txId}
          </p>
        )}
        <Button
          variant="outline"
          onClick={onReset}
          data-ocid="error.retry.secondary_button"
          className="border-border hover:border-primary/50"
        >
          Try Again
        </Button>
        <p className="text-xs text-muted-foreground">
          Need help? Contact us at{" "}
          <a
            href="mailto:support@contipay.co.zw"
            className="text-primary underline"
          >
            support@contipay.co.zw
          </a>
        </p>
      </motion.div>
    );
  }

  // At this point phase is narrowed to 0 | 1 | 2 | 3
  const currentNum = phase as number;

  return (
    <div
      className="card-dark glow-border p-8 rounded-2xl space-y-8"
      data-ocid="processing.panel"
    >
      {/* Steps */}
      <div className="flex items-start justify-center gap-0">
        {steps.map((step, idx) => {
          const isDone = currentNum > step.num;
          const isActive = currentNum === step.num;
          return (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isDone
                      ? "step-complete"
                      : isActive
                        ? "step-active animate-pulse_glow"
                        : "step-inactive"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-success-foreground" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center max-w-[80px] leading-tight ${
                    isActive
                      ? "text-primary"
                      : isDone
                        ? "text-success"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-14 sm:w-20 h-0.5 mx-2 mb-7 transition-all duration-700 ${
                    isDone ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {phase === 0 && "Initiating transaction…"}
          {phase === 1 && "Authorizing your Visa card with ContiPay…"}
          {phase === 2 && "Settlement confirmed — verifying with ContiPay…"}
          {phase === 3 && "Disbursing funds to EcoCash…"}
        </p>
        {txId && (
          <p className="text-xs font-mono text-muted-foreground/60 mt-2 break-all">
            TX: {txId}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function SendMoney() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  /* Form steps */
  const [formStep, setFormStep] = useState<FormStep>(1);

  /* Step 1 fields */
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<RecipientForm>({
    firstName: "",
    surname: "",
    nationalId: "",
    email: "",
    ecocashNumber: "",
    accountName: "",
  });

  /* Step 2 fields */
  const [card, setCard] = useState<CardForm>({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  /* Processing state */
  const [txId, setTxId] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>(0);
  const [error, setError] = useState<string | null>(null);

  const grossCents = dollarsToCents(amount);
  const cardDigits = card.cardNumber.replace(/\s/g, "");
  const cardLast4 = cardDigits.slice(-4);

  const createTx = useCreateTransaction();
  const acquire = useContipayAcquire();
  const disburse = useContipayDisburse();
  const { data: transactions, refetch: refetchTx } = useUserTransactions();

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);
  useEffect(() => () => stopPolling(), [stopPolling]);

  /* ── Watch transaction status for processing ── */
  useEffect(() => {
    // Never override a terminal state — success/error/refunded are sticky
    if (
      processingPhase === "success" ||
      processingPhase === "error" ||
      processingPhase === "refunded"
    )
      return;
    if (!txId || formStep !== 3) return;
    const tx = transactions?.find((t) => t.id === txId);
    if (!tx) return;

    const status = tx.status;

    if (
      status === TransactionStatus.authorizing ||
      status === TransactionStatus.pending
    ) {
      setProcessingPhase(1);
    } else if (status === TransactionStatus.verifying) {
      setProcessingPhase(2);
    } else if (status === TransactionStatus.disbursing) {
      setProcessingPhase(3);
    } else if (status === TransactionStatus.completed) {
      stopPolling();
      setProcessingPhase("success");
    } else if (status === TransactionStatus.failed) {
      stopPolling();
      setProcessingPhase("error");
      setError(getErrorMessage(tx.errorMessage, tx.errorMessage || undefined));
    }
  }, [transactions, txId, formStep, processingPhase, stopPolling]);

  /* ── Helpers ── */
  const setRecipientField = (field: keyof RecipientForm, value: string) =>
    setRecipient((prev) => ({ ...prev, [field]: value }));

  const setCardField = (field: keyof CardForm, value: string) =>
    setCard((prev) => ({ ...prev, [field]: value }));

  const handleFormatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    if (digits.length > 2) {
      setCardField("expiry", `${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardField("expiry", digits);
    }
  };

  /* ── Step 1 → 2 validation ── */
  const handleStep1Continue = () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (!grossCents || grossCents < 100n) {
      setError("Minimum send amount is $1.00.");
      return;
    }
    if (!recipient.firstName.trim()) {
      setError("Recipient first name is required.");
      return;
    }
    if (!recipient.surname.trim()) {
      setError("Recipient surname is required.");
      return;
    }
    if (!recipient.nationalId.trim()) {
      setError("Recipient national ID is required.");
      return;
    }
    if (!recipient.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setError("Valid recipient email is required.");
      return;
    }
    if (!recipient.ecocashNumber.match(/^07\d{8}$/)) {
      setError("EcoCash number must be 07XXXXXXXX format.");
      return;
    }
    if (!recipient.accountName.trim()) {
      setError("Recipient account name is required.");
      return;
    }
    setError(null);
    setFormStep(2);
  };

  /* ── Step 2 → 3 (submit) ── */
  const handleSubmit = useCallback(async () => {
    if (!card.cardholderName.trim()) {
      setError("Cardholder name is required.");
      return;
    }
    if (cardDigits.length !== 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!card.expiry.match(/^\d{2}\/\d{2,4}$/)) {
      setError("Expiry must be in MM/YY or MM/YYYY format.");
      return;
    }
    if (card.cvv.length < 3) {
      setError("CVV must be 3 digits.");
      return;
    }
    if (!grossCents) {
      setError("Invalid amount.");
      return;
    }

    setError(null);
    setFormStep(3);
    setProcessingPhase(0);

    try {
      /* 1. Create transaction record */
      const id = await createTx.mutateAsync({
        amountCents: grossCents,
        recipientEcocash: recipient.ecocashNumber,
        senderName: card.cardholderName,
        cardLast4,
      });
      setTxId(id);
      setProcessingPhase(1);

      /* 2. Acquire from Visa card — send full payload for backend to call ContiPay */
      const cardPayload = JSON.stringify({
        cardNumber: cardDigits,
        cardName: card.cardholderName,
        cvv: card.cvv,
        expiry: card.expiry,
        recipientFirstName: recipient.firstName,
        recipientSurname: recipient.surname,
        recipientNationalId: recipient.nationalId,
        recipientEmail: recipient.email,
        recipientCell: recipient.ecocashNumber,
        recipientAccountName: recipient.accountName,
      });

      const acquireResult = await acquire.mutateAsync({
        cardDetails: cardPayload,
        amountCents: grossCents,
      });

      if (!acquireResult.success) {
        setError(
          getErrorMessage(acquireResult.errorCode, acquireResult.errorMessage),
        );
        setProcessingPhase("error");
        stopPolling();
        return;
      }

      /* 3. Poll until backend confirms status + triggers disburse */
      setProcessingPhase(2);
      pollRef.current = setInterval(() => {
        refetchTx();
      }, 3_000);

      /* 4. Safety timeout — 5 minutes */
      setTimeout(
        () => {
          if (pollRef.current) {
            stopPolling();
            setError(
              "Transaction timed out. Please check History or contact support.",
            );
            setProcessingPhase("error");
          }
        },
        5 * 60 * 1_000,
      );

      /* 5. Trigger disburse after acquire (backend polls webhook, but we also call directly) */
      const disburseResult = await disburse.mutateAsync({
        ecocashNumber: recipient.ecocashNumber,
        amountCents: grossCents,
      });

      if (disburseResult.success) {
        stopPolling();
        setProcessingPhase("success");
      } else {
        stopPolling();
        setError(
          getErrorMessage(
            disburseResult.errorCode,
            disburseResult.errorMessage,
          ),
        );
        setProcessingPhase("error");
      }
    } catch (e: unknown) {
      stopPolling();
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      setError(msg);
      setProcessingPhase("error");
    }
  }, [
    card,
    cardDigits,
    cardLast4,
    grossCents,
    recipient,
    createTx,
    acquire,
    disburse,
    refetchTx,
    stopPolling,
  ]);

  const handleReset = () => {
    stopPolling();
    setFormStep(1);
    setAmount("");
    setRecipient({
      firstName: "",
      surname: "",
      nationalId: "",
      email: "",
      ecocashNumber: "",
      accountName: "",
    });
    setCard({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });
    setTxId(null);
    setProcessingPhase(0);
    setError(null);
  };

  const isSubmitting =
    createTx.isPending || acquire.isPending || disburse.isPending;

  /* ─────────── Render ─────────── */
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-display font-bold text-4xl sm:text-5xl mb-2">
          Send <span className="text-primary">Money Home</span>
        </h1>
        <p className="text-muted-foreground">
          Visa card → EcoCash, instant transfer.
        </p>
      </motion.div>

      {/* Form step indicators (steps 1 & 2) */}
      {formStep < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  formStep === s
                    ? "step-active text-primary-foreground"
                    : formStep > s
                      ? "step-complete text-success-foreground"
                      : "step-inactive text-muted-foreground"
                }`}
              >
                {formStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span
                className={`text-xs font-medium ${
                  formStep === s ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s === 1 ? "Details" : "Card"}
              </span>
              {s < 2 && (
                <div
                  className={`w-8 h-0.5 ${formStep > s ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ─── STEP 1: Amount + Recipient ─── */}
        {formStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="space-y-4"
          >
            {/* Amount */}
            <div className="card-dark glow-border p-6 rounded-2xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Amount (USD)
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="font-display text-4xl font-bold text-muted-foreground/40">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-ocid="send.amount.input"
                  className="amount-input"
                  min="1"
                  step="0.01"
                  max="500"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Min $1.00 · Max $500.00
              </p>
            </div>

            <FeeBreakdown grossCents={grossCents} />

            {/* Recipient Details */}
            <div className="card-dark p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  EcoCash Recipient Details
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="firstName"
                    className="text-xs text-muted-foreground"
                  >
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Tendai"
                    value={recipient.firstName}
                    onChange={(e) =>
                      setRecipientField("firstName", e.target.value)
                    }
                    data-ocid="send.recipient_first_name.input"
                    className="bg-input/40 border-border/60"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="surname"
                    className="text-xs text-muted-foreground"
                  >
                    Surname *
                  </Label>
                  <Input
                    id="surname"
                    placeholder="Moyo"
                    value={recipient.surname}
                    onChange={(e) =>
                      setRecipientField("surname", e.target.value)
                    }
                    data-ocid="send.recipient_surname.input"
                    className="bg-input/40 border-border/60"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="nationalId"
                  className="text-xs text-muted-foreground"
                >
                  National ID *
                </Label>
                <Input
                  id="nationalId"
                  placeholder="00 1234567 A 00"
                  value={recipient.nationalId}
                  onChange={(e) =>
                    setRecipientField("nationalId", e.target.value)
                  }
                  data-ocid="send.recipient_national_id.input"
                  className="bg-input/40 border-border/60 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="recipientEmail"
                  className="text-xs text-muted-foreground"
                >
                  Email Address *
                </Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="tendai.moyo@example.com"
                  value={recipient.email}
                  onChange={(e) => setRecipientField("email", e.target.value)}
                  data-ocid="send.recipient_email.input"
                  className="bg-input/40 border-border/60"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="ecocash"
                  className="text-xs text-muted-foreground"
                >
                  EcoCash Number *
                </Label>
                <Input
                  id="ecocash"
                  placeholder="0771234567"
                  value={recipient.ecocashNumber}
                  onChange={(e) =>
                    setRecipientField(
                      "ecocashNumber",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  data-ocid="send.ecocash_number.input"
                  inputMode="numeric"
                  className="bg-input/40 border-border/60 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Zimbabwe format: 07XXXXXXXX
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="accountName"
                  className="text-xs text-muted-foreground"
                >
                  Account Name *
                </Label>
                <Input
                  id="accountName"
                  placeholder="Tendai Moyo"
                  value={recipient.accountName}
                  onChange={(e) =>
                    setRecipientField("accountName", e.target.value)
                  }
                  data-ocid="send.recipient_account_name.input"
                  className="bg-input/40 border-border/60"
                />
                <p className="text-xs text-muted-foreground">
                  Name exactly as registered on EcoCash
                </p>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30"
                data-ocid="send.step1.error_state"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleStep1Continue}
              data-ocid="send.step1.primary_button"
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
            >
              {!isLoggedIn ? (
                <>
                  <Lock className="w-4 h-4 mr-2" /> Login to Continue
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 mr-2" /> Continue to Card
                  Details
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              🔒 Secured by ContiPay PCI-DSS compliant infrastructure
            </p>
          </motion.div>
        )}

        {/* ─── STEP 2: Card Details ─── */}
        {formStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="space-y-4"
          >
            {/* Card preview */}
            <div className="visa-card rounded-2xl p-6 aspect-[1.7/1] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display font-bold text-base tracking-widest text-white/80">
                  VISA
                </span>
              </div>
              <div>
                <p className="font-mono text-lg tracking-[0.2em] text-white/90 mb-3">
                  {card.cardNumber
                    ? card.cardNumber.padEnd(19, "·").slice(0, 19)
                    : "···· ···· ···· ····"}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">
                      Card Holder
                    </p>
                    <p className="text-sm font-medium text-white/80 uppercase tracking-wide">
                      {card.cardholderName || "YOUR NAME"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">
                      Expires
                    </p>
                    <p className="text-sm font-mono text-white/80">
                      {card.expiry || "MM/YYYY"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card form */}
            <div className="card-dark p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Zimbabwe USD Visa Card
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cardholderName"
                  className="text-xs text-muted-foreground"
                >
                  Cardholder Full Name *
                </Label>
                <Input
                  id="cardholderName"
                  placeholder="e.g. Kudakwashe Chikukwa"
                  value={card.cardholderName}
                  onChange={(e) =>
                    setCardField("cardholderName", e.target.value)
                  }
                  data-ocid="send.cardholder_name.input"
                  autoComplete="cc-name"
                  className="bg-input/40 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cardNumber"
                  className="text-xs text-muted-foreground"
                >
                  Card Number *
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="4444 4444 4444 4444"
                  value={card.cardNumber}
                  onChange={(e) =>
                    setCardField(
                      "cardNumber",
                      formatCardDisplay(e.target.value),
                    )
                  }
                  data-ocid="send.card_number.input"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  maxLength={19}
                  className="bg-input/40 border-border/60 font-mono tracking-widest text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="expiry"
                    className="text-xs text-muted-foreground"
                  >
                    Expiry (MM/YYYY) *
                  </Label>
                  <Input
                    id="expiry"
                    placeholder="08/2027"
                    value={card.expiry}
                    onChange={(e) => handleFormatExpiry(e.target.value)}
                    data-ocid="send.expiry.input"
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    maxLength={7}
                    className="bg-input/40 border-border/60 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="cvv"
                    className="text-xs text-muted-foreground"
                  >
                    CVV *
                  </Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="•••"
                    value={card.cvv}
                    onChange={(e) =>
                      setCardField(
                        "cvv",
                        e.target.value.replace(/\D/g, "").slice(0, 3),
                      )
                    }
                    data-ocid="send.cvv.input"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    maxLength={3}
                    className="bg-input/40 border-border/60 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card-dark p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sending to</p>
                <p className="text-sm font-medium">
                  {recipient.firstName} {recipient.surname}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {recipient.ecocashNumber.slice(0, 4)}***
                  {recipient.ecocashNumber.slice(-2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-display font-bold text-2xl text-primary">
                  ${grossCents ? (Number(grossCents) / 100).toFixed(2) : "—"}
                </p>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30"
                data-ocid="send.step2.error_state"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFormStep(1);
                  setError(null);
                }}
                data-ocid="send.back.secondary_button"
                className="flex-1 border-border"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                data-ocid="send.authorize.primary_button"
                className="flex-[2] h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow animate-pulse_glow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Authorizing…
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" /> Authorize Payment
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              🔒 Full card details are transmitted securely to ContiPay&apos;s
              PCI-DSS compliant API. Not stored on-chain.
            </p>
          </motion.div>
        )}

        {/* ─── STEP 3: Processing ─── */}
        {formStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ProcessingStepper
              phase={processingPhase}
              ecocashNumber={recipient.ecocashNumber}
              txId={txId}
              grossCents={grossCents}
              error={error}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
