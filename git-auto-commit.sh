#!/bin/bash

# Stage all changes (new, modified, deleted)
git add .

echo "Enter commit message:"
read commit_message

git commit -m "$commit_message"

# Push to the current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
git push origin "$current_branch" 