

# AI Use Case Management Application

## Overview
A professional enterprise-grade application for managing AI use cases, featuring a corporate dark design with a sidebar navigation, interactive dashboard, and a powerful data grid with full customization.

---

## 1. Layout & Navigation
- **Dark sidebar** with company branding area, navigation links (Dashboard, Use Cases, User Management), and a logged-in user profile section at the bottom
- **Light content area** with a clean top header showing the current page title and user actions
- Role-based navigation: "User Management" visible only to Admin users

## 2. Role-Based Access (Frontend Mock)
- **Viewer** – Can view the dashboard and use case grid (read-only)
- **Editor** – Can create, edit, and delete use cases
- **Admin** – Full access including user management (CRUD on users and role assignment)
- A role switcher in the UI (dropdown in the header) to demo different permission levels without a backend

## 3. Dashboard Page
- **Summary cards** at the top: Total Use Cases, Active, In Review, Completed
- **Charts section**:
  - Bar chart: Use cases by Category
  - Pie/Donut chart: Use cases by Status
  - Bar chart: Use cases by Priority
- Clean card-based layout with subtle shadows and corporate styling

## 4. Use Cases Grid Page
- **Fully dynamic data grid** with:
  - **Column visibility toggle** – show/hide any column via a dropdown menu
  - **Resizable columns** – drag column borders to resize
  - **Reorderable columns** – drag & drop to rearrange column positions
  - **Sorting** – click column headers to sort ascending/descending
  - **Filtering** – per-column text/select filters
  - **Search** – global search bar across all fields
- **Columns**: Title, Description, Category, Status, Priority, Owner, Department, Estimated Impact, Date Created
- **Row actions** (Editor/Admin only): Edit and Delete buttons per row
- **Create New** button (Editor/Admin only): Opens a form dialog to add a new use case
- **Edit** opens a pre-filled dialog for updating
- All data stored in React state with sample seed data

## 5. User Management Page (Admin Only)
- Table listing users with columns: Name, Email, Role, Status, Date Added
- Actions: Create new user, Edit user role, Delete user
- Forms via modal dialogs
- Protected: only visible/accessible when role is Admin

## 6. Visual Design
- **Corporate dark sidebar** (dark navy/charcoal) with light icon and text
- **Light content area** with subtle gray backgrounds for cards
- Professional typography, consistent spacing, and subtle transitions
- Status badges with color coding (e.g., green for Active, amber for In Review, blue for Completed)
- Polished form dialogs with proper validation feedback

