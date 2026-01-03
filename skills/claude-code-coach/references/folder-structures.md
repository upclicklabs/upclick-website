# Folder Structure Reference

## Starter Structure (Simple Projects)
```
project/
├── .claude/
│   └── CLAUDE.md
├── docs/
│   └── context.md
└── outputs/
```

## Standard Structure (Most Projects)
```
project/
├── .claude/
│   ├── CLAUDE.md
│   └── agents/
│       ├── researcher.md
│       └── writer.md
├── skills/
│   └── brand-voice/
│       └── SKILL.md
├── templates/
│   ├── content-brief.md
│   └── blog-post.md
├── docs/
│   ├── business-context.md
│   └── brand-guidelines.md
├── data/
│   └── [input files]
└── outputs/
    └── [generated deliverables]
```

## Advanced Structure (Multi-Agent Teams)
```
project/
├── .claude/
│   ├── CLAUDE.md              # Master routing + context
│   ├── agents/
│   │   ├── content-strategist.md
│   │   ├── writer.md
│   │   ├── editor.md
│   │   ├── data-analyst.md
│   │   └── presentation-specialist.md
│   └── commands/
│       └── weekly-report.md
├── skills/
│   ├── brand-voice/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── tone-examples.md
│   ├── seo-optimization/
│   │   └── SKILL.md
│   └── data-visualization/
│       ├── SKILL.md
│       └── templates/
│           └── dashboard.html
├── templates/
│   ├── content-brief.md
│   ├── blog-post.md
│   ├── social-post.md
│   └── presentation.md
├── docs/
│   ├── business-context.md
│   ├── brand-guidelines.md
│   ├── workflows.md
│   └── client-briefs/
├── data/
│   ├── analytics/
│   ├── research/
│   └── assets/
└── outputs/
    ├── content/
    ├── reports/
    └── presentations/
```

## DOE Structure (Automation Workflows)
```
project/
├── .claude/
│   └── CLAUDE.md
├── directives/
│   ├── scrape-leads.md
│   ├── enrich-data.md
│   └── send-outreach.md
├── execution/
│   ├── scrape_apollo.py
│   ├── enrich_clearbit.py
│   └── send_email.py
├── tmp/
│   └── [working files]
├── logs/
│   └── [execution logs]
└── .env
```

## Hybrid Structure (Products + Automation)
```
project/
├── .claude/
│   ├── CLAUDE.md
│   └── agents/
├── skills/                    # Expertise injection
├── directives/                # Automation workflows
├── execution/                 # Deterministic scripts
├── src/                       # Application code
├── docs/
├── data/
└── outputs/
```

## Key Principles

### Separation of Concerns
- `.claude/` = Claude's brain (prompts, routing, agents)
- `skills/` = Expertise packages
- `templates/` = Output formats
- `docs/` = Business context (Claude reads)
- `data/` = Input files (Claude processes)
- `outputs/` = Deliverables (Claude creates)

### Naming Conventions
- Folders: lowercase, hyphenated (`content-strategist/`)
- CLAUDE.md, SKILL.md: Always capitalized
- Agent files: lowercase (`writer.md`)
- Templates: descriptive (`content-brief.md`)

### What Goes Where

| Content Type | Location |
|-------------|----------|
| System prompt | `.claude/CLAUDE.md` |
| Agent definitions | `.claude/agents/` |
| Reusable expertise | `skills/` |
| Output formats | `templates/` |
| Business context | `docs/` |
| Raw inputs | `data/` |
| Final outputs | `outputs/` |
