'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { Label } from '@repo/ui/components/label';
import { Separator } from '@repo/ui/components/separator';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Filter, X, Loader2 } from 'lucide-react';
import type {
  MetadataSchema,
  SelectValidationRules,
} from '@repo/web-utils/actions/metadata';

type ClientFiltersProps = {
  schemas: MetadataSchema[];
};

export function ClientFilters({ schemas }: ClientFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(searchParams.get('name') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');

  const [customFields, setCustomFields] = useState<Record<string, any>>(() => {
    const cf = searchParams.get('customFields');
    return cf ? JSON.parse(cf) : {};
  });

  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount =
    [name, email].filter(Boolean).length + Object.keys(customFields).length;

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (name.trim()) params.set('name', name.trim());
    else params.delete('name');

    if (email.trim()) params.set('email', email.trim());
    else params.delete('email');

    if (Object.keys(customFields).length > 0) {
      params.set('customFields', JSON.stringify(customFields));
    } else {
      params.delete('customFields');
    }

    params.set('page', '1');

    startTransition(() => {
      router.push(`/clients?${params.toString()}`);
      setIsOpen(false);
    });
  }, [name, email, customFields, searchParams, router]);

  const clearFilters = useCallback(() => {
    setName('');
    setEmail('');
    setCustomFields({});

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('perPage', searchParams.get('perPage') || '20');

    startTransition(() => {
      router.push(`/clients?${params.toString()}`);
    });
  }, [router, searchParams]);

  const removeFilter = (key: string) => {
    if (key === 'name') setName('');
    else if (key === 'email') setEmail('');
    else {
      setCustomFields((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
    setTimeout(() => applyFilters(), 0);
  };

  const handleCustomFieldChange = (fieldKey: string, value: any) => {
    setCustomFields((prev) => {
      if (value === undefined || value === '' || value === null) {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [fieldKey]: value };
    });
  };

  const renderCustomFieldInput = (schema: MetadataSchema) => {
    const value = customFields[schema.field_key];

    switch (schema.field_type) {
      case 'NUMBER':
        return (
          <Input
            id={`cf-${schema.field_key}`}
            type="number"
            placeholder={`Enter ${schema.field_label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) =>
              handleCustomFieldChange(
                schema.field_key,
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`cf-${schema.field_key}`}
              checked={value === true}
              onCheckedChange={(checked) =>
                handleCustomFieldChange(schema.field_key, checked || undefined)
              }
            />
            <Label
              htmlFor={`cf-${schema.field_key}`}
              className="text-sm font-normal cursor-pointer"
            >
              {schema.field_label}
            </Label>
          </div>
        );

      case 'SELECT':
        const options: string[] | undefined = (
          schema.validation_rules as SelectValidationRules | undefined
        )?.options;

        return (
          <Select
            value={value || '__none__'}
            onValueChange={(v) =>
              handleCustomFieldChange(
                schema.field_key,
                v === '__none__' ? undefined : v,
              )
            }
          >
            <SelectTrigger id={`cf-${schema.field_key}`}>
              <SelectValue
                placeholder={`Select ${schema.field_label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Any</SelectItem>
              {options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'DATE':
        return (
          <Input
            id={`cf-${schema.field_key}`}
            type="date"
            value={value || ''}
            onChange={(e) =>
              handleCustomFieldChange(
                schema.field_key,
                e.target.value || undefined,
              )
            }
          />
        );

      case 'TEXT':
      case 'STRING':
      default:
        return (
          <Input
            id={`cf-${schema.field_key}`}
            type="text"
            placeholder={`Enter ${schema.field_label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) =>
              handleCustomFieldChange(
                schema.field_key,
                e.target.value || undefined,
              )
            }
          />
        );
    }
  };

  const getFilterDisplayValue = (key: string, value: any): string => {
    if (key === 'name') return value;
    if (key === 'email') return value;

    const schema = schemas.find((s) => s.field_key === key);
    if (!schema) return String(value);

    if (schema.field_type === 'BOOLEAN') return value ? 'Yes' : 'No';
    if (schema.field_type === 'NUMBER') return Number(value).toLocaleString();
    return String(value);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search by name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="max-w-sm"
        />

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter Clients</h4>
                <p className="text-xs text-muted-foreground">
                  Refine your search with core and custom filters
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Core Filters</Label>
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email-filter"
                      className="text-xs text-muted-foreground"
                    >
                      Email
                    </Label>
                    <Input
                      id="email-filter"
                      type="email"
                      placeholder="client@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {schemas.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Custom Fields</Label>
                    <div className="space-y-3">
                      {schemas
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((schema) => (
                          <div key={schema.id} className="space-y-1.5">
                            {schema.field_type !== 'BOOLEAN' && (
                              <Label
                                htmlFor={`cf-${schema.field_key}`}
                                className="text-xs text-muted-foreground"
                              >
                                {schema.field_label}
                              </Label>
                            )}
                            {renderCustomFieldInput(schema)}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0 || isPending}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={applyFilters} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={applyFilters} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active:</span>
          {name && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Name: {name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('name')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {email && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Email: {email}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('email')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {Object.entries(customFields).map(([key, value]) => {
            const schema = schemas.find((s) => s.field_key === key);
            return (
              <Badge key={key} variant="secondary" className="gap-1 pr-1">
                {schema?.field_label || key}:{' '}
                {getFilterDisplayValue(key, value)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0.5 hover:bg-transparent"
                  onClick={() => removeFilter(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
