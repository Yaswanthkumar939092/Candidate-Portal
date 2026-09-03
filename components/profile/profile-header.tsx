"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, Pencil, Camera, Check, X } from "lucide-react";
import type { Profile } from "@/types/database";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useUpdateProfile } from "@/lib/hooks/useUpdateProfile";
import { frappeApiBase } from "@/lib/frappe-base";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

const nameSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
});

interface ProfileHeaderProps {
  profile: Profile;
  className?: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const LIFECYCLE_CONFIG: Record<
  Profile["lifecycle_stage"],
  {
    label: string;
    avatarBg: string;
  }
> = {
  candidate: {
    label: "Candidate",
    avatarBg: "bg-blue-500",
  },
  applicant: {
    label: "Applicant",
    avatarBg: "bg-amber-500",
  },
  offered: {
    label: "Offered",
    avatarBg: "bg-purple-500",
  },
  onboarding: {
    label: "Onboarding",
    avatarBg: "bg-orange-500",
  },
  employee: {
    label: "Employee",
    avatarBg: "bg-emerald-500",
  },
};

export function ProfileHeader({ profile, className }: ProfileHeaderProps) {
  const cfg = LIFECYCLE_CONFIG[profile?.lifecycle_stage];

  const [isEditingName, setIsEditingName] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadFile, isPending: isUploading } = useFileUpload();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
    },
  });

  const onSubmitName = async (values: z.infer<typeof nameSchema>) => {
    try {
      await updateProfile({
        full_name: values.full_name,
        mobile_no: profile?.phone || "",
        avatar_url: profile?.avatar_url || ""
      });
      setIsEditingName(false);
      toast.success("Name updated successfully");
    } catch (error) {
      toast.error("Failed to update name");
    }
  };

  const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Only JPG and PNG files are allowed");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Reset input so re-selecting the same file triggers onChange again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    uploadFile(file, {
      onSuccess: async (data) => {
        try {
          await updateProfile({
            full_name: profile?.full_name || "",
            mobile_no: profile?.phone || "",
            avatar_url: data.file_url
          });
          toast.success("Avatar updated successfully");
        } catch (error) {
          setPreviewUrl(null);
          const message = error instanceof Error ? error.message : "Failed to update avatar";
          toast.error(message);
        }
      },
      onError: (error) => {
        setPreviewUrl(null);
        const message = error instanceof Error ? error.message : "Failed to upload file";
        toast.error(message);
      }
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* ── Gradient banner ── */}
      <div className="h-24 w-full bg-linear-to-r from-brand via-primary to-brand-deep">
        <div
          className="h-full w-full opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/*
        ── Row layout: avatar LEFT | details RIGHT ──
        The entire row is pulled up by -mt-10 so the avatar
        overlaps the banner. The details column uses pt-12 to
        push text back down below the banner edge.
      */}
      <div className="flex items-center gap-5 px-6 pb-6 -mt-14 relative z-10">
        {/* LEFT — avatar, sits half-in the banner */}
        <div className="shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          <div 
            className={cn(
              "relative group cursor-pointer h-20 w-20 rounded-full",
              isUploading && "opacity-50 pointer-events-none"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-20 w-20 ring-4 ring-background">
              <AvatarImage
                src={previewUrl ?? (profile?.avatar_url ? (profile.avatar_url.startsWith("/files") ? `${frappeApiBase()}${profile.avatar_url}` : profile.avatar_url) : "")}
                alt={profile?.full_name ?? "User"}
                className={isUploading ? "animate-pulse" : ""}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 left-0 bg-background border shadow-sm rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-colors z-10">
              <Camera className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* RIGHT — all text, aligned to start below the banner */}
        <div className="flex-1 min-w-0">
          {/* Name + lifecycle badge on same line */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {isEditingName ? (
              <Form {...form}>
                <form 
                  onSubmit={form.handleSubmit(onSubmitName)} 
                  className="flex items-center gap-1.5 sm:gap-2 -ml-24 sm:ml-0 mb-2 sm:mb-0 relative z-20 w-[calc(100%+6rem)] sm:w-auto"
                >
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-0 sm:flex-none">
                        <FormControl>
                          <Input
                            {...field}
                            className="h-9 text-lg font-bold px-2 py-1 w-full sm:w-64"
                            autoFocus
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button size="sm" type="submit" disabled={form.formState.isSubmitting} className="shrink-0">
                    {form.formState.isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setIsEditingName(false)} disabled={form.formState.isSubmitting} className="shrink-0">
                    Cancel
                  </Button>
                </form>
              </Form>
            ) : (
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onClick={() => {
                  form.reset({ full_name: profile?.full_name ?? "" });
                  setIsEditingName(true);
                }}
              >
                <h2 className="text-2xl font-bold tracking-tight text-foreground leading-none capitalize group-hover:text-foreground/70 transition-colors">
                  {profile?.full_name ?? "—"}
                </h2>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full hover:bg-muted pointer-events-none"
                >
                  <Pencil className="h-4 w-4 text-foreground group-hover:text-foreground/70 transition-colors" />
                </Button>
              </div>
            )}
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 rounded-full px-3 py-1 text-sm font-semibold shrink-0",
                "border-brand/25 bg-brand/10 text-brand",
              )}
            >
              <span className="h-2 w-2 rounded-full shrink-0 bg-brand" />
              {cfg?.label}
            </Badge>
          </div>

          {/* Contact pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              {profile?.email}
            </span>
            {profile?.phone && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {profile?.phone}
              </span>
            )}
            {profile?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                {profile?.location}
              </span>
            )}
          </div>
          {profile?.skills && profile?.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.skills?.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/30 pl-3 max-w-prose">
              {profile?.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
