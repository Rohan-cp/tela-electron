# Update Setup Guide - GitHub Releases

Your app is now configured to use GitHub Releases for automatic updates. Here's what you need to do:

## Step 1: Set Up GitHub Repository

1. Create a GitHub repository (or use an existing one)
2. **Update `package.json`**: Edit the `repository.url` field to match your actual GitHub repo:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git"
   }
   ```
3. **Update `electron-builder.yml`**: Set the owner and repo:
   ```yaml
   publish:
     owner: YOUR-USERNAME
     repo: YOUR-REPO-NAME
   ```

## Step 2: Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "Tela Electron Builder"
4. Select scopes:
   - For **public repos**: `public_repo`
   - For **private repos**: `repo`
5. Generate the token and copy it

## Step 3: Set Environment Variables

Set the GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

**For macOS/Linux**, add to your `~/.zshrc` or `~/.bashrc`:
```bash
export GITHUB_TOKEN=your_token_here
```

**For Windows** (PowerShell):
```powershell
$env:GITHUB_TOKEN="your_token_here"
```

## Step 4: Build and Publish Your First Release

When you're ready to release, use one of these commands:

```bash
# For macOS (ARM64)
yarn publish:mac

# For macOS (Universal - both Intel and Apple Silicon)
yarn publish:mac:universal

# For Windows
yarn publish:win

# For Linux
yarn publish:linux
```

Or manually:
```bash
yarn build:prod
electron-builder --mac --arm64 --publish always
```

This will:
1. Build your app
2. Create a GitHub Release with the version number
3. Upload the built files as release assets
4. Generate the update metadata files (`latest-mac.yml`, etc.)

## Step 5: How Updates Work

- When users launch your app, it automatically checks GitHub Releases for updates
- If a new version is found, users will see the update button in the Tela menu
- The app downloads the update in the background
- Users can click "Restart and update Tela" to install and restart

## Important Notes

1. **Version numbers**: Make sure to increment the version in `package.json` before each release
2. **First release**: Users installing the first version won't see updates until you publish a second release
3. **Development**: Updates are disabled in development mode (when `NODE_ENV !== "production"`)
4. **Testing**: You can test updates by:
   - Releasing version 1.0.0
   - Installing it
   - Releasing version 1.0.1
   - The app should detect the update

## Troubleshooting

- **"Failed to check for updates"**: Make sure your repo is public or the token has proper permissions
- **"No update available"**: Make sure you've published at least one release with a higher version number
- **GitHub rate limits**: GitHub API has rate limits. For high usage, consider using a GitHub App token instead

## Alternative: Manual Release Process

If you prefer to create releases manually:

1. Build your app: `yarn build:prod && electron-builder --mac --dir`
2. Create a GitHub Release manually via GitHub web interface
3. Upload the files from `dist/` folder
4. The update system will still work automatically!

