from docxtpl import DocxTemplate

tpl = DocxTemplate("templates/invoice/aca-technologies.docx")

context = {
    "trainer_name": "Anil",
    "po_number": "PO-neo-00442",
    "technology": "App Development",
    "num_rows": 3,
}

tpl.render(context)
tpl.save("test_invoice_output.docx")

print("Rendered file saved as test_invoice_output.docx")