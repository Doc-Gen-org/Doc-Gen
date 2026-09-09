export interface ExtractResponse {
    job_id: string;
    source_document_id: string;
    extracted_fields: Record<string, string | number | null>;
    confidence_warnings: string[];
    suggested_output_type: string;
    suggested_company_id: string;
}

export interface ExtractionStatus {
    stage: string;
    progress: number;
}

export interface GenerateRequest {
    document_type: string;
    company_id: string;
    output_format: string;
    fields: Record<string, unknown>;
}