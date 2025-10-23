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
import { type Client } from '@repo/web-utils/actions/clients';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createClient, updateClient } from '@repo/web-utils/actions/clients';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Loader2, Save } from 'lucide-react';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { cn } from '@repo/ui/lib/utils';
import { renderCustomFieldInput } from '@repo/ui/components/custom-field-renderer';
import { buildFormSchema } from '../../utils/build-form-schema';

type ClientViewProps = {
  client?: Client;
  schemas: MetadataSchema[];
  trigger?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const baseCoreSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
    .min(10, 'Phone must be at least 10 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
});

export function ClientView({
  client,
  schemas,
  trigger,
  open,
  setOpen,
}: ClientViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isPending, startTransition] = useTransition();

  const formSchema = buildFormSchema(schemas, baseCoreSchema);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
      fields: {},
    },
  });

  useEffect(() => {
    form.reset({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      notes: client?.notes || '',
      fields: client?.custom_fields || {},
    });
  }, [client, form]);

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        if (client) {
          await updateClient(client.id, data);
          toast.success('Client updated successfully');
        } else {
          await createClient(data);
          toast.success('Client created successfully');
        }
        router.push('/clients');
        router.refresh();
      } catch (error) {
        toast.error(
          client ? 'Failed to update client' : 'Failed to create client',
        );
        console.error(error);
      }
    });
  };

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? 'bottom' : 'right'}
    >
      {typeof open === 'undefined' && trigger && (
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      )}
      {typeof open === 'undefined' && !trigger && (
        <DrawerTrigger asChild>
          <Button
            variant="link"
            className="text-foreground w-fit px-0 text-left cursor-pointer"
          >
            {client?.name || 'New Client'}
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent
        className={cn(isMobile ? 'h-full max-h-[90vh]' : 'max-w-lg')}
      >
        <DrawerHeader className="gap-1">
          <DrawerTitle>{client?.name || 'New Client'}</DrawerTitle>
          <DrawerDescription>
            {client?.email || 'Create a new client by filling out the form'}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {schemas.length > 0 && (
                <>
                  <Separator />
                  <section className="flex flex-col gap-2 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-4 md:text-left">
                    <div className="text-foreground font-semibold">
                      Custom Fields
                    </div>

                    <div className="space-y-4">
                      {schemas
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((schema) =>
                          renderCustomFieldInput({
                            schema,
                            fieldName: `fields.${schema.field_key}`,
                            control: form.control,
                          }),
                        )}
                    </div>
                  </section>
                </>
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
                    {client ? 'Update' : 'Create'} Client
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
