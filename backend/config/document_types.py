DOCUMENT_TYPES = [
    {
        "id": "po",
        "label": "Purchase Order",
        "fields": [
            {"name": "vendor_name", "label": "Vendor Name", "type": "text", "required": True},
            {"name": "trainer_name", "label": "Trainer Name", "type": "text", "required": True},
            {"name": "training_dates", "label": "Training Dates", "type": "date_range", "required": True},
            {"name": "duration_hours", "label": "Duration (hours)", "type": "number", "required": True},
            {"name": "pay_rate", "label": "Pay Rate", "type": "number", "required": True},
            {"name": "subject", "label": "Subject", "type": "text", "required": False},
        ],
    },
    {
        "id": "mou",
        "label": "Memorandum of Understanding",
        "fields": [
            {"name": "college_name", "label": "College Name", "type": "text", "required": True},
            {"name": "vendor_name", "label": "Vendor Name", "type": "text", "required": True},
            {"name": "terms", "label": "Terms", "type": "textarea", "required": True},
        ],
    },
    {
        "id": "invoice",
        "label": "Invoice",
        "fields": [
            {"name": "vendor_name", "label": "Vendor Name", "type": "text", "required": True},
            {"name": "college_name", "label": "College Name", "type": "text", "required": True},
            {"name": "amount", "label": "Amount", "type": "number", "required": True},
            {"name": "invoice_date", "label": "Invoice Date", "type": "date", "required": True},
            {"name": "line_items", "label": "Line Items", "type": "line_items", "required": False},
        ],
    },
    {
        "id": "certificate",
        "label": "Internship Certificate",
        "fields": [
            {"name": "trainee_name", "label": "Trainee Name", "type": "text", "required": True},
            {"name": "duration", "label": "Duration", "type": "text", "required": True},
            {"name": "subject", "label": "Subject", "type": "text", "required": True},
            {"name": "completion_date", "label": "Completion Date", "type": "date", "required": True},
        ],
    },
    {
        "id": "email",
        "label": "Email Template",
        "fields": [
            {"name": "trainer_name", "label": "Trainer Name", "type": "text", "required": True},
            {"name": "training_date", "label": "Training Date", "type": "date", "required": True},
            {"name": "training_time", "label": "Training Time", "type": "text", "required": True},
            {"name": "meeting_link", "label": "Meeting Link", "type": "text", "required": False},
            {"name": "pay_details", "label": "Pay Details", "type": "text", "required": True},
        ],
    },
]