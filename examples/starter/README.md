# xyd-js Documentation Starter

Click on `Use this template` to copy the xyd-js documentation starter kit. This starter kit contains examples including:

- Guide pages with modern markdown
- Navigation and sidebar configuration
- Customizations and theming
- Use of popular components and icons
- API Reference pages with OpenAPI integration

## About xyd-js

**xyd** is a modern, batteries-included documentation engine that redefines the documentation experience by making it intuitive, flexible, and enjoyable. Built for developers who want to create beautiful documentation quickly.

## Features

- ⚡ **Fast Development** - Hot reload with instant preview
- 🎨 **Modern Design** - Beautiful, responsive documentation sites
- 📚 **Rich Content** - Support for markdown, code blocks, and interactive components
- 🔗 **API Integration** - Built-in OpenAPI/Swagger documentation support
- 🚀 **Easy Deployment** - Static site generation for any hosting platform
- 🎯 **Developer Friendly** - Simple CLI and configuration

## Quick Start

### Prerequisites

Make sure you have Node.js installed on your system.

### Installation

Install the xyd-js CLI globally:

```bash
bun add -g xyd-js
```

### Development

Run the development server at the root of your documentation (where `docs.json` is located):

```bash
xyd
```

This will start a local development server with hot reload enabled. Your documentation will be available at `http://localhost:5175` (or the next available port).

### Building for Production

Generate static files for deployment:

```bash
xyd build
```

This produces static files within `.xyd/build/client` which you can deploy to any static hosting platform.

## Project Structure

```
starter/
├── docs.json              # Main configuration file
├── openapi.json           # OpenAPI specification
├── docs/                 # Documentation pages
├── api-reference/        # API reference pages
├── public/              # Static assets
```

## Configuration

The main configuration file `docs.json` controls:

- **Theme**: Customize colors, logos, and branding
- **Navigation**: Header and sidebar structure
- **API Reference**: OpenAPI integration settings
- **Banner**: Custom announcements and notifications

## Deployment

Since xyd-js generates static files, you can deploy to any static hosting platform:

- **Vercel**: Connect your repository and deploy
- **GitHub Pages**: Push to a `gh-pages` branch
- **AWS S3**: Upload the `.xyd/build/client` directory
- **Any CDN**: Serve the static files from your preferred provider

To learn more, check out our [Deploy Samples](https://github.com/xyd-js/deploy-samples).

## Customization

### Adding Pages

Create new markdown files in the `docs/` directory and update the navigation in `docs.json`.

### Styling

Customize the theme by modifying the `theme` section in `docs.json`:

```json
{
  "theme": {
    "name": "picasso",
    "logo": {
      "light": "/public/assets/logo.svg",
      "dark": "/public/assets/logo-dark.svg"
    }
  }
}
```

### API Documentation

Add your OpenAPI specification to `openapi.json` and configure the API reference in `docs.json`.

## Troubleshooting

- **Dev server won't start**: Run `xyd install` to reinstall dependencies
- **Page loads as 404**: Make sure you're running the command in a folder with `docs.json`
- **Build fails**: Check that all referenced files exist and are properly formatted
- **Styling issues**: Verify that your theme configuration in `docs.json` is valid

## Contributing

Found a bug or have a feature request? Please open an issue or submit a pull request to help improve xyd-js.

## License

This starter kit is open source and available under the MIT License.

