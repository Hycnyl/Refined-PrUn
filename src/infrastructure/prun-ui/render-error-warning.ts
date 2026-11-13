export function initRenderErrorWarning() {
  applyLocalizationPatch(L.ErrorBoundary.error, x => `${x}此错误可能由 Refined PrUn 引起。`);
}
