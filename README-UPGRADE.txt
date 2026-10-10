# CivilsOS UPSC upgrade bundle

## Contents
- `index.html`: current CivilsOS prototype UI
- `netlify.toml`: Netlify publish/function configuration
- `netlify/functions/current-affairs.mjs`: public RSS ingestion endpoint

## Important status
This is a first deployment scaffold. RSS ingestion is implemented as a Netlify Function, but the existing prototype UI does not yet call this endpoint and automatic AI syllabus classification is not yet connected. Feed providers can change RSS URLs or block server-side requests; verify source access after deployment. Do not add API keys to this repository.

## Deploy
Upload the extracted files/folders to the connected GitHub repository, preserving the `netlify/functions/current-affairs.mjs` path. Netlify should deploy from the configured production branch.
