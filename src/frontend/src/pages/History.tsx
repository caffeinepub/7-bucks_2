import { type Transaction, TransactionStatus } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useIsAdmin, useUserTransactions } from "@/hooks/useQueries";
import { useQuery } from "@tanstack/react-query";
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

const STATUS_CLASSES: Partial<Record<TransactionStatus, string>> = {
  [TransactionStatus.pending]:
    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  [TransactionStatus.authorizing]:
    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  [TransactionStatus.verifying]:
    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  [TransactionStatus.disbursing]:
    "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  [TransactionStatus.completed]: "bg-success/15 text-success border-success/30",
  [TransactionStatus.failed]:
    "bg-destructive/15 text-destructive border-destructive/30",
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
        STATUS_CLASSES[status] ??
        "bg-muted/20 text-muted-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}

function TxCard({ tx, index }: { tx: Transaction; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-dark p-4 rounded-xl"
      data-ocid={`history.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {tx.senderName}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {maskPhone(tx.recipientEcocash)}
            </p>
            {tx.contipayRef && (
              <p className="text-xs text-muted-foreground/60 font-mono truncate">
                Ref: {tx.contipayRef}
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display font-bold text-lg text-foreground">
            ${centsToDisplay(tx.amountCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Fee: ${centsToDisplay(tx.feeCents)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <StatusBadge status={tx.status} />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDate(tx.createdAt)}
        </div>
      </div>

      {tx.errorMessage && (
        <p className="text-xs text-destructive mt-2 pt-2 border-t border-destructive/20">
          ⚠ {tx.errorMessage}
        </p>
      )}
    </motion.div>
  );
}

function useAllTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5_000,
  });
}

export default function History() {
  const { loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { data: isAdmin } = useIsAdmin();
  const userTx = useUserTransactions();
  const adminTx = useAllTransactions();

  const { data: transactions, isLoading } = isAdmin ? adminTx : userTx;

  if (!isLoggedIn) {
    return (
      <div
        className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="history.error_state"
      >
        <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="font-display font-bold text-2xl mb-2">Login Required</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Please log in to view your transaction history.
        </p>
        <Button
          asChild
          className="bg-primary text-primary-foreground shadow-glow"
        >
          <Link to="/" data-ocid="history.login.link">
            Go to Send Money
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display font-bold text-3xl mb-1">
          Transaction History
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "All platform transactions (admin view)."
            : "Your money transfers, most recent first."}
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="history.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-dark p-12 rounded-2xl text-center"
          data-ocid="history.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-lg mb-1">
            No transfers yet
          </p>
          <p className="text-sm text-muted-foreground">
            Your completed transfers will appear here.
          </p>
          <Button asChild className="mt-6 bg-primary text-primary-foreground">
            <Link to="/">Send Money Now</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3" data-ocid="history.list">
          {[...transactions]
            .sort((a, b) => Number(b.createdAt - a.createdAt))
            .map((tx, i) => (
              <TxCard key={tx.id} tx={tx} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}
