"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/lib/hooks/useUpdateProfile";
import { mobileNumberSchema } from "@/lib/validation/schemas";
import type { MobileNumberData } from "@/lib/validation/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Profile } from "@/types/database";

interface MobileEditInlineProps {
  profile: Profile;
}

/**
 * Inline-editable mobile number field with validation.
 */
export function MobileEditInline({ profile }: MobileEditInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const mobileForm = useForm<MobileNumberData>({
    resolver: zodResolver(mobileNumberSchema),
    defaultValues: {
      mobile_no: profile.phone || "",
    },
  });

  const onSubmitMobile = async (values: MobileNumberData) => {
    try {
      await updateProfile({
        full_name: profile.full_name || "",
        mobile_no: values.mobile_no,
        avatar_url: profile.avatar_url || "",
      });
      setIsEditing(false);
      toast.success("Mobile number updated successfully");
    } catch {
      toast.error("Failed to update mobile number");
    }
  };

  if (isEditing) {
    return (
      <Form {...mobileForm}>
        <form
          onSubmit={mobileForm.handleSubmit(onSubmitMobile)}
          className="flex items-center gap-2 mt-1"
        >
          <FormField
            control={mobileForm.control}
            name="mobile_no"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} className="h-8 text-sm" autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            size="sm"
            type="submit"
            disabled={mobileForm.formState.isSubmitting}
            className="h-8"
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              mobileForm.reset();
              setIsEditing(false);
            }}
            className="h-8"
          >
            Cancel
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <span>{profile.phone || "Not provided"}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
}
