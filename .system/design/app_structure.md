<!--
[TEMPLATE: APPLICATION STRUCTURE & ROUTING MAP]
Instructions for the User (Delete this block before use):
Use your Gemini Gem to fill out this template based on `prompt.md` and `architecture.md`.
The Frontend Agent will read this to generate every page and component.
Define the structure, content, and interactive states in extremely high detail.
-->

# Application Map & Component Specifications
## 1. Global Navigation & Layout
> Define the header, footer, sidebar, and global UI elements present on every page.

*   **Header:** Fixed top navigation. Contains Logo (left), Navigation Links (`/dashboard`, `/settings`), User Profile Menu (right).
*   **Sidebar:** Hidden on mobile. Contains secondary navigation for active route.
*   **Footer:** Minimalist. Copyright and links to Privacy/Terms.

## 2. Route Map (The Pages)
> List every single route in the application and what it does.

*   `/` - The Public Landing Page.
*   `/login` - The Authentication Page.
*   `/dashboard` - The Main User Workspace.
*   `/dashboard/settings` - User Profile Configuration.

## 3. Page Specifications (The "Blueprints")
> Detail the exact layout and content of every route. This is the blueprint for the Frontend Agent.

### Page 1: `/` (Landing Page)
*   **Hero Section:** Large `h1` ("Build Faster"), subtitle, and two CTA buttons ("Get Started", "Learn More").
*   **Features Grid:** 3 columns. Each column contains an icon, title, and short description.
*   **Testimonials:** Carousel of user reviews.
*   **CTA Section:** Bottom banner to capture emails.

### Page 2: `/login` (Authentication)
*   **Form Container:** Centered card, `max-w-md`.
*   **Inputs:** Email (required), Password (required).
*   **Buttons:** Submit ("Log In"), OAuth ("Continue with Google").
*   **Links:** "Forgot Password?", "Create Account" (`/register`).
*   **Interactive States:** Show loading spinner inside the Submit button on click. Show red error message below form on failure.

## 4. Specific Component Breakdown
> If a complex, reusable component exists, define it here (e.g., a "Data Table" or "Rich Text Editor").

### Component: `UserCard`
*   Displays Avatar image (circular, `w-12 h-12`).
*   Displays User Name (bold) and Email (muted gray text).
*   Right-aligned `EllipsisVertical` icon for an options menu.
