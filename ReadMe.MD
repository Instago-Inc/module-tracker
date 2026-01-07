# @instago/tracker

Watch web pages for changes. Captures HTML, text, and headings using the native browser binding, stores snapshots, and reports deltas on subsequent runs.

- Version: 1.0.0
- Entry: index.js
- Exports: `{ trackPage, trackPages }`
- Dependencies: `browser@1.0.0`, `b64@1.0.0`, `diff@1.0.0`, `sys.storage.get`

## API
- `trackPage(url, { noRefresh?, workflow? })` → `{ firstVisit, snapshot, previous?, delta? }`
- `trackPages(urls, opts?)` → `{ results, changes }`

## Example
```js
const tracker = require('tracker@1.0.0');
const { changes } = await tracker.trackPages(['https://example.com']);
if (changes.length) console.log('Pages changed:', changes.length);
```

## Notes
- Requires module storage to persist snapshots between runs and `browser@1.0.0` native binding to fetch pages; pass `workflow: true` to opt out.
