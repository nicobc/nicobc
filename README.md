# Nicolas — data engineer

I build platforms, teach teams, and occasionally ship things like this.

My personal site is available at [nicolascontreras.dev](https://nicolascontreras.dev). It's built to be interactive: the labs run in the browser so users can engage with concepts directly.

## Labs

### Data Contracts
Walks through a silent schema drift breaking a downstream chart, then the contract that prevents it. Validation runs in-browser via AJV.

### BCN Rental Prices
Barcelona rental price trends by neighbourhood, 2015–2023, sourced from the Barcelona and Catalan open data platforms.

## Repo structure

```
app/          Angular frontend
pipelines/    Python data pipelines (bcn-map: admin boundaries + rental prices)
.github/      CI workflows and deploy
.claude/      Agent instructions and project board (Claude Code)
```

## Running locally

### Frontend

```bash
cd app
npm install
ng serve
```

### BCN map pipeline

Dependencies are managed with [uv](https://docs.astral.sh/uv).

The pipeline requires two datasets downloaded manually before running:
- Admin unit boundaries — [Barcelona open data portal](https://opendata-ajuntament.barcelona.cat/data/dataset/808daafa-d9ce-48c0-925a-fa5afdb1ed41/resource/cd800462-f326-429f-a67a-c69b7fc4c50a/download)
- Rental prices — [Habitatge Gencat](https://habitatge.gencat.cat/ca/dades/indicadors_estadistiques/estadistiques_de_construccio_i_mercat_immobiliari/mercat_de_lloguer/lloguers-barcelona-per-districtes-i-barris/)

```bash
cd pipelines/bcn-map
uv sync
uv run build-admin-geo
uv run build-rental-prices
```
