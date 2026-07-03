from services.generator import generate_pdf, generate_docx

sample_fields = {
    "company_name": "iamneo",
    "company_address": "1202, 3rd Floor, SPA SRR Towers, Avinashi Road, PN Palayam, Coimbatore Tamil Nadu 641037, India",
    "company_gstin": "33AAGCI8144L1ZB",
    "company_pan": "AAGCI8144L",
    "po_number": "PO-neo-00442",
    "vendor_name": "Arjuncodeacademy",
    "vendor_address": "ACA Technologies, No:18/2 Govindarajulu Street, Agaram, Chennai-600082",
    "deliver_to_name": "Iamneo Edutech Private Limited",
    "deliver_to_address": "1202, 3rd Floor, SPA SRR Towers, Avinashi Road, PN Palayam, Coimbatore Tamil Nadu 641037, India",
    "po_date": "26/08/2025",
    "start_date": "25/08/2025",
    "end_date": "15/09/2025",
    "trainer_name": "Anil",
    "item_description": "Trainer name - Anil, Batch - App Development, Location - Coimbatore",
    "item_qty": "21.00",
    "item_rate": "5,000.00",
    "item_amount": "1,05,000.00",
    "total": "1,05,000.00",
}

pdf_path = generate_pdf("po", "aca-technologies", sample_fields)
print(f"PDF generated at: {pdf_path}")

docx_path = generate_docx("po", "aca-technologies", sample_fields)
print(f"DOCX generated at: {docx_path}")
