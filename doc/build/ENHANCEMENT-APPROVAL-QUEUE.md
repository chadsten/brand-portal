# Enhancement Specifications
A content approval queue, allowing users to be delegated as "approver" and "requires approval" when uploading content to the application. 

## User Stories
- Bob uploads 12 pictures and 10 files to the asset library, and adds them to a collection "Approved Social Media Assets", and Jane, his manager, reviews the assets and the collection before it is approved.
- Jane can reject specific assets with a note, provide revisions, or approve an asset in bulk.
- Jane can browse assets that are Pending Approval by asset type/size/etc, or by Collection. 
- Jane can perform Collection-level actions such as approval/editing in a similar fashion to assets. Assets can be approved without a Collection being approved, as assets can exist in many collections.
- Bob can view the rejections with notes in a queue to edit and re-submit any assets.
- Bob can edit asset metadata, but not an asset itself, and the same applies to collections.
- Bob can add assets to a collection, or remove them.
- Jane can review and approve/edit/deny any edits, additions, or removals before they are published.
- John, Bob's equal coworker, can view asset and collection revisions on Bob's assets and collections. Jane can review these, along with administrative logs such as rejections, rejection notes, edits, etc.

## Features
- Granular workflow permissions; add/edit/remove permissions for assets and collections: My Own, Others, Everyone (organization-level like a manager with employees - some managers may have the ability to approve/edit ANYONE in their org's work, while others may only have control over their own team.)
- User update: Adding a "manager" user reference, to allow for the team-based workflow in addition to a user having org-wide control
- Approval queue should be list and grid based (option to switch), with filtering by asset type, user, etc. Should have easy controls like "approve all" and "approve selected".

