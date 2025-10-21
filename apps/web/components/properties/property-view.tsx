'use client';

import { Button } from '@repo/ui/components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer';
import { Separator } from '@repo/ui/components/separator';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';
import { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { Property } from '@repo/web-utils/lib/schemas/property.schema';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v3';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createProperty,
  updateProperty,
} from '@repo/web-utils/actions/properties';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Loader2, Save } from 'lucide-react';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { cn } from '@repo/ui/lib/utils';

type PropertyViewProps = {
  property?: Property;
  schemas: MetadataSchema[];
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const baseCoreSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  address: z.string().min(1, 'Address is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  year_built: z.coerce.number().min(1800).max(new Date().getFullYear()),
});

export function PropertyView({
  property,
  schemas,
  open,
  setOpen,
}: PropertyViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
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
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? 'bottom' : 'right'}
    >
      {typeof open === 'undefined' && (
        <DrawerTrigger asChild>
          <Button
            variant="link"
            className="text-foreground w-fit px-0 text-left cursor-pointer"
          >
            {property?.title || 'New Property'}
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent
        className={cn(isMobile ? 'h-full max-h-[90vh]' : 'max-w-lg')}
      >
        <DrawerHeader className="gap-1">
          <DrawerTitle>{property?.title || 'New Property'}</DrawerTitle>
          <DrawerDescription>
            {property?.address ||
              'Create a new property by filling out the form'}
          </DrawerDescription>
        </DrawerHeader>
        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea
              className={cn(
                'm-0 h-full',
                isMobile ? 'max-h-[55vh]' : 'max-h-[80vh]',
              )}
            >
              <section className="flex flex-col gap-2 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-4 md:text-left">
                <div className="text-foreground font-semibold">
                  Core Information
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Luxury Villa Downtown"
                            {...field}
                          />
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
                          <Input
                            placeholder="123 Main Street, City"
                            {...field}
                          />
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
                            Price ($){' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="500000"
                              {...field}
                            />
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
                            Year Built{' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2020"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {schemas.length > 0 && (
                <section className="flex flex-col gap-2 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-4 md:text-left">
                  <div className="text-foreground font-semibold">
                    Custom Fields
                  </div>

                  <div className="space-y-4">
                    {schemas
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((schema) => renderCustomFieldInput(schema))}
                  </div>
                </section>
              )}
            </ScrollArea>

            <Separator />

            <DrawerFooter>
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
              <DrawerClose asChild>
                <Button variant="outline" disabled={isPending}>
                  Done
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
