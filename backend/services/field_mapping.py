def map_mou_fields(fields: dict) -> dict:
    """
    Maps extracted/edited MOU fields (Company<->Vendor direction, as they
    come from the input iamneo<->ACA MOU) into the template's variable
    slots for the OUTPUT MOU (ACA<->Trainer direction).

    Input roles (from extraction):
        issuing_company_name / company_address / company_signatory_*  -> iamneo (college)
        vendor_name / vendor_address / vendor_signatory_*             -> ACA Technologies
        trainer_name                                                  -> the trainer
        trainer_address / trainer_signatory_title                     -> manual review-form fields

    Output roles (template variable names, unchanged):
        issuing_company_name / company_address / company_signatory_*  -> ACA Technologies (now the "Company")
        vendor_name / vendor_address / vendor_signatory_*             -> the trainer (now the "Consultant")
    """
    return {
        "mou_date": fields.get("mou_date"),
        "issuing_company_name": fields.get("vendor_name"),
        "company_address": fields.get("vendor_address"),
        "company_signatory_name": fields.get("vendor_signatory_name"),
        "company_signatory_title": fields.get("vendor_signatory_title"),
        "vendor_name": fields.get("trainer_name"),
        "vendor_address": fields.get("trainer_address"),
        "vendor_signatory_name": fields.get("trainer_name"),
        "vendor_signatory_title": fields.get("trainer_signatory_title"),
    }