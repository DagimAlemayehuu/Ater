<!--
[TEMPLATE: MASTER REQUIREMENTS SPECIFICATION]
Instructions for the User (Delete this block before use):
Use your Gemini Gem to fill out this highly detailed template. The Architect Agent requires absolute clarity to build the system blueprint. Be exhaustive. Do not leave ambiguity.
-->

# 1. Product Vision & Core Value
## 1.1 The "Elevator Pitch"
> What is this product? In one sentence, what problem does it solve?
[Insert pitch]

## 1.2 Target Audience & Use Case
> Who is using this? Describe the primary persona and their typical environment (e.g., "A busy warehouse manager on an iPad with a weak 4G connection").
[Insert audience]

# 2. Functional Requirements (The "Must-Haves")
## 2.1 Core Capabilities
> List the absolute minimum features required for the MVP to function. Be specific. Do not say "Authentication", say "Email/Password login with Forgot Password flow."
*   **Capability 1:** [Name] - [Detailed description of what it does]
*   **Capability 2:** [Name] - [Detailed description of what it does]
*   **Capability 3:** [Name] - [Detailed description of what it does]

## 2.2 User Roles & Permissions
> Who can do what? (e.g., `Admin`, `Member`, `Guest`).
*   **Role 1:** Can [actions]. Cannot [actions].
*   **Role 2:** Can [actions]. Cannot [actions].

# 3. Step-by-Step User Journeys
## 3.1 Journey 1: The Onboarding Flow
> Describe exactly what happens the first time a user opens the app.
1. User lands on `/`.
2. User clicks "Sign Up".
3. User enters X, Y, Z.
4. User is redirected to `/dashboard` and sees the welcome modal.

## 3.2 Journey 2: The Core Loop
> Describe the primary action the user takes repeatedly.
1. User clicks...
2. System calculates...
3. UI updates to show...

# 4. Data Entities (The Nouns)
> What are the primary "things" in this app? (e.g., "Users, Products, Orders").
*   **Entity A:** Has properties like [name, price, date_created].
*   **Entity B:** Belongs to Entity A. Has properties like [status, quantity].

# 5. Non-Functional & Technical Constraints
## 5.1 Performance & Scale
> e.g., "Must support 1,000 concurrent users." "Pages must load in < 1 second."
[Insert constraints]

## 5.2 Integrations & External Services
> Does this app need to talk to the outside world? (e.g., "Must use Stripe for billing," "Must use SendGrid for transactional emails").
*   **Integration 1:** [Service name] - [Purpose]
