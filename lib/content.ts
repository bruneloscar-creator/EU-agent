export const exampleQuestions = [
  {
    text: "What does the AI Act consider a high-risk system?",
    mode: "Explainer"
  },
  {
    text: "Compare GDPR Article 6 with the Data Act's access rules.",
    mode: "Pro"
  },
  {
    text: "What does the Chips Act actually fund?",
    mode: "Explainer"
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
