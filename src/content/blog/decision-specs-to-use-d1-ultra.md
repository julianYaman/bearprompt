---
title: "Usage examples for Liquid d1-ultra"
slug: "decision-specs-to-use-d1-ultra"
description: "Liquid d1-ultra answers typed questions instead of generating text. These are the four usage examples from Liquid’s d1 docs — noul, choice, score, and combining all three."
publishedAt: "2026-10-18"
author: "Bearprompt"
tags:
  - liquid
  - d1-ultra
  - decision
category: "Decision Guides"
featured: false
---

<div class="blog-ai-callout">This post was generated with AI.</div>

Liquid's [d1 family](https://docs.liquid.ai/lfm/models/d1) is a hosted decision model: you send state plus typed questions, and you get calibrated noul, choice, and score answers. Zero generated tokens. The docs' usage examples use `d1`; the pack below runs the same requests on `d1-ultra`.

[Browse the d1-ultra pack](/decisions/category/d1-ultra)

## How to call it

A Decision Example is not a prompt. The model does not write an email or a plan. It answers the questions you named, and your code decides what happens next:

- **Noul** — probability that the answer is yes. Threshold it in code.
- **Choice** — one label from a closed list, plus a distribution and a confidence value.
- **Score** — a weighted position on a rubric you wrote.
- Ask every question in one call against the same state.

The snippets below use the [TypeSafe Python SDK](https://docs.liquid.ai/lfm/models/d1) against Liquid's API. Install `typesafe-sdk`, set `LIQUID_API_KEY`, and point the client at `https://api.liquid.ai`.

## Four usage examples from the docs

### 1. Ask if a message is harmful

A Noul returns a single probability. Threshold it in code: block above 0.8, allow below 0.2, otherwise human review.

```python
from typesafe_sdk import Noul

result = client.system_one(
    model="d1-ultra",
    state="You're an absolute idiot and I hope your company goes bankrupt. I'm going to find out where you work.",
    questions={
        "is_harmful": Noul(
            instructions="Does this user message contain harmful, threatening, or abusive content?",
        ),
    },
)
```

The docs' sample answer is `is_harmful.noul = 0.99`.

[Open the example](/decisions/liquid-ai/noul-harmful-message)

### 2. Classify a customer inquiry

A Choice returns the selected option, a distribution, and a confidence value. Map `intent` onto a queue.

```python
from typesafe_sdk import Choice

result = client.system_one(
    model="d1-ultra",
    state="Hi, I was charged twice for my subscription last month. The amounts are $29.99 on March 3rd and again on March 5th. Can you refund the duplicate charge?",
    questions={
        "intent": Choice(
            instructions="What is the primary topic of this customer inquiry?",
            criteria={
                "billing": "Questions about charges, invoices, refunds, or payment methods",
                "technical": "Bug reports, feature requests, or how-to questions about the product",
                "shipping": "Order status, delivery tracking, or shipping address changes",
                "returns": "Return requests, exchanges, or product condition issues",
                "account": "Login issues, profile updates, or subscription management",
            },
        ),
    },
)
```

The docs' sample answer is `intent.choice = billing` at confidence `0.9996`.

[Open the example](/decisions/liquid-ai/choice-customer-intent)

### 3. Score support urgency

A Score returns a weighted position on the rubric you wrote. Page on-call at 2.5 or higher; escalate to senior support at 1.5 or higher.

```python
from typesafe_sdk import Score

result = client.system_one(
    model="d1-ultra",
    state="Our production API is returning 500 errors on every request. All customers are affected. Revenue impact is approximately $12,000 per hour. Started 15 minutes ago.",
    questions={
        "urgency": Score(
            instructions="How urgent is this support request?",
            criteria=[
                "Can wait: no immediate business impact, can be addressed in normal queue",
                "Should handle today: minor inconvenience or non-blocking issue",
                "Time-sensitive: noticeable customer impact, needs attention within hours",
                "Blocking revenue: critical system failure affecting customers or revenue",
            ],
        ),
    },
)
```

The docs' sample answer is `urgency.score = 2.9995`.

[Open the example](/decisions/liquid-ai/score-support-urgency)

### 4. Combine noul, choice, and score

One call classifies, routes, and prioritizes the same ticket. Escalate if `is_bug` is above 0.7 and `urgency` is above 1.5.

```python
from typesafe_sdk import Choice, Noul, Score

ticket = {
    "message": "The checkout page crashes with a white screen whenever I try to apply a promo code. I've tried three different browsers. This is blocking a $4,200 order for our team and we need to place it before our procurement window closes on Friday.",
    "account": {
        "plan": "enterprise",
        "arr": 52000,
        "customer_since": "2022-03-15",
    },
}

result = client.system_one(
    model="d1-ultra",
    state=ticket,
    questions={
        "is_bug": Noul(
            instructions="Is the customer reporting a software bug (as opposed to a usage question, feature request, or account issue)?",
        ),
        "team": Choice(
            instructions="Which team should handle this ticket?",
            criteria={
                "billing": "Billing, invoicing, charges, and payment method issues",
                "engineering": "Software bugs, crashes, and technical malfunctions",
                "frontend": "UI/UX issues, display problems, and browser-specific bugs",
                "account": "Account setup, permissions, plan changes, and access issues",
            },
        ),
        "urgency": Score(
            instructions="How urgent is this ticket? Consider business impact, time sensitivity, and customer tier.",
            criteria=[
                "Low: no immediate impact, standard queue",
                "Medium: some business impact, handle within 24 hours",
                "High: significant business impact or time-sensitive, handle within 4 hours",
            ],
        ),
    },
)
```

The docs' sample answers are `is_bug.noul = 0.9998`, `team.choice = engineering`, and `urgency.score = 1.996`.

[Open the example](/decisions/liquid-ai/combine-ticket-triage)

## TypeSafe’s primitives too

The same library also has TypeSafe’s primitives examples for Jev: pointing questions at fields in state, combining noul/choice/score, routing a shoe-store ticket, and scoring a Safari crash.

[See the Jev pack](/decisions/category/jev)

Each example page has the documented sample state, answers when the docs publish them, plus Python, TypeScript, and JSON. Compare `d1-ultra` with other decision models on the [Artificial Analysis Decision Index](https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index) — we link out instead of republishing scores.

[Open the Decision Library](/decisions)
