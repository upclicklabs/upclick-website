"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  website: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
        reset();
      } else {
        console.error("Contact form submission failed");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-primary/50">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-xl font-serif-elegant text-foreground">Message Sent!</h3>
        <p className="mt-2 text-muted-foreground">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-6 font-mono text-xs tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3">
          Name
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          placeholder="Your name"
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
        <label htmlFor="contact-email" className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          id="contact-email"
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

      <div>
        <label htmlFor="website" className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3">
          Website (optional)
        </label>
        <input
          {...register("website")}
          type="url"
          id="website"
          placeholder="https://yourwebsite.com"
          className="w-full border border-border/50 bg-secondary/30 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="message" className="block font-mono text-xs tracking-widest text-muted-foreground uppercase mb-3">
          Message
        </label>
        <textarea
          {...register("message")}
          id="message"
          rows={4}
          placeholder="How can we help you?"
          className={cn(
            "w-full border border-border/50 bg-secondary/30 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none",
            errors.message && "border-destructive"
          )}
        />
        {errors.message && (
          <p className="mt-2 text-xs text-destructive">
            {errors.message.message}
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
            Sending...
          </>
        ) : (
          "[SEND MESSAGE]"
        )}
      </button>
    </form>
  );
}
