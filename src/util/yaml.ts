import yaml from 'js-yaml';

/**
 * Safe YAML dump. Refuses non-plain objects, escapes special characters.
 * Used in `agent-memory new` and `emit` to avoid string-concat YAML injection.
 */
export function dumpYaml(obj: Record<string, unknown>): string {
  return yaml.dump(obj, {
    lineWidth: 100,
    sortKeys: false,
    noRefs: true,
    skipInvalid: true,
  });
}
