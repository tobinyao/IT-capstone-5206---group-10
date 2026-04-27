# Frontend Risk Map Integration Notes

## 1. Purpose of This Document

This document records the frontend map functionality that I worked on for the project.  
The main purpose of this work was to replace the placeholder Risk Map page in the main frontend with a real interactive map and improve the usability of the map for cultural heritage and bushfire risk information.

This document also supports my individual D2 deliverable by showing the feature area I contributed to, the implementation process, and the quality assurance checks I completed.

---

## 2. Area of Responsibility

My main responsibility was the frontend Risk Map functionality.

This included:

- Integrating the real Risk Map into the main React frontend
- Replacing the previous placeholder map page
- Displaying the map in a usable layout
- Adding or preserving important map layers
- Improving layer control and map interaction
- Supporting heritage data display
- Improving filters, details panel, legend, instructions, and terminology
- Checking that the map page works with the wider frontend structure

The goal was to make the Risk Map page more useful for users and more suitable for a client demonstration.

---

## 3. Main Features Implemented or Improved

### 3.1 Real Risk Map Integration

The original Risk Map page in the main frontend was a placeholder page.  
I worked on replacing this placeholder with a real interactive map.

The integrated map allows users to:

- View the actual map page instead of placeholder text
- Zoom in and out
- Pan around the map
- Interact with map features
- View relevant spatial information through map overlays

This was an important step because the Risk Map is one of the core features of the project.

---

### 3.2 Map Layout and Frontend Integration

The map page needed to fit into the existing React frontend structure.  
I checked the page layout, routing, and styling so that the Risk Map page could work as part of the full application rather than as a separate prototype.

This included checking:

- Whether the map page could be accessed through the frontend route
- Whether the map container displayed correctly
- Whether the map size and layout worked within the page
- Whether the page visually matched the existing frontend style
- Whether the map function still worked after being integrated with the main project

---

### 3.3 Map Layer Controls

I worked on adding or preserving layer control functionality for the map.

The purpose of layer controls is to allow users to choose which information they want to see on the map. This makes the map easier to understand and prevents too much information from being shown at the same time.

Layer-related work included:

- Keeping important map overlays available
- Allowing users to toggle map layers
- Checking that selected layers display correctly
- Checking that hidden layers are removed from the visible map
- Making the layer control clearer for users

The layer control feature supports better map exploration and improves the user experience.

---

### 3.4 Heritage Risk and Heritage Type Filters

I also worked on the filter functionality for heritage information.

The purpose of filters is to help users narrow down the visible heritage results based on important attributes.

The planned or improved filters include:

- Heritage risk level filter
- Heritage type filter

These filters allow users to focus on specific heritage places instead of viewing all records at once.

Expected behaviour:

- When a risk level is selected, only heritage places with that risk level should be visible
- When a heritage type is selected, only matching heritage places should be shown
- When filters are cleared, the full relevant dataset should become visible again

This feature helps users explore the data more effectively.

---

### 3.5 Clickable Heritage Details Panel

The map also needs to support a details panel for heritage features.

When a user clicks on a heritage place, the details panel should show useful information about the selected feature.

The details panel may include information such as:

- Heritage name or identifier
- Heritage type
- Risk level
- Location-related information
- Key attributes from the processed dataset

This makes the map more informative because users can understand what each feature represents instead of only seeing points or shapes on the map.

---

### 3.6 Map Legend and User Instructions

I worked on improving the user-facing explanation of the map.

The map should be understandable without requiring outside explanation. For this reason, the legend and instructions are important parts of the interface.

The legend and instructions should explain:

- Fire vulnerability colours
- Fuel type categories
- Slope categories
- How to zoom and pan
- How to toggle map layers
- How to click heritage features
- How to use filters
- How to read the details panel

This work improves the map's usability and makes the page more suitable for a client demo.

---

### 3.7 Branding and Terminology

I also considered the wording and visual consistency of the page.

The goal was to make the Risk Map page look more professional and easier for users to understand.

This included checking:

- Whether labels are clear
- Whether terminology is consistent
- Whether headings and instructions are user-friendly
- Whether the page fits the style of the main frontend
- Whether the wording is suitable for a client-facing system

Good terminology is important because the project involves cultural heritage and bushfire risk. The interface should be clear, respectful, and easy to understand.

---

## 4. Quality Assurance and Testing

I completed manual testing during the frontend map work.

The purpose of testing was to make sure the map page worked correctly before and after integration with the main project.

Manual checks included:

- Checking that the frontend runs successfully
- Checking that the Risk Map page loads correctly
- Checking that the map is visible and not hidden by layout issues
- Checking zoom and pan interaction
- Checking whether layers display correctly
- Checking whether layer toggles work as expected
- Checking whether filters affect visible results
- Checking whether clicking a heritage feature updates the details panel
- Checking whether the legend and instructions are visible
- Checking whether the page still fits the existing frontend layout
- Checking for obvious console errors during development

Formal automated tests were limited at this stage, but manual functional testing was used to verify the main user interactions.

---

## 5. GitHub Workflow

The work was managed using a GitHub workflow.

The main workflow included:

1. Pulling the latest project code
2. Creating or using a feature branch
3. Making changes in small steps
4. Testing the frontend locally
5. Committing changes with clear commit messages
6. Pushing the branch to GitHub
7. Opening a pull request
8. Linking the pull request to the related issue
9. Asking teammates to review the changes
10. Updating the work based on feedback where needed

This workflow helped keep my work separated from the main branch until it was ready to be reviewed and integrated.

---

## 6. Related Tasks

The Risk Map work can be divided into the following frontend tasks:

### Task F1: Integrate the Real Risk Map into Main

Main goal:

- Replace the placeholder Risk Map page with the real interactive map

Done when:

- The main frontend displays the real Risk Map
- The old placeholder text is removed
- Users can zoom, pan, and interact with the map
- Core layers can be displayed correctly

---

### Task F2: Add Map Layer Controls

Main goal:

- Allow users to control which map layers are visible

Done when:

- Users can toggle relevant layers
- Layer visibility changes correctly
- The map remains readable and usable

---

### Task F3: Add Map Filters and Details Panel

Main goal:

- Add or preserve heritage risk filter, heritage type filter, and clickable heritage details panel

Done when:

- Filters affect the visible heritage results correctly
- Clicking a feature updates the information panel
- The details panel shows meaningful data from the processed dataset

---

### Task F4: Improve Map Legend and Instructions

Main goal:

- Refine the legend and add user-facing instructions

Done when:

- The page includes a clear legend
- The page explains fire vulnerability colours, fuel type categories, and slope categories
- The page includes basic instructions such as zoom, pan, click, and toggle

---

### Task F5: Improve Branding and Terminology

Main goal:

- Improve the wording, labels, and visual consistency of the map page

Done when:

- The terminology is clear and consistent
- The page is suitable for a client demo
- The interface fits the style of the wider frontend

---

## 7. Collaboration and Integration

This work required collaboration with teammates because the Risk Map page needed to connect with the full project.

Collaboration included:

- Reviewing the existing frontend structure
- Discussing frontend technology choices with teammates
- Checking how the Risk Map page should fit into the main application
- Understanding the available heritage and vegetation data
- Discussing how processed data should appear on the map
- Reviewing teammate frontend changes when needed
- Using GitHub issues and pull requests to communicate progress
- Aligning my map work with the team’s broader project goals

The Risk Map page should not work as an isolated prototype. It needs to integrate with other pages, shared styling, routing, and project data.

---

## 8. Notes for Future Improvement

Possible future improvements include:

- Adding more complete automated tests for map interactions
- Improving mobile responsiveness
- Refining map performance if the dataset becomes larger
- Improving the details panel design
- Adding clearer empty-state messages when no heritage results match the filters
- Improving accessibility of map controls and legend text
- Adding more detailed documentation for data fields and layer meanings

These improvements would make the map more reliable and easier to maintain.

---

## 9. Summary

My main contribution was focused on the frontend Risk Map functionality.  
This included integrating the real map into the main frontend, improving map interaction, supporting layer controls, working on heritage filters and details display, and improving the legend, instructions, branding, and terminology.

This work helped move the Risk Map page from a placeholder or prototype-style page toward a more complete and usable project feature.