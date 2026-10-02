// Status colors for node states. Always shown next to the state name, never alone.
const STATE_COLORS: [RegExp, string][] = [
  [/render/i, '#0ca30c'],
  [/error|crash|fail|stop|hang|offline/i, '#d03b3b'],
  [/idle|wait|start/i, '#8b8e94'],
];

export const stateColor = (state: string): string => {
  const match = STATE_COLORS.find(([pattern]) => pattern.test(state || ''));
  return match ? match[1] : '#fab219';
};
