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
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const ERROR_CODE_MAP: Record<string, string> = {
  INSUFFICIENT_FUNDS: "Your card has insufficient funds.",
  CARD_DECLINED: "Your card was declined. Please check your details.",
  INVALID_CARD: "Card details are invalid.",
  TIMEOUT: "The request timed out. Please try again.",
};

function getErrorMessage(code?: string): string {
  if (!code) return "Transaction failed. Please try again or contact support.";
  return (
    ERROR_CODE_MAP[code] ??
    "Transaction failed. Please try again or contact support."
  );
}

function dollarsToCents(dollars: string): bigint | null {
  const val = Number.parseFloat(dollars);
  if (Number.isNaN(val) || val <= 0) return null;
  return BigInt(Math.round(val * 100));
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

type Step = 1 | 2 | 3;

function Stepper({ currentStep }: { currentStep: Step }) {
  const steps = [
    { num: 1, label: "Authorize Card", icon: CreditCard },
    { num: 2, label: "Verify Settlement", icon: Wifi },
    { num: 3, label: "Payout to EcoCash", icon: Banknote },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 ${
                currentStep > step.num
                  ? "step-complete text-white"
                  : currentStep === step.num
                    ? "step-active text-primary-foreground"
                    : "step-inactive text-muted-foreground"
              }`}
            >
              {currentStep > step.num ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                currentStep === step.num
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-16 sm:w-20 h-0.5 mx-2 transition-all duration-500 ${
                currentStep > step.num ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FeeBreakdown({ grossCents }: { grossCents: bigint | null }) {
  const { data: fees, isLoading } = useCalculateFees(grossCents);

  if (!grossCents || grossCents <= 0n) {
    return (
      <div className="card-dark p-4 rounded-xl space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Fee Breakdown
        </p>
        <p className="text-sm text-muted-foreground">
          Enter an amount to see fees
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="card-dark p-4 rounded-xl space-y-2"
        data-ocid="fees.loading_state"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Fee Breakdown
        </p>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const gross = Number(grossCents) / 100;
  const fee = fees ? Number(fees.fee) / 100 : null;
  const imtt = gross * 0.02;
  const total = fees ? Number(fees.totalCharged) / 100 : null;
  const net = fees ? Number(fees.netToRecipient) / 100 : null;

  return (
    <div className="card-dark p-4 rounded-xl space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Fee Breakdown
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-mono font-medium">${gross.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Service Fee ($1.00 + 6%)
          </span>
          <span className="font-mono font-medium text-destructive">
            -${fee !== null ? fee.toFixed(2) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <div>
            <span className="text-muted-foreground">IMTT Tax (2%)</span>
            <span className="block text-xs text-muted-foreground/60">
              Display only — included in net
            </span>
          </div>
          <span className="font-mono font-medium text-muted-foreground">
            ${imtt.toFixed(2)}
          </span>
        </div>
        <div className="border-t border-border/50 pt-2 flex justify-between">
          <span className="text-muted-foreground">Total Charged</span>
          <span className="font-mono font-semibold">
            ${total !== null ? total.toFixed(2) : "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">
            Net to Recipient
          </span>
          <span className="font-display font-bold text-lg text-primary">
            ${net !== null ? net.toFixed(2) : "—"}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <span className="text-emerald-400 text-xs mt-0.5">✓</span>
        <p className="text-xs text-emerald-400/80">
          15% Digital Tax does <strong>NOT</strong> apply — this is a local
          Zimbabwe (ZW) transaction.
        </p>
      </div>
    </div>
  );
}

export default function SendMoney() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const [step, setStep] = useState<Step>(1);
  const [amount, setAmount] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [ecocashNumber, setEcocashNumber] = useState("");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);

  const grossCents = dollarsToCents(amount);
  const cardDigits = cardNumber.replace(/\s/g, "");
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

  // Watch transactions for our txId status changes
  useEffect(() => {
    if (!txId || step !== 2) return;
    const tx = transactions?.find((t) => t.id === txId);
    if (!tx) return;
    setTxStatus(tx.status);
    if (
      tx.status === TransactionStatus.verifying ||
      tx.status === TransactionStatus.completed
    ) {
      stopPolling();
      // Trigger disbursement
      const netCents = grossCents ? grossCents : 0n;
      disburse
        .mutateAsync({ ecocashNumber, amountCents: netCents })
        .then(() => setStep(3))
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "Disbursement failed.";
          setError(msg);
        });
    } else if (tx.status === TransactionStatus.failed) {
      stopPolling();
      setError(getErrorMessage(tx.errorMessage));
    }
  }, [
    transactions,
    txId,
    step,
    grossCents,
    ecocashNumber,
    disburse,
    stopPolling,
  ]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleFormatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setExpiry(digits);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!isLoggedIn) {
      login();
      return;
    }

    // Validate
    if (!cardholderName.trim()) {
      setError("Cardholder name is required.");
      return;
    }
    if (cardDigits.length !== 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      setError("Expiry must be in MM/YY format.");
      return;
    }
    if (cvv.length < 3) {
      setError("CVV must be 3 digits.");
      return;
    }
    if (!grossCents || grossCents < 100n) {
      setError("Minimum send amount is $1.00.");
      return;
    }
    if (!ecocashNumber.match(/^07\d{8}$/)) {
      setError("EcoCash number must be in format 07XXXXXXXX.");
      return;
    }

    setError(null);

    try {
      // Step 1: Create transaction record
      const id = await createTx.mutateAsync({
        amountCents: grossCents,
        recipientEcocash: ecocashNumber,
        senderName: cardholderName,
        cardLast4,
      });
      setTxId(id);

      // Step 2: Acquire funds from card
      const cardPayload = JSON.stringify({
        cardholderName,
        cardNumber: cardDigits,
        expiry,
        cvv,
      });

      const acquireResult = await acquire.mutateAsync({
        cardDetails: cardPayload,
        amountCents: grossCents,
      });

      if (!acquireResult.success) {
        setError(getErrorMessage(acquireResult.errorCode));
        return;
      }

      // Move to verification step and start polling
      setStep(2);
      pollRef.current = setInterval(() => {
        refetchTx();
      }, 3_000);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to initiate transaction.";
      setError(msg);
    }
  }, [
    isLoggedIn,
    login,
    cardholderName,
    cardDigits,
    expiry,
    cvv,
    grossCents,
    ecocashNumber,
    cardLast4,
    createTx,
    acquire,
    refetchTx,
  ]);

  const handleReset = () => {
    stopPolling();
    setStep(1);
    setAmount("");
    setCardholderName("");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setEcocashNumber("");
    setTxId(null);
    setError(null);
    setTxStatus(null);
  };

  const isSubmitting = createTx.isPending || acquire.isPending;
  const isDisbursing = disburse.isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-3"
        >
          Send Money <span className="text-primary">Home</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-base"
        >
          Pull from your Zimbabwe USD Visa card — delivered instantly to
          EcoCash.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Stepper currentStep={step} />
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Form ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Amount */}
            <div className="card-dark glow-border p-6 rounded-2xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Amount (USD)
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display text-5xl font-bold text-muted-foreground/60">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-ocid="send.amount.input"
                  className="amount-input w-48 placeholder:text-muted-foreground/30"
                  min="1"
                  step="0.01"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Minimum $1.00 — Maximum $500.00
              </p>
            </div>

            <FeeBreakdown grossCents={grossCents} />

            {/* Visa Card Details */}
            <div className="card-dark p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Visa Card Details
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cardholderName"
                  className="text-sm text-muted-foreground"
                >
                  Cardholder Full Name
                </Label>
                <Input
                  id="cardholderName"
                  placeholder="e.g. Tendai Moyo"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  data-ocid="send.cardholder_name.input"
                  autoComplete="cc-name"
                  className="bg-input/50 border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cardNumber"
                  className="text-sm text-muted-foreground"
                >
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="4444 4444 4444 4444"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  data-ocid="send.card_number.input"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  maxLength={19}
                  className="bg-input/50 border-border/50 font-mono tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="expiry"
                    className="text-sm text-muted-foreground"
                  >
                    Expiry (MM/YY)
                  </Label>
                  <Input
                    id="expiry"
                    placeholder="08/27"
                    value={expiry}
                    onChange={(e) => handleFormatExpiry(e.target.value)}
                    data-ocid="send.expiry.input"
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    maxLength={5}
                    className="bg-input/50 border-border/50 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="cvv"
                    className="text-sm text-muted-foreground"
                  >
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    data-ocid="send.cvv.input"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    maxLength={3}
                    className="bg-input/50 border-border/50 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* EcoCash Recipient */}
            <div className="card-dark p-5 rounded-2xl space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                EcoCash Recipient
              </p>
              <div className="space-y-1.5">
                <Label
                  htmlFor="ecocash"
                  className="text-sm text-muted-foreground"
                >
                  EcoCash Number
                </Label>
                <Input
                  id="ecocash"
                  placeholder="e.g. 0771234567"
                  value={ecocashNumber}
                  onChange={(e) =>
                    setEcocashNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  data-ocid="send.ecocash_number.input"
                  inputMode="numeric"
                  className="bg-input/50 border-border/50 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Zimbabwe format: 07XXXXXXXX
                </p>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                data-ocid="send.error_state"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-ocid="send.submit.primary_button"
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse_glow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…
                </>
              ) : !isLoggedIn ? (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" /> Login & Continue
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" /> Authorize Payment
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              🔒 Card details are transmitted securely via ContiPay's PCI-DSS
              compliant gateway.
            </p>
          </motion.div>
        )}

        {/* ── STEP 2: Verifying ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div
              className="card-dark glow-border p-8 rounded-2xl text-center space-y-6"
              data-ocid="verify.panel"
            >
              <div className="w-16 h-16 rounded-full step-active flex items-center justify-center mx-auto animate-pulse_glow">
                {isDisbursing ? (
                  <Banknote className="w-7 h-7 text-primary-foreground" />
                ) : (
                  <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-2">
                  {isDisbursing ? "Disbursing Funds…" : "Verifying Settlement"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {isDisbursing
                    ? "Sending funds to EcoCash. Please wait…"
                    : "Confirming your payment with ContiPay. This may take a moment."}
                </p>
              </div>

              {txId && (
                <div className="text-left p-3 rounded-lg bg-muted/20 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Transaction ID
                  </p>
                  <p className="text-xs font-mono text-foreground/80 break-all">
                    {txId}
                  </p>
                  {txStatus && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Status:{" "}
                      <span className="text-primary capitalize">
                        {txStatus}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                  data-ocid="verify.error_state"
                >
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {error && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  data-ocid="verify.retry.secondary_button"
                  className="border-border/50"
                >
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div
              className="card-dark p-8 rounded-2xl text-center space-y-6"
              style={{
                border: "1px solid oklch(0.68 0.2 145 / 0.5)",
                boxShadow: "0 0 32px oklch(0.68 0.2 145 / 0.15)",
              }}
              data-ocid="success.panel"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: "oklch(0.68 0.2 145)",
                  boxShadow: "0 0 32px oklch(0.68 0.2 145 / 0.4)",
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h2 className="font-display font-bold text-3xl text-foreground mb-2">
                  Money Sent!
                </h2>
                <p className="text-muted-foreground">
                  Funds are being disbursed to{" "}
                  <span className="text-foreground font-mono">
                    {ecocashNumber.slice(0, 4)}***{ecocashNumber.slice(-2)}
                  </span>{" "}
                  via EcoCash.
                </p>
              </div>

              {grossCents && (
                <div className="inline-block px-6 py-3 rounded-xl bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    Amount Sent
                  </p>
                  <p className="font-display font-bold text-3xl text-primary">
                    ${(Number(grossCents) / 100).toFixed(2)}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                ⚠️ Disbursements to EcoCash are{" "}
                <strong>final and non-reversible</strong> once confirmed.
              </p>

              <Button
                onClick={handleReset}
                data-ocid="success.new_transfer.primary_button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Send Another Transfer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
