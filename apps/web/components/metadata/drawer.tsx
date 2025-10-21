'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { EntityType } from '@repo/shared';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@repo/ui/components/drawer';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Button } from '@repo/ui/components/button';
import { Switch } from '@repo/ui/components/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMetadataSchema,
  updateMetadataSchema,
  type MetadataSchema,
} from '@repo/web-utils/actions/metadata';
import { toast } from 'sonner';
import { ValidationRulesEditor } from './validation-rules-editor';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';

const fieldSchemaFormSchema = z.object({
  field_key: z
    .string()
    .min(1, 'Field key is required')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Must be valid identifier (letters, numbers, underscore)',
    ),
  field_type: z.enum(['STRING', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'TEXT']),
  field_label: z.string().min(1, 'Label is required'),
  display_order: z.number().int().min(0),
  validation_rules: z
    .object({
      required: z.boolean(),
    })
    .passthrough()
    .optional(),
});

type FieldSchemaFormValues = z.infer<typeof fieldSchemaFormSchema>;

interface FieldSchemaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  schema?: MetadataSchema | null;
  onSuccess: () => void;
}

export function FieldSchemaDrawer({
  open,
  onOpenChange,
  entityType,
  schema,
  onSuccess,
}: FieldSchemaDrawerProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const isEdit = !!schema;

  const form = useForm<FieldSchemaFormValues>({
    resolver: zodResolver(fieldSchemaFormSchema),
    defaultValues: {
      field_key: '',
      field_type: 'STRING',
      field_label: '',
      display_order: 0,
      validation_rules: {
        required: false,
      },
    },
  });

  useEffect(() => {
    if (schema) {
      form.reset({
        field_key: schema.field_key,
        field_type: schema.field_type as any,
        field_label: schema.field_label,
        display_order: schema.display_order,
        validation_rules: schema.validation_rules || {
          required: false,
        },
      });
    } else {
      form.reset({
        field_key: '',
        field_type: 'STRING',
        field_label: '',
        display_order: 0,
        validation_rules: {
          required: false,
        },
      });
    }
  }, [schema, form, open]);

  const createMutation = useMutation({
    mutationFn: createMetadataSchema,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['metadata-schemas', entityType],
      });
      toast.success('Field schema created successfully');
      onSuccess();
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create field schema');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateMetadataSchema(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['metadata-schemas', entityType],
      });
      toast.success('Field schema updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update field schema');
    },
  });

  const onSubmit = (data: FieldSchemaFormValues) => {
    if (isEdit) {
      const updatePayload = {
        field_label: data.field_label,
        validation_rules: data.validation_rules,
        display_order: data.display_order,
        is_active: true,
      };

      updateMutation.mutate({ id: schema.id, data: updatePayload });
    } else {
      const createPayload = {
        entity_type: entityType,
        field_key: data.field_key,
        field_label: data.field_label,
        field_type: data.field_type,
        validation_rules: {
          required: data.validation_rules?.required || false,
          ...data.validation_rules,
        },
        display_order: data.display_order,
      };
      createMutation.mutate(createPayload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const entityLabels = {
    [EntityType.Property]: 'Properties',
    [EntityType.Listing]: 'Listings',
    [EntityType.Client]: 'Clients',
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEdit ? 'Edit Field Schema' : 'Create Field Schema'}
          </DrawerTitle>
          <DrawerDescription>
            Define a custom field for {entityLabels[entityType]}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="field_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="square_footage"
                        {...field}
                        disabled={isEdit}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier (snake_case, cannot change after
                      creation)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="field_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Square Footage" {...field} />
                    </FormControl>
                    <FormDescription>Human-readable name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="field_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STRING">Text (Short)</SelectItem>
                        <SelectItem value="TEXT">Text (Long)</SelectItem>
                        <SelectItem value="NUMBER">Number</SelectItem>
                        <SelectItem value="DATE">Date</SelectItem>
                        <SelectItem value="SELECT">
                          Select (Dropdown)
                        </SelectItem>
                        <SelectItem value="BOOLEAN">
                          Boolean (Yes/No)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Fields sorted by this number (lower = first)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validation_rules.required"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Required Field</FormLabel>
                      <FormDescription className="text-xs">
                        Users must provide a value
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validation_rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validation Rules</FormLabel>
                    <FormControl>
                      <ValidationRulesEditor
                        fieldType={form.watch('field_type')}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional constraints for this field
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0 pt-4">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending
                    ? 'Saving...'
                    : isEdit
                      ? 'Update Field'
                      : 'Create Field'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
