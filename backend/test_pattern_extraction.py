from services.parser import extract_text
from services.pattern_extraction import extract_fields_pattern
import json

# Point this at your real iamneo PO PDF
test_file = r"C:\Users\sanja\Downloads\PO-neo-00442.pdf"

raw_text = extract_text(test_file, "PO-neo-00442.pdf")
print("----- RAW TEXT -----")
print(raw_text[:500])

print("\n----- EXTRACTED FIELDS -----")
fields = extract_fields_pattern(raw_text)
print(json.dumps(fields, indent=2))