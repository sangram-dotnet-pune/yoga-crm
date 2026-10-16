import { apiFetch } from "./api";
import type { Outcomes, OutcomeRange } from "./types";

export function getOutcomes(range: OutcomeRange): Promise<Outcomes> {
  return apiFetch<Outcomes>(`/outcomes?range=${range}`);
}
