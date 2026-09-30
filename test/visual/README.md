# Visual regression tests

`Visual.test.ts` renders the scenes in `scenes.ts` on a fixed 320×180 canvas,
reads the final tone-mapped target back, reduces it to a 16×9 grid of cell
averages and compares that with the JSON baselines in `baselines/`.

| Command | What it does |
| --- | --- |
| `npm test` | Runs everything, including the visual tests. |
| `npm run test:visual` | Runs only the visual tests. |
| `npm run test:visual:update` | Re-renders every scene and rewrites `baselines/*.json`. |

## When a visual test fails

The failure message prints the worst cell and an ASCII luminance picture of the
baseline and of the current frame. If the change is a bug, fix it. If it is an
intended change in rendering, run `npm run test:visual:update`, look at the diff
of the JSON files, and commit them together with the change.

## Adding a scene

Add an entry to `VISUAL_SCENES` in `scenes.ts`. Keep scenes deterministic: place
the camera with `lookAt` (no smoothed controllers), avoid time-driven animation
and temporal effects (TAA, animated grain), and give shadow / bloom scenes a few
more `frames` to settle. The test itself rejects scenes that are blank or that
still change from frame to frame.

## Tolerances

`DEFAULT_TOLERANCE` allows a per-channel difference of 0.06 on a single cell and
0.012 on the grid mean. Cell averages absorb anti-aliasing and rasterization
differences between GPU backends; a scene can pass its own `tolerance` if it
needs a different limit.

Environment variables understood by `test/ci/main.js`: `UPDATE_BASELINES=1`
(write instead of compare) and `TEST_FILTER=<substring>` (only run matching test
files). The npm scripts set them with POSIX syntax; on Windows use `cross-env`
or set the variables in the shell first.
