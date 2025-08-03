### Application Specifications
We are building a "Brand Portal" or a brand library or asset library. think https://www.frontify.com/en, https://brandkit.com/brand-portal, https://www.mediavalet.com/blog/brand-portal-examples

this will follow our /doc/TECHNOLOGY.md and /package.json file for what technology you should propose. 

## Features
- Asset Library (A library that users can upload images, videos, Microsoft Office files, Adobe Suite files, etc.)
- Font & Color management - fonts/font families and colors with full rgb/hex/etc copy/paste (think Color Cards and a font preview) will be added as "Assets"
- Asset Groups (a specific group of assets a user could make from assets in the library not just assets they upload)
- Asset Group Sharing via Password (no account needed)
- Organiations & Users (with roles) (users belong to an organization. 1 org has many users, and many orgs will exist. roles are things like Admin, User, Content Manager, etc.)
- Granular content access - restrict some assets/groups to specific user Roles
- SSO Support for Google/O365

## Development Paramaters
- systems should be cleanly and DRYly built. look for instances of variables/functions/etc before creating new things (simple example: don't add Username to the User object and the Asset object - use a User REFERENCE from Asset to User to obtain the Username).
- avoid scope creep - your plans can include more fleshed out versions of my features, but do not suggest or attempt to create brand new features without being directly asked.
- no faking - don't create fake buttons, hardcode images into interfaces that pull an image from the database, etc. we should fully complete any code we start; never mock-up/faking.
- fully responsive - our frontend should support screen widths from 360px to 3840px, and everything in between. major breakpoints should follow  most common screen sizes found in the US.
- atomic principles (https://medium.com/galaxy-ux-studio/principles-of-atomic-design-7b03a30c3cb6) should be followed where possible. we want to reuse as many frontend features as possible to avoid breaking DRY or atomic principles.
- create detailed inline documentation (code comments that explain WHY we're doing things, and how they interact with other systems) and external documentation (.md summaries you can quickly read and understand to modify the system(s)).

## Instructions
STOP AND ASK ME AT EVERY STEP HERE
1 - review the Features in whole, and generate a high-level architecture document for the WHOLE APP for me to review and then a more detailed document for each system.
2 - generate a detailed human-friendly summary of how it will work, with use-case examples or user stories so i can confirm you understand everything. propose creating Phases for the tasks for each system as you see fit.
3 - then you should generate a detailed plan that YOU will consume for each feature. break it down into chunked instructions like my example below. 
    A. at the top of this file, write yourself a note "DO NOT CHANGE ANYTHING IN THIS FILE OTHER THAN CHECKING OFF A TASK" and then you will use the task plan to do your work, review your work after it is done, mark it as complete, and then move on.

[-] 1. Phase Name
[x] 1.1 Sub Task Name
- thing to do
- another thing to do
- this thing to do
- _Requirements: 1.4, 2.1, 4.4_

[ ] 1.2 Sub Task Name
- thing to do
- another thing to do
- this thing to do
- _Requirements: 2.3, 3.4, 5.1_