## ADDED Requirements

### Requirement: Resilient Supabase Offline Mock realtime updates
The system SHALL support chaining multiple `.on()` event listener bindings on the offline mock Supabase client to prevent TypeError exceptions.

#### Scenario: Mock subscription chaining
- **WHEN** the offline mock Supabase client is initialized and `.channel().on().on().subscribe()` is called
- **WHEN** the application is run in offline mock mode
- **THEN** the subscription chain SHALL evaluate without throwing any TypeError or method undefined exceptions

### Requirement: Visual Error Alerts for Critical Failures
The system SHALL display clean visual feedback (e.g. via toast notifications) when the user's waitlist status, activation status, or DRM lease verification fails.

#### Scenario: Activation DRM Failure
- **WHEN** the activation fails due to RLS rejection, invalid waitlist status, or incorrect code
- **THEN** a clear visual alert message SHALL be presented to the user with the specific constraint that was violated

### Requirement: Dynamic Chart Layout Dimensions
The system SHALL provide explicit minimum width and height bounds for analytics dashboards and graphs to prevent Recharts aspect ratio errors in the unit test logs.

#### Scenario: Chart Rendering
- **WHEN** the Practice session dashboard is mounted and rendered
- **THEN** the Recharts components SHALL be wrapped in container structures with defined dimensions to avoid console dimension warnings
