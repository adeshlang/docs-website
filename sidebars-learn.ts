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
        'operators',
        'conditionals',
        'loops',
        'functions',
        'higher-order-functions',
        'recursion',
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
        'manual-memory',
        'generics-data-structures',
        'modules-imports',
        'input-timers',
        'async-concurrency',
      ],
    },
    {
      type: 'category',
      label: 'Standard Library & Real World',
      items: [
        'testing',
        'stdlib-tour',
        'stdlib-2',
        'networking',
        'performance',
        'capstone',
      ],
    },
  ],
};

export default sidebars;
