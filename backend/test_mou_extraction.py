from services.parser import extract_text
from services.mou_pattern_extraction import extract_mou_fields
import json

# Point this at the MOU PDF you shared
test_file = r"C:\Users\sanja\Downloads\Arjuncodeacademy Anil MOU - Signed (1).pdf"

raw_text = extract_text(test_file, "mou.pdf")
print("----- RAW TEXT (first 500 chars) -----")
print(raw_text[:500])

print("\n----- EXTRACTED MOU FIELDS -----")
fields = extract_mou_fields(raw_text)
print(json.dumps(fields, indent=2))

import re
sig_match = re.search(r"IN WITNESS WHEREOF(.+?)(?:---\s*END\s*---|$)", raw_text, re.IGNORECASE | re.DOTALL)
if sig_match:
    print("\n----- SIGNATURE SECTION -----")
    print(sig_match.group(1))