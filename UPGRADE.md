# Upgrade Guide

Guide to update your older version (e.g., v92) to v93.

1. Check all the [changes](./imxweb/changes/changesFrom9.2.1To9.3.0.md) we made from v92 to v93.
1. Check the [shared styles](./imxweb/shared/scss/styles.scss)

   Shared scss files contains all the common components, base variables and mixins which are useful to maintain, update and customize the styles.

1. Check the [new data table](./imxweb/projects/qbm/src/lib/data-view/data-view-auto-table/data-view-auto-table.component.ts)

   The new data table contains all the functions of the old data table, with a new look and better usability.

1. Rebasing from v92 branch to v93. There are several different mothods to do it:

   Start this rebasing process without uncommitted changes.

   - Use git rebase command e.g., `git rebase v93` (recommended). You need to resolve the conflicts by every commits. Resolve them before proceeding.
   - Use git merge command e.g., `git merge v93`. You will solve all of your merge conflicts here at once.
   - Use git cherry-pick e.g., `git cherry-pick <commitHash1> <commitHash2>`. You can cherry-pick all your modification on the top of the v93 branch with the list of your commits (List commit hash with `git log` command)

   When you resolving the merge conflicts you should keep the changes come from the newer version or combine your changes with it.

1. Check the [Angular Update Guide](https://angular.dev/update-guide?v=14.0-18.0&l=3) to update your code to the required angular version.
1. Run `npm install` and rebuild all the projects to check for any issues remaining.
