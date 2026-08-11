import { describe, it, expect } from "vitest";
import { AST_DETECTORS } from "../../src/scoring/ast-analyzer.js";
import type { ScoringInput } from "../../src/scoring/signals.js";
import { DEFAULT_NEXTJS_CONFIG } from "../../src/detector/default-config.js";

const danglingDetector = AST_DETECTORS.find(
  (d) => d.signal === "dangling_import_reference"
)!;

describe("AST Detector — dangling_import_reference", () => {
  it("triggers when an import is removed but the component is still referenced in JSX", () => {
    const patch = `
@@ -1,5 +1,4 @@
-import Header from "@/components/Header";
 import Footer from "@/components/Footer";

 export default function Home() {
   return (
     <div>
-      <Footer />
+      <Footer />
       <Header />
     </div>
   );
 }
`;

    const input: ScoringInput = {
      filePath: "app/dashboard/page.tsx",
      patch,
      status: "modified",
      allChangedPaths: ["app/dashboard/page.tsx"],
      config: DEFAULT_NEXTJS_CONFIG,
    };

    expect(danglingDetector.detect(input)).toBe(true);
  });

  it("does NOT trigger when an import is removed and its component is also removed", () => {
    const patch = `
@@ -1,5 +1,3 @@
-import Header from "@/components/Header";
 import Footer from "@/components/Footer";

 export default function Home() {
   return (
-    <Header />
   );
 }
`;

    const input: ScoringInput = {
      filePath: "app/dashboard/page.tsx",
      patch,
      status: "modified",
      allChangedPaths: ["app/dashboard/page.tsx"],
      config: DEFAULT_NEXTJS_CONFIG,
    };

    expect(danglingDetector.detect(input)).toBe(false);
  });

  it("does NOT trigger when an import path is simply updated (removed line + added line)", () => {
    const patch = `
@@ -1,4 +1,4 @@
-import Header from "@/components/Header";
+import Header from "@/components/v2/Header";

 export default function Home() {
   return <Header />;
 }
`;

    const input: ScoringInput = {
      filePath: "app/dashboard/page.tsx",
      patch,
      status: "modified",
      allChangedPaths: ["app/dashboard/page.tsx"],
      config: DEFAULT_NEXTJS_CONFIG,
    };

    expect(danglingDetector.detect(input)).toBe(false);
  });
});
