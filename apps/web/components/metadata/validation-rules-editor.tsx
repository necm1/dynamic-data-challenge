'use client';

import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Button } from '@repo/ui/components/button';
import { Plus, X } from 'lucide-react';

interface ValidationRulesEditorProps {
  fieldType: string;
  value: any;
  onChange: (value: any) => void;
}

export function ValidationRulesEditor({
  fieldType,
  value = {},
  onChange,
}: ValidationRulesEditorProps) {
  if (fieldType === 'NUMBER') {
    return (
      <div className="space-y-3 rounded-lg border p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="min" className="text-xs">
              Minimum Value
            </Label>
            <Input
              id="min"
              type="number"
              placeholder="0"
              value={value?.min || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max" className="text-xs">
              Maximum Value
            </Label>
            <Input
              id="max"
              type="number"
              placeholder="1000000"
              value={value?.max || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (fieldType === 'STRING' || fieldType === 'TEXT') {
    return (
      <div className="space-y-3 rounded-lg border p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="minLength" className="text-xs">
              Min Length
            </Label>
            <Input
              id="minLength"
              type="number"
              placeholder="0"
              value={value?.minLength || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  minLength: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxLength" className="text-xs">
              Max Length
            </Label>
            <Input
              id="maxLength"
              type="number"
              placeholder="255"
              value={value?.maxLength || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  maxLength: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pattern" className="text-xs">
            Regex Pattern (optional)
          </Label>
          <Input
            id="pattern"
            placeholder="^[A-Z][0-9]{3}$"
            value={value?.pattern || ''}
            onChange={(e) =>
              onChange({
                ...value,
                pattern: e.target.value || undefined,
              })
            }
          />
        </div>
      </div>
    );
  }

  if (fieldType === 'SELECT') {
    const options = value?.options || [];

    return (
      <div className="space-y-3 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Dropdown Options</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...value, options: [...options, ''] })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>

        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Click "Add" to define options
          </p>
        ) : (
          <div className="space-y-2">
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[index] = e.target.value;
                    onChange({ ...value, options: updated });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const updated = options.filter(
                      (_: any, i: number) => i !== index,
                    );
                    onChange({ ...value, options: updated });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 text-center text-xs text-muted-foreground">
      No validation rules for this type
    </div>
  );
}
