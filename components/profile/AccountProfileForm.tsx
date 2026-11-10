"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveAccountProfileAction, saveAvatarPathAction } from "@/app/(dashboard)/profile/actions";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/profile/avatar";
import type { AccountProfileData } from "@/types/user";
import { ImagePlus } from "lucide-react";

const initialState = { status: "idle" as const };
const maxAvatarBytes = 2 * 1024 * 1024;
const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function announceProfileUpdate(userName: string, avatarUrl?: string) {
  window.dispatchEvent(
    new CustomEvent("senitor:profile-updated", {
      detail: { userName, avatarUrl },
    })
  );
}

export function AccountProfileForm({ profile }: { profile: AccountProfileData }) {
  const [state, formAction, pending] = useActionState(
    saveAccountProfileAction,
    initialState
  );
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarPath, setAvatarPath] = useState(profile.avatar_path);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (state.status === "success") {
      announceProfileUpdate(
        fullName.trim() || profile.username,
        getAvatarUrl(avatarPath)
      );
    }
  }, [avatarPath, fullName, profile.username, state.status]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (!allowedAvatarTypes.has(file.type)) {
      setUploadError(true);
      setUploadMessage("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxAvatarBytes) {
      setUploadError(true);
      setUploadMessage("The image must be 2 MB or smaller.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setUploadError(false);
    setUploadMessage("Uploading profile picture…");

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUploadError(true);
        setUploadMessage("Sign in again before uploading a profile picture.");
        return;
      }

      const path = `${userData.user.id}/avatar-${crypto.randomUUID()}.${extensionByType[file.type]}`;
      const { error: storageError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (storageError) {
        setUploadError(true);
        setUploadMessage("The picture could not be uploaded. Please try again.");
        return;
      }

      const saved = await saveAvatarPathAction(path);
      if (saved.status !== "success") {
        const { error: cleanupError } = await supabase.storage
          .from("avatars")
          .remove([path]);
        if (cleanupError) {
          console.error("[profile] failed to remove an unsaved avatar upload");
        }
        setUploadError(true);
        setUploadMessage(saved.message ?? "The picture could not be saved.");
        return;
      }

      setAvatarPath(path);
      setPreviewUrl(null);
      setUploadError(false);
      setUploadMessage(saved.message ?? "Profile photo updated.");
      announceProfileUpdate(
        fullName.trim() || profile.username,
        getAvatarUrl(path)
      );
    } catch (error) {
      console.error("[profile] avatar upload failed", {
        name: error instanceof Error ? error.name : "Unknown error",
      });
      setUploadError(true);
      setUploadMessage("The picture could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const avatarUrl = getAvatarUrl(avatarPath);
  const displayedAvatar = previewUrl ?? avatarUrl;
  const displayedName = fullName.trim() || profile.username;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <Avatar src={displayedAvatar} fallback={displayedName} alt={`${displayedName}'s profile picture`} size="xl" />
        <div className="space-y-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary">
            <ImagePlus size={16} aria-hidden />
            {uploading ? "Uploading…" : "Change picture"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload a profile picture"
            />
          </label>
          <p className="text-xs text-text-muted">JPEG, PNG, or WebP. Maximum file size: 2 MB.</p>
          {uploading && (
            <progress
              aria-label="Uploading profile picture"
              className="h-1.5 w-48 accent-accent-primary"
            />
          )}
          {uploadMessage && (
            <p
              role={uploadError ? "alert" : "status"}
              className={`text-xs ${uploadError ? "text-error" : "text-text-secondary"}`}
            >
              {uploadMessage}
            </p>
          )}
        </div>
      </section>

      <form action={formAction} className="space-y-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-text-primary">
          Username
          <input
            value={profile.username}
            readOnly
            className="h-11 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-muted"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-text-primary">
          Full name
          <input
            name="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.currentTarget.value)}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className="h-11 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-text-primary">
          Email address
          <input
            value={profile.email}
            readOnly
            className="h-11 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-muted"
          />
        </label>

        <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>
            Account created{" "}
            <time dateTime={profile.created_at}>
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>
          <Link
            href="/forgot-password"
            className="font-medium text-accent-secondary hover:text-text-primary"
          >
            Change password / account security
          </Link>
        </div>

        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`text-sm ${state.status === "error" ? "text-error" : "text-success"}`}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
