"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Mail, Calendar, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const assessmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  url: z
    .string()
    .min(1, "Website URL is required")
    .url("Please enter a valid URL"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export function AssessmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [reportUrl, setReportUrl] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
  });

  const onSubmit = async (data: AssessmentFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmittedEmail(data.email);
        setReportUrl(result.reportUrl || "");
        setIsSuccess(true);
        reset();
      } else {
        console.error("Assessment request failed:", result.error);
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAnother = () => {
    setIsSuccess(false);
    setSubmittedEmail("");
    setReportUrl("");
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-primary/50 rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div>
          <h3 className="text-xl font-serif-elegant text-foreground">
            Check Your Inbox!
          </h3>
          <p className="mt-3 text-muted-foreground">
            Your AEO Assessment Report has been sent to:
          </p>
          <p className="mt-1 text-foreground font-medium">
            {submittedEmail}
          </p>
        </div>

        <div className="p-4 border border-border/50 bg-secondary/30 text-left space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Detailed score breakdown by pillar
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Personalized recommendations
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Shareable report link
          </p>
        </div>

        {/* View Report Now button */}
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-skal-filled w-full py-4 text-sm tracking-widest flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Your Report Now
          </a>
        )}

        <a
          href={process.env.NEXT_PUBLIC_CALENDLY_URL || "/contact"}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-skal w-full py-4 text-sm tracking-widest flex items-center justify-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Book a Free Consultation
        </a>

        <button
          onClick={handleRequestAnother}
          className="w-full font-mono text-xs tracking-widest text-muted-foreground hover:text-primary transition-colors text-center py-2"
        >
          Analyze Another Website
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3"
        >
          Your Name
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          placeholder="John Smith"
          className={cn(
            "w-full border border-border/50 bg-secondary/30 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors",
            errors.name && "border-destructive"
          )}
        />
        {errors.name && (
          <p className="mt-2 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="url"
          className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3"
        >
          Website URL
        </label>
        <input
          {...register("url")}
          type="url"
          id="url"
          placeholder="https://yourwebsite.com"
          className={cn(
            "w-full border border-border/50 bg-secondary/30 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors",
            errors.url && "border-destructive"
          )}
        />
        {errors.url && (
          <p className="mt-2 text-xs text-destructive">{errors.url.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3"
        >
          Email Address
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          placeholder="you@company.com"
          className={cn(
            "w-full border border-border/50 bg-secondary/30 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors",
            errors.email && "border-destructive"
          )}
        />
        {errors.email && (
          <p className="mt-2 text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-skal-filled w-full py-4 text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
            Analyzing...
          </>
        ) : (
          "Get Your Free Assessment"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        We respect your privacy. Your data will only be used to generate your
        report.
      </p>
    </form>
  );
}
