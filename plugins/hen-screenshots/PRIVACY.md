# Privacy and local file access

The Hen local renderer reads the image files, design config, brand kit, or project archive explicitly passed to it. Folder input scans only that folder's PNG/JPEG/WebP files, without recursion. Rendering creates a new output directory with previews, exports, and an editable project; original inputs are not modified.

The rendering code does not send network requests, require credentials, collect analytics, or upload screenshots to Hen. Installing npm dependencies downloads software from their package and native-binary hosts. It needs network access during setup, not during rendering.

Your AI agent is a separate service. Text and images you share with it are subject to that provider's settings and policies. Local rendering does not imply the entire AI conversation stays on your computer.

Project files embed the original captures and captions, and ZIP exports contain rendered images. Share them only with people you intend to receive that content. No captures or private projects are included in the plugin distribution package.

The plugin does not publish store listings, send mail, or submit itself to plugin directories. Those are separate user-authorized actions.

Contact: [hensell@hensell.dev](mailto:hensell@hensell.dev).
