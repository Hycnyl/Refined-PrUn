export function matchShipBlueprint<T extends { naturalId: string }>(
  blueprints: T[] | undefined,
  naturalId: string,
): { blueprint: T } | { error: string } {
  if (blueprints === undefined) {
    return { error: '尚未加载蓝图' };
  }
  const key = naturalId.toUpperCase();
  const matches = blueprints.filter(blueprint => blueprint.naturalId.toUpperCase() === key);
  const blueprint = matches[0];
  if (matches.length === 1 && blueprint !== undefined) {
    return { blueprint };
  }
  if (matches.length === 0) {
    return { error: `蓝图 ${naturalId} 没有匹配的蓝图` };
  }
  return { error: `蓝图 ${naturalId} 匹配了 ${matches.length} 个蓝图` };
}
