export type DocKey =
  | "f2f" | "pt_eval" | "swo" | "dpd" | "hipaa" | "insurance_card"
  | "aor" | "telehealth_form" | "abn_form" | "par_req" | "atp_eval"
  | "lmn" | "home_assessment" | "pod" | "misc_docs" | "auth_form" | "delivery_photo" | "vendor_form" | "financial_hardship_form";

export const labelMap: Record<DocKey, string> = {
  f2f: "Face-to-Face Note",
  pt_eval: "PT Evaluation",
  swo: "Standard Written Order",
  dpd: "Detailed Product Description",
  hipaa: "HIPAA Consent",
  insurance_card: "Insurance Card",
  aor: "AOR Form",
  telehealth_form: "Telehealth Consent",
  abn_form: "ABN Form",
  par_req: "PAR Request",
  atp_eval: "ATP Eval",
  lmn: "Letter of Medical Necessity",
  home_assessment: "Home Assessment",
  pod: "Proof of Delivery",
  misc_docs: "Misc. Docs",
  auth_form: "Authorization Form",
  delivery_photo: "Delivery Photo",
  vendor_form: "Vendor Form",
  financial_hardship_form: "Financial Hardship Form",
};

export const docSections = [
    {
        id: 'standard',
        label: 'Standard Documentation',
        keys: ['f2f', 'pt_eval', 'swo', 'dpd', 'hipaa', 'insurance_card', 'aor', 'telehealth_form'] as DocKey[]
    },
    {
        id: 'additional',
        label: 'Additional / Payer-Specific',
        keys: ['abn_form', 'par_req', 'atp_eval', 'lmn', 'home_assessment', 'financial_hardship_form'] as DocKey[]
    },
    {
        id: 'post_delivery',
        label: 'Post-Delivery',
        keys: ['pod', 'misc_docs'] as DocKey[]
    }
];

export const docTemplates = [
    {
        id: 'standard_wc',
        label: 'Standard Wheelchair',
        keys: ['f2f', 'pt_eval', 'swo', 'dpd', 'hipaa', 'insurance_card'] as DocKey[]
    },
    {
        id: 'uhc_aor',
        label: 'UHC (Requires AOR)',
        keys: ['f2f', 'pt_eval', 'swo', 'dpd', 'hipaa', 'insurance_card', 'aor'] as DocKey[]
    },
    {
        id: 'full_clinical',
        label: 'Full Clinical Packet',
        keys: ['f2f', 'pt_eval', 'swo', 'dpd', 'hipaa', 'insurance_card', 'aor', 'lmn', 'atp_eval'] as DocKey[]
    }
];
