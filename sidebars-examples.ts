import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * `/learn-by-examples` — learning AdeshLang through complete, runnable programs.
 *
 * The catalog is organized by language area; every page contains dedicated,
 * runnable programs with their verified terminal output and detailed breakdowns.
 */
const sidebars: SidebarsConfig = {
  examplesSidebar: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "learn-by-examples",
        "runnable-examples",
      ],
    },
    {
      type: "category",
      label: "Language Concepts",
      collapsed: false,
      items: [
        "basics",
        "control-flow",
        "functions",
        "collections",
        "oop",
        "enums",
        "error-handling",
        "defer-and-memory",
      ],
    },
    {
      type: "category",
      label: "Ecosystem & Algorithms",
      collapsed: false,
      items: [
        "concurrency",
        "standard-library",
        "dsa",
      ],
    },
  ],
};

export default sidebars;
