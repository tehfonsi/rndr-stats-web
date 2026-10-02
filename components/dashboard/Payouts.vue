<template>
  <DashboardSection title="Income" sort-key="income">
    <template #actions>
      <div class="flex items-center gap-3">
        <div
          v-if="wallet && !editing && data"
          class="inline-flex rounded-lg border border-[var(--rs-border)] bg-[var(--rs-card)] p-1"
          role="radiogroup"
          aria-label="Currency"
        >
          <button
            v-for="u in UNITS"
            :key="u"
            type="button"
            role="radio"
            :aria-checked="unit === u"
            class="rounded-md px-3 py-1.5 text-sm transition-colors"
            :class="unit === u ? 'highlight font-semibold text-white' : 'text-[var(--rs-secondary)] hover:bg-white/5 hover:text-white'"
            @click="setUnit(u)"
          >
            {{ u }}
          </button>
        </div>
        <button
          v-if="wallet && !editing"
          type="button"
          class="truncate text-sm text-[var(--rs-muted)] hover:text-white"
          title="Change wallet"
          @click="startEdit"
        >
          {{ shortAddress(wallet) }} ✎
        </button>
      </div>
    </template>

    <DashboardCard v-if="!walletLoaded">
      <div class="text-sm text-[var(--rs-muted)]">Loading...</div>
    </DashboardCard>

    <DashboardCard v-else-if="!wallet || editing">
      <form class="space-y-2" @submit.prevent="saveWallet">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref="input"
            v-model.trim="draft"
            required
            class="min-w-0 flex-[2] rounded-md border border-[var(--rs-border)] bg-[var(--rs-bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--rs-chart)]"
            placeholder="Solana wallet address that receives your node rewards"
            aria-label="Solana wallet address"
            spellcheck="false"
            autocomplete="off"
          />
          <input
            v-model="draftPassword"
            type="password"
            class="min-w-0 flex-1 rounded-md border border-[var(--rs-border)] bg-[var(--rs-bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--rs-chart)]"
            placeholder="Watchdog password"
            required
            aria-label="Watchdog password"
            autocomplete="current-password"
          />
          <div class="flex gap-2">
            <button
              type="submit"
              class="highlight rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Saving...' : 'Save wallet' }}
            </button>
            <button
              v-if="wallet"
              type="button"
              class="px-2 text-sm text-[var(--rs-muted)] hover:text-white"
              @click="editing = false"
            >
              Cancel
            </button>
          </div>
        </div>
        <p class="text-xs text-[var(--rs-muted)]">
          Saved for this operator, so it shows on all your devices. Use the password from the
          RNDR_Watchdog_Userconfig.ini of your nodes.
        </p>
        <p v-if="draftError" class="text-sm warning">{{ draftError }}</p>
      </form>
    </DashboardCard>

    <DashboardCard v-else-if="error">
      <div class="text-sm warning">
        Could not load payouts from the blockchain: {{ error }}
        <button type="button" class="ml-1 underline" @click="load(true)">Retry</button>
      </div>
    </DashboardCard>

    <DashboardCard v-else-if="!data">
      <div class="text-sm text-[var(--rs-muted)]">
        Reading payouts from the blockchain, the first load can take up to a minute...
      </div>
    </DashboardCard>

    <div v-else class="space-y-4">
      <DashboardCard title="Overview" collapse-key="income-overview" subtitle="RENDER reward payouts received on Solana">
        <div class="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4">
          <div class="col-span-2 lg:col-span-1">
            <div class="text-sm text-[var(--rs-muted)]">Last 30 days</div>
            <div class="mt-1 text-4xl font-semibold sm:text-5xl">
              {{ money(total(30)) }}<span class="ml-1 text-base font-normal text-[var(--rs-secondary)]">{{ unitSuffix }}</span>
            </div>
            <div class="mt-1 text-sm text-[var(--rs-secondary)]">{{ other(total(30, otherUnit)) }}</div>
          </div>
          <div>
            <div class="text-sm text-[var(--rs-muted)]">Last 7 days</div>
            <div class="mt-1 text-2xl font-semibold sm:text-3xl">{{ money(total(7)) }}</div>
            <div class="mt-1 text-sm text-[var(--rs-secondary)]">{{ other(total(7, otherUnit)) }}</div>
          </div>
          <div>
            <div class="text-sm text-[var(--rs-muted)]">Last {{ WEEKS }} weeks</div>
            <div class="mt-1 text-2xl font-semibold sm:text-3xl">{{ money(total(WEEKS * 7)) }}</div>
            <div class="mt-1 text-sm text-[var(--rs-secondary)]">{{ other(total(WEEKS * 7, otherUnit)) }}</div>
          </div>
          <div class="col-span-2 lg:col-span-1">
            <div class="text-sm text-[var(--rs-muted)]">Last payout</div>
            <template v-if="data.payouts.length">
              <div class="mt-1 text-2xl font-semibold sm:text-3xl">{{ money(valueOf(data.payouts[0])) }}</div>
              <div class="mt-1 text-sm text-[var(--rs-secondary)]">
                {{ fromNow(data.payouts[0].time * 1000) }} ago
              </div>
            </template>
            <div v-else class="mt-1 text-sm text-[var(--rs-secondary)]">
              None in the last {{ WEEKS }} weeks
            </div>
          </div>
        </div>
      </DashboardCard>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard
          title="Received per week"
          collapse-key="income-weekly"
          :subtitle="`${unit}, by reward type`"
          class="lg:col-span-2"
        >
          <ul class="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <li v-for="s in series" :key="s.label" class="flex items-center gap-1.5">
              <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: s.color }" />
              <span class="text-[var(--rs-secondary)]">{{ s.label }}</span>
            </li>
          </ul>
          <client-only>
            <DashboardTimeChart
              kind="bar"
              :points="weekly"
              :series="series"
              :bucket="WEEK"
              :height="200"
              :format="formatChart"
              :aria-label="`${unit} received per week`"
            />
          </client-only>
        </DashboardCard>

        <DashboardCard title="Recent payouts" collapse-key="income-payouts" subtitle="Click an amount to open it on Solscan">
          <ul v-if="data.payouts.length" class="divide-y divide-white/5 text-sm">
            <li
              v-for="p in data.payouts.slice(0, 8)"
              :key="p.signature"
              class="flex items-center justify-between gap-3 py-1.5"
            >
              <span class="flex items-center gap-2 text-[var(--rs-secondary)]">
                <span
                  class="inline-block h-2 w-2 rounded-sm"
                  :style="{ backgroundColor: sourceOf(p.source).color }"
                />
                {{ formatDate(p.time) }}
                <span class="text-xs text-[var(--rs-muted)]" :title="p.source">{{ sourceOf(p.source).label }}</span>
              </span>
              <a
                :href="`https://solscan.io/tx/${p.signature}`"
                target="_blank"
                rel="noopener"
                class="tabular-nums text-white! no-underline! hover:underline!"
                >{{ money(valueOf(p)) }} {{ unitSuffix }} ↗</a
              >
            </li>
          </ul>
          <p v-else class="text-sm text-[var(--rs-secondary)]">
            No Render Network payouts found for this wallet.
          </p>
        </DashboardCard>
      </div>

      <p v-if="updating || unit === 'USD' || notice" class="text-xs text-[var(--rs-muted)]">
        <span v-if="notice">{{ notice }} </span>
        <span v-if="updating">Checking the blockchain for new payouts... </span>
        <span v-if="unit === 'USD'">USD at the RENDER price on the day each payout arrived.</span>
      </p>
    </div>
  </DashboardSection>
</template>

<script setup lang="ts">
import { fromNow } from '../../src/utils';
import type { ChartPoint } from '../../src/types';

interface Payout {
  signature: string;
  time: number;
  source: string;
  amount: number;
  usd: number | null;
}

type Unit = 'RENDER' | 'USD';

const props = defineProps<{ operatorId: string }>();

const WEEKS = 12;
const DAY = 24 * 60 * 60;
const WEEK = 7 * DAY;
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const UNITS: Unit[] = ['RENDER', 'USD'];
// Render Network payout addresses, bottom to top in the chart: the steady availability rewards
// (rav3…) form the base, the work-based render rewards (rnoK…, tracks rendered OB-hours) stack on top.
// Colors follow the reward type and are validated as a pair on the card surface.
const SOURCES = [
  { address: 'rav3GKV8KXg4AvswaqT9HWJ4ErxU5csUwTKj549aHUH', label: 'Availability', color: '#3987e5' },
  { address: 'rnoKwRkj6kvrm7Zhn9qqE9tKKcsh8y66bdc9JuCvAT9', label: 'Render', color: '#e5484d' },
];

const wallet = ref('');
const draft = ref('');
const draftError = ref('');
const draftPassword = ref('');
const saving = ref(false);
const notice = ref('');
const walletLoaded = ref(false);
const editing = ref(false);
const unit = ref<Unit>('RENDER');
const input = ref<HTMLInputElement | null>(null);
const data = ref<{ end: number; sources: string[]; payouts: Payout[] } | null>(null);
const error = ref('');
const updating = ref(false);

const otherUnit = computed<Unit>(() => (unit.value === 'RENDER' ? 'USD' : 'RENDER'));
const unitSuffix = computed(() => (unit.value === 'USD' ? '' : 'RENDER'));

onMounted(() => {
  try {
    const savedUnit = window.localStorage.getItem('income-unit');
    if (savedUnit === 'USD' || savedUnit === 'RENDER') unit.value = savedUnit;
    // the wallet used to be kept in the browser, it lives in the database now
    window.localStorage.removeItem(`wallet:${props.operatorId}`);
  } catch {}
  loadSavedWallet();
});

// the wallet is stored per operator in the database, set with the watchdog password
async function loadSavedWallet() {
  try {
    const res = await $fetch<{ wallet: string | null }>('/api/operator-wallet', {
      query: { id: props.operatorId },
    });
    if (res.wallet && !editing.value) useWallet(res.wallet);
  } catch (e) {
    console.error(e);
  } finally {
    walletLoaded.value = true;
  }
}

function useWallet(address: string) {
  wallet.value = address;
  load();
}

// ---- browser cache ----
// Render pays once a week per payout address, on Wednesday (UTC). Payouts are cached in
// localStorage and the blockchain is only asked again once a new Wednesday payout is due.

interface PayoutCache {
  fetchedAt: number; // ms
  sources: string[];
  payouts: Payout[];
}

const HOUR_MS = 60 * 60 * 1000;
const cacheKey = (address: string) => `payouts:${address}`;

function readCache(address: string): PayoutCache | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(address));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(address: string, cache: PayoutCache) {
  try {
    window.localStorage.setItem(cacheKey(address), JSON.stringify(cache));
  } catch {}
}

// start of the most recent Wednesday, UTC, in ms
function lastPayoutDay(now = Date.now()): number {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - ((d.getUTCDay() - 3 + 7) % 7) * DAY * 1000;
}

function needsUpdate(cache: PayoutCache): boolean {
  const payday = lastPayoutDay();
  const paidSince = (from: number, to = Infinity) =>
    new Set(cache.payouts.filter((p) => p.time * 1000 >= from && p.time * 1000 < to).map((p) => p.source));
  // expect a payout from every address that paid the week before (or any payout at all)
  const expected = paidSince(payday - WEEK * 1000, payday);
  const received = paidSince(payday);
  const complete = expected.size ? [...expected].every((s) => received.has(s)) : received.size > 0;
  // while this week's payouts are missing, look again at most once an hour
  return !complete && Date.now() - cache.fetchedAt > HOUR_MS;
}

function show(cache: PayoutCache) {
  const since = Date.now() / 1000 - WEEKS * WEEK;
  data.value = {
    end: Math.floor(Date.now() / 1000),
    sources: cache.sources,
    payouts: cache.payouts.filter((p) => p.time >= since),
  };
}

async function load(force = false) {
  const address = wallet.value;
  error.value = '';
  const cache = readCache(address);
  if (cache) show(cache);
  else data.value = null;
  if (cache && !force && !needsUpdate(cache)) return;

  updating.value = true;
  try {
    const newest = cache?.payouts.reduce((max, p) => Math.max(max, p.time), 0) || 0;
    const res = await $fetch<{ sources: string[]; payouts: Payout[] }>('/api/wallet-income', {
      query: { address, days: WEEKS * 7, after: newest || undefined },
    });
    if (address !== wallet.value) return;
    const known = new Set(cache?.payouts.map((p) => p.signature));
    const since = Date.now() / 1000 - WEEKS * WEEK;
    const next: PayoutCache = {
      fetchedAt: Date.now(),
      sources: res.sources,
      payouts: [...res.payouts.filter((p) => !known.has(p.signature)), ...(cache?.payouts || [])]
        .filter((p) => p.time >= since)
        .sort((a, b) => b.time - a.time),
    };
    writeCache(address, next);
    show(next);
  } catch (e: any) {
    // keep showing cached payouts, only complain when there is nothing to show
    if (!data.value) error.value = e?.statusMessage || e?.message || 'unknown error';
  } finally {
    updating.value = false;
  }
}

function setUnit(u: Unit) {
  unit.value = u;
  try {
    window.localStorage.setItem('income-unit', u);
  } catch {}
}

function startEdit() {
  draft.value = wallet.value;
  draftError.value = '';
  editing.value = true;
  nextTick(() => input.value?.focus());
}

async function saveWallet() {
  if (!BASE58.test(draft.value)) {
    draftError.value = 'That does not look like a Solana address.';
    return;
  }
  if (!draftPassword.value) {
    draftError.value = 'Enter the password from your watchdog .ini to save the wallet.';
    return;
  }
  draftError.value = '';
  notice.value = '';
  saving.value = true;
  try {
    await $fetch('/api/operator-wallet', {
      method: 'PUT',
      body: { operator_id: props.operatorId, wallet: draft.value, password: draftPassword.value },
    });
  } catch (e: any) {
    draftError.value =
      e?.statusCode === 403
        ? 'Wrong password! Make sure you set the same password in the .ini file of all nodes.'
        : `Could not save the wallet: ${e?.statusMessage || e?.message || 'unknown error'}`;
    return;
  } finally {
    saving.value = false;
  }
  notice.value = 'Wallet saved for all your devices.';
  draftPassword.value = '';
  editing.value = false;
  useWallet(draft.value);
}

const valueOf = (p: Payout, u: Unit = unit.value) => (u === 'USD' ? p.usd || 0 : p.amount);

function total(days: number, u: Unit = unit.value): number {
  if (!data.value) return 0;
  const since = data.value.end - days * DAY;
  return data.value.payouts.filter((p) => p.time >= since).reduce((sum, p) => sum + valueOf(p, u), 0);
}

const sourceOf = (address: string) =>
  SOURCES.find((s) => s.address === address) || { address, label: shortAddress(address), color: 'var(--rs-muted)' };
const series = SOURCES.map(({ label, color }) => ({ label: `${label} rewards`, color }));

const weekly = computed<ChartPoint[]>(() => {
  if (!data.value) return [];
  const { end, payouts } = data.value;
  return Array.from({ length: WEEKS }, (_, i) => {
    const t = end - (WEEKS - i) * WEEK;
    const inWeek = payouts.filter((p) => p.time >= t && p.time < t + WEEK);
    const values = SOURCES.map((s) =>
      inWeek.filter((p) => p.source === s.address).reduce((sum, p) => sum + valueOf(p), 0)
    );
    return { t, value: values.reduce((a, b) => a + b, 0), values };
  });
});

const shortAddress = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
const formatDate = (t: number) =>
  new Date(t * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const usd = (v: number, digits = 2) =>
  v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits });
const money = (v: number) => (unit.value === 'USD' ? usd(v) : v.toFixed(2));
const other = (v: number) => (otherUnit.value === 'USD' ? `≈ ${usd(v)}` : `${v.toFixed(2)} RENDER`);
const formatChart = (v: number, short?: boolean) =>
  unit.value === 'USD'
    ? usd(v, short ? 0 : 2)
    : short
      ? v.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : `${v.toFixed(2)} RENDER`;
</script>
