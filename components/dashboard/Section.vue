<template>
  <section
    :data-sort-key="sortKey"
    class="rounded-xl transition-shadow"
    :class="{ 'ring-2 ring-[var(--rs-chart)] ring-offset-4 ring-offset-[var(--rs-bg)]': isDragged }"
  >
    <header
      class="flex flex-wrap items-end justify-between gap-3"
      :class="{ 'mb-4': open }"
    >
      <div class="flex min-w-0 items-start gap-1">
        <button
          v-if="drag && sortKey"
          data-sort-handle
          type="button"
          class="-ml-1 mt-0.5 inline-flex h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[var(--rs-muted)] hover:bg-white/5 hover:text-white active:cursor-grabbing"
          :aria-label="`Move ${title} section, use the arrow keys`"
          title="Drag to reorder"
          @pointerdown="drag.start(sortKey, $event)"
          @keydown.up.prevent="drag.move(sortKey, -1)"
          @keydown.down.prevent="drag.move(sortKey, 1)"
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="3.5" r="1.25" /><circle cx="10" cy="3.5" r="1.25" />
            <circle cx="6" cy="8" r="1.25" /><circle cx="10" cy="8" r="1.25" />
            <circle cx="6" cy="12.5" r="1.25" /><circle cx="10" cy="12.5" r="1.25" />
          </svg>
        </button>
        <DashboardCollapseButton :collapsed="collapsed" :controls="bodyId" @toggle="toggle">
          <h2 class="text-xl font-semibold">{{ title }}</h2>
        </DashboardCollapseButton>
      </div>
      <slot v-if="open" name="actions" />
    </header>
    <div v-show="open" :id="bodyId">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { SECTION_DRAG } from '../../composables/useSectionOrder';

// `sortKey` makes the section reorderable when the page provides useSectionOrder()
const props = defineProps<{ title: string; collapseKey?: string; sortKey?: string }>();

const key = props.collapseKey || props.title;
const bodyId = `section-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
const { collapsed, toggle } = useCollapsed(key);

const drag = inject(SECTION_DRAG, null);
const isDragged = computed(() => !!props.sortKey && drag?.active.value === props.sortKey);
// while any section is dragged, all of them show only their header
const open = computed(() => !collapsed.value && !drag?.active.value);
</script>
