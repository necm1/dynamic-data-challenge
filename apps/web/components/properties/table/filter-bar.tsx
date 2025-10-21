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
import type { MetadataSchema } from '@repo/web-utils/actions/metadata';

type PropertiesFilterBarProps = {
  schemas: MetadataSchema[];
};

export function PropertiesFilterBar({ schemas }: PropertiesFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const [customFields, setCustomFields] = useState<Record<string, any>>(() => {
    const cf = searchParams.get('customFields');
    return cf ? JSON.parse(cf) : {};
  });

  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount =
    [title, minPrice, maxPrice].filter(Boolean).length +
    Object.keys(customFields).length;

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (title) params.set('title', title);
    else params.delete('title');

    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');

    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    if (Object.keys(customFields).length > 0) {
      params.set('customFields', JSON.stringify(customFields));
    } else {
      params.delete('customFields');
    }

    params.set('page', '1');

    startTransition(() => {
      router.push(`/properties?${params.toString()}`);
      setIsOpen(false);
    });
  }, [title, minPrice, maxPrice, customFields, searchParams, router]);

  const clearFilters = useCallback(() => {
    setTitle('');
    setMinPrice('');
    setMaxPrice('');
    setCustomFields({});

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('perPage', searchParams.get('perPage') || '20');

    startTransition(() => {
      router.push(`/properties?${params.toString()}`);
    });
  }, [router, searchParams]);

  const removeFilter = (key: string) => {
    if (key === 'title') setTitle('');
    else if (key === 'minPrice') setMinPrice('');
    else if (key === 'maxPrice') setMaxPrice('');
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
        const options = schema.validation_rules?.options as
          | string[]
          | undefined;
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
    if (key === 'title') return value;
    if (key === 'minPrice') return `$${Number(value).toLocaleString()}`;
    if (key === 'maxPrice') return `$${Number(value).toLocaleString()}`;

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
          placeholder="Search properties..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
                <h4 className="font-medium text-sm">Filter Properties</h4>
                <p className="text-xs text-muted-foreground">
                  Refine your search with core and custom filters
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="min"
                      className="text-xs text-muted-foreground"
                    >
                      Min ($)
                    </Label>
                    <Input
                      id="min"
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="max"
                      className="text-xs text-muted-foreground"
                    >
                      Max ($)
                    </Label>
                    <Input
                      id="max"
                      type="number"
                      placeholder="∞"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
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
          {title && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Title: {title}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('title')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {minPrice && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Min: {getFilterDisplayValue('minPrice', minPrice)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('minPrice')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {maxPrice && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Max: {getFilterDisplayValue('maxPrice', maxPrice)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('maxPrice')}
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
