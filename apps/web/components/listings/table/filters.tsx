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
import { ListingStatus } from '@repo/shared';

type ListingFiltersProps = {
  schemas: MetadataSchema[];
};

const statusLabels = {
  [ListingStatus.ACTIVE]: 'Active',
  [ListingStatus.PENDING]: 'Pending',
  [ListingStatus.SOLD]: 'Sold',
};

export function ListingFilters({ schemas }: ListingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState(searchParams.get('status') || '__all__');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [propertyId, setPropertyId] = useState(
    searchParams.get('property_id') || '',
  );

  const [customFields, setCustomFields] = useState<Record<string, any>>(() => {
    const cf = searchParams.get('customFields');
    return cf ? JSON.parse(cf) : {};
  });

  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount =
    [status !== '__all__' ? status : '', minPrice, maxPrice, propertyId].filter(
      Boolean,
    ).length + Object.keys(customFields).length;

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (status && status !== '__all__') params.set('status', status);
    else params.delete('status');

    if (minPrice.trim()) params.set('minPrice', minPrice.trim());
    else params.delete('minPrice');

    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim());
    else params.delete('maxPrice');

    if (propertyId.trim()) params.set('property_id', propertyId.trim());
    else params.delete('property_id');

    if (Object.keys(customFields).length > 0) {
      params.set('customFields', JSON.stringify(customFields));
    } else {
      params.delete('customFields');
    }

    params.set('page', '1');

    startTransition(() => {
      router.push(`/listings?${params.toString()}`);
      setIsOpen(false);
    });
  }, [
    status,
    minPrice,
    maxPrice,
    propertyId,
    customFields,
    searchParams,
    router,
  ]);

  const clearFilters = useCallback(() => {
    setStatus('__all__');
    setMinPrice('');
    setMaxPrice('');
    setPropertyId('');
    setCustomFields({});

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('perPage', searchParams.get('perPage') || '20');

    startTransition(() => {
      router.push(`/listings?${params.toString()}`);
    });
  }, [router, searchParams]);

  const removeFilter = (key: string) => {
    if (key === 'status') setStatus('__all__');
    else if (key === 'minPrice') setMinPrice('');
    else if (key === 'maxPrice') setMaxPrice('');
    else if (key === 'property_id') setPropertyId('');
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
    if (key === 'status') return statusLabels[value as ListingStatus];
    if (key === 'minPrice' || key === 'maxPrice')
      return `$${Number(value).toLocaleString()}`;
    if (key === 'property_id') return value.slice(0, 8);

    const schema = schemas.find((s) => s.field_key === key);
    if (!schema) return String(value);

    if (schema.field_type === 'BOOLEAN') return value ? 'Yes' : 'No';
    if (schema.field_type === 'NUMBER') return Number(value).toLocaleString();
    return String(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);

    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== '__all__') {
      params.set('status', value);
    } else {
      params.delete('status');
    }

    params.set('page', '1');

    startTransition(() => {
      router.push(`/listings?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                <h4 className="font-medium text-sm">Filter Listings</h4>
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
                      htmlFor="min-price-filter"
                      className="text-xs text-muted-foreground"
                    >
                      Min Price
                    </Label>
                    <Input
                      id="min-price-filter"
                      type="number"
                      placeholder="100000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="max-price-filter"
                      className="text-xs text-muted-foreground"
                    >
                      Max Price
                    </Label>
                    <Input
                      id="max-price-filter"
                      type="number"
                      placeholder="500000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="property-id-filter"
                      className="text-xs text-muted-foreground"
                    >
                      Property ID
                    </Label>
                    <Input
                      id="property-id-filter"
                      type="text"
                      placeholder="UUID or partial ID"
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
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
          {status !== '__all__' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Status: {statusLabels[status as unknown as ListingStatus]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('status')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {minPrice && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Min: ${Number(minPrice).toLocaleString()}
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
              Max: ${Number(maxPrice).toLocaleString()}
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
          {propertyId && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Property: {propertyId.slice(0, 8)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('property_id')}
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
