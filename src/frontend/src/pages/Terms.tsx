import { motion } from "motion/react";

interface Section {
  id: string;
  title: string;
  content: string[];
}

const sections: Section[] = [
  {
    id: "overview",
    title: "1. Service Overview",
    content: [
      "7 Bucks is a digital money transfer service operated by Mahachi Desmond Private Limited (Reg: 24167A02122024), a company registered in Zimbabwe.",
      "The service enables Zimbabwean students holding local USD Visa cards to transfer funds to EcoCash mobile money accounts within Zimbabwe via the ContiPay payment infrastructure.",
      "By using 7 Bucks, you agree to be bound by these Terms and Conditions in their entirety.",
    ],
  },
  {
    id: "fees",
    title: "2. Fees & Charges",
    content: [
      "A Service Fee of USD $1.00 plus 6% of the gross transaction amount is charged per transfer.",
      "IMTT (Intermediated Money Transfer Tax) at 2% is a statutory levy by the Government of Zimbabwe, absorbed within the Net Payout — not charged separately.",
      "The 15% Digital Services Tax does NOT apply — all transfers are local Zimbabwe (ZW) domestic transactions.",
      "The Net Payout amount is the exact amount the recipient will receive, with no hidden charges.",
      "All fees are non-refundable once a transaction has been initiated.",
    ],
  },
  {
    id: "finality",
    title: "3. Transaction Finality",
    content: [
      "ALL DISBURSEMENTS TO THE ECOCASH NETWORK ARE FINAL AND NON-REVERSIBLE ONCE CONFIRMED BY THE 7 BUCKS SYSTEM.",
      "Confirmation occurs only after a cryptographically signed SUCCESS status is received from ContiPay via server-to-server verification.",
      "It is the sender's sole responsibility to verify the recipient's EcoCash number before submitting. Funds sent to an incorrect number cannot be recovered.",
      "Transaction statuses of 'completed' indicate funds have been dispatched to the EcoCash network.",
    ],
  },
  {
    id: "responsibilities",
    title: "4. User Responsibilities",
    content: [
      "You must be the legitimate cardholder of any Visa card used on the platform.",
      "You are responsible for maintaining the confidentiality of your account credentials and Internet Identity.",
      "You must not use 7 Bucks for any unlawful purpose, including money laundering, fraud, or financing prohibited activities.",
      "You must ensure that all personal information provided is accurate and current.",
      "You must comply with all applicable Zimbabwean regulations, including the Money Laundering and Proceeds of Crime Act (Chapter 9:24).",
    ],
  },
  {
    id: "liability",
    title: "5. Limitation of Liability",
    content: [
      "Mahachi Desmond Private Limited's total liability shall not exceed the value of the transaction giving rise to the claim.",
      "We are not liable for: delays in EcoCash delivery, losses from incorrect recipient information, or service interruptions from ContiPay or telecommunications providers.",
      "The service is provided 'as is' without warranties, to the extent permitted by Zimbabwean law.",
    ],
  },
  {
    id: "governing",
    title: "6. Governing Law",
    content: [
      "These Terms are governed by the laws of the Republic of Zimbabwe.",
      "Any disputes shall be subject to the exclusive jurisdiction of the courts of Zimbabwe.",
      "Mahachi Desmond Private Limited reserves the right to amend these Terms at any time with notice.",
      "Contact: legal@mahachi.co.zw — Mahachi Desmond Private Limited, Harare, Zimbabwe.",
    ],
  },
  {
    id: "privacy",
    title: "7. Data Privacy",
    content: [
      "Personal data collected during transactions (name, national ID, phone number, email) is used solely for processing payments via ContiPay.",
      "Card details are transmitted directly to ContiPay's PCI-DSS compliant infrastructure and are never stored on the 7 Bucks system.",
      "Transaction records are retained for a minimum of 7 years as required by Zimbabwean financial regulations.",
      "We do not sell or share personal data with third parties beyond what is required to process your transaction.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="font-display font-bold text-4xl mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-muted-foreground text-sm">
          Last updated: April 2026 · Mahachi Desmond Private Limited (Reg:
          24167A02122024)
        </p>
      </motion.div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-dark p-6 rounded-2xl"
            data-ocid={`terms.${section.id}.panel`}
          >
            <h2 className="font-display font-bold text-base mb-4 text-foreground">
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.content.map((para, j) => (
                <li
                  key={`${section.id}-${j}`}
                  className="text-sm text-muted-foreground leading-relaxed flex gap-2"
                >
                  <span className="text-border shrink-0 mt-0.5">•</span>
                  <span>{para}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-xs text-muted-foreground"
      >
        © {new Date().getFullYear()} Mahachi Desmond Private Limited (Reg:
        24167A02122024). All rights reserved.
      </motion.div>
    </div>
  );
}
