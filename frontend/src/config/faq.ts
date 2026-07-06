export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "How do I upgrade to a company (B2B) account?",
    answer:
      "Open your profile and submit a company affiliation request with your company's NIP number. Once the NIP is verified, your account is linked to the company and you'll see company pricing and B2B-only products immediately.",
  },
  {
    question: "Can I browse B2B-only products without a company account?",
    answer:
      "Yes. Anyone can view B2B-only products and their listed prices while browsing. Purchasing them, however, requires an active company account making the order under a B2B purchase type.",
  },
  {
    question: "Do products come with certificates or a Certificate of Analysis (CoA)?",
    answer:
      "Reagents and chemical products ship with a Certificate of Analysis (CoA), and applicable equipment includes calibration and compliance documentation. Reach out to Technical Support if you need a copy ahead of purchase.",
  },
  {
    question: "How do you handle freight and shipping?",
    answer:
      "Orders are shipped from our main warehouse in Tarnów. Shipping cost and lead time depend on order weight, volume, and destination, and are calculated at checkout before you confirm your order.",
  },
  {
    question: "What is your return policy for reagents?",
    answer:
      "Unopened reagents in original, undamaged packaging can be returned within 14 days of delivery. Opened chemical containers cannot be returned for safety and compliance reasons unless the product was defective on arrival.",
  },
  {
    question: "Can I pay with a purchase order or on Net 30 terms?",
    answer:
      "Company accounts in good standing can request Net 30 invoicing and pay by purchase order. Contact our Accounting & Billing team to set up terms for your company.",
  },
  {
    question: "How do volume and company discounts work?",
    answer:
      "Many products have quantity-based discount tiers, so unit price drops as order quantity increases. Verified company accounts also receive negotiated company-specific pricing on top of standard catalog prices where applicable.",
  },
  {
    question: "Why do I need to confirm my email address?",
    answer:
      "We use double opt-in verification: after registering, you'll receive a confirmation email. Confirming it activates your account and ensures order and billing notifications reach the correct address.",
  },
];
