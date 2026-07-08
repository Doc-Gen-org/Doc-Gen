"""
Quick isolated test for the MOU generation pipeline.
Tests map_mou_fields() + generate_document() without going through
the HTTP layer, using the real extracted MOU JSON plus manually
supplied trainer_address / trainer_signatory_title values.
"""

from services.generator import generate_document

# Real extraction output from /extract (document_type=mou)
extracted_fields = {
    "mou_date": "24-Aug-2025",
    "issuing_company_name": "iamneo Edutech Private Limited",
    "company_address": "3RD FLOOR, 1202 SPA SRR Tower, Avinashi Road, Pappanaicken palayam, Coimbatore, Tamil Nadu, India, 641037",
    "vendor_name": "Arjuns code academy",
    "trainer_name": "Anil",
    "vendor_address": "ACA Technologies, No:18/2 Govindarajulu Street,Agaram,Chennai-600082",
    "company_signatory_name": "Senthil Kumar T P",
    "company_signatory_title": "President",
    "vendor_signatory_name": "Arjun",
    "vendor_signatory_title": "Consultant",
}

# Manual review-form fields (not extracted — user-entered for output MOU)
manual_fields = {
    "trainer_address": "12 Anna Nagar, Chennai, Tamil Nadu, 600040",
    "trainer_signatory_title": "Trainer",
}

# What the frontend would actually send to /transform
fields = {**extracted_fields, **manual_fields}

print("=== Input fields sent to generate_document() ===")
for k, v in fields.items():
    print(f"  {k}: {v}")

output_path = generate_document(
    document_type="mou",
    company_id="aca-technologies",
    output_format="pdf",
    fields=fields,
)

print(f"\n=== Generated file ===\n{output_path}")
print("\nOpen this PDF and check:")
print("  1. 'Company' block shows ACA Technologies (NOT iamneo)")
print("  2. 'Consultant' block shows Anil's name + the manual trainer_address")
print("  3. Signature block: left side = Arjun/Consultant (ACA's signatory),")
print("     right side = Anil/Trainer (the trainer_signatory_title you entered)")
print("  4. The 'AND' paragraph reads cleanly — no leftover {{ }} or duplicate names")