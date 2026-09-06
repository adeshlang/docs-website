import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * `/learn-by-examples` — learning AdeshLang through complete, runnable programs.
 *
 * The catalog is organized by language area; every page contains a single
 * master program with its verified terminal output and a breakdown of the
 * constructs it demonstrates.
 */
const sidebars: SidebarsConfig = {
  examplesSidebar: [
    'learn-by-examples',
    'runnable-examples',
  ],
};

export default sidebars;
