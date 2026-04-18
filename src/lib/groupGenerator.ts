import { Student, ExclusionRule } from "@/types";

export interface GroupGeneratorOptions {
  students: Student[];
  mode: "size" | "count";
  groupSize: number;
  groupCount: number;
  exclusions: ExclusionRule[];
}

export interface GroupGeneratorResult {
  groups: string[][];
  stats: {
    totalStudents: number;
    groupCount: number;
    avgSize: number;
    iterations: number;
  };
}

/**
 * Generates random groups from a list of students, respecting exclusion rules.
 * Returns student IDs in each group.
 */
export function generateGroups(opts: GroupGeneratorOptions): GroupGeneratorResult {
  const { students, mode, groupSize, groupCount, exclusions } = opts;
  const studentIds = students.map((s) => s.id);
  const n = studentIds.length;

  if (n === 0) {
    return { groups: [], stats: { totalStudents: 0, groupCount: 0, avgSize: 0, iterations: 0 } };
  }

  const targetCount = mode === "count" ? groupCount : Math.ceil(n / groupSize);

  const MAX_ATTEMPTS = 500;
  let bestGroups: string[][] = [];
  let bestViolations = Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffled = shuffle([...studentIds]);
    const groups: string[][] = Array.from({ length: targetCount }, () => []);

    // Distribute students round-robin
    shuffled.forEach((id, i) => {
      groups[i % targetCount].push(id);
    });

    const violations = countViolations(groups, exclusions);
    if (violations < bestViolations) {
      bestViolations = violations;
      bestGroups = groups;
    }
    if (violations === 0) break;
  }

  return {
    groups: bestGroups,
    stats: {
      totalStudents: n,
      groupCount: bestGroups.length,
      avgSize: n / bestGroups.length,
      iterations: Math.min(MAX_ATTEMPTS, bestViolations === 0 ? 1 : MAX_ATTEMPTS),
    },
  };
}

function countViolations(groups: string[][], exclusions: ExclusionRule[]): number {
  let violations = 0;
  for (const group of groups) {
    const groupSet = new Set(group);
    for (const rule of exclusions) {
      const inGroup = rule.studentIds.filter((id) => groupSet.has(id));
      if (inGroup.length >= 2) violations++;
    }
  }
  return violations;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Resolve student IDs → display names. */
export function resolveStudentNames(
  ids: string[],
  students: Student[]
): string[] {
  return ids.map((id) => {
    const s = students.find((st) => st.id === id);
    return s ? `${s.firstName} ${s.lastName}`.trim() : id;
  });
}
