# module/tracker - V8 module

Track changes across web pages over time and get a clear view of what actually shifted. This module is designed for simple, repeatable monitoring runs without needing to wire up complex scraping logic.

Use it as a lightweight watcher that remembers the last snapshot and highlights differences on the next run. Learn more about Instago at https://instago.ai.

## Technical reference

### Exports
- `trackPage(url, options?)`
- `trackPages(urls, options?)`

### Usage
- `trackPage(url, options?)` -> `{ url, firstVisit, snapshot, previous?, delta? }`
  - `url` is required and must be a string.
  - `options.noRefresh` (boolean) skips page refresh before capture when true.
  - Returns `firstVisit: true` with `delta: null` when no prior snapshot exists.
- `trackPages(urls, options?)` -> `{ results, changes }`
  - `urls` must be a non-empty array of URL strings.
  - `results` contains one entry per URL; errors are captured per-item.
  - `changes` is a filtered list of entries with non-empty deltas.

### Configuration
- `env.json` has no required or optional keys for this module.

### Examples
```js
const tracker = require('tracker@latest');

const result = await tracker.trackPage('https://example.com');
if (result.firstVisit) {
  console.log('First time snapshot captured.');
} else if (result.delta) {
  console.log('Changes detected:', result.delta);
}
```

```js
const tracker = require('tracker@latest');

const { changes } = await tracker.trackPages([
  'https://example.com',
  'https://example.org'
]);

if (changes.length) {
  console.log('Pages changed:', changes.length);
}
```
