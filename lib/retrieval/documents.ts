import type { DocumentType } from "@/lib/retrieval/types";

export type SourceDocument = {
  id: string;
  shortName: string;
  fullTitle: string;
  type: DocumentType;
  group: string;
  celex?: string;
  eurlexUrl?: string;
  sourceUrl: string;
  sourceKind: "cellar-celex" | "pdf" | "web-pdf";
};

const eurlex = (celex: string) =>
  `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:${celex}`;

export const sourceDocuments: SourceDocument[] = [
  {
    id: "32024R1689",
    shortName: "AI Act",
    fullTitle: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence",
    type: "regulation",
    group: "Tech & digital",
    celex: "32024R1689",
    eurlexUrl: eurlex("32024R1689"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32024R1689",
    sourceKind: "cellar-celex"
  },
  {
    id: "32022R2065",
    shortName: "Digital Services Act",
    fullTitle: "Regulation (EU) 2022/2065 on a Single Market For Digital Services",
    type: "regulation",
    group: "Tech & digital",
    celex: "32022R2065",
    eurlexUrl: eurlex("32022R2065"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32022R2065",
    sourceKind: "cellar-celex"
  },
  {
    id: "32022R1925",
    shortName: "Digital Markets Act",
    fullTitle: "Regulation (EU) 2022/1925 on contestable and fair markets in the digital sector",
    type: "regulation",
    group: "Tech & digital",
    celex: "32022R1925",
    eurlexUrl: eurlex("32022R1925"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32022R1925",
    sourceKind: "cellar-celex"
  },
  {
    id: "32016R0679",
    shortName: "GDPR",
    fullTitle: "Regulation (EU) 2016/679, the General Data Protection Regulation",
    type: "regulation",
    group: "Tech & digital",
    celex: "32016R0679",
    eurlexUrl: eurlex("32016R0679"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32016R0679",
    sourceKind: "cellar-celex"
  },
  {
    id: "32023R2854",
    shortName: "Data Act",
    fullTitle: "Regulation (EU) 2023/2854 on harmonised rules on fair access to and use of data",
    type: "regulation",
    group: "Tech & digital",
    celex: "32023R2854",
    eurlexUrl: eurlex("32023R2854"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32023R2854",
    sourceKind: "cellar-celex"
  },
  {
    id: "32022R0868",
    shortName: "Data Governance Act",
    fullTitle: "Regulation (EU) 2022/868 on European data governance",
    type: "regulation",
    group: "Tech & digital",
    celex: "32022R0868",
    eurlexUrl: eurlex("32022R0868"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32022R0868",
    sourceKind: "cellar-celex"
  },
  {
    id: "32024R2847",
    shortName: "Cyber Resilience Act",
    fullTitle: "Regulation (EU) 2024/2847 on horizontal cybersecurity requirements for products with digital elements",
    type: "regulation",
    group: "Tech & digital",
    celex: "32024R2847",
    eurlexUrl: eurlex("32024R2847"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32024R2847",
    sourceKind: "cellar-celex"
  },
  {
    id: "32022L2555",
    shortName: "NIS2 Directive",
    fullTitle: "Directive (EU) 2022/2555 on measures for a high common level of cybersecurity across the Union",
    type: "directive",
    group: "Tech & digital",
    celex: "32022L2555",
    eurlexUrl: eurlex("32022L2555"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32022L2555",
    sourceKind: "cellar-celex"
  },
  {
    id: "32023R1781",
    shortName: "EU Chips Act",
    fullTitle: "Regulation (EU) 2023/1781 establishing a framework of measures for strengthening Europe's semiconductor ecosystem",
    type: "regulation",
    group: "Industrial & strategic autonomy",
    celex: "32023R1781",
    eurlexUrl: eurlex("32023R1781"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32023R1781",
    sourceKind: "cellar-celex"
  },
  {
    id: "32024R1252",
    shortName: "Critical Raw Materials Act",
    fullTitle: "Regulation (EU) 2024/1252 establishing a framework for ensuring a secure and sustainable supply of critical raw materials",
    type: "regulation",
    group: "Industrial & strategic autonomy",
    celex: "32024R1252",
    eurlexUrl: eurlex("32024R1252"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32024R1252",
    sourceKind: "cellar-celex"
  },
  {
    id: "32024R1735",
    shortName: "Net-Zero Industry Act",
    fullTitle: "Regulation (EU) 2024/1735 on establishing a framework of measures for strengthening Europe's net-zero technology manufacturing ecosystem",
    type: "regulation",
    group: "Industrial & strategic autonomy",
    celex: "32024R1735",
    eurlexUrl: eurlex("32024R1735"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32024R1735",
    sourceKind: "cellar-celex"
  },
  {
    id: "32021R1119",
    shortName: "European Climate Law",
    fullTitle: "Regulation (EU) 2021/1119 establishing the framework for achieving climate neutrality",
    type: "regulation",
    group: "Green & climate",
    celex: "32021R1119",
    eurlexUrl: eurlex("32021R1119"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32021R1119",
    sourceKind: "cellar-celex"
  },
  {
    id: "32022L2464",
    shortName: "CSRD",
    fullTitle: "Directive (EU) 2022/2464 as regards corporate sustainability reporting",
    type: "directive",
    group: "Green & climate",
    celex: "32022L2464",
    eurlexUrl: eurlex("32022L2464"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32022L2464",
    sourceKind: "cellar-celex"
  },
  {
    id: "32023R0956",
    shortName: "CBAM",
    fullTitle: "Regulation (EU) 2023/956 establishing a carbon border adjustment mechanism",
    type: "regulation",
    group: "Green & climate",
    celex: "32023R0956",
    eurlexUrl: eurlex("32023R0956"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32023R0956",
    sourceKind: "cellar-celex"
  },
  {
    id: "32023R1114",
    shortName: "MiCA",
    fullTitle: "Regulation (EU) 2023/1114 on markets in crypto-assets",
    type: "regulation",
    group: "Finance & markets",
    celex: "32023R1114",
    eurlexUrl: eurlex("32023R1114"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32023R1114",
    sourceKind: "cellar-celex"
  },
  {
    id: "32022R2554",
    shortName: "DORA",
    fullTitle: "Regulation (EU) 2022/2554 on digital operational resilience for the financial sector",
    type: "regulation",
    group: "Finance & markets",
    celex: "32022R2554",
    eurlexUrl: eurlex("32022R2554"),
    sourceUrl: "https://publications.europa.eu/resource/celex/32022R2554",
    sourceKind: "cellar-celex"
  },
  {
    id: "draghi-report",
    shortName: "Draghi Report",
    fullTitle: "The future of European competitiveness: A competitiveness strategy for Europe",
    type: "report",
    group: "Strategic non-binding documents",
    sourceUrl: "https://commission.europa.eu/document/download/97e481fd-2dc3-412d-be4c-f152a8232961_en",
    sourceKind: "pdf"
  },
  {
    id: "letta-report",
    shortName: "Letta Report",
    fullTitle: "Much more than a market: Speed, security, solidarity",
    type: "report",
    group: "Strategic non-binding documents",
    sourceUrl: "https://european-research-area.ec.europa.eu/documents/letta-report-much-more-market-april-2024",
    sourceKind: "web-pdf"
  },
  {
    id: "ai-continent-action-plan",
    shortName: "AI Continent Action Plan",
    fullTitle: "AI Continent Action Plan COM(2025)165",
    type: "communication",
    group: "Strategic non-binding documents",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/library/ai-continent-action-plan",
    sourceKind: "web-pdf"
  },
  {
    id: "commission-work-programme-2026",
    shortName: "Commission Work Programme 2026",
    fullTitle: "2026 Commission work programme",
    type: "communication",
    group: "Strategic non-binding documents",
    sourceUrl: "https://commission.europa.eu/strategy-and-policy/strategy-documents/commission-work-programme/commission-work-programme-2026_en",
    sourceKind: "web-pdf"
  }
];
