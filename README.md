# VideoTak

A private, local-first video library built with React, TypeScript, Vite, and Tailwind CSS. Starts completely empty: no sample videos, accounts, or backend required.

## Features
- Save YouTube, Facebook, and website links with editable captions, thumbnails, categories, and notes.
- Captions and thumbnails are fetched automatically after pasting a link in the add dialog. YouTube uses public oEmbed metadata; website and Facebook previews also use Microlink. If metadata is blocked or rate-limited, an explanation and manual editing remain available. Website domains are used as clearly identified placeholder captions when a page title is unavailable.
- Watch in embedded YouTube or Facebook players. Private videos and creators who disable embedding cannot be played; the original link is always available.
- Website bookmarks show a preview and open the original in a new tab rather than attempting to bypass sites' iframe restrictions.
- Create color-coded categories, favorite videos, search captions and notes, sort, and switch between grid/list views.
- Write automatically saved personal notes beneath each video caption.
- Export and import JSON backups from Library settings. Import merges duplicates by URL.
- Responsive dark interface. No videos are added automatically and no app-imposed video count limit (browser storage limits apply).

## Local development

```sh
npm ci
npm run dev
```

Production build: `npm run build`. Output: `dist/`.

## Publish on GitHub Pages

1. Upload this project to a GitHub repository with the default branch named `main`.
2. In the repository, open **Settings → Pages → Build and deployment → Source**, then choose **GitHub Actions**.
3. Push to `main`, or manually run the included **Deploy VideoTak to GitHub Pages** workflow in the Actions tab.
4. The workflow builds with a relative base so both repository and custom-domain Pages sites work.

No secret keys or server configuration are needed. For a different branch, adjust `.github/workflows/deploy.yml`.

## Data & privacy

Videos, notes, and categories are stored in localStorage under `videotak-videos` and `videotak-categories`. Data belongs to a particular browser and site origin; it is not uploaded to GitHub or synchronized across devices. Use JSON export/import to move your library. Clearing browser/site data deletes the library, so back up regularly.

Metadata requests send the pasted URL to YouTube's oEmbed service, Noembed, or Microlink's public preview API. Avoid pasting sensitive/private URLs. Playing a video loads third-party YouTube/Facebook embeds. These services have their own privacy policies, restrictions, rate limits, and cookies. Public metadata retrieval is best effort; Facebook does not reliably expose captions/thumbnails to client-only apps. No service credentials are bundled, and no backend is required for GitHub Pages.

বাংলা ক্যাপশন ও নোট লেখা যাবে। প্রথমে লাইব্রেরি খালি থাকবে। লিংক দিয়ে নিজের ভিডিও যোগ করুন। GitHub Pages-এ প্রকাশ করার জন্য উপরের ধাপগুলো অনুসরণ করুন।

## Cross-device sync (Firebase, free)

1. Create a Firebase project, enable **Authentication** (Google + Email/Password) and **Firestore**.
2. Paste the rules from `firestore.rules` into Firestore → Rules → Publish.
3. Paste your web app config into `src/firebase.ts`.
4. Add your GitHub Pages domain (`<user>.github.io`) to Authentication → Settings → Authorized domains.
5. Push to `main`. Open Library settings → sign in on each device.
