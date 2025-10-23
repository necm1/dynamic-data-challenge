'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useTransition, useMemo } from 'react';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export function MetadataFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const fieldKey = searchParams.get('field_key') || '';
  const fieldLabel = searchParams.get('field_label') || '';
  const fieldType = searchParams.get('field_type') || '';

  const hasActiveFilters = useMemo(
    () => fieldKey || fieldLabel || fieldType,
    [fieldKey, fieldLabel, fieldType],
  );

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (Object.keys(updates).some((k) => k !== 'page')) {
      params.set('page', '1');
    }

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const debouncedUpdate = useDebouncedCallback(updateParams, 300);

  const clearFilters = () => {
    startTransition(() => {
      router.push(window.location.pathname);
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter Schemas</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search field key..."
            defaultValue={fieldKey}
            onChange={(e) => debouncedUpdate({ field_key: e.target.value })}
            className="pl-10"
            disabled={isPending}
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search label..."
            defaultValue={fieldLabel}
            onChange={(e) => debouncedUpdate({ field_label: e.target.value })}
            className="pl-10"
            disabled={isPending}
          />
        </div>

        <Select
          value={fieldType || 'all'}
          onValueChange={(value) => updateParams({ field_type: value })}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Field Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="STRING">Text (Short)</SelectItem>
            <SelectItem value="TEXT">Text (Long)</SelectItem>
            <SelectItem value="NUMBER">Number</SelectItem>
            <SelectItem value="DATE">Date</SelectItem>
            <SelectItem value="SELECT">Select</SelectItem>
            <SelectItem value="BOOLEAN">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {fieldKey && (
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Key:</span>
              <span className="font-medium">{fieldKey}</span>
              <button
                onClick={() => updateParams({ field_key: '' })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {fieldLabel && (
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Label:</span>
              <span className="font-medium">{fieldLabel}</span>
              <button
                onClick={() => updateParams({ field_label: '' })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {fieldType && (
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{fieldType}</span>
              <button
                onClick={() => updateParams({ field_type: '' })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
