---
name: commit-sync-push-agent
description: Commits all changes, syncs with remote repository, and pushes to GitHub using username Arham-Begani and email arhambegani2@gmail.com. Use when you need to commit and push all current changes.
argument-hint: Optional commit message. If not provided, use a default message.
tools: run_in_terminal, get_changed_files
---

# Commit, Sync, and Push Agent

This agent handles committing all unstaged changes, syncing with the remote repository, and pushing to the main branch.

## Steps:

1. Set git user config to username: Arham-Begani and email: arhambegani2@gmail.com

2. Check for changes using get_changed_files

3. If there are changes, add all files: git add .

4. Commit with a message (use argument or default)

5. Pull from origin to sync: git pull --rebase origin main (assuming main branch)

6. Push to origin: git push origin main

## Notes:

- Assumes the branch is main. If different, adjust.

- Handles conflicts by rebasing.

- If no changes, skip commit.

Use run_in_terminal for all git commands.