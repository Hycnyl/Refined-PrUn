export function useClipboard() {
  const copied = ref(false);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  onScopeDispose(() => clearTimeout(timeout));

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('复制到剪贴板失败', e);
      return;
    }
    copied.value = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      copied.value = false;
    }, 1000);
  }

  return { copied, copy };
}
