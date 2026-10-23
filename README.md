# Aprendo a Leer

A browser-based React word game for practicing Spanish syllables. All game
logic runs in the browser, and scores and hint preferences are saved in
`localStorage`; the app does not require a Java or Node.js backend.

Syllable lessons use bundled synthetic Latin American Spanish audio clips, so
pronunciation does not depend on an installed system voice or an online speech
service. The clips were generated with eSpeak NG; the synthesizer itself is not
included in the app runtime.

Turn on the hint to see a word category and letter blanks instead of an emoji.
Categories include animals, household items, foods, fruit and vegetables,
desserts, personal items, and more.

Progress is specific to the browser profile and site origin. Existing progress
from the Java desktop version is not imported automatically.

## Run locally

Install Node.js 22.12 or newer. On Windows, double-click `start-app.bat`.
It installs dependencies the first time, starts the local app, and opens it
in your browser. Keep the terminal window open while playing; press Ctrl+C to
stop the app.

Alternatively, run:

```sh
npm install
npm run start
```

Open the local URL printed by Vite. Vite also prints a network URL that other
devices on the same LAN can use; if it is not reachable, allow Node.js through
Windows Firewall on your private network. Create a static production build
with `npm run build`; the deployable files are written to `dist/`.

## Tests

```sh
npm test
```
