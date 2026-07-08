from services.generator import generate_pdf

sample_fields = {
    "vendor_name": "Arjuncodeacademy",
    "vendor_address": "ACA Technologies, No:18/2 Govindarajulu Street, Agaram, Chennai-600082",
    "vendor_gstin": "33AAGCI8144L1ZB",
    "vendor_pan": "AAGCI8144L",
    "trainer_name": "Anil",
    "trainer_address": "No. 12, Anna Nagar,<br>Chennai, Tamil Nadu 600040",
    "issuing_company_name": "IAMNEO EDUTECH PRIVATE LIMITED",
    "issuing_company_address": "1202, 3rd Floor, SPA SRR Towers, Avinashi Road,<br>PN Palayam, Coimbatore Tamil Nadu 641037",
    "po_number": "PO-neo-00442",
    "po_date": "26/08/2025",
    "start_date": "25/08/2025",
    "end_date": "15/09/2025",
    "technology": "App Development",
    "location": "Coimbatore",
    "qty": "21.00",
    "rate": "5,000.00",
    "total": "1,05,000.00",
}

output_path = generate_pdf("po", "aca-technologies", sample_fields)
print(f"PDF generated at: {output_path}")