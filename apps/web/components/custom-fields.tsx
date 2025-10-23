'use client';

import { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { JSX, useMemo } from 'react';
import { Badge } from '@repo/ui/components/badge';
import { Check, X } from 'lucide-react';

type TableCustomFieldsProps = {
  schemas: MetadataSchema[];
  customFields: Record<string, any>;
  maxVisible?: number;
};

export function TableCustomFieldsProps({
  schemas,
  customFields,
  maxVisible = 2,
}: TableCustomFieldsProps) {
  const schemaMap = useMemo(() => {
    return schemas.reduce(
      (acc, schema) => {
        acc[schema.field_key] = schema;
        return acc;
      },
      {} as Record<string, MetadataSchema>,
    );
  }, [schemas]);

  const formatCustomFieldValue = (
    fieldKey: string,
    value: any,
  ): { label: string; display: string | JSX.Element } => {
    const schema = schemaMap[fieldKey];
    const label = schema?.field_label || fieldKey;

    if (value === undefined || value === null) {
      return { label, display: '-' };
    }

    switch (schema?.field_type) {
      case 'BOOLEAN':
        return {
          label,
          display: value ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <X className="h-3 w-3 text-muted-foreground" />
          ),
        };

      case 'NUMBER':
        return {
          label,
          display: Number(value).toLocaleString(),
        };

      case 'DATE':
        return {
          label,
          display: new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };

      case 'SELECT':
      case 'ARRAY':
        if (Array.isArray(value)) {
          return {
            label,
            display:
              value.slice(0, 2).join(', ') + (value.length > 2 ? '...' : ''),
          };
        }
        return { label, display: String(value) };

      case 'TEXT':
        return {
          label,
          display:
            String(value).slice(0, 20) +
            (String(value).length > 20 ? '...' : ''),
        };

      case 'STRING':
      default:
        return {
          label,
          display:
            String(value).slice(0, 15) +
            (String(value).length > 15 ? '...' : ''),
        };
    }
  };

  const entries = Object.entries(customFields || {});

  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.slice(0, maxVisible).map(([fieldKey, value]) => {
        const { label, display } = formatCustomFieldValue(fieldKey, value);

        return (
          <Badge
            key={fieldKey}
            variant="outline"
            className="text-muted-foreground px-1.5 flex items-center gap-1"
          >
            <span className="font-medium">{label}:</span>
            <span className="flex items-center">{display}</span>
          </Badge>
        );
      })}
      {entries.length > maxVisible && (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          +{entries.length - maxVisible} more
        </Badge>
      )}
    </div>
  );
}
