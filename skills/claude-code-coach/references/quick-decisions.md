# Quick Decision Reference

## Should I Create a Skill, Sub-Agent, or Command?

```
┌─────────────────────────────────────────────────────────┐
│                  What do you need?                       │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   Reusable prompt   Expertise in    Isolated context
     sequence        main context      for a task
         │                │                │
         ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ Command │      │  Skill  │      │Sub-Agent│
   └─────────┘      └─────────┘      └─────────┘
```

### Command
- Reusable prompt template
- Same steps every time
- No special knowledge needed
- Example: `/changelog` — generates changelog from commits

### Skill
- Expertise injection into main context
- Specialized knowledge Claude lacks
- Quality/consistency standards
- Example: `brand-voice` — ensures all content matches brand tone

### Sub-Agent
- Isolated context window
- Specific problem domain
- Prevents context pollution
- Example: `@researcher` — does web research without filling main context

---

## When to Use DOE vs Skills Framework

```
┌─────────────────────────────────────────────────────────┐
│              What are you building?                      │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    Automation workflow        Product/Application
    (lead gen, scraping,       (app, tool, content
     email sequences)           system, team)
              │                       │
              ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │  DOE Framework  │     │ Skills Framework│
    │                 │     │                 │
    │ - Directives    │     │ - Skills        │
    │ - Orchestration │     │ - Agents        │
    │ - Execution     │     │ - Templates     │
    └─────────────────┘     └─────────────────┘
```

### DOE Framework
- Business process automation
- Deterministic outcomes required
- Error rates must be minimal
- LLM decides, code executes

### Skills Framework
- Building products/tools
- Need expert knowledge injection
- Quality over determinism
- Multiple agents collaborate

### Hybrid (Use Both)
- Product with automation workflows
- Example: Marketing tool that also auto-generates content

---

## How Many Agents Do I Need?

```
One Agent:
- Simple, single-domain task
- No handoffs needed
- Example: Q&A bot

Two Agents:
- Research + Creation pattern
- One gathers, one produces
- Example: @researcher → @writer

Three+ Agents:
- Complex workflows
- Multiple specialized roles
- Clear handoff points
- Example: Content team (@strategist → @writer → @editor)

Warning Signs You Have Too Many:
- Agents have overlapping responsibilities
- Routing rules are confusing
- Simple tasks hit multiple agents
```

---

## Where Should This File Go?

| File Type | Location |
|-----------|----------|
| System prompt for project | `.claude/CLAUDE.md` |
| Agent definition | `.claude/agents/[name].md` |
| Reusable command | `.claude/commands/[name].md` |
| Expertise/knowledge | `skills/[name]/SKILL.md` |
| Output format template | `templates/[type].md` |
| Business context Claude reads | `docs/` |
| Input data to process | `data/` |
| Generated outputs | `outputs/` |
| Deterministic scripts | `execution/` or `scripts/` |
| Environment variables | `.env` |

---

## MCP Server Quick Reference

### Common MCP Servers
| Server | Use Case |
|--------|----------|
| Google Drive | Read/write docs, sheets |
| Notion | Database, content calendar |
| Slack | Team communication |
| GitHub | Code repos, issues |
| Ahrefs | SEO data |
| GA4 | Analytics data |
| Postgres | Database queries |

### Installation
```bash
# Import from Claude Desktop
cd /path/to/project
mcp add-from-claude-desktop

# Verify
/mcp  # In Claude Code session
```

---

## Skill Trigger Checklist

When writing skill descriptions, include:

- [ ] What the skill does (capability)
- [ ] When to use it (triggers)
- [ ] File types/formats it handles
- [ ] Example phrases that should trigger it

**Good description:**
> "Creates branded social media visuals. Use when user requests social graphics, Instagram posts, LinkedIn images, or any visual content that needs brand colors and style. Triggers on 'create social image', 'design post graphic', 'make visual for [platform]'."

**Bad description:**
> "Helps with social media."

---

## Debugging Checklist

When something isn't working:

### Agent Not Triggering
- [ ] Is trigger phrase in routing rules?
- [ ] Is agent file in `.claude/agents/`?
- [ ] Did you use `@agent-name` tag?
- [ ] Is there a routing conflict?

### Skill Not Triggering
- [ ] Is description specific enough?
- [ ] Did you install the skill?
- [ ] Is SKILL.md in correct location?
- [ ] Try explicitly: "Use [skill-name] to..."

### Output Inconsistent
- [ ] Is there a template for this output?
- [ ] Does agent know to read template?
- [ ] Are quality criteria defined?

### Context Window Full
- [ ] Move research to sub-agent
- [ ] Clear context with `/clear`
- [ ] Break task into smaller pieces

### MCP Not Working
- [ ] Run `/mcp` to verify connection
- [ ] Check authentication
- [ ] Reimport with `mcp add-from-claude-desktop`

---

## Anti-Patterns to Avoid

### ❌ God Agent
One agent does everything → Create specialized agents

### ❌ Unclear Handoffs
Agents don't know who's next → Define routing rules

### ❌ No Templates
Every output different → Create templates for consistency

### ❌ Skills in Main Prompt
Huge CLAUDE.md with all knowledge → Extract to skills

### ❌ No Error Recovery
System breaks, stays broken → Add self-annealing pattern

### ❌ Overlapping Agents
Multiple agents could handle same task → Clarify boundaries
