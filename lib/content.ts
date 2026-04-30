export const exampleQuestions = [
  {
    text: "What does the AI Act consider a high-risk system?",
    mode: "Explainer",
    domain: "AI & data"
  },
  {
    text: "Compare GDPR Article 6 with the Data Act's access rules.",
    mode: "Pro",
    domain: "AI & data"
  },
  {
    text: "What does the Chips Act fund, and how is it structured?",
    mode: "Explainer",
    domain: "Industrial & strategic"
  },
  {
    text: "What does the Draghi Report recommend on EU competitiveness?",
    mode: "Explainer",
    domain: "Industrial & strategic"
  },
  {
    text: "How does CBAM interact with the Emissions Trading System?",
    mode: "Pro",
    domain: "Finance & climate"
  },
  {
    text: "What are MiCA's reserve requirements for stablecoins?",
    mode: "Pro",
    domain: "Finance & climate"
  }
] as const;

export const indexedTexts = [
  "AI Act",
  "GDPR",
  "DSA",
  "DMA",
  "Chips Act",
  "Draghi Report"
] as const;

export const indexedTextsV0 = {
  "Tech & digital": [
    "AI Act",
    "GDPR",
    "Digital Services Act",
    "Digital Markets Act",
    "Data Act",
    "Data Governance Act",
    "Cyber Resilience Act",
    "NIS2 Directive",
    "eIDAS 2.0",
    "European Media Freedom Act"
  ],
  Industrial: [
    "European Chips Act",
    "Critical Raw Materials Act",
    "Net-Zero Industry Act"
  ],
  Green: [
    "Corporate Sustainability Reporting Directive",
    "Corporate Sustainability Due Diligence Directive",
    "EU Taxonomy Regulation"
  ],
  Finance: ["Markets in Crypto-Assets Regulation", "DORA"],
  "Strategic documents": ["Draghi Report", "EU Competitiveness Compass"]
} as const;
