import { userData } from '@src/store/user-data';

export const FLT_BUTTONS_BUFFER_COMMAND = 'XIT FLTBUTTONS';

export type FltButtonColorStatus = 'baseEmpty' | 'baseCargo' | 'cxEmpty' | 'cxCargo';

export type FltButtonColors = Record<FltButtonColorStatus, string>;

export const FLT_BUTTON_COLOR_STATUSES: {
  key: FltButtonColorStatus;
  location: 'Base' | 'CX';
  cargo: 'Empty' | 'Cargo';
}[] = [
  { key: 'baseEmpty', location: 'Base', cargo: 'Empty' },
  { key: 'baseCargo', location: 'Base', cargo: 'Cargo' },
  { key: 'cxEmpty', location: 'CX', cargo: 'Empty' },
  { key: 'cxCargo', location: 'CX', cargo: 'Cargo' },
];

/** Current FLT unload colors plus six toned palette options for the picker. */
export const FLT_BUTTON_COLOR_OPTIONS: { label: string; value: string }[] = [
  { label: '蓝色', value: '#43a4df' },
  { label: '橙色', value: '#f7a600' },
  { label: '绿色', value: '#5cb85c' },
  { label: '红色警告', value: '#d9534f' },
  { label: '琥珀色', value: '#f0ad4e' },
  { label: '紫色', value: '#b48ad8' },
  { label: '玫红', value: '#e8676b' },
  { label: '青绿', value: '#2a9d8f' },
];

export const DEFAULT_FLT_BUTTON_COLORS: FltButtonColors = {
  // Historic unload colors: blue when empty, orange with cargo, at a base and at a CX.
  // Purple and rose stay in the picker; they apply only after the player selects them.
  baseEmpty: '#43a4df',
  baseCargo: '#f7a600',
  cxEmpty: '#43a4df',
  cxCargo: '#f7a600',
};

export function resolveFltButtonColor(atCx: boolean, hasCargo: boolean): string {
  const colors = userData.settings.fltButtonColors;
  const key: FltButtonColorStatus = atCx
    ? hasCargo
      ? 'cxCargo'
      : 'cxEmpty'
    : hasCargo
      ? 'baseCargo'
      : 'baseEmpty';
  return colors?.[key] ?? DEFAULT_FLT_BUTTON_COLORS[key];
}

export function setFltButtonColor(status: FltButtonColorStatus, value: string) {
  userData.settings.fltButtonColors ??= { ...DEFAULT_FLT_BUTTON_COLORS };
  userData.settings.fltButtonColors[status] = value;
}
