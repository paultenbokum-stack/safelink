# Gemini Notebook prompt: Safe Link client presentation

## Recommended workflow

Gemini Notebook, previously NotebookLM, is a good tool for producing the first deck because it grounds the output in uploaded sources and can export to PowerPoint or PDF.

For the meeting and follow-up, produce two outputs from the same notebook:

1. **Presenter Slides:** a concise 14-15 slide meeting deck.
2. **Detailed Deck:** a fuller decision pack for the client to review afterward.

The presenter deck should lead the discussion. The detailed Safe Link strategy report should remain available as the evidence base and appendix.

## Sources to add to the notebook

Add these sources before generating the deck:

1. `SAFE-LINK-COMPETITOR-STRATEGY.md`, or a Google Doc/PDF made from it. Treat this as the primary analytical source.
2. The client's original Safe Link Google brief.
3. [SB Security's website](https://sbsecurity.co.za/), for the company's services, positioning and visual identity.
4. The Google Stitch Safe Link prototype.

Optional validation sources:

- [Namola](https://www.namola.com/)
- [Matrix MyPanic](https://matrix.co.za/mypanic/)
- [Secura](https://www.secura.co.za/)
- [mySOS](https://mysos.co.za/how-it-works/)
- [FSK ArmME](https://www.fsk.co.za/armme)
- [Sentinel IoT](https://www.sntl-iot.com/)

Do not overload the notebook with generic security-industry articles. The detailed strategy report already consolidates the research and explains its caveats.

## Gemini Notebook settings

For the meeting version:

- Output: **Slide Deck**
- Format: **Presenter Slides**
- Length: **Long**
- Language: **English**
- Paste the master prompt below into the customization field.

For the leave-behind:

- Output: **Slide Deck**
- Format: **Detailed Deck**
- Length: **Long**
- Use the second prompt at the end of this document.

## Master prompt for the meeting deck

```text
Act as a senior strategy consultant, product strategist and presentation designer.

Create a polished, client-facing presentation titled:

"Safe Link by SB Security"

Subtitle:
"From trusted home security to protection everywhere"

AUDIENCE

The audience is the leadership, operations and commercial team at SB Security in South Africa. They understand private security and their customers deeply, but they should not need technical software knowledge to follow the presentation.

The presenter has approximately 35-45 minutes, including discussion.

MEETING PURPOSE

The presentation must help the client:

1. Understand the competitor landscape and what customers value.
2. See where the current Safe Link concept is already strong.
3. Understand the important operational gaps without feeling that the existing work is being dismissed.
4. Agree on Safe Link's positioning and initial target market.
5. Agree on the scope of a six-week closed pilot.
6. Decide which hardware should be integrated, purchased or deferred.
7. React to the proposed pricing and route to market.
8. Leave clear feedback, owners and next actions.

CORE STRATEGIC THESIS

Safe Link should not launch as another generic national panic app.

Its defensible position is:

"Safe Link by SB: your home-security relationship, everywhere."

Safe Link should connect four jobs that competitors currently address separately:

- Person: mobile SOS, medical help and proactive safety.
- Home: alarm status, testing, technicians and account service.
- Family: consent-based location, arrivals and household readiness.
- Response: visible control-room ownership, responder progress and follow-up.

The recommended launch market is SB's existing customers and proven local response footprint. Establish reliable density locally, publish honest coverage and expand area by area after operational evidence.

TONE

- Confident, constructive and collaborative.
- Commercially grounded and client friendly.
- Respect the work already completed.
- Present risks as design decisions and trust-building opportunities.
- Avoid alarmist legal or technical language.
- Avoid generic sales language and exaggerated claims.
- Write in South African English and show all money in rand.

DESIGN DIRECTION

- Use SB Security's existing identity and logo where available from the supplied sources.
- Use a restrained, professional security-operations style.
- Prefer white or near-white content backgrounds, strong dark text and a controlled red accent drawn from the SB brand.
- Avoid futuristic cyber imagery, hooded figures, glowing padlocks, generic stock security guards and decorative gradients.
- Use real product screens, simple diagrams, comparison tables, maps or operational timelines where the source material supports them.
- Use icons sparingly and consistently.
- Do not place long paragraphs on slides.
- Use conclusion-led slide titles, not topic labels.
- Limit each core slide to one main idea, one visual and no more than 3-5 concise points.
- Keep detailed evidence in speaker notes or the appendix.
- Where a client decision is required, add a clearly labelled "Decision" or "Discussion" callout.

SOURCE AND ACCURACY RULES

- Treat the uploaded Safe Link competitor strategy as the primary analytical source.
- Treat the original client brief as the source of intended functionality.
- Treat SB Security's website as the source of SB's current services and brand character.
- Use current public competitor prices as of 29 July 2026.
- Clearly label public competitor statements as public claims where appropriate.
- Do not invent response times, coverage, customer counts, supplier agreements or technical capabilities.
- Do not imply that private armed response is available where coverage has not been contracted.
- Do not describe NFC tags as trackers.
- Describe BLE locations as proximity or "last seen" unless a detection network is proven.
- Do not describe the ESP32 concept as a finished product.
- Do not promise a production-ready national platform or certified custom hardware in six weeks.
- Do not present automatic silent audio recording as an approved launch feature.
- Do not state that all data will remain in South Africa unless every supplier has been verified.
- Where exact prices or commercial terms require confirmation, say so.

CREATE THIS STORY

SLIDE 1: COVER

Title:
"Safe Link by SB Security"

Subtitle:
"From trusted home security to protection everywhere"

Use an SB-relevant image or a restrained montage showing home, family and control-room protection. Do not put the title in a card.

SLIDE 2: THE DECISIONS WE NEED FROM THIS MEETING

Conclusion-led title:
"Today is about agreeing the first credible version of Safe Link"

Show five decision areas:

- Positioning and initial customer.
- Pilot geography and response promise.
- Launch features and deferred features.
- Hardware approach.
- Pricing and 90-day actions.

Add a small note:
"We are agreeing a pilot direction, not signing off every final feature."

SLIDE 3: THE CUSTOMER PROBLEM

Conclusion-led title:
"Customers currently manage safety through disconnected relationships"

Show a simple fragmented journey:

- Home alarm and armed response.
- Mobile personal safety.
- Family location and check-ins.
- Technician and account support.
- Panic hardware and asset devices.

Then show Safe Link joining these around one trusted SB relationship.

SLIDE 4: THE MARKET IS SPLIT ACROSS THREE PRIMARY JOBS

Conclusion-led title:
"No single competitor owns home, family and response together"

Create a clear landscape:

- Namola and Secura: private mobile response.
- Life360: everyday family coordination.
- FSK ArmME: alarm control and communicator integration.
- Matrix MyPanic: proactive Ride and Meet protection.
- mySOS: contact alerts, journeys and independent cellular hardware.

Highlight the open space:
"SB can connect these jobs through an existing local security relationship."

Avoid declaring one competitor an overall winner.

SLIDE 5: WHAT CUSTOMERS REPEATEDLY VALUE

Conclusion-led title:
"Trust comes from visible progress and everyday usefulness"

Present six proven patterns:

- One unmistakable SOS action.
- Fast human acknowledgement.
- Responder identity, progress and ETA.
- Test mode and readiness checks.
- Useful family/journey features between incidents.
- Simple household pricing and honest coverage.

Use a clean evidence-led visual rather than dense text.

SLIDE 6: SAFE LINK'S RECOMMENDED POSITION

Conclusion-led title:
"SB's advantage is the relationship around the response"

Feature the positioning prominently:

"Your home-security relationship, everywhere."

Show four product pillars:

- Person.
- Home.
- Family.
- Response.

Under each pillar, use only 2-3 short examples.

Add a "Decision" callout:
"Do we agree that existing SB households in the proven response footprint are the first market?"

SLIDE 7: THE CURRENT CONCEPT IS A STRONG FRONT-END VISION

Conclusion-led title:
"The prototype already communicates a compelling customer promise"

Show selected prototype screens or grouped features:

- Multi-category SOS and active incident view.
- Family map and geofence alerts.
- Technician booking and alarm testing.
- Devices, membership and partner portal.

Balance the message:
"The visual concept is ahead of a typical early prototype. The next step is to make the operating promise real."

SLIDE 8: THE NEXT INVESTMENT IS THE OPERATING BACKBONE

Conclusion-led title:
"The most important missing feature sits behind the SOS button"

Visualise the incident path:

Signal received -> control room acknowledged -> dispatch decision -> responder accepted -> en route -> on scene -> resolved -> reviewed

Show the operational requirements:

- Timers and escalation.
- Data, SMS and voice fallback.
- Coverage and location confidence.
- Secure cancellation and false-alarm handling.
- Complete incident audit.

Do not turn this into a technical architecture slide.

SLIDE 9: THE SAFEST EXPERIENCE IS SIMPLE BEFORE, DURING AND AFTER AN INCIDENT

Conclusion-led title:
"One SOS should start help before asking the user to classify the emergency"

Show a three-stage customer journey:

Before:
- Protection Readiness.
- Monthly test.
- Safe Journey or Safe Appointment.

During:
- Brief press-and-hold.
- Incident transmitted immediately.
- Category/context can follow.
- Human acknowledgement and live progress.

After:
- Incident summary.
- Follow-up and support.
- Readiness restored.

Mention secure cancellation and duress handling discreetly.

SLIDE 10: THE DIFFERENTIATORS WORTH BUILDING

Conclusion-led title:
"Safe Link can compete on proof, readiness and connected service"

Prioritise:

1. Protection Timeline: visible ownership and timestamps.
2. Response Readiness: permissions, signal, contacts and device health.
3. Home plus Person: alarm, mobile response, technicians and account.
4. Safe Journey and Safe Appointment.
5. Privacy modes: SOS only, Journey, Family and Private Bubble.

Add a smaller "later opportunity":
"A verified SB/Sentinel local recovery mesh."

Do not make the BLE concept a launch promise.

SLIDE 11: HARDWARE STRATEGY

Conclusion-led title:
"Integrate and buy first; invent hardware after demand is proven"

Use three columns:

INTEGRATE NOW
- FSK Falcon X/ArmME or another supported alarm communicator.

BUY OR PARTNER
- Certified cellular panic/voice device.
- GPS/LTE asset tracking where the use case justifies it.

PILOT OR DEFER
- Sentinel BLE after coverage/API/privacy due diligence.
- Shelly only for controlled demonstrations.
- Custom ESP32 as a later funded hardware programme.

Add a "Decision" callout:
"Which communicator and cellular panic partners should enter commercial due diligence?"

SLIDE 12: PRICING

Conclusion-led title:
"Household pricing should reward the existing SB relationship"

First show compact market anchors:

- Namola Plus: R59 individual; R129 family.
- Matrix MyPanic: R49 individual; R99 family.
- Secura: R49 individual; homepage R149 family.
- Safe Link prototype: R100 without clear household differentiation.

Then show the recommended hypothesis:

- SB Home Companion: included with an active monitored-alarm account.
- Safe Link Response Individual: R59 for SB customers; R69 standalone.
- Safe Link Response Household: R119 for SB customers; R139 standalone, up to five.
- Hardware: separate upfront or financed add-on.

Add caveat:
"Final pricing follows supplier cost, VAT, control-room effort, response charges and measured pilot usage."

Add a "Discussion" callout:
"Should Safe Link drive retention of the existing alarm base, standalone growth, or both?"

SLIDE 13: THE SIX-WEEK PROMISE

Conclusion-led title:
"Six weeks can deliver a real closed pilot, not the final national platform"

Use two clear columns.

CREDIBLE IN SIX WEEKS
- Member app critical path.
- One-action SOS and live location.
- Control-room incident queue.
- Responder status workflow.
- One response area and one integration path.
- Protection drill.
- Safe Journey or Safe Appointment.
- Basic audit and pilot analytics.

DEFER UNTIL PROVEN
- National multi-partner automation.
- Custom certified hardware.
- Broad panel compatibility.
- Mature fraud, billing and support operations.
- Production-scale resilience evidence.

Show indicative planning ranges, clearly labelled and excluding VAT and external costs:

- CREAM accelerated six-week closed pilot: R750,000-R1.8 million.
- Conventional agency closed pilot, 4-6 months: R2.5-R5 million.
- Production regional v1, 8-12 months: R6-R12 million.

Say that CREAM needs to quote against fixed outcomes, named team allocation, exclusions, IP ownership, warranty and post-pilot run cost.

SLIDE 14: THE 90-DAY PLAN

Conclusion-led title:
"Start with a dense local pilot and earn the right to expand"

Show three phases:

Weeks 1-2: Operating contract
- Coverage.
- Response rules.
- Data/privacy roles.
- Supplier selection.
- Recruit 30-50 existing SB households.

Weeks 3-8: Build closed pilot
- Member, control-room and responder path.
- Readiness and test mode.
- Safe Journey or Appointment.
- Full event instrumentation.

Weeks 9-12: Field validation
- Drills across phones, signal and battery conditions.
- Partner failure and operator-overload exercises.
- Customer interviews.
- Measured cost-to-serve and pricing validation.

SLIDE 15: AGREEMENTS AND NEXT ACTIONS

Conclusion-led title:
"Five decisions unlock the pilot"

Create a client-friendly decision table with columns:

- Decision.
- Recommended direction.
- Client feedback.
- Owner.
- Due date.

Include these five decisions:

1. Initial customer and geography.
2. Dispatch/callback operating rule.
3. Launch feature boundary.
4. Alarm and panic-hardware partners.
5. Six-week pilot outcomes and budget.

Leave visible space for notes during the meeting.

APPENDIX

Include a concise appendix after the 15 core slides:

A1. Competitor capability matrix.
A2. Public competitor pricing comparison.
A3. Hardware comparison and Sentinel due-diligence questions.
A4. Trust, POPIA, mobile-platform and security checklist.
A5. Pilot success measures.

For the pilot scorecard, include:

- Backend incident receipt p95 under 5 seconds when data is available.
- Control-room acknowledgement p95 under 30 seconds.
- Dispatch decision or escalation p95 under 60 seconds.
- Zero orphan incidents.
- 100% timestamped incident transitions.
- More than 80% of pilot households completing a protection drill.
- At least 99.5% crash-free mobile sessions.

FINAL QUALITY CHECK

Before completing the deck:

- Ensure every core slide has one clear takeaway.
- Remove repeated points.
- Keep technical detail out of core slides.
- Check every price against the supplied source.
- Retain all caveats around public claims and estimates.
- Ensure the six-week slide says "closed pilot," not "completed platform."
- Ensure BLE is not called real-time GPS.
- Ensure NFC is not called tracking.
- Ensure the deck ends with decisions and owners, not a generic thank-you slide.
```

## Prompt for the detailed leave-behind deck

Generate this as a separate **Detailed Deck** after the presenter version.

```text
Create a detailed client decision pack titled:

"Safe Link by SB Security: Product and Pilot Recommendation"

This is the written leave-behind for SB Security leadership after the strategy meeting.

Use the same strategic thesis, factual guardrails and source hierarchy as the presenter deck, but make the document understandable without a presenter.

Organise it into:

1. Executive recommendation.
2. Customer problem and SB opportunity.
3. Competitor landscape and public pricing.
4. What the current prototype covers.
5. Critical operating and product gaps.
6. Recommended Safe Link experience.
7. Product differentiation.
8. Hardware integrate/buy/build recommendation.
9. Pricing hypothesis and commercial caveats.
10. Trust, POPIA, platform-policy and security requirements.
11. Six-week closed-pilot scope and exclusions.
12. Cost comparison.
13. 90-day route to market.
14. Pilot scorecard.
15. Decisions, owners and feedback required.

Use concise paragraphs, clear comparison tables and decision callouts. Explain unfamiliar terms in plain business language.

Include source citations and distinguish:

- Verified official requirements.
- Public competitor claims.
- Strategic recommendations.
- Planning estimates that require quotation.

Do not introduce unsupported statistics or features. Preserve the exact cautions around coverage, audio, BLE, NFC, ESP32, six-week delivery and data residency.

End with a one-page decision record that the client can complete:

- Decision.
- Agreed direction.
- Outstanding question.
- Owner.
- Due date.
```

## Final human review checklist

Before presenting or sending the generated deck:

- Check prices against the strategy report.
- Check that Life360 is not described as providing private South African dispatch.
- Check that MyPanic and mySOS are treated as separate products.
- Check that the flat R100 prototype price is described as a current concept, not an agreed price.
- Remove any invented SB coverage or response-time claim.
- Ensure any prototype screenshots contain no placeholder customer data.
- Ensure the deck does not promise silent audio recording.
- Ensure "real time" is not used for BLE or NFC.
- Confirm that cost ranges are labelled as estimates, excluding VAT and third-party costs.
- Confirm that six weeks is consistently described as a closed pilot.
- Replace generic generated imagery with SB-relevant images or actual prototype screens where possible.
- Add the meeting date, presenter name and client attendees.
- Export both PPTX and PDF, then inspect every slide for cropped text, inaccurate visuals and incorrect citations.

