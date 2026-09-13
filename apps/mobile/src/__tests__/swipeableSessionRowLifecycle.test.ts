import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/session/SwipeableSessionRow.tsx"),
  "utf8",
);

describe("SwipeableSessionRow native animation lifecycle", () => {
  it("uses Reanimated Swipeable for synchronous gesture-driven layout", () => {
    expect(source).toContain("ReanimatedSwipeable as Swipeable");
    expect(source).toMatch(/from ["']react-native-reanimated["']/);
    expect(source).not.toContain("ClassicSwipeable as Swipeable");
  });

  it("uses the release position and keeps expansion on the UI thread", () => {
    expect(source).toContain("const translation = translationRef.current;");
    expect(source).toContain("if (translation.value >= fullSwipeThreshold)");
    expect(source).toContain("if (-translation.value >= fullSwipeThreshold)");
    expect(source).toContain("onSwipeableWillOpen={handleWillOpen}");
    expect(source).not.toContain("peakTranslationRef");
  });

  it("keeps the action shells fixed while the action width expands", () => {
    expect(source).toContain("<View style={styles.rightShell}>");
    expect(source).toContain("<View style={styles.pinShell}>");
    expect(source).toContain("width: LEFT_PANEL_WIDTH");
    expect(source).toContain("width: RIGHT_PANEL_WIDTH");
    expect(source).toContain(
      "width: Math.max(BUTTON_SIZE, revealed - BUTTON_GAP * 2)",
    );
    expect(source).toMatch(
      /width:\s*BUTTON_SIZE\s*\+\s*Math.max\(0, revealed - BUTTON_GAP \* 2 - BUTTON_SIZE\)\s*\*\s*armedProgress.value/,
    );
    expect(source).not.toContain("scaleX");
  });

  it("preserves action spacing and fixed outer anchors", () => {
    expect(source).toMatch(
      /right: Math.max\(\s*BUTTON_GAP \* 2 \+ BUTTON_SIZE,\s*revealed - BUTTON_SIZE - BUTTON_GAP,?\s*\)/,
    );
    expect(source).toMatch(/archiveButton:\s*\{[^}]*right: BUTTON_GAP,/);
    expect(source).toMatch(/pinButton:\s*\{[^}]*left: BUTTON_GAP,/);
  });

  it("resets recycled rows and avoids starting idle mount animations", () => {
    expect(source).toContain("methodsRef.current?.reset();");
    expect(source).toContain("translationRef.current = null;");
    expect(source).toContain("registry.onRowClose(rowKey);");
    expect(source).toMatch(
      /if \(previous === null\)\s*\{\s*armedProgress.value = next \? 1 : 0;\s*return;/,
    );
    expect(source).toMatch(
      /if \(next !== previous\)\s*\{\s*armedProgress.value = withTiming/,
    );
  });
});
