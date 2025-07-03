# PowerShell script to stage, commit, and push all changes

git add .

$commit_message = Read-Host "Enter commit message"

git commit -m "$commit_message"

# Get current branch name
$git_branch = git rev-parse --abbrev-ref HEAD

git push origin $git_branch 