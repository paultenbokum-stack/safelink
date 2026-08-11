# Safe Link by SB Security

## Competitor, product, hardware, pricing and go-to-market strategy

**Working paper:** 29 July 2026  
**Prepared from:** the supplied Google brief, the Google Stitch prototype, the two shared ESP32 discussions, the current Safe Link workspace, public competitor products, app-store feedback, official platform guidance and South African regulatory sources.

> This is product and commercial analysis, not legal advice. Public competitor claims, coverage, prices and response times have not been independently audited. Confirm them in written supplier agreements before using them in a proposal.

## 1. Executive recommendation

Safe Link should not launch as another broad "panic button plus family map." Namola, Secura and MyPanic already make that promise at low monthly prices. Life360 is far ahead in everyday family coordination, while FSK ArmME is far ahead in alarm-panel control.

SB's defensible position is the overlap those products do not own:

> **Safe Link by SB: your home-security relationship, everywhere.**

The product should connect four things around SB's existing operational trust:

1. **Person:** one-action SOS, medical assistance, safe journeys and safe appointments.
2. **Home:** alarm status/control, alarm testing, event history and technician support.
3. **Family:** consent-based location, arrival alerts and household safety readiness.
4. **Response:** a visible, accountable path from control-room acknowledgement to responder arrival and incident follow-up.

The first market should be SB's actual response footprint and existing customer base, not an unproven national launch. A dense local network with credible response evidence is more valuable than a large coverage map with inconsistent service.

The current prototype is a strong product vision, but it is not yet an operational safety system. The largest missing feature is not another screen. It is the incident engine and operating process behind the SOS button.

## 2. Important corrections to the brief

- The document's "DSK ArmMe" appears to mean **FSK ArmME**.
- **Matrix MyPanic** and **mySOS South Africa** are separate products. They have different apps, pricing, dispatch models and hardware.
- NFC tags identify an item when someone taps them. They do not track location.
- BLE tags provide proximity or a last-seen location unless a nearby compatible phone or gateway detects them. BLE alone is not live GPS.
- The ESP32 device discussed in the shared conversations is a **reference design**, not a finished, certified product available to buy.
- The Stitch screens are a visual/product prototype. A dependable mobile safety product needs native mobile capabilities, backend event processing and control-room integration that a web prototype does not demonstrate.

## 3. What the current prototype gets right

The reviewed Stitch project contains a coherent consumer proposition:

- Armed-response, medical, fire, towing and general SOS categories.
- An active-incident view with responder, vehicle, ETA, map and control-room contact.
- Family map, family status, battery indicators and geofence alerts.
- Profile, emergency contacts, device management and subscription areas.
- Technician booking, alarm testing and a security-services catalogue.
- BLE/GPS and NFC product concepts.
- A partner portal with dispatch acceptance, responders and billing.
- Onboarding, OTP login and a basic R100/month subscription.

This is visually more complete than a typical concept. It also expresses SB's human service well through named responders, control-room visibility and technician access.

## 4. Prototype gaps that matter most

### 4.1 Emergency workflow

The current screens imply a successful dispatch but do not specify:

- Incident states, timestamps and ownership.
- Control-room acknowledgement and escalation timers.
- What happens when the operator, responder or user does not answer.
- Coverage checks before accepting payment or promising response.
- Push-notification, data, SMS and voice-call fallback.
- Stale or inaccurate GPS handling.
- Responder offer, acceptance, reassignment and arrival verification.
- False-alarm cancellation, duress cancellation and operator override.
- Test incidents that cannot accidentally create a real dispatch.
- An immutable incident audit and post-incident report.

Recommended state model:

`created -> received -> operator acknowledged -> dispatch decision -> responder offered -> accepted -> en route -> on scene -> resolved -> reviewed -> closed`

Every transition should record actor, timestamp, source, location confidence and reason. Escalation timers should run independently of the app screen.

### 4.2 The activation design

Do not make a frightened user choose the correct emergency category before asking for help. The primary action should be one unmistakable SOS:

1. Press and hold briefly to prevent an accidental tap.
2. Send the incident immediately after activation.
3. Let the user add armed, medical, fire or roadside context while dispatch is already progressing.
4. Call back according to a documented rule; if there is no answer, follow a predefined dispatch/escalation policy.
5. Show control-room acknowledgement, responder status and the last reliable location.
6. Allow secure cancellation with biometric or PIN confirmation, plus a separate duress code.

Keep category shortcuts for experienced users, but do not make classification a prerequisite for assistance.

### 4.3 Missing customer requirements

The original brief includes functionality not visible in the reviewed prototype:

- Current account balance.
- Statement and invoice history.
- Alarm event history and clear alarm-panel status.
- A useful "share appointment" safety workflow.
- A controlled way to share a live incident with a trusted contact.

Turn "share appointment" into **Safe Appointment**, with a check-in time, overrun timer, nominated contacts and escalation. Add **Safe Journey** using the same engine. Matrix MyPanic's Ride and Meet modes demonstrate why proactive protection is more useful than waiting for a panic.

### 4.4 Four products, not one

A production service needs four connected surfaces:

| Surface | Primary jobs |
|---|---|
| Member app | SOS, family, journeys, home alarm, devices, account and support |
| Control-room console | Incident queue, map, verification, escalation, dispatch, communications and audit |
| Responder/partner app | Offer, accept, navigation, status, evidence, safety and closure |
| Administration | Customers, plans, coverage, roles, devices, billing, suppliers, reporting and compliance |

The partner screen in Stitch is a useful start, but it cannot substitute for the control-room and responder workflows.

### 4.5 Claims that must be earned

The prototype terms refer to continuous exact tracking, rolling audio buffers, TLS 1.3, AES-256 and South Africa-only Tier-3 hosting. Each is an architectural, legal or supplier commitment.

- Do not publish a cryptographic algorithm just because it sounds secure. Define what is encrypted, where keys live and how they rotate.
- Do not promise South Africa-only processing until every cloud, maps, analytics, push, SMS and support supplier is mapped.
- Do not start or stream audio silently. Apple requires explicit consent and a conspicuous recording indication. RICA and POPIA require a reviewed consent, purpose, access and retention model.
- Do not call BLE "real-time tracking" without a measurable detection network.

## 5. Competitor landscape

Legend: **Yes** means publicly offered; **Partial** means limited, indirect or plan/region dependent; **No** means no meaningful public evidence.

| Capability | Namola | Life360 in SA | Matrix MyPanic | Secura | mySOS | FSK ArmME | Safe Link prototype |
|---|---|---|---|---|---|---|---|
| Private armed response | Yes, Plus | No | Yes | Yes | Premium/AURA | Via monitoring ecosystem | Designed |
| Private medical response | Yes, Plus | No | Yes | Yes | Premium/AURA | No | Designed |
| Everyday family location | Yes | Yes, category leader | No | Partial | Partial | No | Yes |
| Places/geofences | Yes | Yes | No | No public evidence | No | No | Yes |
| Timed journey/appointment | No clear dead-man mode | Partial | Yes, Ride and Meet | Partial | Yes, Track Me | No | No |
| Alarm-panel control | No | No | No | No | No | Yes, category leader | Test only |
| Live responder/ETA view | Limited public detail | No SA dispatch | Unclear | Yes | Limited public detail | No | Designed |
| Independent panic hardware | R2,499 tracker | Tile can trigger alerts | No | From R899 | R1,995 4G voice device | Falcon communicator | Concept only |
| Privacy mode | Partial | Yes, Bubbles | Avoids constant tracking | Unclear | Unclear | Unclear | Missing |
| Account/technician service | No | No | No | No | No | Portal/billing features | Partial |

### 5.1 Namola

**Public offer**

- Free, Essential and Plus tiers.
- Essential: R29 individual, R49 couple and R65 family.
- Plus: R59 individual, R99 couple and R129 family.
- Private armed and medical response on Plus; public dispatch on Essential.
- Family location, travel history, arrival alerts, battery-aware updates, Places/geofences, communities and incident information.
- Panic tracker: R2,499 once plus R99/month including Plus.
- Current site claims 1,400+ private responders, nine-province public dispatch and a Johannesburg response centre.

**What works**

Namola makes emergency help understandable, then creates non-emergency reasons to open the app through family, places and community information. Its live coverage messaging is also better than silently accepting a panic where private response is unavailable.

**Weakness/opportunity**

It is not the customer's home alarm, technician, statement or local security relationship. Public app feedback also shows that users punish unclear free-versus-paid emergency access and unreliable location alerts quickly.

**Lesson for SB**

Match Namola's price clarity and coverage transparency. Differentiate through home-alarm integration, local operational accountability and customer service, not a longer list of emergency categories.

### 5.2 Life360

**Public offer**

- Strong family location, ETA, location history, Places, driving summaries, crash-related features, SOS alerts and Tile integration.
- Free includes two days of history and two Places; paid plans increase history and Places.
- International public pricing is approximately EUR5.99/month for Silver and EUR9.99/month for Gold; South African in-app pricing was not publicly clear enough to use as a direct price benchmark.
- Bubbles lets a member share an approximate area temporarily instead of exact location.

**Critical regional limitation**

Life360's official support material does not list South Africa among countries with 24/7 emergency dispatch. In South Africa it is principally a family coordination and contact-alert product, not a private armed-response substitute. Crash dispatch and roadside features are also region limited.

**What works**

Life360 wins retention through ordinary family reassurance, not emergencies. Location history, place alerts, driver context, privacy modes and device-health guidance create recurring value.

**Weakness/opportunity**

It collects a broad set of sensitive data, depends heavily on phone permissions and signal, and its South African response proposition is limited. Public reviews show severe frustration when a family member disappears from a Circle or automated support cannot resolve account migration.

**Lesson for SB**

Copy the everyday utility and privacy controls, not the surveillance feel. Show location freshness, accuracy, battery and permissions honestly. Make human support a product advantage.

### 5.3 Matrix MyPanic

**Public offer**

- R49 individual, R69 double and R99 family of up to five.
- App panic routed through a 24/7 control room to armed or medical response.
- Nationwide positioning without separate panic hardware.
- **Ride** and **Meet** timers escalate when a journey or appointment overruns and the user does not confirm safety.
- Deliberately avoids constant family tracking.

**What works**

Ride and Meet solve risk before the user can press a panic button. Pricing is simple and family-friendly.

**Due-diligence issue**

The current Matrix website describes control-room callback before dispatch, while store copy has described direct nearest-responder notification. SB should ask Matrix-style suppliers to document the real event path, callback rule, acceptance SLA and no-response rule rather than rely on marketing language.

**Lesson for SB**

Safe Journey and Safe Appointment should be launch features or the first fast follow. They fit domestic workers, children, estate agents, technicians and field employees particularly well.

### 5.4 Secura

**Public offer**

- R49 per person per month; homepage family plan R149 for five.
- A separate subscription page has shown a different family equivalent, so current channel pricing should be confirmed.
- Standalone panic button from R899, with device-plus-subscription bundles from R1,299.
- Armed and medical dispatch, control-room oversight, responder details/ETA, family sharing, roadside stand-by support and a Test/Real mode.

**What works**

Secura is unusually clear about the live dispatch experience. Test mode reduces uncertainty and lets a customer learn the product before a real emergency.

**Weakness/opportunity**

It remains an assistance layer rather than an integrated home-security account. Coverage can fall back to public services, so "nationwide" and "private response everywhere" are not the same promise.

**Lesson for SB**

Build a monthly protection drill and a visible responder timeline. A user should be able to prove that location, notifications, control-room connectivity and household contacts are ready.

### 5.5 mySOS South Africa

**Public offer**

- Free/basic contact alerting and category-based emergency assistance.
- Find Near Me and Track Me journey timing.
- Premium professional response through AURA.
- A R1,995 cellular device with SOS, two-way voice, fall detection, battery/network status and medical-profile support; public stock and included-service wording should be confirmed.

**What works**

The independent 4G voice device is suitable for older users, lone workers and people who may not be able to unlock or navigate a phone.

**Weakness/opportunity**

Without a paid responder service, mySOS terms make clear that the app principally notifies contacts. GPS, cellular and device limitations still apply.

**Lesson for SB**

Do not force every segment onto a smartphone-only experience. A tactile, cellular, two-way-voice option is strategically useful, but buying/partnering is faster and safer than inventing hardware first.

### 5.6 FSK ArmME and Falcon X

**Public offer**

- Arm/disarm/stay, multiple alarm areas, zone status/bypass/naming, outputs, quick actions, notifications and multiple panels.
- Falcon X communicator with internal battery, dual GSM network, improved signalling, Wi-Fi app experience and jamming resistance.
- Support for major South African panel brands including IDS, DSC, Paradox, Risco, Texecom, Rhino and Orisec.
- Installer and client portals, logs, users, billing/report features and an app-panic subscription.

**What works**

FSK understands that alarm control is a stateful, supervised integration, not a relay button. Panel compatibility, communicator health, zone status and installer tooling are the moat.

**Weakness/opportunity**

Public reviews have historically complained about latency, synchronisation, login/OTP and status reliability. In a security app, stale status is worse than no status because it creates false confidence.

**Lesson for SB**

Integrate with the alarm/communicator ecosystem instead of trying to emulate it in software. Always show status timestamp and communicator health. Never display "armed" or "disarmed" without freshness and acknowledgement.

## 6. The industry patterns that consistently work

1. **One-action help:** the main emergency control is obvious, reachable and difficult to trigger accidentally.
2. **Human confirmation:** users value a fast, calm operator callback and visible acknowledgement more than clever automation.
3. **Proof of progress:** responder accepted, en route, identity, ETA and arrival create confidence.
4. **Test mode:** a safe drill removes anxiety and exposes broken permissions before an emergency.
5. **Everyday value:** family arrivals, journeys, alarm status and technician/account service create retention between incidents.
6. **Simple household pricing:** couple/family tiers are standard. Per-person-only pricing feels punitive.
7. **Hardware for inaccessible phones:** a tactile trigger matters for older people, lone workers and high-risk moments.
8. **Visible limitations:** honest coverage, location age, signal, battery and device health are safer than absolute claims.
9. **Privacy control:** exact location should be purposeful and revocable, with temporary sharing and approximate modes.
10. **Redundant dispatch:** data, push, SMS, voice and operator procedures must fail over; a push notification is not an SLA.

## 7. How Safe Link can be meaningfully different

### 7.1 The protection timeline

Make every incident auditable and understandable:

- "Received by SB Control Room at 14:03:08."
- "Operator Thando acknowledged at 14:03:19."
- "Unit SB12 accepted at 14:03:44."
- "ETA 7-10 minutes; location last updated 8 seconds ago, accuracy 12 m."
- "Responder arrived at 14:11:02."
- Incident summary, actions and follow-up after closure.

This is more defensible than advertising an average response time alone.

### 7.2 Response Readiness

Create a persistent readiness status for each member:

- Location permission and precision.
- Background operation.
- Push notification delivery.
- Mobile-data availability.
- Battery optimisation restrictions.
- Emergency contacts.
- Last successful protection drill.
- Paired hardware battery/heartbeat.
- Home communicator connection and last panel update.

Safe Link can become the first product that tells the customer whether protection is actually ready before it is needed.

### 7.3 Home plus person

Bring the alarm relationship into the same app:

- Panel status with timestamp and communicator health.
- Arm/disarm only after secure step-up authentication.
- Zone and event context.
- False-alarm cancellation governed by control-room policy.
- Holiday, house-sitter and temporary access modes.
- Alarm test with a guided control-room workflow.
- Technician booking, job status, certificates, invoices and statements.

This is the clearest structural advantage over Namola, Life360, MyPanic and Secura.

### 7.4 Privacy that households can trust

Offer explicit modes:

- **SOS only:** location starts when help is activated.
- **Journey:** precise sharing for a defined trip or appointment.
- **Family:** continuous household sharing with member-controlled pauses.
- **Private bubble:** temporary approximate location while preserving emergency access.

Show who can see location, why, until when and the most recent access. Children require competent-person authorisation and additional safeguards. Employees and domestic workers require genuine notice, purpose limitation and a non-coercive operating policy; do not turn a safety tool into covert workforce surveillance.

### 7.5 A local recovery mesh

Sentinel's BLE concept could become distinctive if it is technically and contractually real:

- SB vehicles, technicians and selected estate gateways could act as authorised detection points.
- Lost assets, pets or wearables could be detected within SB's dense service footprint.
- A control-room workflow could turn a last-seen event into a structured recovery action.

This is only a differentiator after Sentinel proves scanner coverage, latency, protocol security, API/white-label rights, anti-stalking measures and privacy compliance. Until then, label BLE locations as **last seen**, not live.

## 8. Hardware comparison

| Option | Public/indicative cost | Good for | Missing or risky | Recommendation |
|---|---:|---|---|---|
| Shelly 1 Gen3 | About R444 incl. VAT from a current local list | Low-cost dry-contact automation and lab demonstrations | Indoor, Wi-Fi dependent, no LTE/GNSS/battery/tamper/jamming/secure element or alarm supervision | Do not use as the core security communicator |
| FSK Falcon X + ArmME | Dealer quote required; older resale prices are not reliable | Existing-panel integration, supervised signalling, arm/disarm, zones and outputs | Vendor integration, panel compatibility and commercial dependency | Best v1 route for home-alarm integration if API/commercial access is agreed |
| ESP32-S3 custom controller | Shared concept estimated R1,500-R2,500 prototype BOM, excluding engineering/compliance | Full IP ownership, NFC, BLE, relay and custom workflows | It is a component, not a product; needs PCB, isolation, PSU, battery, LTE/GNSS, enclosure, PKI, OTA, factory test, support and certification | Bench proof of concept only until a funded hardware programme exists |
| Sentinel Aura BLE | R999-R1,500 class depending model; platform commonly R10/month after included term | Assets, tags, pets and local last-seen detection | Not GPS; network density and third-party scanner model are unclear | Pilot only after API/network due diligence |
| Sentinel Core GPS/LTE | R2,999 plus optional R65 ex VAT/month platform | Vehicles/high-value assets with cellular GNSS, telemetry and tamper signals | Larger/costlier than a wearable panic device; integration rights and SLA required | Strong asset pilot candidate |
| Cellular voice panic device | mySOS public benchmark R1,995; other vendors by quote | Elderly, lone-worker and phone-inaccessible panic | SIM, charging, coverage, fall-detection quality, control-room integration | Buy/partner before designing custom hardware |

### 8.1 Shelly conclusion

Shelly 1 Gen3 is a capable home-automation relay with potential-free contacts, local/cloud APIs, MQTT, scripts and webhooks. It is useful for a controlled gate or garage demonstration. It should not be presented as equivalent to Falcon X or a monitored alarm communicator.

Its low purchase price omits the expensive security properties: supervised heartbeat, multi-network signalling, battery backup, tamper and jamming detection, safe electrical design, provisioning, device identity, fleet operations and a control-room event contract.

### 8.2 ESP32 conclusion

ESP32-S3 supports Wi-Fi, BLE, secure boot, flash encryption and signed over-the-air update patterns, but those are ingredients. A production Safe Link controller would still need:

- Isolated and protected alarm inputs/outputs.
- A secure element or equivalent protected device identity.
- LTE fallback and possibly GNSS.
- Monitored battery backup and power-failure reporting.
- Tamper detection and environmental enclosure.
- Secure provisioning, certificate rotation, signed firmware and rollback protection.
- Manufacturing test fixtures, serial traceability and replacement processes.
- Penetration testing, safety/EMC testing and ICASA type approval.

ICASA states that electronic communications/radio equipment generally requires approval before it is supplied, sold or used in South Africa. Standard approval needs accredited test reports, schematics, PCB layout, manuals, EMC and safety evidence. The stated authority processing time is about 30 days only after a complete compliant submission; laboratory and redesign time comes before that.

**Decision:** six weeks is enough for a bench prototype using approved modules. It is not enough for a field-ready, supportable and certified security product.

### 8.3 Sentinel due-diligence questions

Do not sign an integration or place the products in the Safe Link store until Sentinel answers these in writing:

1. Which phones, apps or gateways detect Aura BLE broadcasts?
2. Is it Apple's Find My network, Google's Find Hub network, Sentinel's app network or a proprietary gateway network?
3. What is measured detector density and median/p95 detection latency in SB's footprint?
4. What is reported when no detector has heard a tag for hours or days?
5. Are identifiers rotating and unlinkable to unauthorised observers?
6. What anti-stalking alerts and owner-verification controls exist?
7. Is there a documented API, webhook, sandbox, rate limit, uptime SLA and data-export mechanism?
8. Can SB white-label the experience and retain its customer relationship?
9. Who is the POPIA responsible party/operator for location events, and where are all subprocessors?
10. Why does the iOS privacy declaration say no data is collected while the service describes cloud maps, history, alerts and background location?

## 9. Pricing comparison and recommendation

### 9.1 Public price anchors

| Product | Individual | Couple/family | Hardware |
|---|---:|---:|---:|
| Namola Essential | R29/month | R49 couple; R65 family | None required |
| Namola Plus | R59/month | R99 couple; R129 family | Panic tracker R2,499 + R99/month |
| Matrix MyPanic | R49/month | R69 double; R99 family up to five | None |
| Secura | R49/month | Homepage R149 family up to five | Panic button from R899; bundles from R1,299 |
| mySOS | Basic app free; premium not publicly clear | Not publicly clear | 4G voice/fall device R1,995 plus service/SIM terms |
| Life360 | SA price not sufficiently public | Global paid family plans | Tile/GPS products vary |
| Safe Link prototype | R100/month | No clear household differentiation | BLE/NFC store concepts |

The prototype's flat R100/month is hard to defend for one person while Namola Plus is R59 and MyPanic/Secura are R49. The SB relationship can justify a premium only when alarm integration, visible local response and service/account convenience are real.

### 9.2 Recommended launch structure

| Plan | Suggested price | Purpose |
|---|---:|---|
| **SB Home Companion** | Included for active SB monitored-alarm customers | Account, statements, technician booking, alarm test/status, incident history, household invites and contact-only SOS |
| **Safe Link Response Individual** | R59/month for SB customers; R69 standalone | Private armed/medical dispatch, Safe Journey/Appointment, family contacts and response timeline |
| **Safe Link Response Household** | R119/month for SB customers; R139 standalone, up to five | Full household response and family safety |
| **Hardware add-on** | Device-specific upfront price or financed term | Cellular panic, GPS asset or validated BLE tag with clearly stated subscription |

These are positioning hypotheses, not final prices. Before launch, calculate contribution margin after VAT, payment fees, app-store rules, control-room labour, response-network charges, maps, SMS/voice, support, fraud/false alarms and hardware replacement.

At R69 including VAT, revenue before other costs is only R60 excluding VAT. That makes supplier economics more important than interface design. Require a cost per active member, per incident and per dispatch from every partner.

Use a 30-day household trial or include the first month with a new SB installation. The onboarding goal should be a completed protection drill, not merely an app download.

## 10. Compliance and safety design

### 10.1 POPIA

Safe Link processes location, contact, financial and potentially health, child, biometric and audio data. Required work includes:

- A data inventory and purpose for every field/event.
- Data minimality and retention schedules by incident type.
- Separate, understandable consent for family tracking and audio.
- Competent-person authority and safeguards for children's data.
- Role-based access, audit logs and operator agreements.
- A subprocessor and cross-border transfer map covering hosting, maps, analytics, push, SMS and support.
- Data access, correction, export and deletion workflows.
- A security-compromise response and notification procedure.
- Privacy impact assessments for continuous location, family/employee monitoring and audio.

Register and involve SB's Information Officer early. "Consent" alone is not a design strategy; the service also needs necessity, minimality, clear purposes and practical revocation.

### 10.2 Mobile-platform constraints

- Android background location is restricted to core functionality and requires a Play declaration, prominent disclosure, privacy policy and review evidence.
- iOS prefers When In Use location where possible and may suspend background apps. Always access needs clear justification and transparency.
- Apple's current review guideline says location APIs should not be used to provide emergency services. Because established response apps exist in the store, SB should seek App Review clarification early and position the app as coordinating SB's licensed private service without claiming that phone location is an infallible emergency system.
- App stores require explicit microphone consent and visible/audible recording indication.
- A website or PWA alone is not a dependable implementation for background tracking, hardware triggers and high-priority safety behaviour.

### 10.3 Security baseline

Use OWASP MASVS as the mobile verification baseline. At minimum:

- Secure storage with no incident/location leakage into logs, screenshots or backups.
- Passkeys or strong OTP plus device binding; step-up authentication for alarm control and sensitive changes.
- Short-lived tokens, least privilege and strict tenant separation.
- TLS with server identity verification; protected secrets and keys.
- Append-only incident audit and privileged-action monitoring.
- Signed builds, dependency/SBOM controls and a vulnerability-response process.
- Abuse cases for stalking, coercive control, fake panics, account takeover, responder impersonation and malicious insiders.
- Independent mobile, API, cloud and hardware penetration testing before public launch.

### 10.4 Security-industry operations

SB and every responding partner must remain appropriately registered and compliant under the Private Security Industry Regulation Act and applicable PSiRA requirements. Supplier contracts should define:

- Coverage polygons and exclusions.
- Control-room acknowledgement and responder-acceptance targets.
- Dispatch/no-answer rules.
- Qualifications, identification and escalation authority.
- False alarms, cancellations and call-out economics.
- Incident evidence, complaints and audit access.
- Data roles, subprocessors, breach handling and exit/data portability.

A PSiRA survey found that up to 20% of armed-response calls could be false alarms, reinforcing the need for test mode, cancellation controls and false-alarm operations.

## 11. Six-week CREAM plan versus a conventional build

### 11.1 What six weeks can credibly produce

A focused **closed operational pilot** in one SB service area:

- Cross-platform member app for iOS/Android.
- Authentication, profile, emergency contacts and consent.
- One-action SOS with live location and data/voice fallback.
- Control-room incident queue and state transitions.
- Manual or one documented response integration.
- Responder web/mobile workflow for accept, en route, on scene and close.
- Safe Journey or Safe Appointment.
- Protection drill/readiness check.
- Basic family invitations and time-limited sharing.
- Audit, operational dashboard and pilot analytics.

Conditions:

- One geography and one control room.
- Existing certified hardware only.
- No custom alarm communicator.
- No promise of complete national partner automation.
- Billing can be manually reconciled or integrated through one existing provider.
- App-store approval timing is outside the team's control.
- Legal, control-room and supplier decision-makers are available daily.

### 11.2 What six weeks cannot responsibly promise

- A nationally hardened response platform with multiple partner SLAs.
- A certified custom ESP32 security device.
- Broad alarm-panel compatibility comparable with FSK.
- Fully automated fire, towing, medical and armed-response networks.
- Proven p95 response performance at scale.
- Mature fraud, stalking, support, billing, analytics and compliance operations.
- Independent security assurance, disaster recovery drills and a long field reliability record.

### 11.3 Indicative delivery economics

Clutch's July 2026 South African listings commonly show agency rates of USD25-99/hour, with many established firms at USD50-99/hour. The ranges below are bottom-up planning estimates in rand, excluding VAT, hardware inventory, response call-outs, legal opinions, certification labs and major third-party licence fees.

| Outcome | Typical shape | Indicative cost |
|---|---|---:|
| Product/operating blueprint | 2-3 weeks, service design, architecture, risk and backlog | R250k-R500k |
| CREAM accelerated closed pilot | 6 weeks, 4-6 multidisciplinary people, tight scope | R750k-R1.8m |
| Conventional agency closed pilot | 4-6 months, fuller mobile/backend/operations QA | R2.5m-R5m |
| Production regional v1 | 8-12 months, four surfaces, integrations, security and resilience | R6m-R12m |
| National multi-partner platform | 12-18+ months, partner network, hardware and scale | R10m-R20m+ |

CREAM's advantage should be measured as **time to a tested operating pilot**, not "the full platform in six weeks." Ask CREAM for a fixed list of pilot outcomes, named team allocation, excluded integrations, security/compliance deliverables, IP ownership, warranty and post-pilot monthly run cost. A precise CREAM price cannot be inferred without its team and commercial rates.

Budget ongoing product and reliability work after v1. A useful planning allowance is 15-25% of build cost per year for maintenance and platform evolution, before variable control-room, response, communications, maps and device costs.

## 12. Recommended 90-day route to market

### Phase 0: Operating contract, weeks 1-2

- Define coverage and who responds to each incident category.
- Agree callback, no-answer, cancellation and escalation rules.
- Map POPIA roles, suppliers and data retention.
- Run an Apple/Google policy pre-check.
- Select one alarm integration and one optional certified panic device.
- Recruit 30-50 existing SB households in a dense local area.

### Phase 1: Build the six-week pilot, weeks 3-8

- Build the member, control-room and responder critical path.
- Instrument every incident transition.
- Add monthly protection drill and device/permission readiness.
- Add one proactive mode: Safe Journey or Safe Appointment.
- Keep family location time-limited in the first pilot if continuous background behaviour is not yet proven.

### Phase 2: Closed field validation, weeks 9-12

- Run scheduled drills across phone models, poor signal and battery states.
- Test operator overload, unaccepted dispatches and partner failure.
- Verify data export/deletion and breach procedures.
- Interview users after drills and real incidents.
- Price from measured cost-to-serve rather than competitor price alone.

### Acquisition wedge

Start with existing SB customers in the control-room footprint:

- Technician-assisted installation and first protection drill.
- QR onboarding tied to the existing account.
- Include Home Companion; upsell mobile household response.
- Reward family completion and readiness, not app opens.
- Use estate/community partnerships only after local response data is credible.
- Expand geography polygon by polygon, with visible coverage in the app.

Later segments:

- Older people and caregivers with a cellular voice panic.
- Lone workers, estate agents and field teams with Safe Appointment/Journey.
- Schools and estates with consent-based household/community tools.
- High-value asset recovery using GPS first, then validated BLE mesh coverage.

## 13. Pilot success gates

Do not launch publicly because the screens are complete. Launch when the operating system passes agreed gates:

| Measure | Pilot target |
|---|---|
| Incident accepted by backend | p95 under 5 seconds when data is available |
| Control-room acknowledgement | p95 under 30 seconds |
| Dispatch decision or documented escalation | p95 under 60 seconds |
| Orphan incidents | Zero |
| Incident state transitions with actor/timestamp | 100% |
| Active-SOS location freshness | Visible; target under 15 seconds when OS/network permits |
| Scheduled protection drills completed | More than 80% of pilot households |
| Crash-free mobile sessions | At least 99.5% |
| False-alarm/cancellation reasons recorded | 100% |
| Partner acceptance and arrival data captured | 100% |
| Data access/deletion test | Passed before public release |

Also track median and p95 responder acceptance, dispatch-to-arrival by coverage polygon, GPS accuracy, permission failure, SMS/voice fallback use, support contacts per 100 users, household activation, 30/90-day retention and contribution margin per member.

## 14. Decisions SB should make before development expands

1. Is Safe Link initially an SB-customer benefit, a standalone national subscription, or both? Recommendation: SB customers first.
2. What exact geographic polygon can SB support with an honest private-response promise?
3. Which incidents dispatch without successful callback?
4. Is continuous family tracking necessary at launch, or can Journey/Appointment create value with less privacy and battery risk?
5. Which panel/communicator vendor will provide a supported API?
6. Which hardware is certified, stocked, replaceable and API-accessible?
7. Who owns the incident after a partner accepts it?
8. Which party bears a response call-out and false-alarm cost?
9. What location/audio data is retained, for how long and for whose benefit?
10. What does CREAM contractually deliver at the end of week six?

## 15. Final product priority

### Build first

- One-action SOS and resilient incident state machine.
- Control-room and responder workflows.
- Safe Journey/Safe Appointment.
- Response Readiness and Test mode.
- Clear coverage, location freshness and responder timeline.
- Existing-customer onboarding, account and technician functions.
- Privacy modes and household consent.

### Integrate next

- FSK or another supported alarm communicator.
- Billing/statements.
- A certified cellular panic/voice device.
- Additional response partners and service categories.

### Experiment after evidence

- Sentinel BLE recovery mesh.
- Pet/asset marketplace.
- Community incident intelligence.
- Custom ESP32 hardware.

The core product promise should remain narrow and testable:

> **When you ask SB for help, you can see that your signal was received, who owns it, what is happening next, and whether your protection is ready before an emergency.**

## 16. Primary research sources

### Supplied materials

- [SB Security website](https://sbsecurity.co.za/)
- [Safe Link Google brief](https://docs.google.com/document/d/1ZxY2Oab6CVgwkDoJMKW2gpbxPNk5V1isqL5JErB8UtA/edit?usp=sharing)
- [Safe Link Stitch project](https://stitch.withgoogle.com/projects/13148236774265996145)

### Competitors

- [Namola product and pricing](https://www.namola.com/)
- [Life360 international plans](https://intl.life360.com/)
- [Life360 emergency dispatch availability](https://support.life360.com/hc/en-us/articles/23053510925847-SOS-with-24-7-Emergency-Dispatch)
- [Life360 crash detection and regional availability](https://support.life360.com/hc/en-us/articles/23053382766487-Crash-Detection-with-24-7-Emergency-Dispatch)
- [Matrix MyPanic](https://matrix.co.za/mypanic/)
- [Secura](https://www.secura.co.za/)
- [mySOS: how it works](https://mysos.co.za/how-it-works/)
- [FSK ArmME](https://www.fsk.co.za/armme)
- [FSK Falcon X](https://www.fsk.co.za/products/falcon-x)

### Hardware

- [Shelly 1 Gen3 official knowledge base](https://kb.shelly.cloud/knowledge-base/shelly-1-gen3)
- [Espressif ESP32-S3 product](https://www.espressif.com/en/products/socs/esp32-s3)
- [ESP-IDF secure boot](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/security/secure-boot-v2.html)
- [ESP-IDF flash encryption](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/security/flash-encryption.html)
- [Sentinel IoT platform](https://www.sntl-iot.com/)
- [Sentinel Core GPS/LTE](https://www.sntl-iot.com/product-page/sentinel-core-rechargeable-4g-lte-mid-range-asset-tracking-system)
- [ICASA type approval](https://www.icasa.org.za/pages/type-approval)

### Regulation, platform and security

- [POPIA, South African Government](https://www.gov.za/documents/protection-personal-information-act)
- [Information Regulator POPIA guidance and security-compromise resources](https://inforegulator.org.za/popia/)
- [Private Security Industry Regulation Act](https://www.gov.za/documents/private-security-industry-regulation-act)
- [PSiRA Code of Conduct](https://www.gov.za/documents/private-security-industry-regulation-act-code-conduct)
- [RICA, Department of Justice](https://www.justice.gov.za/legislation/acts/2002-070.pdf)
- [Android background-location policy](https://support.google.com/googleplay/android-developer/answer/9799150)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple background-location guidance](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [South African mobile-development agency benchmarks](https://clutch.co/za/app-developers)
