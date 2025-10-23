export interface MetadataValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  pattern?: string;
}
