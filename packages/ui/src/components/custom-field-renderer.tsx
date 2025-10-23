'use client';

import {
  MetadataSchema,
  SelectValidationRules,
} from '@repo/web-utils/actions/metadata';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Checkbox } from './checkbox';
import { Control, FieldValues, Path } from 'react-hook-form';

type CustomFieldRendererProps<T extends FieldValues> = {
  schema: MetadataSchema;
  control: Control<T>;
  fieldName: Path<T>;
};

export function renderCustomFieldInput<T extends FieldValues>({
  schema,
  control,
  fieldName,
}: CustomFieldRendererProps<T>) {
  switch (schema.field_type) {
    case 'NUMBER':
      return (
        <FormField
          key={schema.id}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {schema.field_label}
                {schema.validation_rules?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={`Enter ${schema.field_label.toLowerCase()}`}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'BOOLEAN':
      return (
        <FormField
          key={schema.id}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {schema.field_label}
                  {schema.validation_rules?.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                {schema.validation_rules?.description && (
                  <FormDescription>
                    {schema.validation_rules.description}
                  </FormDescription>
                )}
              </div>
            </FormItem>
          )}
        />
      );

    case 'SELECT': {
      const select = schema.validation_rules as
        | SelectValidationRules
        | undefined;
      const options = select?.options as string[] | undefined;
      const isMultiple = select?.multiple === true;

      if (isMultiple) {
        return (
          <FormField
            key={schema.id}
            control={control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.validation_rules?.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <div className="space-y-2 border rounded-md p-4">
                  {options?.map((option) => {
                    const currentValue = (field.value as string[]) || [];
                    const isChecked = currentValue.includes(option);

                    return (
                      <FormItem
                        key={option}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked: boolean) => {
                              const updated = checked
                                ? [...currentValue, option]
                                : currentValue.filter((v) => v !== option);
                              field.onChange(updated);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {option}
                        </FormLabel>
                      </FormItem>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }

      return (
        <FormField
          key={schema.id}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {schema.field_label}
                {schema.validation_rules?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`Select ${schema.field_label.toLowerCase()}`}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    case 'ARRAY': {
      const arrayRules = schema.validation_rules as
        | SelectValidationRules
        | undefined;
      const arrayOptions = arrayRules?.options as string[] | undefined;

      if (arrayOptions && arrayOptions.length > 0) {
        // Render as checkboxes for predefined options
        return (
          <FormField
            key={schema.id}
            control={control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.validation_rules?.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <div className="space-y-2 border rounded-md p-4">
                  {arrayOptions.map((option) => {
                    const currentValue = (field.value as string[]) || [];
                    const isChecked = currentValue.includes(option);

                    return (
                      <FormItem
                        key={option}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked: boolean) => {
                              const updated = checked
                                ? [...currentValue, option]
                                : currentValue.filter((v) => v !== option);
                              field.onChange(updated);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {option}
                        </FormLabel>
                      </FormItem>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else {
        // Free-form array
        return (
          <FormField
            key={schema.id}
            control={control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.validation_rules?.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter values separated by commas"
                    {...field}
                    value={
                      Array.isArray(field.value)
                        ? field.value.join(', ')
                        : field.value || ''
                    }
                    onChange={(e) => {
                      const values = e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean);
                      field.onChange(values.length > 0 ? values : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
    }

    case 'DATE':
      return (
        <FormField
          key={schema.id}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {schema.field_label}
                {schema.validation_rules?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'TEXT':
      return (
        <FormField
          key={schema.id}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {schema.field_label}
                {schema.validation_rules?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Enter ${schema.field_label.toLowerCase()}`}
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'STRING':
    default:
      return (
        <FormField
          key={schema.id}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {schema.field_label}
                {schema.validation_rules?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={`Enter ${schema.field_label.toLowerCase()}`}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
  }
}
