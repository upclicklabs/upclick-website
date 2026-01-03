# Agent Routing & Orchestration Reference

## Routing Rules Template

Add this section to your CLAUDE.md:

```markdown
## Agent Routing

### Single-Agent Triggers
| Phrase Contains | Route To | Notes |
|-----------------|----------|-------|
| "research", "find", "look up" | @researcher | Always first for new topics |
| "write", "draft", "create" | @writer | After research complete |
| "analyze", "data", "metrics" | @analyst | Needs data input |
| "slides", "deck", "presentation" | @presenter | After content ready |
| "edit", "review", "proofread" | @editor | Final quality check |

### Multi-Agent Workflows
| Trigger Phrase | Workflow |
|---------------|----------|
| "full blog post" | @researcher → @writer → @editor |
| "campaign report" | @analyst → @writer → @presenter |
| "content calendar" | @researcher → @strategist → @writer |

### Conflict Resolution
1. If multiple agents could handle → Ask user
2. If scope unclear → Start with @researcher
3. If dependencies missing → Complete prerequisite first
```

## Orchestration Patterns

### Pattern 1: Sequential Pipeline
```
User Request
    ↓
@researcher (gathers information)
    ↓
@writer (creates draft)
    ↓
@editor (polishes output)
    ↓
Final Output
```

**When to use:** Each step depends on previous output
**Example:** Blog creation, report writing

**CLAUDE.md config:**
```markdown
### Blog Creation Workflow
Trigger: "create blog about [topic]"
1. @researcher researches [topic], saves to /data/research/
2. @writer reads research, creates draft in /outputs/drafts/
3. @editor reviews draft, saves final to /outputs/published/
```

### Pattern 2: Parallel Execution
```
User Request
    ↓
    ├→ @writer (creates copy)
    ├→ @designer (creates visuals)
    └→ @analyst (pulls metrics)
    ↓
@coordinator (combines outputs)
    ↓
Final Output
```

**When to use:** Independent tasks that can run simultaneously
**Example:** Campaign launch, multi-format content

**CLAUDE.md config:**
```markdown
### Campaign Launch Workflow
Trigger: "launch campaign for [product]"
Execute in parallel:
- @writer creates email copy, social posts
- @designer creates visual assets
- @analyst pulls baseline metrics
Then: Combine into campaign brief in /outputs/campaigns/
```

### Pattern 3: Hub and Spoke
```
User Request
    ↓
@coordinator (main agent)
    ├→ delegates to @specialist-a
    ├→ delegates to @specialist-b
    └→ delegates to @specialist-c
    ↓
@coordinator (consolidates)
    ↓
Final Output
```

**When to use:** Central decision-maker delegates specialized tasks
**Example:** Project management, complex analysis

**CLAUDE.md config:**
```markdown
### Project Coordination
@project-lead is the default coordinator.
- Technical questions → delegate to @developer
- Content questions → delegate to @writer
- Data questions → delegate to @analyst
@project-lead consolidates all outputs into project deliverable.
```

### Pattern 4: Conditional Branching
```
User Request
    ↓
@triage (determines type)
    ├→ If type A → @agent-a
    ├→ If type B → @agent-b
    └→ If unclear → Ask user
    ↓
Final Output
```

**When to use:** Different request types need different handlers
**Example:** Support tickets, content types

**CLAUDE.md config:**
```markdown
### Content Request Routing
1. Determine content type from request
2. Route accordingly:
   - Blog/article → @long-form-writer
   - Social post → @social-writer
   - Email → @email-writer
   - Unclear → Ask user to specify
```

## Agent Handoff Protocol

### Clean Handoff Requirements
Each agent must:
1. Save output to agreed location
2. Include metadata for next agent
3. Signal completion clearly

**Output format for handoffs:**
```markdown
# [Deliverable Name]
Created by: @[agent-name]
Date: [timestamp]
Status: Ready for @[next-agent]

## Summary
[Brief description of what was done]

## Output Location
[File path]

## Notes for Next Agent
[Any context needed]
```

### Dependency Management
```markdown
## Workflow Dependencies

@writer requires:
- Research brief from @researcher (minimum)
- Content strategy from @strategist (optional)
- SEO keywords from @seo-specialist (optional)

@presenter requires:
- Final content from @writer OR @analyst
- Brand assets in /docs/brand/

@editor requires:
- Draft content in /outputs/drafts/
- Style guide in /docs/style-guide.md
```

## Common Routing Mistakes

### Mistake 1: Overlapping Responsibilities
❌ Bad:
```
@content-creator - Creates content
@writer - Writes content
```

✅ Good:
```
@researcher - Gathers information, creates briefs
@writer - Creates long-form content from briefs
```

### Mistake 2: Vague Triggers
❌ Bad:
```
"help" → @assistant
```

✅ Good:
```
"help with research" → @researcher
"help with writing" → @writer
"help with data" → @analyst
```

### Mistake 3: Missing Conflict Resolution
❌ Bad:
```
"create content" → @writer
"create report" → @analyst
"create presentation" → @presenter
# What about "create content report presentation"?
```

✅ Good:
```
"create content" → @writer
"create report" → @analyst
"create presentation" → @presenter

Conflict resolution:
- Multiple content types → Break into sequential tasks
- Ambiguous → Ask user to specify primary deliverable
```

## Testing Your Routing

### Test Cases to Run
1. Clear single-agent request
2. Multi-step workflow trigger
3. Ambiguous request (should ask for clarification)
4. Request requiring handoff between agents
5. Request with missing dependencies

### Validation Checklist
- [ ] Every agent has clear, non-overlapping triggers
- [ ] Multi-agent workflows have defined sequence
- [ ] Conflict resolution rules exist
- [ ] Handoff locations are specified
- [ ] Dependencies are documented
