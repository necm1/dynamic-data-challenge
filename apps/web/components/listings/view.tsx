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
import { type Listing } from '@repo/web-utils/actions/listings';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createListing, updateListing } from '@repo/web-utils/actions/listings';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Loader2, Save } from 'lucide-react';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { cn } from '@repo/ui/lib/utils';
import { renderCustomFieldInput } from '@repo/ui/components/custom-field-renderer';
import { buildFormSchema } from '../../utils/build-form-schema';
import { ListingStatus } from '@repo/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';

type ListingViewProps = {
  listing?: Listing;
  schemas: MetadataSchema[];
  trigger?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const baseCoreSchema = z.object({
  status: z.enum(ListingStatus),
  price: z.coerce.number().positive('Price must be positive'),
  property_id: z.uuid('Invalid property ID'),
});

const statusLabels = {
  [ListingStatus.ACTIVE]: 'Active',
  [ListingStatus.PENDING]: 'Pending',
  [ListingStatus.SOLD]: 'Sold',
};

export function ListingView({
  listing,
  schemas,
  trigger,
  open,
  setOpen,
}: ListingViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isPending, startTransition] = useTransition();

  const formSchema = buildFormSchema(schemas, baseCoreSchema);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: ListingStatus.ACTIVE,
      price: 0,
      property_id: '',
      fields: {},
    },
  });

  useEffect(() => {
    form.reset({
      status: listing?.status ?? ListingStatus.ACTIVE,
      price: listing?.price ?? 0,
      property_id: listing?.property_id ?? '',
      fields: listing?.metadata || {},
    });
  }, [listing, form]);

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        if (listing) {
          await updateListing(listing.id, data);
          toast.success('Listing updated successfully');
        } else {
          await createListing(data);
          toast.success('Listing created successfully');
        }
        router.push('/listings');
        router.refresh();
      } catch (error) {
        toast.error(
          listing ? 'Failed to update listing' : 'Failed to create listing',
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
            {listing?.property?.title || 'New Listing'}
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent
        className={cn(isMobile ? 'h-full max-h-[90vh]' : 'max-w-lg')}
      >
        <DrawerHeader className="gap-1">
          <DrawerTitle>{listing?.property?.title || 'New Listing'}</DrawerTitle>
          <DrawerDescription>
            {listing?.property?.address ||
              'Create a new listing by filling out the form'}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Status <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(statusLabels).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Price <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="250000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="property_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Property ID{' '}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="UUID of property" {...field} />
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
                    {listing ? 'Update' : 'Create'} Listing
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
