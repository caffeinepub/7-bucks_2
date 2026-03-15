import { type Transaction, TransactionStatus } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useUserTransactions } from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Lock } from "lucide-react";
import { motion } from "motion/react";

function centsToDisplay(cents: bigint): string {
  return (Number(cents) / 100).toFixed(2);
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-ZW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const classes: Partial<Record<TransactionStatus, string>> = {
    [TransactionStatus.pending]:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    [TransactionStatus.authorizing]:
      "bg-blue-500/15 text-blue-400 border-blue-500/30",
    [TransactionStatus.verifying]:
      "bg-blue-500/15 text-blue-400 border-blue-500/30",
    [TransactionStatus.disbursing]:
      "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    [TransactionStatus.completed]:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    [TransactionStatus.failed]: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
        classes[status] ?? "bg-muted/20 text-muted-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}

function TxRow({ tx, index }: { tx: Transaction; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-dark p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0"
      data-ocid={`history.item.${index + 1}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{tx.senderName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {maskPhone(tx.recipientEcocash)}
          </p>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-0.5 sm:min-w-[100px]">
        <p className="font-display font-bold text-base text-foreground">
          ${centsToDisplay(tx.amountCents)}
        </p>
        <p className="text-xs text-muted-foreground">
          Fee: ${centsToDisplay(tx.feeCents)}
        </p>
        <p className="text-xs text-muted-foreground font-semibold">
          Total: ${centsToDisplay(tx.totalChargedCents)}
        </p>
      </div>

      <div className="flex sm:flex-col items-center sm:items-center justify-between gap-2 sm:gap-1 sm:ml-6">
        <StatusBadge status={tx.status} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDate(tx.createdAt)}
        </div>
      </div>

      {tx.errorMessage && (
        <p className="text-xs text-destructive mt-1 sm:mt-0 sm:ml-4 w-full sm:w-auto">
          {tx.errorMessage}
        </p>
      )}
    </motion.div>
  );
}

export default function History() {
  const { loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { data: transactions, isLoading } = useUserTransactions();

  if (!isLoggedIn) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="history.error_state"
      >
        <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          Login Required
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Please log in to view your transaction history.
        </p>
        <Button asChild className="bg-primary text-primary-foreground">
          <Link to="/" data-ocid="history.login.link">
            Go to Send Money
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display font-bold text-3xl text-foreground mb-1">
          Transaction History
        </h1>
        <p className="text-muted-foreground text-sm">
          All your money transfers in one place.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="history.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-dark p-12 rounded-2xl text-center"
          data-ocid="history.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-lg text-foreground mb-1">
            No transfers yet
          </p>
          <p className="text-sm text-muted-foreground">
            Your completed transfers will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3" data-ocid="history.list">
          {transactions.map((tx, i) => (
            <TxRow key={tx.id} tx={tx} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
