import { AlertTriangle, Shield, Users, Zap } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Zap,
    title: "Instant Transfers",
    description:
      "Pull funds from your Zimbabwe-issued USD Visa card and have them land on any EcoCash number within minutes.",
  },
  {
    icon: Users,
    title: "Built for Students",
    description:
      "Designed specifically for Zimbabwean students abroad who need a fast, affordable way to support family back home.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Every transaction is cryptographically verified server-to-server with ContiPay before disbursement. No fake confirmations.",
  },
];

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-5"
          style={{
            background: "oklch(0.72 0.2 210 / 0.12)",
            border: "1px solid oklch(0.72 0.2 210 / 0.3)",
            color: "oklch(0.72 0.2 210)",
          }}
        >
          Mahachi Desmond Private Limited
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
          About <span className="text-primary">7 Bucks</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Bridging the gap for Zimbabwean students to support parents and peers
          instantly using local USD Visa cards.
        </p>
      </motion.div>

      {/* Entity card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-dark glow-border p-6 rounded-2xl mb-8"
        data-ocid="about.entity.card"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Legal Entity
        </p>
        <p className="text-foreground text-base font-medium">
          7 Bucks is a product of{" "}
          <strong className="text-primary">
            Mahachi Desmond Private Limited
          </strong>{" "}
          (Reg: <span className="font-mono text-sm">24167A02122024</span>).
        </p>
      </motion.div>

      {/* Feature cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="card-dark p-5 rounded-xl"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ background: "oklch(0.72 0.2 210 / 0.15)" }}
            >
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-sm text-foreground mb-1.5">
              {f.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-dark p-6 rounded-2xl mb-6"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Our Mission
        </p>
        <p className="text-foreground leading-relaxed">
          Zimbabwean students holding local USD Student Visa cards face
          significant friction when supporting family back home. Traditional
          channels are slow, expensive, or restricted to bank-only transfers. 7
          Bucks removes that barrier — pulling directly from your Visa card and
          delivering via EcoCash, Zimbabwe's most widely used mobile money
          platform.
        </p>
      </motion.div>

      {/* Finality notice */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl flex items-start gap-3"
        style={{
          background: "oklch(0.82 0.19 70 / 0.08)",
          border: "1px solid oklch(0.82 0.19 70 / 0.25)",
        }}
        data-ocid="about.finality.card"
      >
        <AlertTriangle
          className="w-4 h-4 shrink-0 mt-0.5"
          style={{ color: "oklch(0.82 0.19 70)" }}
        />
        <p className="text-sm" style={{ color: "oklch(0.82 0.19 70 / 0.9)" }}>
          <strong>Transaction Finality:</strong> Disbursements to the EcoCash
          network are <strong>final and non-reversible</strong> once confirmed
          by the system. Please double-check all recipient details before
          authorizing payment.
        </p>
      </motion.div>
    </div>
  );
}
