#!/bin/bash

# Generate structured release notes based on conventional commits
# Usage: ./scripts/generate-release-notes.sh [version] [previous_tag]

set -e

VERSION="$1"
PREVIOUS_TAG="$2"

if [ -z "$VERSION" ]; then
  echo "❌ Please provide a version number"
  echo "Usage: $0 <version> [previous_tag]"
  exit 1
fi

# Detect tag schema from the current version
if [[ $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
  TAG_SCHEMA="v*"
  TAG_PREFIX="v"
elif [[ $VERSION =~ ^[a-zA-Z0-9-]+/[a-zA-Z0-9-]+@[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
  # Extract package name and version for package-specific tags
  PACKAGE_NAME=$(echo "$VERSION" | sed 's/@.*$//')
  TAG_SCHEMA="${PACKAGE_NAME}@*"
  TAG_PREFIX="${PACKAGE_NAME}@"
elif [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
  # Plain version numbers (like 0.1.0-alpha.0)
  TAG_SCHEMA="$VERSION"
  TAG_PREFIX=""
else
  # Default to exact version matching
  TAG_SCHEMA="$VERSION"
  TAG_PREFIX=""
fi

# Get the previous tag for comparison if not provided
if [ -z "$PREVIOUS_TAG" ]; then
  # Find the most recent tag that matches the same schema
  if [[ $TAG_SCHEMA == "v*" ]]; then
    # For v* tags, find the most recent v* tag
    PREVIOUS_TAG=$(git tag --sort=-version:refname | grep "^v[0-9]" | head -n 1 | grep -v "^$VERSION$" || echo "")
  elif [[ $TAG_SCHEMA == *"@"* ]]; then
    # For package tags, find the most recent tag with the same package prefix
    PREVIOUS_TAG=$(git tag --sort=-version:refname | grep "^$TAG_PREFIX" | head -n 1 | grep -v "^$VERSION$" || echo "")
  else
    # For exact version matching, find the most recent tag with the same major.minor version
    MAJOR_MINOR=$(echo "$VERSION" | sed 's/^\([0-9]\+\.[0-9]\+\)\..*/\1/')
    PREVIOUS_TAG=$(git tag --sort=-version:refname | grep "^$MAJOR_MINOR\." | head -n 1 | grep -v "^$VERSION$" || echo "")
  fi
fi

if [ -n "$PREVIOUS_TAG" ]; then
#   echo "Comparing with previous tag: $PREVIOUS_TAG (schema: $TAG_SCHEMA)"
  COMMITS=$(git log --pretty=format:"%s|%an" $PREVIOUS_TAG..HEAD)
else
#   echo "No previous tag found for schema $TAG_SCHEMA, showing all commits"
  COMMITS=$(git log --pretty=format:"%s|%an")
fi

# Debug: Show what tags are available
# echo "Available tags for schema $TAG_SCHEMA:"
if [[ $TAG_SCHEMA == "v*" ]]; then
  git tag --sort=-version:refname | grep "^v[0-9]" | head -n 5
elif [[ $TAG_SCHEMA == *"@"* ]]; then
  git tag --sort=-version:refname | grep "^$TAG_PREFIX" | head -n 5
else
  MAJOR_MINOR=$(echo "$VERSION" | sed 's/^\([0-9]\+\.[0-9]\+\)\..*/\1/')
  git tag --sort=-version:refname | grep "^$MAJOR_MINOR\." | head -n 5
fi

# Initialize sections
HIGHLIGHTS=""
FEATURES=""
FIXES=""
CHORES=""
DOCS=""
OTHER=""

# Process each commit
while IFS= read -r line; do
  if [ -n "$line" ]; then
    COMMIT_MSG=$(echo "$line" | cut -d'|' -f1)
    AUTHOR=$(echo "$line" | cut -d'|' -f2)
    
    # Extract commit type and description
    if [[ $COMMIT_MSG =~ ^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: ]]; then
      COMMIT_TYPE="${BASH_REMATCH[1]}"
      COMMIT_DESC=$(echo "$COMMIT_MSG" | sed 's/^[^:]*: *//')
      
      # Format the commit line
      COMMIT_LINE="- $COMMIT_DESC by @$AUTHOR"
      
      # Categorize commits
      case $COMMIT_TYPE in
        "feat")
          if [[ $COMMIT_DESC == *"breaking"* ]] || [[ $COMMIT_DESC == *"major"* ]]; then
            HIGHLIGHTS="$HIGHLIGHTS
        $COMMIT_LINE"
          else
            FEATURES="$FEATURES
        $COMMIT_LINE"
          fi
          ;;
        "fix")
          FIXES="$FIXES
        $COMMIT_LINE"
          ;;
        "docs")
          DOCS="$DOCS
        $COMMIT_LINE"
          ;;
        "chore"|"ci"|"build")
          CHORES="$CHORES
        $COMMIT_LINE"
          ;;
        *)
          OTHER="$OTHER
        $COMMIT_LINE"
          ;;
      esac
    else
      # Non-conventional commits go to other
      COMMIT_LINE="- $COMMIT_MSG by @$AUTHOR"
      OTHER="$OTHER
        $COMMIT_LINE"
    fi
  fi
done <<< "$COMMITS"

# Build the release body
RELEASE_BODY="## 🚀 Release $VERSION"

# Add Highlights section if there are any
if [ -n "$HIGHLIGHTS" ]; then
  RELEASE_BODY="$RELEASE_BODY

## Highlights$HIGHLIGHTS"
fi

# Add Features section
if [ -n "$FEATURES" ]; then
  RELEASE_BODY="$RELEASE_BODY

## Features$FEATURES"
fi

# Add Other Changes section
if [ -n "$OTHER" ]; then
  RELEASE_BODY="$RELEASE_BODY

## Other Changes$OTHER"
fi

# Add Documentation section
if [ -n "$DOCS" ]; then
  RELEASE_BODY="$RELEASE_BODY

## Documentation$DOCS"
fi

# Add Bug Fixes section
if [ -n "$FIXES" ]; then
  RELEASE_BODY="$RELEASE_BODY

## Bug Fixes$FIXES"
fi

# Add Chores section
if [ -n "$CHORES" ]; then
  RELEASE_BODY="$RELEASE_BODY

## Chores$CHORES"
fi

# Add timestamp
RELEASE_BODY="$RELEASE_BODY
"

# Output the release body
echo "$RELEASE_BODY" 