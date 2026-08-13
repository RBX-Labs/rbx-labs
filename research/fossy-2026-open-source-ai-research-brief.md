# From Prompts to Runtime Signals
## Research brief: open-source AI, security, enterprise use, and FOSSY 2026

**Prepared:** 24 July 2026  
**Purpose:** Establish a historically accurate and evidence-led foundation for Rishabh Banga's FOSSY 2026 talk. This is a research brief, not proposed speaker copy.

## Update protocol

This is a living research record. A daily monitor reviews official or primary
sources for material changes in the FOSSY programme, AI model releases and
licenses, openness/reproducibility artifacts, security guidance, benchmarks,
and regulation.

An update must:

1. Use a dated primary source or a clearly identified research source.
2. State what changed and why it alters the analysis or talk.
3. Append a dated entry to the update log rather than silently replacing
   historical facts.
4. Update the Rishabh/RBX knowledge bases when a finding becomes durable.
5. Make no edits when there is no material, verifiable change.

## Update log

- **2026-07-24 — Baseline created.** Historical, model-openness, security,
  enterprise, regulatory, and FOSSY-programme research established. See sources
  cited throughout this document.
- **2026-07-27 — Kimi K3 full weights released under a custom license.**
  Moonshot published the full weights for Kimi K3, a 2.8T-parameter, native
  multimodal agentic model with a one-million-token context window. This is a
  material expansion of deployable open-weight capability, but the Kimi K3
  License requires a separate agreement for commercial Model-as-a-Service use
  above its stated revenue threshold. It should therefore be described as
  **open weight**, not as an OSAID-conformant open-source AI system. This
  sharpens the talk's distinction between access to a capable checkpoint and
  the durable freedoms needed for independent use and repair. [Moonshot model
  repository](https://github.com/MoonshotAI/Kimi-K3) [Kimi K3
  License](https://github.com/MoonshotAI/Kimi-K3/blob/main/LICENSE)
- **2026-07-27 — EU Digital Omnibus on AI entered into force.** Regulation
  (EU) 2026/1744 simplifies selected AI Act implementation rules while adding
  explicit safeguards and stronger AI Office oversight. It moves high-risk
  Annex III duties to 2 December 2027 and Annex I product duties to 2 August
  2028; expands proportionate support and sandboxes to small mid-caps; and
  simplifies selected literacy and database duties. It also prohibits systems
  for non-consensual intimate material or child sexual abuse material from 2
  December 2026 and permits special-category-data processing for bias work only
  under safeguards. For the talk, the extra implementation time is a window to
  build auditability, authorization, and reproducible evidence—not a reason to
  defer them. [Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj)
- **2026-08-02 — EU GPAI enforcement powers became applicable.** The
  Commission can now enforce General-Purpose AI model-provider obligations,
  including with fines. The underlying obligations have applied since 2 August
  2025; this is the start of the Commission's enforcement power, not a new
  category of provider duty. For the talk, model documentation, downstream
  limitation information, copyright-policy evidence, and lifecycle records are
  operational requirements now, rather than a future compliance discussion.
  [European Commission GPAI guidelines](https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers)
- **2026-08-06 — Official FOSSY schedule no longer confirms the RBX session.**
  The current programme lists the AI track on Saturday 8 August with *Co-Building
  the Future: AI Alignment for Open Source Communities* at 10:45, an empty
  11:45 slot, *Dude, where did my tokens go?* at 14:00, and *Too Many Eyeballs?
  Free Software Security in the LLM Era* at 16:30. It contains no Rishabh Banga
  or *From Prompts to Runtime Signals* listing. The Sunday OSAID session remains
  listed at 10:45. This authoritative schedule does not establish whether the
  RBX session was cancelled, moved, or simply omitted, so the immediate action
  is to confirm the slot with the organizers before announcing or travelling.
  The talk's runtime-evidence argument and its local kit remain usable, but its
  programme positioning must not be represented as confirmed. [FOSSY 2026
  schedule](https://2026.fossy.ca/schedule/)
- **2026-08-08 — FOSSY schedule also removed the Sunday OSAID session.** The
  official programme now shows an unfilled AI-track slot at Sunday 10:45, where
  the 6 August review still found the Open Source AI Definition session. The
  Saturday 11:45 AI slot remains unfilled and still does not list Rishabh Banga
  or *From Prompts to Runtime Signals*. This is a published-programme change,
  not evidence of why either session is absent. For the talk, do not describe
  either its own slot or a Sunday OSAID companion session as confirmed; obtain
  organizer confirmation before making programme or travel claims. [FOSSY 2026
  schedule](https://2026.fossy.ca/schedule/)
- **2026-08-09 — Sunday AI track now publishes two later sessions, but not the
  missing RBX or OSAID sessions.** The official programme retains the unfilled
  Sunday 10:45 AI slot, while listing *Copyright is bad, actually, and maybe
  not all the LLMs are* at 11:45 and *Toward Ethical Use of LLM-gen-AI to
  advance FOSS* at 14:00. It still contains neither Rishabh Banga nor *From
  Prompts to Runtime Signals*, and it does not restore the former OSAID
  session. For the talk, the surrounding AI programme has changed again, but
  the authoritative page still cannot establish a cancellation, move, or
  reason for the absent sessions; organizer confirmation remains required.
  [FOSSY 2026 schedule](https://2026.fossy.ca/schedule/)

## Executive finding

The useful question is not whether open-source AI is inherently more secure than proprietary AI. It is not. The useful question is what kind of **agency, evidence, and repairability** a release gives to people who depend on it.

Open-source AI can give a user the ability to inspect the model supply chain, retain deployment control, reproduce a behavior, replace a dependency, and submit a patch. It does not automatically make a model safe, private, unbiased, secure, legally unencumbered, or operationally reliable. Those properties must be engineered and tested at the model, application, and deployment layers.

The proposed talk should make this FOSS-native argument:

> Software freedom for AI does not end with access to a checkpoint. A trustworthy open-source AI system makes its runtime behavior inspectable enough that a failure can become a reproducible test and, eventually, a community fix.

## 1. Why the terminology matters

The public vocabulary conflates at least four different things.

| Term | Minimum practical meaning | It does **not** necessarily mean |
| --- | --- | --- |
| Open framework | Source code for ML tooling is available under an open-source license. | Pretrained models, training data, or a deployable AI product are open. |
| Open weights | Trained parameters can be downloaded and run locally. | The training data, recipe, source code, or commercial rights are open. |
| Openly licensed model | A model artifact has a permissive or custom license. | The whole development process is reproducible, or that no other policy applies. |
| Open-source AI system | The system grants the freedoms to use, study, modify, and share, with the materials needed to do so. | The system is automatically secure, harmless, or suitable for every purpose. |

OSI's Open Source AI Definition (OSAID) 1.0 treats open source as a threshold, not a marketing spectrum. It requires the freedoms to use, study, modify, and share. For machine-learning systems, the "preferred form to make modifications" includes:

1. **Data information**: provenance, scope, selection, filtering, and enough detail for a skilled person to build a substantially equivalent system.
2. **Code**: data-processing, training, validation/testing, tokenizer or supporting code, inference, architecture, and training settings.
3. **Parameters**: model weights and other configuration needed to run or modify the model.

Source: [Open Source AI Definition 1.0](https://opensource.org/ai/open-source-ai-definition) and [OSAID FAQ](https://opensource.org/ai/faq).

This is not an academic distinction. A team that only has weights can fine-tune and serve a model, but may not be able to audit its data lineage, understand a failure produced by the training process, reproduce a result, or rebuild after an upstream withdrawal. A team with the full artifact chain can attempt all of those things, although the compute and data costs may still be substantial.

## 2. Historical analysis: three different traditions became one argument

Today's argument about "open AI" combines three histories with different goals. Much of the current confusion comes from treating them as identical.

### 2.1 Free/open software: the fork-and-maintain tradition

Free and open-source software established the expectation that users should be able to inspect the preferred form for modification, fix defects, redistribute improvements, and create a fork if governance fails. This tradition is principally about **user freedom and collective maintenance**.

For ordinary software, the source tree, build instructions, dependencies, tests, and license are the main artifacts. The source code can be complex, but the object of modification is comparatively legible.

### 2.2 Open science: the reproduce-and-scrutinize tradition

Machine learning grew through papers, datasets, benchmark suites, and source releases. The objective was often reproducibility and scientific scrutiny: can another group inspect the method, recreate the experiment, dispute a result, and compare alternatives?

This is broader than an open license. A paper can describe a method without releasing the full data, code, hyperparameters, or checkpoints. Conversely, a released implementation can be open source while the trained artifact and data lineage are opaque.

### 2.3 Open access/open weights: the deploy-and-build tradition

The foundation-model era made access to a trained checkpoint economically valuable. Releasing weights gives researchers and developers immediate capability: local inference, adaptation, quantization, fine-tuning, and integration with open serving runtimes. It also creates ecosystems around hardware, fine-tunes, evaluation, and application tools.

This third tradition is powerful, but it is not automatically free software or open science. A downloadable model may be governed by a custom license, an acceptable-use policy, an application process, a commercial-scale condition, or undisclosed training inputs.

### 2.4 The timeline

| Year / period | Development | What it changed |
| --- | --- | --- |
| **2015** | Google released TensorFlow as open source. | ML infrastructure became a mainstream FOSS project rather than a collection of research implementations. [Google Open Source Blog](https://opensource.googleblog.com/2015/11/tensorflow-googles-latest-machine.html) |
| **2016–18** | PyTorch gained a fast-growing research and developer community. | Open frameworks made implementation and experimentation increasingly shareable, even when data and trained models remained unavailable. [PyTorch retrospective](https://pytorch.org/blog/a-year-in/) |
| **2019** | OpenAI initially released only the 124M GPT-2 model, describing a staged-release approach over misuse concerns. | Release policy became a public AI-safety question, separate from the old question of whether source code was open. [GPT-2 August report](https://cdn.openai.com/GPT_2_August_Report.pdf) |
| **2021–22** | The BigScience collaboration produced BLOOM, a 176B-parameter multilingual model. | It demonstrated that a large model could be organized as a global, open-science collaboration. Yet its Responsible AI License imposed use restrictions, illustrating that public access and OSI-style unrestricted open source are not the same. [BLOOM model card](https://huggingface.co/bigscience/bloom) |
| **2023** | Broadly available open-weight releases moved local deployment and commercial experimentation into the mainstream. Llama 2 became a key example. | The term "open source model" was increasingly used for releases governed by custom terms. Llama 2's license imposed an acceptable-use policy, prohibited use to improve another LLM, and required Meta permission above a 700M-MAU threshold. [Llama 2 license](https://ai.meta.com/llama/license/) |
| **2024** | OSI released OSAID 1.0; fully open research releases such as OLMo became more visible. | The conversation moved from "are weights downloadable?" to "what is the preferred form for modifying an ML system?" |
| **2025–26** | High-quality open-weight models, fully open projects, managed enterprise offerings, and sovereignty initiatives coexist. | Capability is no longer the only differentiator. Provenance, licensing, deployment control, evaluation, cost, and support determine what a release means in practice. |

## 3. Current landscape: access has expanded; reproducibility remains scarce

### 3.1 A spectrum of releases, not a binary market

#### A. Fully open / reproducibility-oriented releases

**OLMo 2** is a strong current example. Ai2 releases models, accessible training data, training code, reproducible recipes, intermediate checkpoints, and evaluation artifacts. The family includes 1B, 7B, 13B, and 32B models. The 32B release reports training on up to 6T tokens. [OLMo 2 overview](https://allenai.org/olmo2) [OLMo 2 32B details](https://allenai.org/blog/olmo2-32B)

**Historical context (20 November 2025; identified 4 August 2026):** Ai2's
**OLMo 3** extended this pattern to an explicitly released end-to-end “model
flow”: 7B and 32B base, instruction, and reasoning variants, with checkpoints,
data, code, and traceability from outputs back to training-data and training
decisions. Ai2 describes OLMo 3-Think 32B as a fully open reasoning model; the
important FOSSY point is the release boundary, not the publisher's capability
ranking. It provides a concrete example of how openness can make a model
behaviour investigable upstream of its final weights—while still leaving runtime
authorization, validation, and operational evidence as separate engineering
work. [Ai2 OLMo 3 release](https://allenai.org/blog/olmo3)

**Apertus**, released by the Swiss AI Initiative in 2025, is another important current example. Its project says it publishes data, code, weights, methods, and alignment principles; the Swiss release description says it included training source code, dataset documentation, weights, and intermediate checkpoints under a permissive open-source license. [Apertus project](https://apertus-ai.org/) [Swisscom release description](https://www.swisscom.ch/de/about/news/2025/09/02-apertus.html)

These releases do not make retraining cheap. They make the basis for independent inspection and modification materially more available.

#### B. Permissively licensed open-weight releases

**Qwen3-8B** is distributed with an Apache 2.0 license. That is materially valuable: it permits broad use, modification, and redistribution of the released artifact. But the license on weights alone does not establish that the model's complete training data, data-processing pipeline, training code, or evaluation history is available. [Qwen3-8B license](https://huggingface.co/Qwen/Qwen3-8B/blob/main/LICENSE)

**gpt-oss**, released in August 2025, is a useful contemporary case precisely because the publisher calls it **open-weight**, not open source. OpenAI says the 20B and 120B models are Apache 2.0 licensed, can run on infrastructure the deployer controls, and can be fine-tuned with open tooling. Its 120B model has 117B total parameters but activates 5.1B per token; OpenAI says it can run on one 80GB GPU. The 20B model has 21B total parameters, activates 3.6B per token, and is described as able to run with 16GB of memory. [OpenAI's gpt-oss announcement](https://openai.com/index/introducing-gpt-oss/) [gpt-oss help documentation](https://help.openai.com/en/articles/11870455)

The lesson is not that gpt-oss is inadequate. It is that precision matters: a release can be very useful, locally deployable, permissively licensed, and still not be a complete open-source AI system under OSAID.

#### C. Open-weight / source-available releases with custom restrictions

Llama 2 is a historically useful illustration. Its Community License granted a limited license and allowed modification, but it required adherence to Meta's acceptable-use policy, prevented use to improve another large language model, and required permission at a specified commercial scale. Those restrictions are incompatible with OSI's freedom to use the system for any purpose without asking permission. [Llama 2 license](https://ai.meta.com/llama/license/)

**Kimi K3** is a current example of why this distinction remains important.
Moonshot made the full weights for its 2.8T-parameter native multimodal,
agentic model available on 27 July 2026. Its repository describes a
one-million-token context window and 104B activated parameters, while the
published license requires a separate agreement before a Model-as-a-Service
business with aggregate revenue above US$20 million uses the software or its
derivatives commercially. That condition means the release is not unrestricted
in the OSAID sense. It is a significant open-weight deployment option, not a
license to call the whole system open source. [Kimi K3 model
repository](https://github.com/MoonshotAI/Kimi-K3) [Kimi K3
License](https://github.com/MoonshotAI/Kimi-K3/blob/main/LICENSE)

This category has been central to the ecosystem because many developers can use these releases successfully. It should not be dismissed; it should be named accurately.

#### D. Closed managed models

Closed models typically expose a versioned service interface, product documentation, policy controls, and contractual commitments rather than parameters, training data information, and training code. They can be attractive for leading capability, fast deployment, managed capacity, and vendor-operated patching. They are not independently inspectable or forkable in the FOSS sense.

### 3.2 Capability data: the gap moved, rather than disappearing

Stanford's AI Index measured the gap between the top closed and top open models on the Chatbot Arena leaderboard as:

| Date | Reported closed-versus-open performance gap |
| --- | --- |
| January 2024 | **8.04%** |
| February 2025 | **1.70%** |
| August 2024 (alternative 2026-series measurement) | **0.5%** |
| March 2026 | **3.3%** |

The 2026 report also states that six of the top ten models on the Arena leaderboard were closed as of March 2026. [2025 AI Index technical performance](https://hai.stanford.edu/ai-index/2025-ai-index-report/technical-performance) [2026 AI Index technical performance](https://hai.stanford.edu/ai-index/2026-ai-index-report/technical-performance)

The analytical conclusion is deliberately modest:

* Open-weight models are capable enough for many serious workloads.
* The frontier is dynamic; a short-lived leaderboard lead is not a deployment strategy.
* The right comparison is workload-specific: quality, latency, cost, hardware, privacy, licensing, maintenance capacity, and required control all matter.

### 3.3 Transparency data: open weights are not a transparency guarantee

The Foundation Model Transparency Index provides the most useful corrective to simplistic openness claims. Stanford reports that the index average rose from **37/100 in 2023** to **58/100 in 2024**, then fell to **40/100 in 2025**. It also explicitly warns that openness does not guarantee transparency: weight-releasing developers can still disclose little about methodology or data. [2026 AI Index: Responsible AI](https://hai.stanford.edu/ai-index/2026-ai-index-report/responsible-ai) [Stanford analysis of declining transparency](https://hai.stanford.edu/news/transparency-in-ai-is-on-the-decline)

**Historical context (2026 AI Index; identified 4 August 2026):** Stanford also
reports the first Artificial Analysis Openness Index, which separates model
availability, methodology disclosure, and pre- and post-training-data
transparency. Most evaluated leading models scored only 2–16 out of 18; OLMo 3
32B Think and K2 Think were the only listed models with any score for
pre-training-data transparency. This is a comparative disclosure metric, not an
OSAID certification, but it supplies a useful stage claim: weights and a broad
license do not by themselves expose the upstream material needed to investigate
or rebuild a system. [Stanford AI Index 2026, Responsible AI chapter](https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_3_responsible_ai.pdf)

This matters because the information needed to investigate robustness, bias, copyright exposure, or geographic/data gaps often sits upstream of the final checkpoint.

## 4. Security analysis: open source changes the security posture; it does not settle it

There is no defensible aggregate figure that says open-source AI is safer or less safe than proprietary AI. The risks are layered and the comparison is not one-dimensional.

### 4.1 Model artifact and dependency supply chain

Open distribution makes it possible to inspect, pin, mirror, sign, and independently audit artifacts. It also makes artifact ingestion a supply-chain responsibility.

The concrete risk is not theoretical. Python pickle serialization can execute arbitrary code during model load. Hugging Face advises users to obtain artifacts from trusted sources, use signed commits and pinned revisions, avoid unreviewed `trust_remote_code`, and prefer `safetensors`. Its documentation says `.safetensors` is prioritized to avoid the arbitrary-code-execution risks associated with pickle formats. [Transformers security policy](https://github.com/huggingface/transformers/security/policy) [Hugging Face pickle scanning](https://huggingface.co/docs/hub/security-pickle)

**Implication:** a project should not tell users merely to `pip install` and download an arbitrary model repository. It should publish exact revisions, checksums or signed provenance where possible, safe serialization requirements, dependency locks, and a disclosure process.

**Historical context (25 May 2026; identified 27 July 2026):** OWASP's
[AIUC-1 crosswalk](https://genai.owasp.org/resource/aiuc-1-crosswalks-owasp-top-10-for-agentic-applications/)
maps agentic risks to controls and identifies gaps around agent identity, runtime
containment, architectural monitoring, supply-chain attestation, and schema
controls. It is not a new update-log event because it predates the 24 July
baseline, but it reinforces the talk's central engineering claim: model
openness needs visible runtime controls and evidence, not just a downloadable
artifact.

**Historical context (18 May 2026; identified 31 July 2026):** NIST CAISI's
[summary of responses on AI-agent security](https://www.nist.gov/publications/summary-analysis-responses-request-information-regarding-security-considerations-ai)
records broad agreement that agents introduce novel security threats that are a
barrier to adoption, and that established cybersecurity principles remain
relevant but need adaptation for agent security. This is a synthesis of RFI
responses, not prescriptive NIST implementation guidance, and it predates the
24 July baseline. It nevertheless strengthens the talk's narrow operational
claim: apply familiar identity, least-privilege, validation, monitoring, and
incident-response disciplines to the agent/tool boundary, with evidence that
the controls actually held at runtime.

**Historical context (June 2026; identified 8 August 2026):** OWASP's *State
of Agentic AI Security and Governance* v2.01 synthesizes the security and
governance implications of agentic deployment. It argues that deployer-owned
permissions, configuration, and operational controls are where agent safety
and security converge, and recommends trajectory-level monitoring and
code-level interception around tool invocation and delegation. This is OWASP
guidance, not a binding standard or evidence that any single control is
sufficient. It nevertheless independently supports the talk's central design:
keep authorization, validation, and replayable run evidence outside the model
and prompt. [OWASP report](https://genai.owasp.org/download/50592/)

### 4.2 Model behaviour is not an access-control system

Open or closed, an LLM is not a reliable policy enforcement point. It can be prompted, fine-tuned, swapped, routed around, or embedded in an application with different context. In an open-model ecosystem this is especially important: the model is deliberately replaceable.

Therefore, high-consequence controls must be external to the prompt and model:

```text
model output
  → schema validation
  → authorization check
  → constrained tool call
  → downstream-state verification
  → audit record / approval / fallback
```

This is the conceptual bridge to the FOSSY talk. A system that depends on "the model refuses bad requests" is not fork-resilient. A system that enforces permissions and verifies outcomes in visible runtime code is.

### 4.3 Application and agentic-system security

OWASP's current 2026 LLM Top 10 identifies risks that remain regardless of the
source of the weights: prompt injection, sensitive-information disclosure,
excessive agency, supply chain, data and model poisoning, unbounded
consumption, misinformation, hidden-context exposure, vector and embedding
weaknesses, and improper output handling. [OWASP GenAI LLM Top 10
2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)

**Historical context (3 August 2026; identified 10 August 2026):** OWASP's
2026 guide supersedes the legacy LLM Top 10 page and grounds its ranking in
both practitioner assessment and a corpus of real incidents. It moves
**Excessive Agency** to third and explicitly frames a model with tools,
memory, and downstream consequences as a boundary that must also be assessed
against OWASP's Agentic Top 10. This is voluntary security guidance, not a
binding standard; for the FOSSY talk, it is independent evidence for putting
authorization, capability limits, validation, and replayable run evidence in
the surrounding system rather than trusting model behaviour. [OWASP 2026
guide](https://genai.owasp.org/download/56857/)

For agentic systems, the operational threat is often not a malicious model file but an otherwise capable model that is given too much authority: broad data access, unrestricted web/tool input, irreversible actions, or no human review. The correct response is least privilege, scoped credentials, explicit approval for high-impact action, validation, and observable state transitions.

### 4.4 Data custody and operational security

Self-hosting can prevent prompts, retrieved documents, and inference logs from being sent to an external model provider. It does not make the data safe by default. The deployer must secure identity, network exposure, prompt logs, vectors/document stores, backups, observability systems, secret management, model updates, and incident response.

Managed models transfer more infrastructure and patching responsibility to a provider, but users still own their retrieval corpus, authorization decisions, tool permissions, and application behavior. NIST explicitly recommends lifecycle testing, evaluation, validation, verification, supplier due diligence, SBOMs, and standard controls for both open-source and proprietary GenAI integrations. [NIST AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

## 5. Enterprise analysis: not "open versus enterprise" but a control allocation decision

The recurring enterprise mistake is to frame the choice as self-hosted/open = secure and managed/closed = insecure, or vice versa. The actual decision is about where control and operational burden sit.

| Decision dimension | Open/self-hosted path | Managed proprietary path |
| --- | --- | --- |
| Model and runtime control | Potentially high; can inspect, pin, modify, replace, or fork, depending on the release. | Limited to provider interface, contracts, configuration, and documented versions. |
| Data boundary | Can be kept in an organization's selected environment. | Depends on service architecture, region, contract, and configuration. |
| Supply-chain responsibility | Organization must verify model, runtime, container, dependencies, and updates. | Provider manages more of the serving stack; customer still evaluates provider and application dependencies. |
| Scaling, uptime, patching | Organization owns capacity planning, accelerator allocation, incident response, and upgrades. | Provider owns much of the infrastructure operation. |
| Capability access | May lag the transient closed frontier, but can be tailored and optimized for a task. | Often rapid access to newest provider capability. |
| Reproducibility and exit | Stronger if artifacts and versions are truly available and pinned. | Limited; provider change, price, retirement, or policy shifts may be outside customer control. |

The most common pragmatic architecture is hybrid, not ideological: a local/open model for data-sensitive or repeatable tasks; a managed model for a harder capability tier; and a shared evaluation, policy, permission, and audit layer that does not assume either model is trustworthy by default.

### Regulatory context

The European Union's General-Purpose AI model obligations applied from **2 August 2025**. Providers must maintain technical documentation, give downstream providers capability/limitation information, implement copyright policy, and publish a sufficiently detailed training-content summary. Free/open-source releases can receive limited exemptions under conditions, but not from all obligations; copyright policy and public training-data summaries still apply, and systemic-risk models do not receive the same exemption. [European Commission GPAI guidance](https://digital-strategy.ec.europa.eu/en/faqs/guidelines-obligations-general-purpose-ai-providers)

**Historical context (28 April 2026; identified 27 July 2026):** the
Commission's current GPAI guidance distinguishes the already-applicable
provider duties from enforcement: its powers to enforce those duties, including
with fines, begin on **2 August 2026**. This is not a new update-log event
because it predates the 24 July baseline. It matters to the FOSSY talk because
documentation, downstream limitation information, and evidence about the model
lifecycle are now immediate deployment concerns rather than a future-policy
discussion. [European Commission GPAI guidelines](https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers)

**Update (2 August 2026):** those Commission enforcement powers, including
fines, are now applicable. This does not create a new GPAI provider obligation;
it makes the existing duties enforceable by the Commission. For the FOSSY talk,
keep the operational conclusion concrete: documentation, downstream limitation
information, copyright-policy evidence, and lifecycle records must be treated
as deployable evidence, not as future compliance paperwork. [European
Commission GPAI guidelines](https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers)

The Commission also published Article 50 transparency guidance on **20 July 2026**. It clarifies disclosure duties for interactive AI and machine-readable marking of AI-generated or manipulated content; it is material regulatory context, but predates this brief's **24 July** baseline and is therefore not a new update-log change. [European Commission Article 50 guidance](https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-transparency-obligations-providers-and-deployers-certain-ai-systems)

**Historical context (10 June 2026; identified 8 August 2026):** the
Commission's voluntary [Code of Practice on Transparency of AI-Generated
Content](https://digital-strategy.ec.europa.eu/en/faqs/code-practice-transparency-ai-generated-content)
offers an EU-wide practical route for providers and deployers to demonstrate
compliance with Article 50 marking and labelling duties. It covers
machine-readable marking for generated/manipulated audio, image, video, and
text, plus clear labels for deepfakes and public-interest text in scope; it
does not create duties beyond the AI Act. For the talk, this is a concrete
implementation aid for public-facing systems, not a substitute for the legal
requirements or for runtime evidence.

**Historical context (7 July 2026; identified 29 July 2026):** the
Commission's [Action Plan on Cybersecurity and Artificial
Intelligence](https://digital-strategy.ec.europa.eu/en/news/commission-presents-eu-action-plan-cybersecurity-and-artificial-intelligence)
sets a coordinated policy direction for the resilience risks of advanced AI
models. The Commission says it will launch a call to expand EU capacity to
evaluate model capabilities and risks before models enter the EU market, with
that capacity expected to be operational in 2027. This is not an additional
provider obligation or a new update-log event: it predates the baseline. It
does, however, strengthen the FOSSY talk's case that open releases need
replayable evaluation evidence and operational security controls, rather than
relying on availability or a model's claimed safeguards.

**Digital Omnibus on AI (in force 27 July 2026):** Regulation (EU) 2026/1744
delays high-risk AI obligations for Annex III systems to **2 December 2027**
and Annex I product systems to **2 August 2028**. It extends proportionate
support and priority sandbox access to small mid-cap companies, expands
real-world testing subject to safeguards, simplifies selected AI-literacy and
EU-database duties, and streamlines some conformity-assessment pathways. The
measure also creates an explicit prohibition, applying **2 December 2026**, on
placing on the market, putting into service, or using systems for
non-consensual intimate material or child sexual abuse material; enables
strictly safeguarded special-category-data processing for bias detection and
correction; and gives the AI Office exclusive supervision of specified systems
based on GPAI models and systems in very large online platforms or search
engines. The talk implication is practical: use the longer runway to make
provenance, permissions, incident response, and evaluation evidence real,
rather than treating compliance as a future paperwork exercise. [Regulation
(EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj)

This does not resolve the open-source debate. It makes one fact clear: in 2026, documentation, provenance, and lifecycle evidence are increasingly part of the deployment environment, not a discretionary appendix.

## 6. Implications for the FOSSY talk

### 6.1 The talk's unique lane in the programme

**Current programme verification (8 August 2026):** The official schedule has
no Rishabh Banga or *From Prompts to Runtime Signals* entry. It retains the
Saturday AI-track alignment session at 10:45, an unfilled 11:45 slot, and the
later token-cost and LLM-era free-software-security sessions. It now also shows
an unfilled AI-track slot at Sunday 10:45; the Open Source AI Definition
session that was still listed on 6 August is no longer published. The schedule
cannot tell us whether either absence is a cancellation, move, or listing
omission. Confirm directly with FOSSY before treating a slot, room, or
surrounding-session claim as current. [FOSSY 2026 schedule](https://2026.fossy.ca/schedule/)

**Historical programme context (baseline, 24 July 2026):** The FOSSY AI track includes a Saturday session immediately before this talk on alignment for open-source communities; later sessions on token costs, human trust, and LLM-era free-software security; and a Sunday OSI session on the Open Source AI Definition. [FOSSY 2026 schedule](https://2026.fossy.ca/schedule/)

Rishabh's talk should not compete with the definition, ethics, token-economics, or security sessions. Its lane is the missing engineering/maintenance layer:

> Once a community has an AI system it is allowed to use and modify, how does it make the system's behaviour inspectable, reproducible, and repairable in real use?

### 6.2 The exact thesis

> Open source is not a claim that an AI model is safe. It is the condition that lets a community independently test safety claims, observe failures, and change the system. Runtime signals are the evidence that makes that freedom operational.

### 6.3 The demonstration should be local and replayable

Use a small project-maintainer assistant, not an enterprise procurement assistant and not a consumer chatbot.

**Question:** `Does this project still support Feature X, and should we upgrade?`

**Fixtures:**

* README says Feature X is supported.
* Current changelog deprecates it.
* An open issue documents an incomplete migration.
* No current migration guide is present.

**Prompt-only path:** returns a neat but unsafe answer based on the README.

**Runtime-aware path:** emits a trace:

```text
sources: README@14-month-old, CHANGELOG@current, issue#418@open
freshness: documentation stale
contradiction: README conflicts with changelog
coverage: no migration guide found
tool scope: read-only; cannot file or close an issue
decision: abstain from upgrade recommendation
fallback: create maintainer-review bundle
```

The audience should see the important transformation:

```text
bad answer
→ evidence trail
→ reproducible fixture
→ evaluation case
→ regression test
→ patch
```

### 6.4 RBX patterns that are credible supporting evidence

Use the projects as patterns, not as grand enterprise case studies.

1. **Canna Guide**: preserve source claims and conflicts rather than collapsing them into a fictional fact. This demonstrates provenance and uncertainty.
2. **Builder Sundays agent**: a click was not treated as success; the workflow needed downstream evidence that the booking state changed. This demonstrates state verification.
3. **Network Guardian**: weak individual signals remain advisory; multiple independent signals are required before a stronger conclusion. This demonstrates evidence composition rather than model self-confidence.

**Historical context (24 July 2026; identified 1 August 2026):** RBX prepared
the Apache-2.0, framework-neutral **Runtime Trust Kit** as a concrete companion
artifact for this session. It includes a bounded policy, stale/conflicting-source
fixture, expected evaluation, contrasting prompt-only and runtime-aware traces,
a model-lock template, threat model, and a dependency-free verifier. The local
primary sources are the [Runtime Trust Kit](https://rbx-labs.io/fossy-runtime-trust-kit/),
[kit README](https://github.com/RBX-Labs/rbx-labs/blob/main/fossy-runtime-trust-kit/README.md),
[example policy](https://github.com/RBX-Labs/rbx-labs/blob/main/fossy-runtime-trust-kit/policy/runtime-policy.example.json),
and [dependency-free verifier](https://github.com/RBX-Labs/rbx-labs/blob/main/fossy-runtime-trust-kit/tests/verify-runtime-trust-kit.mjs).
This is historical context rather than a new update-log event because it
predates the 24 July baseline, but it makes the talk's proposed contribution
usable: a community can inspect the evidence boundary, reproduce the failure,
and turn the result into a regression test without adopting a particular model
or agent framework.

### 6.5 A minimal contribution-ready runtime kit

The practical output should be a framework-neutral repository pattern:

```text
/fixtures              versioned source snapshots for replay
/policy                allowed sources, tool scopes, stop conditions
/evals                 answer / caveat / escalation expectations
/traces                redacted, structured run records
/tests                 regression cases created from failures
MODEL_LOCK             exact model, runtime, tokenizer, and artifact revision
THREAT_MODEL.md        data, tool, supply-chain, and authority boundaries
```

The project need not force a specific model or orchestrator. The point is that a model may change while the project's safety and maintenance contract remains visible.

## 7. Claims that are safe to make on stage

* "Open source does not make a model secure; it makes independent verification and repair possible."
* "Open weights are useful, but weights alone are not the preferred form for modifying an AI system."
* "A security boundary that only exists in a system prompt will not survive model replacement, fine-tuning, or a fork."
* "A successful API or tool call is not proof of a successful real-world outcome; verify the downstream state."
* "Confidence should be explained as evidence—source freshness, coverage, contradiction, validation—not as a model's feeling."
* "The right artifact for an AI failure is not only a screenshot. It is a trace that can become a fixture, evaluation, and patch."

## 8. Claims to avoid

* "Open-source models are safer than proprietary models."
* "Self-hosting makes data private or compliant by default."
* "All downloadable models are open source."
* "A model card, benchmark, or confidence score proves trustworthiness."
* "Human review fixes a workflow whose permissions, provenance, and evidence are opaque."
* Any implication that RBX has deployed a formal enterprise control plane or claims conclusive security detection where its work is advisory.
