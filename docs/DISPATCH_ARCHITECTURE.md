# Emergency Dispatch Architecture: In-Zone vs Out-of-Zone (Waterfall Routing)

This document outlines the architectural logic for handling emergency panic signals from the mobile app, specifically detailing how the system routes alerts between internal operations (SB Security) and external national aggregators (e.g., Aura, IER).

## Core Philosophy: Waterfall Dispatch
To maintain quality control and minimize third-party API costs, the system always attempts to handle the emergency **in-house first**. The system only "waterfalls" to a third-party aggregator if the client is outside the physical coverage area.

The decision logic occurs strictly on the **SB Security Backend Servers**, not on the mobile app itself.

## Step-by-Step Flow

### 1. The Trigger
- The user presses the panic button on their phone.
- The mobile app captures the live GPS location (latitude/longitude).
- The app sends a data payload to the **SB Security Backend Server**.

### 2. The Geofence Check ("Traffic Cop")
- Upon receiving the payload, the backend server cross-references the GPS coordinates against the predefined SB Security operational geofence polygon.
- The server asks: *"Are these coordinates inside the SB Security operational geofence?"*

### 3. Split Routing Logic

#### Scenario A: IN-ZONE (Inside the Geofence)
If the coordinates fall within the geofence:
- The server **ignores the third-party aggregator API completely**.
- The server routes the panic signal directly to the internal SB Security Control Room dashboard.
- Internal operators screen the call, manage the client, and dispatch SB's own armed response vehicles.
- **Result:** No third-party fees incurred; full operational control maintained.

#### Scenario B: OUT-OF-ZONE (Outside the Geofence)
If the coordinates fall outside the geofence (e.g., inter-provincial travel):
- The server automatically forwards the emergency payload via API to the national aggregator (e.g., Aura or IER).
- The aggregator's automated system geolocates the nearest available independent response vehicle in that specific province and dispatches them.
- The aggregator API sends webhooks/callbacks to the SB Backend with ETA updates.
- The SB Backend forwards these updates to the user's phone.
- **Result:** The client receives nationwide rescue; SB incurs the aggregator's incident fee for that specific event.

## Integration Considerations
- **POPIA / Privacy:** The user onboarding flow must include an opt-in consent for sharing live location and personal data with third-party responders during an out-of-zone emergency.
- **False Alarms:** The app UI must include a robust "Cancel Panic" feature to prevent unnecessary dispatch penalties from the aggregator.
- **SLAs / Liability:** Ensure App Terms & Conditions include indemnity clauses protecting SB Security from delays or failures caused by third-party subcontracted responders.
