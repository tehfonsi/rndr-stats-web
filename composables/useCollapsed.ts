// Collapsed state of a card or section, remembered per browser in localStorage
export function useCollapsed(key: string) {
  const storageKey = `collapsed:${key}`;
  const collapsed = ref(false);

  onMounted(() => {
    try {
      collapsed.value = window.localStorage.getItem(storageKey) === '1';
    } catch {}
  });

  function toggle() {
    collapsed.value = !collapsed.value;
    try {
      if (collapsed.value) {
        window.localStorage.setItem(storageKey, '1');
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {}
  }

  return { collapsed, toggle };
}
