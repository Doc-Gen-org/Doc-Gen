from services.ai_extraction import extract_fields_from_text

sample_text = """
ACA Technologies
Purchase Order

This PO confirms the engagement of trainer Priya Sharma for a Python Fundamentals
training session at SRM Institute, scheduled from 2026-07-01 to 2026-07-05,
totaling 20 hours. Pay rate: INR 1500 per hour.
"""

result = extract_fields_from_text(sample_text)
print("----- EXTRACTED FIELDS -----")
print(result)