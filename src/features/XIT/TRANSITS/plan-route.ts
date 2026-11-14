import { RouteStop } from '@src/features/XIT/TRANSITS/resolve-route-stop';

export interface RouteLeg {
  originLabel: string;
  destinationLabel: string;
  originQuery?: string;
  destinationQuery?: string;
  error?: string;
}

export function planRouteLegs(stops: RouteStop[]): { error?: string; legs: RouteLeg[] } {
  if (stops.length < 2) {
    return { error: '请至少输入两个站点', legs: [] };
  }
  const legs: RouteLeg[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const origin = stops[i];
    const destination = stops[i + 1];
    if (origin === undefined || destination === undefined) {
      continue;
    }
    const leg: RouteLeg = {
      originLabel: origin.label,
      destinationLabel: destination.label,
      originQuery: origin.query,
      destinationQuery: destination.query,
    };
    if (origin.query === undefined) {
      leg.error = origin.error ?? `未知站点“${origin.raw}”`;
    } else if (destination.query === undefined) {
      leg.error = destination.error ?? `未知站点“${destination.raw}”`;
    } else if (origin.query.toUpperCase() === destination.query.toUpperCase()) {
      leg.error = '起点和目的地相同';
    }
    legs.push(leg);
  }
  return { legs };
}

export function stopLines(text: string) {
  return text
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(x => x.length > 0);
}
