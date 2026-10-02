import type { InjectionKey, Ref } from 'vue';

export interface SectionDrag {
  active: Ref<string | null>;
  start: (key: string, event: PointerEvent) => void;
  move: (key: string, direction: -1 | 1) => void;
}

export const SECTION_DRAG: InjectionKey<SectionDrag> = Symbol('section-drag');

const STORAGE_KEY = 'section-order';

/**
 * Order of the dashboard sections, changed by dragging a section's handle (or arrow keys on it)
 * and remembered in localStorage. While dragging, all sections show only their header so the
 * list is short enough to reorder without scrolling. Sections mark their root with `data-sort-key`.
 */
export function useSectionOrder(defaults: string[]) {
  const order = ref<string[]>([...defaults]);
  const active = ref<string | null>(null);

  onMounted(() => {
    try {
      const saved: string[] = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      // keep known keys in their saved order, append sections added later
      const known = saved.filter((k) => defaults.includes(k));
      order.value = [...known, ...defaults.filter((k) => !known.includes(k))];
    } catch {}
  });

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order.value));
    } catch {}
  }

  const element = (key: string) => document.querySelector<HTMLElement>(`[data-sort-key="${key}"]`);

  function start(key: string, event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const before = element(key)?.getBoundingClientRect().top ?? 0;
    active.value = key;
    // sections collapse to their headers now, keep the grabbed header under the pointer
    nextTick(() => {
      const after = element(key)?.getBoundingClientRect().top ?? 0;
      window.scrollBy(0, after - before);
    });

    // listen on window: reordering moves the section's DOM node, which drops any pointer capture
    const onMove = (e: PointerEvent) => {
      const others = order.value.filter((k) => k !== key);
      let index = 0;
      others.forEach((k) => {
        const rect = element(k)?.getBoundingClientRect();
        if (rect && e.clientY > rect.top + rect.height / 2) index++;
      });
      const next = [...others];
      next.splice(index, 0, key);
      if (next.join() !== order.value.join()) order.value = next;
    };
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('blur', onEnd);
      active.value = null;
      save();
      nextTick(() => element(key)?.scrollIntoView({ block: 'nearest' }));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('blur', onEnd);
  }

  function move(key: string, direction: -1 | 1) {
    const from = order.value.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.value.length) return;
    const next = [...order.value];
    next.splice(from, 1);
    next.splice(to, 0, key);
    order.value = next;
    save();
    // moving the DOM node drops focus, give it back so the arrow keys can be pressed again
    nextTick(() => element(key)?.querySelector<HTMLElement>('[data-sort-handle]')?.focus());
  }

  provide(SECTION_DRAG, { active, start, move });

  return { order, dragging: active };
}
