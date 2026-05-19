import { Component, effect, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Deck, FlyToInterpolator, MapViewState, PickingInfo } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { ThemeService } from '../../services/theme';
import { environment } from '../../../environments/environment';

const INITIAL_VIEW = {
  longitude: 2.13,
  latitude: 41.4,
  zoom: 10.9,
  pitch: 0,
  bearing: -60,
};

const MIN_YEAR = 2014;
const MAX_YEAR = 2025;
const PLAY_INTERVAL_MS = 800;
const PRE_COVID_YEAR = 2019;

interface MetricRecord {
  year: number;
  neighborhood_code: number;
  price_per_sqm: number | null;
}

interface Insights {
  priciest: { neighborhood: string; price_per_sqm: number; year: number };
  biggest_surge: {
    neighborhood: string;
    delta_monthly_80sqm: number;
    pct_change: number;
    pre_covid_year: number;
    year: number;
  };
  city_avg: {
    price_per_sqm: number;
    pre_covid_price_per_sqm: number;
    pct_change: number;
    pre_covid_year: number;
    year: number;
  };
  suppressed_neighborhoods: number[];
}

interface TooltipState {
  x: number;
  y: number;
  neighborhood: string;
  district: string;
  year: number;
  pricePerSqm: string;
  priceFor80sqm: string;
  yoy: string | null;
  yoyUp: boolean;
  vsPreCovid: string | null;
  vsPreCovidUp: boolean;
}

type MetricsLookup = Map<number, Map<number, MetricRecord>>;

interface NeighborhoodProperties {
  level: string;
  code: number;
  district_code: string;
  name: string;
}

type GeoFeature = Feature<Geometry, NeighborhoodProperties>;
type GeoCollection = FeatureCollection<Geometry, NeighborhoodProperties>;

@Component({
  selector: 'app-bcn-map',
  imports: [],
  templateUrl: './bcn-map.html',
  styleUrl: './bcn-map.scss',
})
export class BcnMap implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  protected readonly minYear = MIN_YEAR;
  protected readonly maxYear = MAX_YEAR;
  protected readonly selectedYear = signal(MAX_YEAR);
  protected readonly legendTicks = signal<[string, string, string]>(['', '', '']);
  protected readonly isPlaying = signal(false);
  protected readonly tooltip = signal<TooltipState | null>(null);
  protected readonly showInfo = signal(false);
  protected insights: Insights | null = null;

  readonly mapTitle = 'Barcelona';
  readonly subtitle = 'Rental price · Neighborhoods · 2014–2025';
  readonly attributionText = 'Source: Ajuntament de Barcelona · INCASÒL';
  readonly attributionHref =
    'https://habitatge.gencat.cat/ca/dades/indicadors_estadistiques/estadistiques_de_construccio_i_mercat_immobiliari/mercat_de_lloguer/lloguers-barcelona-per-districtes-i-barris/';
  readonly infoTitle = 'About this map';
  readonly infoBody =
    "Average annual rental price across Barcelona's 73 neighborhoods, sourced from registered rental contracts deposited with INCASÒL. Figures are in €/m²/month.";
  readonly infoCaveat =
    'Neighborhoods with fewer than 6 registered contracts in a given year are suppressed by the source. A small number of additional neighborhoods are suppressed because their year-on-year price swings exceed 40% — a signal of thin, unreliable coverage rather than genuine market movement. Both are shown in gray on the map.';

  private deck?: Deck;
  private geojson!: GeoCollection;
  private metricsLookup: MetricsLookup = new Map();
  private districtNames = new Map<number, string>();
  private suppressedNeighborhoods = new Set<number>();
  private valueMin = 0;
  private valueMax = 1;
  private playInterval?: ReturnType<typeof setInterval>;
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      const year = this.selectedYear();
      this.tooltip.set(null);
      if (this.deck) {
        this.deck.setProps({ layers: this.buildLayers(theme, year) });
      }
    });
  }

  ngOnInit(): void {
    const base = environment.dataBaseUrl;
    Promise.all([
      fetch(`${base}/bcn-admin.geojson`).then((r) => r.json()),
      fetch(`${base}/rental-prices.json`).then((r) => r.json()),
      fetch(`${base}/rental-insights.json`).then((r) => r.json()),
    ]).then(([geojson, metrics, insights]) => this.initDeck(geojson, metrics, insights));
  }

  ngOnDestroy(): void {
    this.pause();
    this.deck?.finalize();
  }

  protected fitToFrame(): void {
    this.deck?.setProps({
      viewState: {
        ...INITIAL_VIEW,
        transitionDuration: 400,
        transitionInterpolator: new FlyToInterpolator(),
      },
    });
  }

  protected togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  protected onSliderInput(event: Event): void {
    this.pause();
    this.selectedYear.set(+(event.target as HTMLInputElement).value);
  }

  private play(): void {
    this.isPlaying.set(true);
    this.playInterval = setInterval(() => {
      const next = this.selectedYear() < MAX_YEAR ? this.selectedYear() + 1 : MIN_YEAR;
      this.selectedYear.set(next);
    }, PLAY_INTERVAL_MS);
  }

  private pause(): void {
    this.isPlaying.set(false);
    clearInterval(this.playInterval);
  }

  private initDeck(geojson: GeoCollection, metrics: MetricRecord[], insights: Insights): void {
    this.geojson = geojson;
    this.insights = insights;
    this.suppressedNeighborhoods = new Set(insights.suppressed_neighborhoods);
    this.districtNames = buildDistrictNames(geojson);
    this.metricsLookup = this.buildMetricsLookup(metrics);
    this.deck = new Deck({
      parent: this.container.nativeElement,
      viewState: INITIAL_VIEW,
      onViewStateChange: ({ viewState }: { viewState: MapViewState }) => {
        this.deck?.setProps({ viewState });
      },
      controller: true,
      getCursor: ({ isDragging, isHovering }: { isDragging: boolean; isHovering: boolean }) =>
        isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab',
      style: { background: 'transparent' },
      layers: this.buildLayers(this.themeService.theme(), this.selectedYear()),
    });
  }

  private buildMetricsLookup(metrics: MetricRecord[]): MetricsLookup {
    const lookup: MetricsLookup = new Map();
    let min = Infinity,
      max = -Infinity;
    for (const record of metrics) {
      if (!lookup.has(record.year)) lookup.set(record.year, new Map());
      lookup.get(record.year)!.set(record.neighborhood_code, record);
      if (record.price_per_sqm != null) {
        if (record.price_per_sqm < min) min = record.price_per_sqm;
        if (record.price_per_sqm > max) max = record.price_per_sqm;
      }
    }
    this.valueMin = min;
    this.valueMax = max;
    const fmt = (v: number) => `€${v.toFixed(1)}`;
    this.legendTicks.set([fmt(min), fmt((min + max) / 2), fmt(max)]);
    return lookup;
  }

  private buildLayers(theme: 'light' | 'dark', year: number) {
    const [r, g, b]: [number, number, number] = theme === 'dark' ? [255, 255, 255] : [26, 27, 30];
    const yearMetrics = this.metricsLookup.get(year) ?? new Map();

    return [
      new GeoJsonLayer({
        id: 'neighborhoods-fill',
        data: this.geojson,
        stroked: false,
        filled: true,
        pickable: true,
        getFillColor: (f: GeoFeature) => {
          if (f.properties.level !== 'neighborhood') return [0, 0, 0, 0];
          const code: number = f.properties.code;
          if (this.suppressedNeighborhoods.has(code)) return [128, 128, 128, 40];
          const record = yearMetrics.get(code);
          if (!record?.price_per_sqm) return [128, 128, 128, 40];
          return interpolateColor((record.price_per_sqm - this.valueMin) / (this.valueMax - this.valueMin));
        },
        onHover: ({ object, x, y }: PickingInfo<GeoFeature>) => {
          if (!object || object.properties.level !== 'neighborhood') {
            this.tooltip.set(null);
            return;
          }
          const code: number = object.properties.code;
          if (this.suppressedNeighborhoods.has(code)) {
            this.tooltip.set(null);
            return;
          }
          const record = yearMetrics.get(code);
          if (!record?.price_per_sqm) {
            this.tooltip.set(null);
            return;
          }
          const prevRecord = this.metricsLookup.get(year - 1)?.get(code);
          const yoy =
            prevRecord?.price_per_sqm != null
              ? ((record.price_per_sqm - prevRecord.price_per_sqm) / prevRecord.price_per_sqm) * 100
              : null;
          const preCovidRecord = year > PRE_COVID_YEAR ? this.metricsLookup.get(PRE_COVID_YEAR)?.get(code) : null;
          const preCovidDelta =
            preCovidRecord?.price_per_sqm != null
              ? Math.round((record.price_per_sqm - preCovidRecord.price_per_sqm) * 80)
              : null;
          this.tooltip.set({
            x,
            y,
            neighborhood: object.properties.name,
            district: this.districtNames.get(parseInt(object.properties.district_code)) ?? '',
            year,
            pricePerSqm: `€${record.price_per_sqm.toFixed(2)}`,
            priceFor80sqm: `€${Math.round(record.price_per_sqm * 80).toLocaleString('en-GB')}`,
            yoy: yoy != null ? `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}% vs ${year - 1}` : null,
            yoyUp: yoy != null && yoy >= 0,
            vsPreCovid:
              preCovidDelta != null
                ? `${preCovidDelta >= 0 ? '+' : ''}€${Math.abs(preCovidDelta).toLocaleString('en-GB')}/month since ${PRE_COVID_YEAR}`
                : null,
            vsPreCovidUp: preCovidDelta != null && preCovidDelta >= 0,
          });
        },
        updateTriggers: { getFillColor: year },
      }),
      new GeoJsonLayer({
        id: 'admin-boundaries',
        data: this.geojson,
        stroked: true,
        filled: false,
        parameters: { depthTest: false },
        getLineColor: (f: GeoFeature) => {
          switch (f.properties.level) {
            case 'city':
              return [r, g, b, 80];
            case 'district':
              return [r, g, b, 50];
            case 'neighborhood':
              return [r, g, b, 30];
            default:
              return [0, 0, 0, 0];
          }
        },
        updateTriggers: { getLineColor: theme },
        getLineWidth: (f: GeoFeature) => {
          switch (f.properties.level) {
            case 'city':
              return 2;
            case 'district':
              return 1;
            case 'neighborhood':
              return 0.5;
            default:
              return 0;
          }
        },
        lineWidthMinPixels: 0.5,
      }),
    ];
  }
}

function buildDistrictNames(geojson: GeoCollection): Map<number, string> {
  const map = new Map<number, string>();
  for (const f of geojson.features) {
    if (f.properties.level === 'district') {
      map.set(f.properties.code, f.properties.name);
    }
  }
  return map;
}

function interpolateColor(t: number): [number, number, number, number] {
  const low: [number, number, number] = [59, 130, 246];
  const high: [number, number, number] = [239, 68, 68];
  return [
    Math.round(low[0] + t * (high[0] - low[0])),
    Math.round(low[1] + t * (high[1] - low[1])),
    Math.round(low[2] + t * (high[2] - low[2])),
    160,
  ];
}
