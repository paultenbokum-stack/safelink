# Compact Gemini Notebook prompts

Use these in Gemini Notebook's **Describe the slide deck** field. The detailed strategy already loaded in the notebook should supply the evidence and supporting detail.

## Meeting deck

Select **Presenter Slides**, **Long**, **English**, then paste:

```text
Create a polished 15-slide presentation titled "Safe Link by SB Security: From trusted home security to protection everywhere."

Audience: SB Security leadership, operations and commercial stakeholders. Help them agree positioning, first market, six-week pilot, hardware, pricing and 90-day actions. Use the uploaded Safe Link strategy as the primary source. Be constructive, commercial and non-technical.

Thesis: Safe Link should not be another generic national panic app. Position it as "Your home-security relationship, everywhere," joining Person, Home, Family and Response. Launch with existing SB households in a proven local footprint, then expand after evidence.

Story:
1. Cover and positioning.
2. Decisions required today.
3. Customer problem: alarm, mobile safety, family, technicians and accounts are fragmented.
4. Market: Namola/Secura = response; Life360 = family; FSK = alarm control; MyPanic = proactive safety; mySOS = panic hardware.
5. What works: one SOS, human acknowledgement, responder progress, test mode, everyday value, household pricing and honest coverage.
6. SB opportunity: Person + Home + Family + Response. Ask if existing SB households are first.
7. Prototype strengths: SOS, incident view, family map, technician booking, alarm test, devices and partner portal.
8. Main gap: show received -> acknowledged -> dispatch -> accepted -> en route -> on scene -> resolved, with escalation, fallbacks and audit.
9. Experience: Readiness and Safe Journey/Appointment before; one SOS before classification; visible progress and follow-up.
10. Differentiators: Protection Timeline, Response Readiness, Home plus Person, proactive safety and privacy modes.
11. Hardware: integrate a supported communicator; buy certified panic/GPS devices; pilot Sentinel BLE after due diligence; defer Shelly as a security controller and custom ESP32 production.
12. Pricing anchors and hypothesis: Namola Plus R59 individual/R129 family; MyPanic R49/R99; Secura R49/R149; prototype R100 flat. Recommend Home Companion included for monitored SB customers; Response R59 SB/R69 standalone; Household R119 SB/R139 standalone, up to five. Label as a hypothesis pending unit economics.
13. Six weeks: closed pilot, not final platform. Include SOS, control-room queue, responder workflow, one area/integration, drill, one proactive mode and audit. Defer national automation, custom hardware and broad panel support. Estimates excluding VAT/external costs: CREAM R750k-R1.8m; conventional pilot R2.5m-R5m; regional v1 R6m-R12m.
14. 90 days: weeks 1-2 operating rules/suppliers/30-50 households; weeks 3-8 build; weeks 9-12 field drills, failure tests, interviews and measured pricing.
15. Decision record with five rows: first customer/geography; callback/dispatch rule; launch scope; hardware partners; pilot outcomes/budget. Include Client feedback, Owner and Due date columns.

Appendix: competitor matrix, pricing, hardware, trust checklist and scorecard. Targets: backend receipt p95 <5s; control-room acknowledgement <30s; decision/escalation <60s; zero orphan incidents; all transitions timestamped; >80% drill completion; >=99.5% crash-free sessions.

Design: conclusion-led titles, one idea/visual and 3-5 short points per slide, SB branding and actual prototype screens. Avoid generic cyber imagery and dense text. Add Decision/Discussion callouts.

Accuracy: use only supplied sources; distinguish claims, recommendations and estimates. Invent no coverage, SLAs or agreements. Life360 has no private SA dispatch. MyPanic and mySOS are separate. NFC does not track. BLE is proximity/last-seen unless proven. ESP32 is a concept. Six weeks means closed pilot. Promise no silent audio, local-only data or national coverage. End with decisions, not thanks.
```

## Ultra-short fallback

If the meeting prompt is still truncated, add the compact prompt above to the notebook as a source named **Safe Link Deck Brief**, then paste:

```text
Create a 15-slide Presenter Deck titled "Safe Link by SB Security: From trusted home security to protection everywhere." Follow the source "Safe Link Deck Brief" and use the full Safe Link strategy for evidence.

Tell this story: decisions today; fragmented customer problem; competitor map; what works; SB's Person + Home + Family + Response opportunity; prototype strengths; missing incident backbone; recommended SOS/readiness/journey experience; differentiators; integrate/buy/defer hardware; pricing; six-week closed pilot versus later platform; 90-day plan; final decision record.

Use conclusion-led titles, SB branding, prototype screens, one visual and 3-5 short points per slide. Add decision callouts and a concise evidence appendix. Distinguish public claims, recommendations and estimates. Invent no coverage, SLAs, prices or agreements. Do not call NFC/BLE real-time tracking, present ESP32 as finished hardware, or imply national production readiness in six weeks. End with client feedback, owners and dates.
```

## Detailed client leave-behind

Select **Detailed Deck**, **Long**, **English**, then paste:

```text
Create a detailed, self-explanatory client decision pack titled "Safe Link by SB Security: Product and Pilot Recommendation." Use the uploaded Safe Link strategy as the primary source and the original brief/SB website for intent and brand.

Position Safe Link as "Your home-security relationship, everywhere," joining Person, Home, Family and Response. Recommend an existing-customer pilot in SB's proven local footprint before wider expansion.

Cover: executive recommendation; customer problem; competitor landscape and pricing; prototype strengths; critical operating gaps; recommended SOS and proactive-safety experience; differentiators; hardware integrate/buy/build decision; pricing hypothesis; trust, POPIA and platform constraints; six-week pilot scope and exclusions; cost comparison; 90-day plan; measurable pilot scorecard; decisions, feedback, owners and dates.

Use plain business language, conclusion-led headings, concise paragraphs, comparison tables and visible decision callouts. Clearly distinguish official requirements, public competitor claims, strategic recommendations and planning estimates.

Preserve these guardrails: Life360 has no private SA dispatch; MyPanic and mySOS are separate; NFC is not tracking; BLE is proximity/last-seen unless network coverage is proven; ESP32 is not finished hardware; six weeks means a closed pilot, not a national production platform; do not promise silent audio, national coverage, response times or South Africa-only data without proof. Verify every price against the supplied source.

End with a one-page decision record: Decision, Recommended direction, Client feedback, Owner and Due date.
```
