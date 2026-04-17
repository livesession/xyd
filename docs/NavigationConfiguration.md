# Navigation Configuration

Navigation in xyd is configured through the `navigation` property in your settings file. The system supports five primary navigation types that work together to create the complete navigation experience.

## Navigation Structure Overview

The `Navigation` interface includes:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sidebar` | `SidebarNavigation` | Yes | Main navigation on the left side |
| `tabs` | `Tabs` | No | Top-level tab navigation |
| `sidebarDropdown` | `SidebarDropdown` | No | Dropdown menu in sidebar |
| `segments` | `Segment[]` | No | Route-specific navigation elements |
| `anchors` | `Anchors` | No | Fixed navigation elements (header/sidebar) |

## Sidebar Navigation

The sidebar is the primary navigation element displayed on the left side of documentation pages. It supports a hierarchical structure with routes, groups, and pages.

A `SidebarRoute` defines navigation for a specific route and its sub-pages. A `Sidebar` object defines a group of pages.

The `order` property can be:
- `0` - Default order
- `-1` - First position
- `{ after: string }` - Position after specified page
- `{ before: string }` - Position before specified page

Virtual pages allow composition of content from multiple sources.

## Tabs Navigation

Tabs provide top-level navigation typically displayed in the header or below it. Each tab represents a major section of documentation.

The `page` property enables route matching, while `href` provides the actual navigation target (useful when redirecting to a specific sub-page).

## Anchors Configuration

Anchors provide fixed navigation elements that appear in the header or sidebar, typically used for social links, external resources, and CTAs.

### Header Anchors

Header anchors appear in the top navigation bar. They support three variants:

1. **Standard NavigationItem** - Regular link
2. **NavigationItemButton** - Styled as a button with `button: "primary" | "secondary"`
3. **NavigationItemSocial** - Social media link with `social: Social` property

### Sidebar Anchors

Sidebar anchors are positioned at the top or bottom of the sidebar.

## Segments Configuration

Segments provide route-specific navigation that appears only when viewing pages within a particular route. They're commonly used for creating dropdown navigation in the sidebar.

When `appearance` is set to `"sidebarDropdown"`, the segment renders as a dropdown menu in the sidebar when the user is viewing any page within the specified route.

## Sidebar Dropdown

The `sidebarDropdown` provides an alternative dropdown navigation directly in the sidebar, independent of route context.

## Navigation Processing and Hooks

The framework provides several React hooks to access and work with navigation configuration at runtime.

### useActivePage Hook

Returns the active page identifier based on current route and navigation configuration. The hook searches through tabs, sidebarDropdown, and webeditor header items to find the active page. When `match` is true, it performs prefix matching for nested routes.

### useMatchedSegment Hook

Returns the segment configuration that matches the current route. This hook iterates through `settings.navigation.segments` to find a segment where either the route exactly matches the current path or any page within the segment matches the current path.

### useActivePageRoute Hook

Returns the active `SidebarRoute` based on current navigation context. This extracts `SidebarRoute` items from the sidebar structure and finds the one matching the current route.

## File Watching and Navigation Updates

During development, the system watches navigation configuration files and triggers appropriate updates when changes are detected.

Changes to certain properties require server restart. Other navigation changes invalidate the settings module, triggering React Router to re-render with updated navigation.

## Navigation and Routing Integration

Navigation configuration directly influences React Router route generation. Each page in the navigation sidebar becomes a route in React Router. The `pagePathMapping` global object maps route IDs to actual file paths.

## Best Practices

### Organizing Navigation Structure

1. Use route-based organization by grouping pages under `SidebarRoute` objects
2. Leverage groups to create collapsible sections within routes
3. Set meaningful icons for quick visual identification
4. Use consistent ordering with the `order` property

### Navigation Hierarchy

Keep navigation depth reasonable (typically 2-3 levels max):
- Level 1: Tabs or top-level routes
- Level 2: Groups within routes
- Level 3: Individual pages

### Route Matching

- Use `page` for internal routing with React Router
- Use `href` when specifying an exact URL (can combine both)
- Organize segments hierarchically since they're matched based on route prefixes
