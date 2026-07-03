from services.parser import extract_text

# Update this path to point at any real PDF or DOCX file on your machine
test_file_path = r"C:\Users\KBsan\Downloads\PO-neo-00442.pdf"

text = extract_text(test_file_path, "sample.pdf")
print("----- EXTRACTED TEXT -----")
print(text)