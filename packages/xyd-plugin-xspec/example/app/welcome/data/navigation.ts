import { NavItem } from "../types";

// This is a sample structure - expand with full navigation data
export const navigationData: NavItem[] = [
  {
    id: "sec-Getting-Started",
    label: "Getting Started",
    secid: "1",
    href: "#sec-Getting-Started",
  },
  {
    id: "sec-Markdown",
    label: "Markdown",
    secid: "2",
    href: "#sec-Markdown",
    hasToggle: true,
    children: [
      {
        id: "sec-Character-Encoding",
        label: "Character Encoding",
        secid: "2.1",
        href: "#sec-Character-Encoding",
        hasToggle: true,
        children: [
          {
            id: "sec-Escape-sequence",
            label: "Escape sequence",
            secid: "2.1.1",
            href: "#sec-Escape-sequence",
          },
        ],
      },
      {
        id: "sec-Inline-formatting",
        label: "Inline formatting",
        secid: "2.2",
        href: "#sec-Inline-formatting",
        hasToggle: true,
        children: [
          {
            id: "sec-Inline-HTML",
            label: "Inline HTML",
            secid: "2.2.1",
            href: "#sec-Inline-HTML",
          },
          {
            id: "sec-Links",
            label: "Links",
            secid: "2.2.2",
            href: "#sec-Links",
          },
          {
            id: "sec-Emphasis",
            label: "Emphasis",
            secid: "2.2.3",
            href: "#sec-Emphasis",
          },
          {
            id: "sec-Inline-Code",
            label: "Inline Code",
            secid: "2.2.4",
            href: "#sec-Inline-Code",
          },
          {
            id: "sec-Images",
            label: "Images",
            secid: "2.2.5",
            href: "#sec-Images",
          },
        ],
      },
      {
        id: "sec-Blocks",
        label: "Blocks",
        secid: "2.3",
        href: "#sec-Blocks",
        hasToggle: true,
        children: [
          {
            id: "sec-Block-HTML",
            label: "Block HTML",
            secid: "2.3.1",
            href: "#sec-Block-HTML",
          },
          {
            id: "sec-Blocks.Section-Headers",
            label: "Section Headers",
            secid: "2.3.2",
            href: "#sec-Blocks.Section-Headers",
          },
          {
            id: "sec-Paragraphs",
            label: "Paragraphs",
            secid: "2.3.3",
            href: "#sec-Paragraphs",
          },
          {
            id: "sec-Lists",
            label: "Lists",
            secid: "2.3.4",
            href: "#sec-Lists",
            hasToggle: true,
            children: [
              {
                id: "sec-Task-Lists",
                label: "Task Lists",
                secid: "2.3.4.1",
                href: "#sec-Task-Lists",
              },
            ],
          },
          {
            id: "sec-Code-Block",
            label: "Code Block",
            secid: "2.3.5",
            href: "#sec-Code-Block",
          },
          {
            id: "sec-Block-Quotes",
            label: "Block Quotes",
            secid: "2.3.6",
            href: "#sec-Block-Quotes",
          },
          {
            id: "sec-Horizontal-Rules",
            label: "Horizontal Rules",
            secid: "2.3.7",
            href: "#sec-Horizontal-Rules",
          },
          {
            id: "sec-Automatic-Links",
            label: "Automatic Links",
            secid: "2.3.8",
            href: "#sec-Automatic-Links",
          },
        ],
      },
    ],
  },
  {
    id: "sec-Spec-Additions",
    label: "Spec Additions",
    secid: "3",
    href: "#sec-Spec-Additions",
    hasToggle: true,
    children: [
      {
        id: "sec-Link-Anything",
        label: "Link Anything",
        secid: "3.1",
        href: "#sec-Link-Anything",
      },
      {
        id: "sec-Title-and-Introduction",
        label: "Title and Introduction",
        secid: "3.2",
        href: "#sec-Title-and-Introduction",
      },
      {
        id: "sec-Sections",
        label: "Sections",
        secid: "3.3",
        href: "#sec-Sections",
        hasToggle: true,
        children: [
          {
            id: "sec-Sections.Section-Headers",
            label: "Section Headers",
            secid: "3.3.1",
            href: "#sec-Sections.Section-Headers",
          },
          {
            id: "sec-Subsection-Headers",
            label: "Subsection Headers",
            secid: "3.3.2",
            href: "#sec-Subsection-Headers",
          },
          {
            id: "sec-Table-of-Contents",
            label: "Table of Contents",
            secid: "3.3.3",
            href: "#sec-Table-of-Contents",
          },
          {
            id: "sec-Section-Numbers",
            label: "Section Numbers",
            secid: "3.3.4",
            href: "#sec-Section-Numbers",
            hasToggle: true,
            children: [
              {
                id: "sec-Custom-Numbers",
                label: "Custom Numbers",
                secid: "3.3.4.8",
                href: "#sec-Custom-Numbers",
              },
              {
                id: "sec-Appendix-Annex-Sections",
                label: "Appendix / Annex Sections",
                secid: "3.3.4.9",
                href: "#sec-Appendix-Annex-Sections",
              },
            ],
          },
        ],
      },
      // Add more sections as needed...
    ],
  },
  // Add appendix sections
  {
    id: "sec-Using-Spec-Markdown",
    label: "Using Spec Markdown",
    secid: "A",
    href: "#sec-Using-Spec-Markdown",
    hasToggle: true,
    children: [
      {
        id: "sec-Print-Options",
        label: "Print Options",
        secid: "A.1",
        href: "#sec-Print-Options",
      },
      {
        id: "sec-Hot-rebuilding-with-nodemon",
        label: "Hot rebuilding with nodemon",
        secid: "A.2",
        href: "#sec-Hot-rebuilding-with-nodemon",
      },
    ],
  },
  {
    id: "sec-Contributing-to-Spec-Markdown",
    label: "Contributing to Spec Markdown",
    secid: "B",
    href: "#sec-Contributing-to-Spec-Markdown",
    hasToggle: true,
    children: [
      {
        id: "sec-Pull-Requests",
        label: "Pull Requests",
        secid: "B.1",
        href: "#sec-Pull-Requests",
      },
      {
        id: "sec--main-is-unsafe",
        label: "`main` is unsafe",
        secid: "B.2",
        href: "#sec--main-is-unsafe",
      },
      {
        id: "sec-Issues",
        label: "Issues",
        secid: "B.3",
        href: "#sec-Issues",
      },
      {
        id: "sec-Coding-Style",
        label: "Coding Style",
        secid: "B.4",
        href: "#sec-Coding-Style",
      },
      {
        id: "sec-License",
        label: "License",
        secid: "B.5",
        href: "#sec-License",
      },
    ],
  },
];
