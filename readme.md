# @tse-ian/ripgrep

A Node.js wrapper for `ripgrep`, distributed as platform-specific binaries.

## Features

- **Multi-platform Support**: Automatically installs the correct binary for your operating system and architecture.
- **Lightweight**: The main package is a thin wrapper; only the relevant binary for your platform is downloaded.
- **Node.js Addon**: Provides N-API bindings for direct usage in Node.js applications.

## Installation

```bash
npm install @tse-ian/ripgrep
```

## Supported Platforms

The following platforms are supported via optional dependencies:

- `darwin-x64` (macOS Intel)
- `darwin-arm64` (macOS Apple Silicon)
- `linux-x64`
- `linux-arm64`
- `win32-x64`

## Usage

```javascript
const ripgrep = require('@tse-ian/ripgrep');

// Use the ripgrep addon
// Example: ripgrep.grep(...) - depending on the actual API of the addon
```

## Architecture

This repository uses a monorepo-like structure to manage and distribute multiple platform-specific packages.

- **Root Package (`@tse-ian/ripgrep`)**: The main entry point. It uses `optionalDependencies` to try installing all platform packages. NPM will only successfully install the one matching the current system.
- **Vendor Packages (`vendor/ripgrep/*`)**: Contains the actual binaries and `ripgrep.node` addon for each platform. These are published as separate scoped packages (e.g., `@tse-ian/x64-darwin-ripgrep`).

## Development

### Directory Structure

```
.
├── index.js                # Main entry point, resolves platform package
├── package.json            # Root package configuration
├── vendor/
│   └── ripgrep/
│       ├── arm64-darwin/   # macOS ARM64 package
│       ├── x64-linux/      # Linux x64 package
│       └── ...             # Other platforms
└── .github/
    └── workflows/
        └── ci.yml          # Automated publishing workflow
```

### Release Process

The release process is automated via GitHub Actions.

1.  **Update Version**: Update the version in `package.json` and all `vendor/ripgrep/*/package.json` files.
2.  **Commit & Push**: Push changes to the `main` branch.
3.  **Auto-Publish**: The CI workflow will:
    - Iterate through `vendor/ripgrep/*` and publish each platform package.
    - Publish the root package.

**Note**: Ensure the `NPM_TOKEN` secret is set in your GitHub repository settings.

## License

MIT
