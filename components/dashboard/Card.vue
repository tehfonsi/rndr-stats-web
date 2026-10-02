<template>
  <section
    class="rounded-xl border border-[var(--rs-border)] bg-[var(--rs-card)] p-4 sm:p-5"
  >
    <header
      v-if="title"
      class="flex flex-wrap items-start justify-between gap-x-3 gap-y-2"
      :class="{ 'mb-4': !collapsed }"
    >
      <DashboardCollapseButton
        class="min-w-[12rem] flex-1"
        :collapsed="collapsed"
        :controls="bodyId"
        @toggle="toggle"
      >
        <h2 class="text-base font-semibold">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-sm text-[var(--rs-muted)]">
          {{ subtitle }}
        </p>
      </DashboardCollapseButton>
      <slot v-if="!collapsed" name="actions" />
    </header>
    <div v-show="!title || !collapsed" :id="bodyId">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
// cards with a title are collapsible, `collapseKey` identifies them in localStorage (defaults to the title)
const props = defineProps<{ title?: string; subtitle?: string; collapseKey?: string }>();

const key = props.collapseKey || props.title || 'card';
const bodyId = `card-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
const { collapsed, toggle } = useCollapsed(key);
</script>
