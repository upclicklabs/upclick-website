# Discovery Session Template

## How to Use This Template
Run through these phases with the user. Don't ask all questions at once — be conversational. Skip questions that have already been answered.

---

## Phase 1: Problem Understanding

### Opening Questions (Pick 2-3)
1. "What problem are you trying to solve?"
2. "What's the pain point that made you want to automate this?"
3. "Who is this for — yourself, clients, your team?"
4. "What does success look like? What's the ideal outcome?"

### Clarifying Questions (As Needed)
- "How often does this need to happen?"
- "What's the current cost (time/money) of doing this manually?"
- "What would break if this automation failed?"

### Phase 1 Output
```
Problem: [One sentence summary]
Stakeholder: [Who benefits]
Success Metric: [How we know it's working]
Frequency: [How often this runs]
Risk Level: [What happens if it fails]
```

---

## Phase 2: Workflow Mapping

### Process Questions
1. "Walk me through how this is done manually today, step by step."
2. "What inputs do you start with?"
3. "What outputs do you need at the end?"
4. "Which steps are repetitive and predictable?"
5. "Which steps require judgment or creativity?"

### Integration Questions
- "What tools/systems does this touch?" (CRM, email, sheets, etc.)
- "Where does the data come from?"
- "Where does the output need to go?"

### Phase 2 Output
```
## Current Workflow
1. [Step 1] - Input: [x] → Output: [y]
2. [Step 2] - Input: [y] → Output: [z]
...

## Inputs
- [Source 1]: [description]
- [Source 2]: [description]

## Outputs
- [Deliverable 1]: [format, destination]
- [Deliverable 2]: [format, destination]

## Integration Points
- [Tool/System]: [how it's used]
```

---

## Phase 3: Agent Architecture

### Analysis Questions
Based on the workflow, identify:
1. What distinct roles emerge from the steps?
2. What expertise does each role need?
3. What tools does each role need access to?

### Design Questions
- "Should this be one agent or multiple?"
- "What skills (expertise) are missing from vanilla Claude?"
- "What MCP connections are needed?"

### Phase 3 Output
```
## Proposed Agents

### @[agent-1-name]
Role: [One sentence]
Responsibilities:
- [Task 1]
- [Task 2]
Skills needed: [list]
MCP tools: [list]
Triggers: "[phrase 1]", "[phrase 2]"

### @[agent-2-name]
...

## Orchestration
[Diagram or description of how agents work together]

## Skills to Create
1. [skill-name]: [what expertise it provides]
2. ...

## MCP Servers Needed
1. [server]: [what it connects to]
2. ...
```

---

## Phase 4: Folder Structure

### Structure Questions
1. "Do you have existing files/templates to incorporate?"
2. "How should outputs be organized?"
3. "Will multiple people access this workspace?"

### Phase 4 Output
```
project-name/
├── .claude/
│   ├── CLAUDE.md
│   └── agents/
│       └── [identified agents]
├── skills/
│   └── [identified skills]
├── templates/
│   └── [output templates needed]
├── docs/
│   └── [business context]
├── data/
│   └── [input organization]
└── outputs/
    └── [output organization]
```

---

## Phase 5: Implementation Roadmap

### Prioritization Questions
1. "What's the minimum viable version?"
2. "What can we add later?"
3. "What's the biggest risk to mitigate first?"

### Phase 5 Output
```
## Implementation Phases

### Phase 1: Foundation (Do First)
- [ ] Create folder structure
- [ ] Write CLAUDE.md with basic routing
- [ ] Create first agent: @[name]
- [ ] Test with simple task

### Phase 2: Core Functionality
- [ ] Add remaining agents
- [ ] Create essential skills
- [ ] Connect MCP servers
- [ ] Test multi-agent workflow

### Phase 3: Polish & Scale
- [ ] Add templates for consistency
- [ ] Create custom skills for brand/quality
- [ ] Add error handling
- [ ] Document workflows
```

---

## Discovery Session Summary Template

After completing all phases, generate this summary:

```markdown
# Project Discovery Summary: [Project Name]

## Problem Statement
[One paragraph describing the problem and desired outcome]

## Workflow Overview
[Brief description of the process being automated]

## Architecture

### Agents
| Agent | Role | Key Triggers |
|-------|------|--------------|
| @[name] | [role] | "[triggers]" |

### Skills Needed
| Skill | Purpose |
|-------|---------|
| [name] | [what it provides] |

### MCP Integrations
| Server | Connection |
|--------|------------|
| [name] | [what system] |

## Folder Structure
[Tree diagram]

## Implementation Roadmap
1. [Phase 1 summary]
2. [Phase 2 summary]
3. [Phase 3 summary]

## Next Steps
1. [Immediate action 1]
2. [Immediate action 2]
3. [Immediate action 3]
```

---

## Tips for Running Discovery

### Do
- Ask one question at a time
- Validate understanding before moving on
- Use their language, not technical jargon
- Draw diagrams/structures as you go
- Confirm each phase before proceeding

### Don't
- Overwhelm with too many questions
- Assume technical knowledge
- Skip to implementation too fast
- Forget to document decisions
- Ignore edge cases and error scenarios
