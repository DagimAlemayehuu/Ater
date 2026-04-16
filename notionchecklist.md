# Notion Database Exhaustive Checklist

## 1. Intro to Databases
- [x] Every item is its own page (can add text, images, blocks)
- [x] Customize properties (contextualize, label, augment)
- [x] Visualize data in different ways (List, Calendar, Chart, etc.)
- [ ] View multiple sets of data in one database (CRM, OKRs, etc.)
- [x] **Create a database:**
    - [x] New page -> Table
    - [ ] Slash command `/database`
    - [x] Start from scratch
    - [ ] Pull in data from existing source
    - [ ] Build with AI prompt
    - [ ] Choose from Suggested template
- [x] **Database Tour:**
    - [x] Create a new database page
    - [x] Add a property
    - [x] Add a new view
    - [x] Edit a view (name, layout, properties, filter, sort, group)
- [ ] **Full-page vs. Inline Databases:**
    - [x] Full-page: Sidebar presence, lock database option
    - [ ] Inline: Controls hidden on hover, expand to full page, delete/duplicate/move/copy link via `⋮⋮`
    - [ ] Turn full-page to inline (drag into another page -> Turn into inline)
    - [ ] Turn inline to full-page (drag into sidebar)
- [ ] **Duplicate a Database:**
    - [ ] Duplicate with content
    - [ ] Duplicate without content
- [x] **Add and Open Database Pages:**
    - [x] Add via blue "New" button (top right)
    - [x] Add via "+ New" (bottom of table/list/board)
    - [x] Add via "+" on hover (Calendar days)
    - [x] Add via "+ New" image frame (Gallery)
    - [x] Open as page (Hover open on Table, Click title on List, Click card on Board/Calendar/Gallery)
    - [x] Open in peek preview
    - [ ] View in full page mode (`⤢`)
- [x] **Page Editing:**
    - [x] View/Edit properties at top
    - [x] Reorder/Rename/Duplicate/Delete properties via `⋮⋮`
    - [x] Change property type via `⋮⋮`
    - [x] Add content blocks to free page space
    - [ ] Drag content into database to turn into pages
- [x] **Item Options (Right-click):**
    - [x] Delete
    - [ ] Duplicate
    - [ ] Copy link
    - [x] Rename
    - [ ] Move to
    - [ ] Edit property
- [x] **Customize Database Pages:**
    - [x] Property Visibility: Always show, Hide when empty, Always hide
    - [x] Reorder property display
    - [ ] Backlinks: Expanded, Show in popover, Off
    - [ ] Comments: Expanded, Off
- [ ] **Collaboration & Permissions:**
    - [ ] "Can edit content" level: Create/Edit/Delete pages, Edit values. Cannot structurally change (add properties/views/filters).
    - [ ] Lock views (prevent structural changes while allowing data edits)
    - [ ] Database Lock (prevents property/view changes for everyone)

## 2. Views, Filters, Sorts & Groups
- [x] **Types of Database Views:**
    - [x] Table (Rows/Columns)
    - [x] Board (Groups by property, e.g., Kanban)
    - [ ] Timeline (Chronological plotting)
    - [x] Calendar (Date-based display)
    - [ ] List (Minimal layout)
    - [x] Gallery (Image-focused)
    - [ ] Chart (Bar, Line, Donut)
    - [ ] Forms (Information gathering)
- [x] **Create and Switch Between Views:**
    - [x] Add view via `+`
    - [x] Name views
    - [x] Reorder views via dragging
    - [x] Access views via sidebar (nested under full-page DB)
- [x] **View Settings Menu (High-Fidelity):**
    - [x] Rename view
    - [x] Change layout type
    - [x] **Property Visibility Menu:**
        - [x] Toggle all properties
        - [x] Search properties to toggle
        - [x] Drag to reorder property priority
    - [x] Duplicate view
    - [x] Delete view
- [x] **Filters (Exhaustive Logic):**
    - [x] **Basic Filter UI:** Select property -> Select condition -> Select value
    - [x] **Property-Specific Filter Patterns:**
        - [x] **Checkbox:** Is Checked / Is Unchecked
        - [x] **Confidence/Difficulty (Select):** Is, Is not, Is empty, Is not empty
        - [x] **Unit/Topic (Text):** Contains, Does not contain, Starts with, Ends with
        - [x] **Tested On/Dates:** Is, Is before, Is after, Is on or before, Is on or after, Is within (range)
    - [x] Advanced filters (AND/OR logic, nested up to 3 layers)
    - [x] Filter count indicator on the view tab
- [x] **Groups (High-Fidelity):**
    - [x] Group by property (Course, Status, Priority)
    - [x] Group order (Ascending, Descending, Manual)
    - [x] Hide empty groups toggle
    - [x] Group color/icon synchronization
- [x] **Search:** Search page titles and properties
- [ ] **Freeze Column:** "Freeze up to column" (sticky left column)

## 3. Database Properties
- [x] **Property Types:**
    - [x] Text (formatted)
    - [x] Number (Currency, Progress bar, Percent)
    - [x] Select (one tag)
    - [ ] Status (To-do, In Progress, Complete)
    - [ ] Multi-Select (multiple tags)
    - [x] Date (Range, Time, Reminders)
    - [x] Formula (Calculations)
    - [x] Relation (Connect DBs)
    - [ ] Rollup (Aggregate related data)
    - [ ] Person (Tag members/guests)
    - [ ] File (Upload/Link images/docs)
    - [x] Checkbox (Boolean)
    - [ ] URL (Open in new tab)
    - [ ] Email (Launch mail client)
    - [ ] Phone (Prompt to call)
    - [ ] Created time (Auto)
    - [ ] Created by (Auto)
    - [ ] Last edited time (Auto)
    - [ ] Last edited by (Auto)
    - [x] Button (Automate actions)
    - [ ] ID (Unique numerical ID)
    - [ ] Place (Map location)
- [ ] **Property Editing Menu (Granular):**
    - [x] Change property name
    - [x] Change property type
    - [x] **Select Option Management:**
        - [x] Add new option
        - [x] Delete option
        - [x] Rename option
        - [x] Change option color
    - [x] Duplicate property
    - [x] Delete property
- [x] **Page Record Detail (UI Layout):**
    - [x] Iconic header (Title + Icon)
    - [x] Property grid (2-column layout or list)
    - [x] "Add a property" button in-line
    - [x] Collapsible property sections

## 15. Study Planner Specific Logic (Reference Implementations)
- [ ] **Confidence Tracker Board:**
    - [ ] Groups: Low Confidence, Medium Confidence, High Confidence
    - [ ] Cards: Show Unit name, Difficulty, and Last Review Date
- [ ] **Difficulty Planner Board:**
    - [ ] Groups: Level 1 (Easy) to Level 5 (Hard)
    - [ ] Sorting: Sort by Date Created (Oldest first)
- [ ] **Planning Table View:**
    - [ ] Columns: Topic, Course, Difficulty, Confidence, Tested On (Date), Status (Checkbox)
    - [ ] Calculations: Sum of "Status" (completion %), Average "Difficulty"
- [ ] **Tracker Board (Kanban):**
    - [ ] States: Not Started, Reviewing, Mastered, Needs Work
    - [ ] Quick Actions: "Mark as Mastered" button in card preview

## 4. Relations & Rollups
- [x] **Relations:**
    - [x] Connect two separate databases
    - [ ] One-way relations (default)
    - [ ] Two-way relations ("Show on [related DB]")
    - [ ] Limit number of related pages (1 page vs. No limit)
    - [x] Open related pages directly
    - [x] Remove related pages
    - [x] Display options: Always show, Hide when empty, Always hide
    - [ ] Show specific properties of linked pages in the relation field
    - [ ] Relate a database to itself
- [x] **Rollups:**
    - [x] Relation selection
    - [x] Property selection from related page
    - [x] Calculation type
    - [x] Number formatting / Decimal placement
    - [ ] **Rollup Calculation Types:**
        - [ ] Show original / unique values
        - [ ] Count all / values / unique / empty / not empty
        - [ ] Percent empty / not empty
        - [ ] Numeric: Sum, Average, Median, Min, Max, Range
        - [ ] Date: Earliest, Latest, Date range
    - [ ] Aggregate rollups (Sums/Averages for entire column in Table/Board)

## 5. Database Settings
- [x] **Access via Settings Menu:**
    - [ ] Lock database (data entry only, no structural changes)
    - [x] Edit properties (CRUD, settings, wrap text)
    - [ ] Automations (View/Edit)
    - [ ] Sub-items / Sub-tasks (Toggle on/off)
    - [ ] Dependencies (Toggle on/off)
    - [ ] Sprints (Toggle on/off for Task DB)
    - [ ] Connections (App integrations)
    - [ ] Customize page layout (Global page organization)
    - [ ] Turn into Tasks / Undo Task database

## 6. Database Templates
- [x] **Create Templates:**
    - [x] Define title, properties, and page content
    - [x] Replicate page structures with one click
    - [x] Indicator bar when editing templates
- [x] **Use Templates:**
    - [ ] Select from gray menu in new page
    - [x] Select from dropdown next to "New" button
- [ ] **Repeating Templates:**
    - [ ] Frequency: Daily, Weekly, Monthly, Yearly
    - [ ] Intervals, Start date, Time
- [ ] **Nesting Templates:**
    - [ ] Templates within recurring templates (Weekly/Monthly/Yearly only)
    - [ ] Up to 3 levels of nesting
- [x] **Template Actions:** Edit, Duplicate, Delete

## 7. Sub-items & Dependencies
- [ ] **Sub-items:**
    - [ ] Enable in More Settings
    - [x] **Display Options:**
        - [ ] Table/List/Timeline: Nested in toggle, Flattened list
        - [ ] Board/Calendar/Gallery: Card property, Flattened list
    - [ ] **Filter Options:** Parents only, Parents and sub-items, Sub-items only
    - [ ] Move, Duplicate, Delete logic (recursive)
    - [ ] Edit nesting properties (Sub-item vs. Parent item property)
    - [ ] Toggle nesting on title property
- [ ] **Dependencies:**
    - [ ] Connect tasks linearly
    - [ ] **Automatic Date Shifting:**
        - [ ] Shift only when dates overlap
        - [ ] Shift & maintain time between items
        - [ ] Do not automatically shift
    - [ ] Avoid weekends toggle

## 8. Task Databases & Sprints
- [ ] **Task Databases:**
    - [ ] Require Status, Assignee, Due date
    - [ ] Integrates with "My tasks" in Home
    - [ ] Unique ID property (auto-assigned, non-editable)
    - [ ] Unique ID URLs (`notion.so/PREFIX-123`)
- [ ] **Sprints:**
    - [ ] Enable Sprints on Task DB
    - [ ] **Sprint Board Views:** Current Sprint, Sprint planning, Backlog
    - [ ] **Sprints Database:** Timeline view, individual sprint pages
    - [ ] Plan Sprint: Move unfinished tasks / backlog tasks
    - [ ] Complete Sprint:
        - [ ] Status updates (Last, Past, Current)
        - [ ] Task carry-over options (Next sprint, Backlog, Stay in current)
        - [ ] Automated sprints (Auto complete/create)
    - [ ] **Sprint Settings:** Duration (1-8 weeks), Start day, Incomplete tasks behavior

## 9. Data Sources
- [ ] **Understanding Data Sources:** Set of pages within a database
- [ ] **Multi-source Databases:** Combine new and existing data sources
- [ ] **Permissions:** Source-level respect (linked sources keep original permissions)
- [x] **Manage Data Sources:** Add, Link, Move to different location, Move to Trash
- [ ] **Moving Sources:**
    - [ ] Move to another database (merges)
    - [ ] Move to a page (becomes standalone)
    - [ ] Move views vs. Keep as linked views
- [ ] **Editing Linked Sources:** Structural changes (views/filters) are local; data changes (title/properties/pages) are global.

## 10. Optimize Load Times & Performance
- [ ] **Slowdown Factors:** Page count, visible properties, complex logic (Formulas/Rollups)
- [ ] **Optimization Tips:**
    - [ ] Use linked databases instead of many inline ones on high-traffic pages
    - [ ] Avoid complex reference chains
    - [ ] Minimize filters/sorts on Formulas/Rollups
    - [ ] Filter on simple properties (Select, Status, Date)
    - [ ] Hide unnecessary properties
    - [ ] Delete unused pages / Filter out old ones
- [ ] **Database Size Limits:**
    - [ ] Page Level: 2.5MB total property data (excludes files, body content, formula/rollup results)
    - [ ] DB Level: 1.5MB for structural metadata (properties, options, formulas)
    - [ ] Two-way relation limit: 10,000 references per page
- [ ] **Restore Deleted Properties:** Up to 1.5MB in trash

## 11. Specific View Type Features
### Table View
- [ ] Bulk edit multiple rows (checkbox selection)
- [x] Rearrange columns/rows
- [x] Resize columns
- [x] Wrap cell content
- [ ] **Calculations (at bottom of columns):**
    - [ ] Count all/values/unique/empty/not empty
    - [ ] Percent empty/not empty
    - [ ] Date: Earliest, Latest, Range
    - [ ] Number: Sum, Average, Median, Min, Max, Range

### Board View
- [x] Group by different properties (Status, Person, Select, etc.)
- [x] Add new groups (edit property options)
- [ ] Sub-grouping (second layer)
- [x] Reorder columns and cards
- [x] Color columns toggle
- [ ] Card size (Small, Medium, Large)
- [ ] **Card Preview:** Page cover, Page content, Files & Media
- [ ] Fit image toggle / Reposition image
- [x] Show/Hide properties on cards
- [x] Hide columns
- [x] Column calculations

### Timeline View
- [ ] Adjust timeframe (Hours to Years)
- [ ] Adjust project length (drag edges)
- [ ] Jump to Today
- [ ] Show/Hide table next to timeline
- [ ] Load limit (number of pages)
- [ ] Show/Hide properties in timeline and table
- [ ] Plot by different date properties (separate Start/End properties supported)
- [ ] Timeline calculations (if table is open)

### Calendar View
- [x] Weekly vs. Monthly view
- [x] Scroll infinitely through months
- [x] Move and stretch cards (drag-and-drop)
- [x] Show/Hide properties on cards
- [x] Show calendar by different date properties
- [ ] "Start week on Monday" preference

### Gallery View
- [ ] **Card Preview:** Page cover, Page content, Files & Media
- [ ] Fit image toggle / Reposition image
- [ ] Card size (Small, Medium, Large)
- [ ] Hide Name property for standalone images
- [x] Show/Hide properties on cards

### Dashboard View
- [x] Add/Arrange widgets (Table, Board, Calendar, Chart, Timeline)
- [x] Edit mode vs. View mode
- [ ] Create via slash command `/dash`
- [ ] Create with Notion Agent (AI generated draft)
- [ ] **Widget Management:**
    - [ ] Up to 4 widgets per row, 12 widgets total
    - [x] Resize row height and widget width
    - [x] Duplicate/Delete widgets
- [x] **Global Filters:** Filter multiple sources at once
- [ ] Performance optimization (use filters, avoid large tables)

### Chart View
- [ ] **Chart Types:** Vertical bar, Horizontal bar, Line, Donut, Number
- [ ] Availability: Paid (unlimited), Free (one chart)
- [ ] **Configuration:**
    - [ ] X-Axis: Property selection, Sorting, Visible/Hidden groups, Omit zero values
    - [ ] Y-Axis: Property selection, Grouping, Cumulative toggle
    - [ ] Donut: Slice representation, Legend
- [ ] **Style Options:**
    - [ ] Color palettes
    - [ ] Height (Small to XL)
    - [ ] Grid lines, Axis names, Data labels
    - [ ] Smooth line, Gradient area (Line chart)
    - [ ] Value in center (Donut)
    - [ ] Color by value
- [ ] **Interactivity:**
    - [ ] Hover for labels
    - [ ] Drilldowns (view data points in table format)
    - [ ] Save drilldown as view
- [ ] Save chart as PNG/SVG (paid users remove watermark)

### Feed View
- [ ] Stacked-card format
- [ ] Direct commenting
- [ ] Track views on posts
- [x] Property visibility settings

### Map View
- [ ] Visualize Place properties on interactive map
- [ ] Address search (3rd party provider)
- [ ] Zoom and explore
- [ ] Filter/Sort place properties (text-based)
- [ ] Switch between multiple Place properties
- [ ] Limit: 100 items shown at once

## 12. Layouts (Custom Page Layouts)
- [ ] **Layout Builder Components:**
    - [x] Heading: Pin up to 4 properties, Backlinks visibility
    - [x] Main page area: Large area for sub-items/text properties
    - [x] Details panel: Collapsible right-side panel for properties
    - [x] Property group: Organize properties into sections
- [ ] **Structure Options:**
    - [ ] Simple layout
    - [ ] Tabbed layout (Content tab + Database view tabs)
- [ ] **Styling & Interaction:**
    - [ ] Inline comments: Default vs. Minimal
    - [ ] Page discussions toggle
    - [ ] Property icons toggle
    - [ ] Full width toggle
- [ ] **Module Management:**
    - [ ] Add modules (property specific)
    - [x] Move modules (drag-and-drop, move up/down/panel/page)
    - [x] Remove modules
- [ ] Apply to all pages / Reset to original

## 13. Unique ID
- [ ] Automated prefix generation
- [ ] Prefix customization
- [ ] non-editable numerical ID
- [ ] GitHub integration support

## 14. Forms
- [ ] **Creation:** Slash command `/form`, from existing database, from scratch
- [ ] **Respondent Property:** Captured automatically (can be anonymous)
- [ ] **Form Builder Configuration:**
    - [ ] Title, Description, Icon, Cover
    - [ ] Question mapping to properties (Sync with property name toggle)
    - [ ] Required questions toggle
    - [ ] Question types: Multiple choice, Date, Long answer, etc.
    - [ ] Max selections per response (Multi-select/Relation/People)
    - [ ] Conditional logic (Business/Enterprise only)
- [ ] **Submission Experience:**
    - [ ] Submit button Text/Color
    - [ ] Confirmation Title/Body
    - [ ] Email notifications for submissions
- [ ] **Sharing Settings:**
    - [ ] Anyone in workspace vs. Anyone on web
    - [ ] Anonymous responses toggle
    - [ ] Access to submission after submitting (None, View, Comment, Edit, Full)
    - [ ] Notion branding toggle
- [ ] **Response Analysis:**
    - [ ] Stored in "Responses" Table view
    - [ ] Built-in Automations (triggers/actions on new response)
- [ ] **Security:** Disable web sharing (Enterprise admin only)
