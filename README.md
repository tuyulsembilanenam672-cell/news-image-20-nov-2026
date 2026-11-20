# The World in One Day — 20 November 2026

[![make.fun](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/c/news-image-20261120)

A deterministic newspaper front page summing up the world's news of
Friday 20 November 2026, drawn pixel by pixel with Node's standard
library only — no network, no fonts, no dependencies.

## The day in seven stories

- **Trump, Xi and Putin sign peace declaration** — the three leaders end their first trilateral meeting at the APEC summit in Shenzhen.
- **Trump puts Iran war decision off to 2027** — no rush on Iran, he will see what happens after January 1.
- **Court rules Myanmar committed genocide** — the ICJ finds the military likely intended to destroy a substantial part of the Rohingya minority.
- **Cyclone Akvan slams into India's east coast** — 300,000 evacuated in Odisha as the storm makes landfall.
- **Russian strikes hit embassies in Kyiv** — Austrian and Dutch embassies damaged as Europe says it is ready for talks with Moscow.
- **GTA 6 sales pass $1.8 billion in a day** — Rockstar's game overtakes the global run of The Odyssey.
- **Engine trouble ends Hayabusa2 landing plan** — Japan's probe abandons its asteroid landing.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` draws a 1024×1024 PNG and writes it to `entry.png` in the
output directory. Running it twice produces byte-identical output.

## Entry

Built for the [make.fun competition "Sum up 20 November's world news in one image"](https://make.fun/c/news-image-20261120).
