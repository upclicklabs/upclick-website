# AEO Agency Landing Page

## Project Overview

A modern landing page for an Answer Engine Optimization (AEO) agency, featuring an interactive AEO Assessment Tool that analyzes websites and delivers personalized reports.

**Inspiration Sources:**
- [Skal Ventures Template](https://v0.app/templates/skal-ventures-template-tnZGzubtsTc) - Design/layout
- [Webflow AEO Assessment](https://webflow.com/aeo-assessment/) - Assessment tool feature
- [Profound](https://www.tryprofound.com/) - AEO messaging and content strategy

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion
- **Email Service:** Resend (for assessment reports + contact form)
- **Scheduling:** Calendly embed
- **Form Handling:** React Hook Form + Zod validation

---

## Page Structure

### Landing Page (`/`)

#### 1. Hero Section
- **Headline:** Problem-first positioning (e.g., "Get Your Brand Mentioned by AI")
- **AI Platform Logos:** ChatGPT, Perplexity, Claude, Gemini, Copilot
- **Subheadline:** Value proposition explaining AEO impact
- **Primary CTA:** "Get Your Free Assessment" or "Book a Call"
- **Visual:** Animation or illustration of AI search experience

#### 2. Problem Section
- Address the pain point: Zero-click AI search is changing how consumers find brands
- Statistics on AI search adoption
- What happens when your brand isn't optimized for AI

#### 3. About Section
- Agency story and mission
- Team expertise in AI/LLM optimization
- Why AEO matters now (the shift from SEO to AEO)

#### 4. What is AEO Section
- Clear explanation of Answer Engine Optimization
- How AI search engines find, understand, and cite content
- Visual comparison: Traditional SEO vs AEO
- Key differences in optimization approach

#### 5. Benefits of AEO Section
- **Visibility in AI Responses:** Get mentioned by ChatGPT, Perplexity, Claude
- **Higher Quality Traffic:** Reach users with high intent
- **Future-Proof Presence:** Stay ahead of the AI search revolution
- **Competitive Advantage:** Stand out while competitors lag behind
- **Brand Authority:** Become a trusted source AI recommends

#### 6. Services/How It Works Section
- **AI Visibility Monitoring:** Track where and how AI mentions your brand
- **Content Optimization:** Create AI-optimized content at scale
- **Technical AEO:** Schema, structured data, AI crawler optimization
- **Analytics & Reporting:** Measure AI-driven traffic and mentions

#### 7. Trust Signals Section
- Client logos (if available)
- Press mentions / "As seen in"
- Key metrics or results (e.g., "7x AI visibility boost")

#### 8. Case Studies/Results Section
- Before/after AI visibility metrics
- Client success stories
- Specific results with data points

#### 9. AEO Assessment Tool Section
- **URL Input:** Enter website to analyze
- **Email Capture:** Where to send the report
- **4 Analysis Categories:**
  - **Content:** Freshness, structure, depth, clarity, question coverage
  - **Technical:** Schema markup, metadata, accessibility, page speed
  - **Authority:** Brand mentions, author attribution, citations
  - **Measurement:** Analytics setup, LLM traffic tracking
- **Output:** Maturity score (1-5) + detailed recommendations
- **Delivery:** Report emailed to user

#### 10. FAQ Section
- Common questions about AEO
- How AEO differs from SEO
- Timeline and expectations
- Pricing structure

#### 11. Footer
- Navigation links
- Contact information
- Social media links
- Legal pages (Privacy, Terms)

---

### Contact Page (`/contact`)

#### Booking Section
- **Calendly Embed:** Schedule a discovery call
- Available time slots
- Call duration and what to expect

#### Contact Form
- Name
- Email
- Company/Website URL
- Message/How can we help?
- Submit button

#### Direct Contact Info
- Email address
- Phone (optional)
- Social media links
- Office hours/response time expectations

---

## AEO Assessment Tool Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Form                         │
│  - Website URL input                                     │
│  - Email input                                           │
│  - Submit button with loading state                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 API Route (/api/assess)                  │
│  1. Validate inputs (URL format, email)                  │
│  2. Fetch target website HTML                            │
│  3. Analyze content structure                            │
│  4. Check schema/structured data                         │
│  5. Evaluate technical factors                           │
│  6. Calculate scores per category                        │
│  7. Generate personalized recommendations                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Email Service                          │
│  - Format report as branded HTML email                   │
│  - Include score breakdown                               │
│  - List actionable recommendations                       │
│  - CTA to book a call                                    │
└─────────────────────────────────────────────────────────┘
```

### Assessment Scoring Criteria

| Category | What We Check | Weight |
|----------|---------------|--------|
| **Content** | FAQ sections, how-to guides, structured answers, content freshness, question coverage | 30% |
| **Technical** | Schema.org markup, meta descriptions, heading structure, page speed, mobile-friendly | 25% |
| **Authority** | Backlinks, brand mentions, author bios, E-E-A-T signals | 25% |
| **Measurement** | Analytics setup, goal tracking, AI referrer detection | 20% |

---

## Folder Structure

```
/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── contact/
│   │   └── page.tsx             # Contact page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── api/
│       ├── assess/
│       │   └── route.ts         # AEO assessment API
│       └── contact/
│           └── route.ts         # Contact form API
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── sections/
│   │   ├── hero.tsx
│   │   ├── problem.tsx
│   │   ├── about.tsx
│   │   ├── what-is-aeo.tsx
│   │   ├── benefits.tsx
│   │   ├── services.tsx
│   │   ├── trust-signals.tsx
│   │   ├── case-studies.tsx
│   │   ├── assessment-tool.tsx
│   │   └── faq.tsx
│   └── forms/
│       ├── assessment-form.tsx
│       └── contact-form.tsx
├── lib/
│   ├── utils.ts
│   ├── assessment/
│   │   ├── analyzer.ts          # Website analysis logic
│   │   ├── scoring.ts           # Score calculation
│   │   └── report.ts            # Report generation
│   └── email/
│       ├── send-report.ts       # Assessment report email
│       └── send-contact.ts      # Contact form notification
├── public/
│   ├── images/
│   └── icons/
│       └── ai-platforms/        # ChatGPT, Perplexity, Claude logos
├── CLAUDE.md
└── skills/
```

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## Environment Variables

```env
# Email Service (Resend)
RESEND_API_KEY=
EMAIL_FROM=hello@yourdomain.com
EMAIL_TO=contact@yourdomain.com

# Scheduling (Calendly)
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-username/discovery-call

# Optional: Analytics
NEXT_PUBLIC_GA_ID=
```

---

## Code Style & Conventions

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind CSS for styling (no inline styles)
- Component files: PascalCase (e.g., `HeroSection.tsx`)
- Utility files: kebab-case (e.g., `send-report.ts`)
- Use `cn()` helper for conditional class names
- Mobile-first responsive design

---

## Content Messaging Guidelines

### Key Messages to Convey

1. **The Problem:** AI is changing how people discover brands. Zero-click AI answers mean traditional SEO isn't enough.

2. **The Solution:** AEO ensures your brand gets mentioned when AI answers questions in your industry.

3. **The Urgency:** Early movers gain significant advantage as AI search adoption grows.

4. **The Proof:** Concrete results with metrics (X% visibility increase, etc.)

### Tone of Voice

- Professional but approachable
- Data-driven and credible
- Forward-thinking and innovative
- Educational without being condescending

---

## Specialized Agents (Skills)

This project uses specialized agents for different tasks. Each agent has defined responsibilities and can be invoked using slash commands.

### Available Agents

| Agent | File | Purpose |
|-------|------|---------|
| **Content Writer** | `skills/content-writer.md` | Landing page copy, blog posts, email content |
| **Frontend Developer** | `skills/frontend-developer.md` | Template customization, components, integrations |
| **AEO Specialist** | `skills/aeo-specialist.md` | Schema markup, assessment logic, AEO optimization |
| **Email Designer** | `skills/email-designer.md` | Assessment report emails, transactional emails |
| **QA Reviewer** | `skills/qa-reviewer.md` | Testing, accessibility, pre-launch checklist |

### When to Use Each Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROJECT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CONTENT PHASE                                                │
│     └── /content-writer → Landing page copy, blog articles      │
│                                                                  │
│  2. DEVELOPMENT PHASE                                            │
│     ├── /frontend-developer → Build components, pages           │
│     └── /aeo-specialist → Schema markup, assessment tool        │
│                                                                  │
│  3. EMAIL PHASE                                                  │
│     └── /email-designer → Assessment report templates           │
│                                                                  │
│  4. QA PHASE                                                     │
│     └── /qa-reviewer → Testing, accessibility, launch prep      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Invocation Examples

```bash
# Content tasks
/content-writer Write hero section copy for AEO agency
/content-writer Create blog post: "What is Answer Engine Optimization?"

# Development tasks
/frontend-developer Build the hero section component
/frontend-developer Implement Calendly embed on contact page

# AEO tasks
/aeo-specialist Generate schema markup for the homepage
/aeo-specialist Build scoring algorithm for assessment tool

# Email tasks
/email-designer Create assessment report email template

# QA tasks
/qa-reviewer Run pre-launch checklist
/qa-reviewer Test assessment form submission flow
```

### Note on Template Usage

Since we're using the Skal Ventures template as a base, the **Frontend Developer** agent focuses on:
- Customizing the template to match AEO agency branding
- Building the AEO Assessment Tool (custom feature not in template)
- Integrating Calendly for scheduling
- Adding any sections not covered by the template

The template provides the foundational design, but customization is still needed for branding, content, and custom features like the assessment tool.
