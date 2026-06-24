"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useChangePassword } from "@/lib/hooks/useChangePassword";
import { changePasswordSchema } from "@/lib/validation/schemas";
import type { ChangePasswordData } from "@/lib/validation/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

/**
 * Self-contained password change form with validation and API integration.
 */
export function PasswordChangeForm() {
  const { mutateAsync: changePassword } = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmitPassword = async (values: ChangePasswordData) => {
    try {
      await changePassword(values);
      passwordForm.reset();
      toast.success("Password updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Colored section header */}
      <div className="flex items-center gap-2.5 px-6 py-4 bg-linear-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
          <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="font-semibold text-foreground">
          Account Security
        </h3>
      </div>

      <div className="px-6 py-5">
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
