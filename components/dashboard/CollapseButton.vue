<template>
  <button
    type="button"
    class="flex min-w-0 items-start gap-2 text-left"
    :aria-expanded="!collapsed"
    :aria-controls="controls"
    :title="collapsed ? 'Expand' : 'Collapse'"
    @click="emit('toggle')"
  >
    <span
      class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--rs-muted)] transition-transform"
      :class="{ '-rotate-90': collapsed }"
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </span>
    <span class="min-w-0"><slot /></span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ collapsed: boolean; controls?: string }>();
const emit = defineEmits<{ toggle: [] }>();
</script>
