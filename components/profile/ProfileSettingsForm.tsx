"use client";

import { useActionState } from "react";
import { saveProfileSettingsAction } from "@/app/(dashboard)/profile/actions";
import type { ProfileSettingsData } from "@/types/user";

const initialState = { status: "idle" as const };

const fields = [
  {
    name: "programmingLanguage",
    label: "Programming language",
    value: "cpp",
    options: [
      ["cpp", "C++"],
      ["python", "Python"],
      ["java", "Java"],
    ],
  },
  {
    name: "experienceLevel",
    label: "Experience level",
    value: "beginner",
    options: [
      ["beginner", "Beginner"],
      ["intermediate", "Intermediate"],
      ["advanced", "Advanced"],
    ],
  },
  {
    name: "learningGoal",
    label: "Learning goal",
    value: "interview_prep",
    options: [
      ["interview_prep", "Interview preparation"],
      ["competitive_programming", "Competitive programming"],
      ["academic_exams", "Academic exams"],
      ["core_mastery", "Core DSA mastery"],
    ],
  },
] as const;

export function ProfileSettingsForm({
  profile,
}: {
  profile: ProfileSettingsData;
}) {
  const [state, formAction, pending] = useActionState(
    saveProfileSettingsAction,
    initialState
  );
  const experienceLevel =
    profile.programming_experience ?? profile.dsa_experience ?? "beginner";
  const targetOptions = [
    ...new Set([
      15,
      30,
      45,
      60,
      90,
      120,
      180,
      240,
      profile.daily_study_target ?? 30,
    ]),
  ].sort((a, b) => a - b);

  return (
    <form action={formAction} className="space-y-5">
      {fields.map((field) => {
        const selectedValue =
          field.name === "programmingLanguage"
            ? profile.programming_language ?? field.value
            : field.name === "experienceLevel"
              ? experienceLevel
              : profile.learning_goal ?? field.value;

        return (
          <label
            key={field.name}
            className="flex flex-col gap-2 text-sm font-medium text-text-primary"
          >
            {field.label}
            <select
              name={field.name}
              defaultValue={selectedValue}
              required
              className="h-11 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
            >
              {field.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        );
      })}

      <label className="flex flex-col gap-2 text-sm font-medium text-text-primary">
        Daily study target
        <select
          name="dailyStudyTarget"
          defaultValue={String(profile.daily_study_target ?? 30)}
          required
          className="h-11 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          {targetOptions.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minutes per day
            </option>
          ))}
        </select>
      </label>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-error"
              : "text-sm text-success"
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-accent-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
