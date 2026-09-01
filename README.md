# AdeshLang Documentation Website

This is the official documentation website for AdeshLang, built with [Docusaurus 3](https://docusaurus.io/).

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)

### Installation

```bash
# Install dependencies
bun install
```

### Local Development

```bash
# Start the development server
bun run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Build for production
bun run build
```

The built site will be in the `build/` directory.

### Serve Locally

```bash
# Serve the production build
bun run serve
```

## Project Structure

```
docs-website/
├── blog/                    # Blog posts (optional)
├── docs/                   # Documentation files
│   ├── intro.md           # Introduction page
│   ├── getting-started/   # Getting started guides
│   ├── language-guide/    # Language reference
│   ├── advanced/          # Advanced topics
│   ├── backends/          # Execution backends
│   ├── stdlib/            # Standard library
│   ├── tools/             # Tools and ecosystem
│   ├── performance/       # Performance optimization
│   ├── examples.md        # Examples catalog
│   ├── faq.md             # FAQ
│   └── contributing.md    # Contributing guide
├── src/
│   ├── css/               # Custom CSS
│   │   └── custom.css
│   └── pages/             # Custom pages
├── static/
│   └── img/               # Static images
│       ├── logo.svg
│       └── favicon.ico
├── sidebars.ts            # Sidebar configuration
├── docusaurus.config.ts   # Site configuration
└── package.json
```

## Features

- ✅ **Multi-backend documentation** - Complete guides for all 7 execution backends
- ✅ **Language reference** - Comprehensive language guide
- ✅ **Advanced topics** - Memory safety, OOP, async/await, decorators
- ✅ **Standard library docs** - Built-in modules and functions
- ✅ **Tools & ecosystem** - CLI, LSP, formatting, testing, FFI
- ✅ **Performance section** - Optimization tips and benchmarks
- ✅ **443+ examples** - Catalog of working examples
- ✅ **Responsive design** - Works on all devices
- ✅ **Dark mode** - Built-in dark theme support
- ✅ **Search** - Algolia search integration ready

## Customization

### Adding New Documentation

1. Create a new `.md` or `.mdx` file in the appropriate `docs/` subdirectory
2. Add frontmatter at the top:
   ```markdown
   ---
   id: my-doc
   title: My Document Title
   sidebar_label: My Doc
   ---
   ```
3. Update `sidebars.ts` to include the new document

### Updating Sidebar

Edit `sidebars.ts` to modify the navigation structure:

```typescript
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/quick-start', 'getting-started/installation'],
    },
    // ... more categories
  ],
};
```

### Custom Styling

Edit `src/css/custom.css` to override default styles.

### Configuration

Edit `docusaurus.config.ts` to customize:
- Site title and tagline
- Navbar items
- Footer links
- Theme colors
- Algolia search credentials

## Deployment

### Deploy to GitHub Pages

```bash
# Build the site
bun run build

# Deploy (requires proper GitHub configuration)
bun run deploy
```

### Manual Deployment

Copy the contents of the `build/` directory to your web server.

## Documentation Guidelines

### Writing Style

- Use clear, concise language
- Include code examples for all features
- Use AdeshLang syntax highlighting: \`\`\`adesh
- Keep paragraphs short (2-4 sentences)
- Use headings to organize content

### Code Examples

```adesh
// Good example
fn add(a: i64, b: i64): i64 {
    return a + b;
}

// Show expected output when helpful
print(add(5, 3));  // Output: 8
```

### Linking

Use relative links within the documentation:

```markdown
[Quick Start](getting-started/quick-start)
[Memory Safety](advanced/memory-safety)
```

## Troubleshooting

### Build Errors

If you encounter MDX compilation errors:
- Check for unescaped `<` characters (use `&lt;`)
- Ensure all code blocks have proper syntax highlighting
- Verify frontmatter is correctly formatted

### Broken Links

Run the build and check for broken link warnings. Fix by:
- Using correct relative paths
- Ensuring linked documents exist
- Checking sidebar configuration matches document IDs

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a branch (`feature/improve-docs`)
3. Make your changes
4. Test locally (`bun run start`)
5. Submit a pull request

## License

AdeshLang documentation is licensed under the MIT License. See the main project LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/adeshlang/adeshlang/issues)
- **Discussions**: [GitHub Discussions](https://github.com/adeshlang/adeshlang/discussions)
- **Main Repository**: [https://github.com/adeshlang/adeshlang](https://github.com/adeshlang/adeshlang)

---

**Built with ❤️ using Docusaurus**
