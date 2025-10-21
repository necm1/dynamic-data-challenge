'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v3';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Separator } from '@repo/ui/components/separator';
import {
  createProperty,
  updateProperty,
} from '@repo/web-utils/actions/properties';
import type { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

type Property = {
  id: string;
  title: string;
  address: string;
  price: number;
  year_built: number;
  custom_fields: Record<string, any>;
};

type PropertyFormProps = {
  property?: Property;
  schemas: MetadataSchema[];
};

const baseCoreSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  address: z.string().min(1, 'Address is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  year_built: z.coerce.number().min(1800).max(new Date().getFullYear()),
});

export function PropertyForm({ property, schemas }: PropertyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const buildFormSchema = () => {
    const customFieldsSchema: Record<string, z.ZodTypeAny> = {};

    schemas.forEach((schema) => {
      let fieldSchema: z.ZodTypeAny;

      switch (schema.field_type) {
        case 'NUMBER':
          fieldSchema = z.coerce.number();
          break;
        case 'BOOLEAN':
          fieldSchema = z.boolean();
          break;
        case 'DATE':
          fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
          break;
        case 'SELECT':
          const options = schema.validation_rules?.options as
            | string[]
            | undefined;
          const isMultiple = schema.validation_rules?.multiple === true;

          if (isMultiple) {
            fieldSchema = z.array(z.enum(options as [string, ...string[]]));
          } else {
            fieldSchema = z.enum(options as [string, ...string[]]);
          }
          break;
          break;
        case 'TEXT':
        case 'STRING':
        default:
          fieldSchema = z.string();
          break;
      }

      if (!schema.is_required) {
        fieldSchema = fieldSchema.optional();
      }

      customFieldsSchema[schema.field_key] = fieldSchema;
    });

    return baseCoreSchema.extend({
      fields: z.object(customFieldsSchema).optional(),
    });
  };

  const formSchema = buildFormSchema();
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: property?.title || '',
      address: property?.address || '',
      price: property?.price || 0,
      year_built: property?.year_built || new Date().getFullYear(),
      fields: property?.custom_fields || {},
    },
  });

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        if (property) {
          await updateProperty(property.id, data);
          toast.success('Property updated successfully');
        } else {
          await createProperty(data);
          toast.success('Property created successfully');
        }
        router.push('/properties');
        router.refresh();
      } catch (error) {
        toast.error(
          property ? 'Failed to update property' : 'Failed to create property',
        );
        console.error(error);
      }
    });
  };

  const renderCustomFieldInput = (schema: MetadataSchema) => {
    const fieldName = `fields.${schema.field_key}` as const;

    switch (schema.field_type) {
      case 'NUMBER':
        return (
          <FormField
            key={schema.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.is_required && (
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
            control={form.control}
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
                    {schema.is_required && (
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

      case 'SELECT':
        const options = schema.validation_rules?.options as
          | string[]
          | undefined;
        const isMultiple = schema.validation_rules?.multiple === true;

        if (isMultiple) {
          return (
            <FormField
              key={schema.id}
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {schema.field_label}
                    {schema.is_required && (
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
                              onCheckedChange={(checked) => {
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
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

      case 'DATE':
        return (
          <FormField
            key={schema.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.is_required && (
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
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.is_required && (
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
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {schema.field_label}
                  {schema.is_required && (
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
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Fields Card */}
        <Card>
          <CardHeader>
            <CardTitle>Core Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Luxury Villa Downtown" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Address <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Price ($) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year_built"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Year Built <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {schemas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schemas
                .sort((a, b) => a.display_order - b.display_order)
                .map((schema) => renderCustomFieldInput(schema))}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? (
              'Saving...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {property ? 'Update' : 'Create'} Property
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
