import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * `/learn` — the guided path to learning AdeshLang.
 *
 * The items are ordered intentionally: follow the sidebar from top to bottom
 * as a reading path. It starts with orientation, moves through setup, and then
 * steps through every core concept in small, runnable lessons.
 */
const sidebars: SidebarsConfig = {
  learnSidebar: [
    'learn-programming',
    {
      type: 'category',
      label: 'Start Here',
      items: [
        'getting-started/quick-start',
        'getting-started/installation',
        'getting-started/first-program',
        'hello-world',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'variables',
        'conditionals',
        'loops',
        'functions',
        'collections',
        'calculator',
        'strings',
        'types',
      ],
    },
    {
      type: 'category',
      label: 'Modeling Data',
      items: [
        'structs-enums',
        'oop',
        'error-handling',
      ],
    },
    {
      type: 'category',
      label: 'Going Deeper',
      items: [
        'memory-safety',
        'async-concurrency',
      ],
    },
    {
      type: 'category',
      label: 'Standard Library & Real World',
      items: [
        'stdlib-tour',
        'capstone',
      ],
    },
  ],
};

export default sidebars;
