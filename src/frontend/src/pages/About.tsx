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
      "Designed specifically for Zimbabwean students who need a fast, affordable way to support family back home.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Every transaction is cryptographically verified server-to-server with ContiPay before disbursement. No fake confirmations.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Enter Amount & Recipient",
    description:
      "Enter the amount you want to send and the recipient's EcoCash number and personal details.",
  },
  {
    step: "02",
    title: "Authorize Your Visa Card",
    description:
      "Securely enter your Zimbabwe USD Visa card details. They are transmitted directly to ContiPay's PCI-DSS compliant gateway.",
  },
  {
    step: "03",
    title: "Funds Hit EcoCash",
    description:
      "Once ContiPay confirms payment, funds are disbursed directly to the recipient's EcoCash wallet. Typically within minutes.",
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-5 bg-primary/10 border border-primary/25 text-primary">
          Mahachi Desmond Private Limited
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
          About <span className="text-primary">7 Bucks</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Bridging the gap for Zimbabwean students to support parents and peers
          instantly using local USD Visa cards.
        </p>
      </motion.div>

      {/* Legal entity */}
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
        <p className="text-base font-medium">
          7 Bucks is a product of{" "}
          <strong className="text-primary">
            Mahachi Desmond Private Limited
          </strong>{" "}
          (Reg: <span className="font-mono text-sm">24167A02122024</span>).
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Registered in Zimbabwe. Operating under applicable Zimbabwean
          financial regulations including the Money Laundering and Proceeds of
          Crime Act (Chapter 9:24).
        </p>
      </motion.div>

      {/* Features */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="card-dark p-5 rounded-xl"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center mb-3">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-sm mb-1.5">
              {f.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card-dark p-6 rounded-2xl mb-8"
        data-ocid="about.how.card"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          How It Works
        </p>
        <div className="space-y-6">
          {howItWorks.map((s, i) => (
            <div key={s.step} className="flex gap-4">
              <div className="shrink-0 w-9 h-9 rounded-full step-active flex items-center justify-center">
                <span className="font-display font-bold text-xs text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card-dark p-6 rounded-2xl mb-6"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Our Mission
        </p>
        <p className="leading-relaxed text-sm text-muted-foreground">
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
        transition={{ delay: 0.55 }}
        className="p-4 rounded-xl flex items-start gap-3 bg-warning/8 border border-warning/25"
        data-ocid="about.finality.card"
      >
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-warning/90">
          <strong>Transaction Finality:</strong> Disbursements to the EcoCash
          network are <strong>final and non-reversible</strong> once confirmed
          by the system. Please double-check all recipient details before
          authorizing payment.
        </p>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Questions? Contact us at{" "}
          <a
            href="mailto:support@mahachi.co.zw"
            className="text-primary hover:underline"
          >
            support@mahachi.co.zw
          </a>
        </p>
      </motion.div>
    </div>
  );
}
