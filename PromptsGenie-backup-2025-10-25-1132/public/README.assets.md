# Public assets

Place static files here to be served at the site root. Examples:

- `genie-header.png` → background canvas and header backdrop, served at `/genie-header.png`
- `genie-logo.png` → header logo image, served at `/genie-logo.png`

Header usage:
- The `BrandHeader` component looks for `/genie-logo.png` and shows it next to the title. If the image is missing, it falls back to an emoji placeholder.
- The background of the header references `/genie-header.png` and includes a gradient overlay for readability.