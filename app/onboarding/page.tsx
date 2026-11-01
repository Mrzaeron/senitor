"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/auth";
import { submitOnboardingAction } from "@/app/auth/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Code2,
  Brain,
  Target,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      programmingLanguage: "cpp",
      programmingExperience: "intermediate",
      dsaExperience: "beginner",
      learningGoal: "interview_prep",
      dailyStudyTarget: 30,
    },
    mode: "onChange",
  });

  const selectedTarget = useWatch({
    control,
    name: "dailyStudyTarget",
    defaultValue: 30,
  });

  const progressPercentage = Math.round((currentStep / 3) * 100);

  const handleNextStep = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await trigger(["fullName", "programmingLanguage"]);
    } else if (currentStep === 2) {
      valid = await trigger(["programmingExperience", "dsaExperience"]);
    }
    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: OnboardingInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitOnboardingAction(data);
      if (!result.success) {
        setServerError(
          result.error || "Failed to save profile. Please check your connection."
        );
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Step Tracker Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent-secondary" />
            <span>Step {currentStep} of 3</span>
          </span>
          <span className="text-accent-secondary font-mono">{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} variant="primary" size="sm" animated />
      </div>

      <Card className="border-border bg-bg-card shadow-lg">
        <CardHeader>
          {currentStep === 1 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" dot>Profile Setup</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">Personalize Your Identity</CardTitle>
              <CardDescription>
                Tell us your name and your primary programming language for algorithms
              </CardDescription>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" dot>Diagnostic</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">Assess Your Skill Level</CardTitle>
              <CardDescription>
                We tailor problem difficulty and explanations to match your current experience
              </CardDescription>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" dot>Goals & Cadence</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">Define Your Target</CardTitle>
              <CardDescription>
                Set your primary objective and commitment to stay accountable
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {serverError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg border border-error/40 bg-error-muted/30 p-3 text-xs text-error"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* STEP 1: Name & Language */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <Input
                    label="What should we call you?"
                    placeholder="e.g. Maya Lin"
                    leftIcon={<User size={16} />}
                    error={errors.fullName?.message}
                    required
                    {...register("fullName")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">
                    Preferred Language for DSA <span className="text-error">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="programmingLanguage"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: "cpp",
                            name: "C++",
                            desc: "STL, high performance, competitive standard",
                          },
                          {
                            id: "python",
                            name: "Python",
                            desc: "Fast prototyping, clean syntax, interview favorite",
                          },
                          {
                            id: "java",
                            name: "Java",
                            desc: "Collections framework, enterprise favorite",
                          },
                        ].map((lang) => {
                          const active = field.value === lang.id;
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => field.onChange(lang.id)}
                              className={[
                                "flex flex-col text-left p-3.5 rounded-lg border transition-all cursor-pointer",
                                active
                                  ? "bg-accent-subtle/80 border-accent-primary text-text-primary shadow-glow"
                                  : "bg-bg-secondary border-border text-text-secondary hover:border-border-accent hover:text-text-primary",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-semibold text-sm">{lang.name}</span>
                                {active && (
                                  <CheckCircle2 size={16} className="text-accent-primary" />
                                )}
                              </div>
                              <span className="text-xs text-text-muted leading-relaxed">
                                {lang.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.programmingLanguage && (
                    <p className="text-xs text-error mt-1">
                      {errors.programmingLanguage.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Programming & DSA Experience */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* General Coding Experience */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                    <Code2 size={16} className="text-accent-secondary" />
                    <span>General Coding Experience</span>
                  </label>
                  <Controller
                    control={control}
                    name="programmingExperience"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "beginner", title: "Beginner", desc: "< 1 year of programming" },
                          { id: "intermediate", title: "Intermediate", desc: "1 - 3 years coding" },
                          { id: "advanced", title: "Advanced", desc: "3+ years / professional" },
                        ].map((lvl) => {
                          const active = field.value === lvl.id;
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => field.onChange(lvl.id)}
                              className={[
                                "flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer",
                                active
                                  ? "bg-accent-subtle/80 border-accent-primary text-text-primary"
                                  : "bg-bg-secondary border-border text-text-secondary hover:border-border-accent hover:text-text-primary",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-semibold text-sm">{lvl.title}</span>
                                {active && (
                                  <CheckCircle2 size={15} className="text-accent-primary" />
                                )}
                              </div>
                              <span className="text-xs text-text-muted">{lvl.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                {/* DSA Specific Experience */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                    <Brain size={16} className="text-accent-secondary" />
                    <span>Data Structures & Algorithms Background</span>
                  </label>
                  <Controller
                    control={control}
                    name="dsaExperience"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "beginner", title: "Introductory", desc: "Learning fundamentals" },
                          { id: "intermediate", title: "Practicing", desc: "Know basic trees & sorting" },
                          { id: "advanced", title: "Competitive", desc: "Proficient in DP & graphs" },
                        ].map((lvl) => {
                          const active = field.value === lvl.id;
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => field.onChange(lvl.id)}
                              className={[
                                "flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer",
                                active
                                  ? "bg-accent-subtle/80 border-accent-primary text-text-primary"
                                  : "bg-bg-secondary border-border text-text-secondary hover:border-border-accent hover:text-text-primary",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-semibold text-sm">{lvl.title}</span>
                                {active && (
                                  <CheckCircle2 size={15} className="text-accent-primary" />
                                )}
                              </div>
                              <span className="text-xs text-text-muted">{lvl.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Goals & Daily Target */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Goal Selector */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                    <Target size={16} className="text-accent-secondary" />
                    <span>Primary Learning Goal</span>
                  </label>
                  <Controller
                    control={control}
                    name="learningGoal"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            id: "interview_prep",
                            title: "Technical Interview Prep",
                            desc: "FAANG / Tier-1 software engineering coding rounds",
                          },
                          {
                            id: "competitive_programming",
                            title: "Competitive Programming",
                            desc: "Codeforces, LeetCode contests & rating growth",
                          },
                          {
                            id: "academic_exams",
                            title: "Academic & University Exams",
                            desc: "CS degree coursework and algorithm fundamentals",
                          },
                          {
                            id: "core_mastery",
                            title: "Deep Problem Solving",
                            desc: "Continuous mental sharpening and engineering rigor",
                          },
                        ].map((goal) => {
                          const active = field.value === goal.id;
                          return (
                            <button
                              key={goal.id}
                              type="button"
                              onClick={() => field.onChange(goal.id)}
                              className={[
                                "flex flex-col text-left p-3.5 rounded-lg border transition-all cursor-pointer",
                                active
                                  ? "bg-accent-subtle/80 border-accent-primary text-text-primary shadow-glow"
                                  : "bg-bg-secondary border-border text-text-secondary hover:border-border-accent hover:text-text-primary",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-semibold text-sm">{goal.title}</span>
                                {active && (
                                  <CheckCircle2 size={15} className="text-accent-primary" />
                                )}
                              </div>
                              <span className="text-xs text-text-muted leading-relaxed">
                                {goal.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                {/* Daily Study Target */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium text-text-primary">
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} className="text-accent-secondary" />
                      <span>Daily Study Commitment</span>
                    </span>
                    <span className="text-xs font-mono text-accent-secondary">
                      {selectedTarget} minutes / day
                    </span>
                  </label>
                  <Controller
                    control={control}
                    name="dailyStudyTarget"
                    render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[15, 30, 45, 60, 90].map((mins) => {
                          const active = Number(field.value) === mins;
                          return (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => field.onChange(mins)}
                              className={[
                                "py-2 px-3 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer",
                                active
                                  ? "bg-accent-primary text-text-inverted border-accent-primary shadow-sm"
                                  : "bg-bg-secondary border-border text-text-secondary hover:border-border-accent hover:text-text-primary",
                              ].join(" ")}
                            >
                              {mins} mins
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handlePrevStep}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isPending}
                  rightIcon={<Sparkles size={16} />}
                >
                  Build My Personalized Roadmap
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
