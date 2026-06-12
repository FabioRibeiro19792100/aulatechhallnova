import { describe, expect, it } from "vitest";
import {
  AGENT_DEMO_INBOX,
  buildAgentDemoResult,
  createDefaultAgentMissionState,
  normalizeAgentMissionState,
} from "../src/data/agentMission.js";

describe("agent mission demo flow", () => {
  it("builds a deterministic result with all expected sections", () => {
    const result = buildAgentDemoResult({
      agentType: "inbox",
      objective: "pending_messages",
      dataSource: "demo",
      capabilities: ["read_messages", "identify_pending", "recommend_priorities"],
      permissions: ["read", "classify", "summarize", "recommend"],
    });

    expect(result.inboxSize).toBe(AGENT_DEMO_INBOX.length);
    expect(result.recurringThemes.length).toBeGreaterThan(0);
    expect(result.attentionMessages.length).toBeGreaterThan(0);
    expect(result.frequentContacts.length).toBeGreaterThan(0);
    expect(result.possiblePriorities.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("normalizes partial persisted state without losing defaults", () => {
    const normalized = normalizeAgentMissionState({
      currentStep: "composer",
      agentOnboardingCompleted: true,
      agentDraft: {
        objective: "weekly_summary",
      },
    });

    expect(normalized.currentStep).toBe("composer");
    expect(normalized.agentOnboardingCompleted).toBe(true);
    expect(normalized.agentDraft.agentType).toBe(createDefaultAgentMissionState().agentDraft.agentType);
    expect(normalized.agentDraft.objective).toBe("weekly_summary");
    expect(normalized.agentDraft.capabilities.length).toBeGreaterThan(0);
  });
});
