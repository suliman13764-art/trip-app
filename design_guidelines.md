{
  "design_personality": {
    "brand_attributes": [
      "trustworthy",
      "operationally precise",
      "calm under pressure",
      "audit-friendly",
      "accessible by default"
    ],
    "visual_style": {
      "direction": "Swiss-style clarity + modern bento dashboard",
      "notes": [
        "No marketing gloss; this is an internal daily tool.",
        "Prioritize legibility, error prevention, and step-by-step confidence.",
        "Use subtle depth (1–2 shadow levels) and clear sectioning; avoid transparent/glass backgrounds.",
        "Map is the ‘visual truth’; tables/text are the ‘audit truth’. Keep both visible on desktop."
      ]
    }
  },

  "typography": {
    "font_pairing": {
      "heading": {
        "family": "Space Grotesk",
        "google_fonts_import": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
        "usage": "Page titles, step headers, KPI labels"
      },
      "body": {
        "family": "Inter",
        "google_fonts_import": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
        "usage": "All body text, tables, form labels"
      },
      "mono": {
        "family": "IBM Plex Mono",
        "google_fonts_import": "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap",
        "usage": "Timestamps, route/run numbers, debug distances"
      }
    },
    "tailwind_text_hierarchy": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-lg font-semibold tracking-tight",
      "kpi_value": "text-2xl font-semibold tabular-nums",
      "body": "text-sm md:text-base leading-6",
      "small": "text-xs text-muted-foreground",
      "mono": "font-mono text-xs md:text-sm"
    },
    "content_rules": [
      "Use tabular numbers for times/durations: add `tabular-nums` on KPI values.",
      "Never center-align long text blocks; left align for scanning.",
      "Use sentence case for labels; Title Case only for page title."
    ]
  },

  "color_system": {
    "intent": "Muted teal + slate neutrals for long-session readability; warm sand background to reduce glare.",
    "tokens_hsl_for_index_css": {
      "background": "38 33% 97%",
      "foreground": "222 47% 11%",
      "card": "0 0% 100%",
      "card-foreground": "222 47% 11%",
      "popover": "0 0% 100%",
      "popover-foreground": "222 47% 11%",

      "primary": "186 72% 28%",
      "primary-foreground": "0 0% 100%",

      "secondary": "210 20% 96%",
      "secondary-foreground": "222 47% 11%",

      "muted": "210 20% 96%",
      "muted-foreground": "215 16% 40%",

      "accent": "186 45% 92%",
      "accent-foreground": "186 72% 18%",

      "destructive": "0 72% 51%",
      "destructive-foreground": "0 0% 100%",

      "border": "214 20% 88%",
      "input": "214 20% 88%",
      "ring": "186 72% 28%",

      "chart-1": "186 72% 28%",
      "chart-2": "160 55% 34%",
      "chart-3": "43 74% 52%",
      "chart-4": "210 10% 45%",
      "chart-5": "14 70% 52%",

      "radius": "0.75rem"
    },
    "semantic_extensions_css_vars": {
      "--success": "160 55% 34%",
      "--success-foreground": "0 0% 100%",
      "--warning": "43 74% 52%",
      "--warning-foreground": "222 47% 11%",
      "--info": "199 78% 40%",
      "--info-foreground": "0 0% 100%",
      "--surface": "0 0% 100%",
      "--surface-2": "210 20% 96%",
      "--ink": "222 47% 11%"
    },
    "usage_rules": [
      "Primary teal is for actions (Run analysis, Generate text, Copy).",
      "Use semantic colors only with icon + label (never color alone).",
      "Keep map overlays high-contrast: teal route, amber markers, slate labels.",
      "Avoid large gradients; prefer solid surfaces."
    ],
    "gradients_and_texture": {
      "allowed": [
        "Very subtle header background only (<= 15% viewport height).",
        "Decorative 1px–2px top border gradient on header or stepper rail."
      ],
      "safe_gradient_examples": [
        "bg-[radial-gradient(1200px_circle_at_20%_0%,hsl(186_45%_92%)_0%,transparent_55%)]",
        "bg-[linear-gradient(90deg,hsl(186_72%_28%/.12),transparent_35%,hsl(43_74%_52%/.10))]"
      ],
      "noise_overlay": {
        "css": ".noise { background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>'); }")
      }
    }
  },

  "layout_and_grid": {
    "page_structure": {
      "desktop": "Two-column: left = workflow + results; right = map + debug tabs.",
      "mobile": "Single column with sticky stepper header; map collapses into an accordion panel."
    },
    "container": {
      "max_width": "max-w-7xl",
      "padding": "px-4 sm:px-6 lg:px-8",
      "section_spacing": "py-6 md:py-8",
      "card_spacing": "p-4 md:p-6",
      "bento_grid": "grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6"
    },
    "recommended_regions": [
      {
        "name": "Top header",
        "cols": "lg:col-span-12",
        "content": "Title, run context (date/timezone), status chips"
      },
      {
        "name": "Workflow stepper + inputs",
        "cols": "lg:col-span-5",
        "content": "Upload, Home zone, Parameters, Run"
      },
      {
        "name": "Map",
        "cols": "lg:col-span-7",
        "content": "Leaflet map with route + home circle + markers"
      },
      {
        "name": "Results overview",
        "cols": "lg:col-span-12",
        "content": "KPIs, segments table, correction text panel"
      }
    ]
  },

  "core_workflow_ui": {
    "stepper": {
      "pattern": "4-step guided workflow with completion states",
      "steps": [
        "1. Upload files",
        "2. Set home zone",
        "3. Parameters",
        "4. Run & review"
      ],
      "component": "Use Tabs as stepper (shadcn Tabs) + progress rail",
      "interaction": [
        "Disable later steps until prerequisites are met.",
        "Show inline validation summary at top of each step.",
        "Persist selected files and home zone in React state only (v1 stateless)."
      ],
      "data_testids": {
        "stepper": "workflow-stepper",
        "step_upload": "workflow-step-upload",
        "step_home": "workflow-step-home-zone",
        "step_params": "workflow-step-parameters",
        "step_run": "workflow-step-run-review"
      }
    },

    "step_1_upload": {
      "layout": "Two upload cards side-by-side on desktop; stacked on mobile.",
      "components": [
        "Card",
        "Button",
        "Input (type=file)",
        "Alert",
        "Progress",
        "Table (preview first 10 rows)"
      ],
      "ux_details": [
        "Show file type hints: GPS (CSV/XLSX), WebTrack (XLSX/PDF-to-XLSX).",
        "After upload, show a small preview table and detected timestamp format.",
        "If headers missing: show ‘Auto-detected columns’ badge and a collapsible mapping preview (read-only in v1)."
      ],
      "empty_states": [
        "GPS missing: show Alert with action ‘Upload GPS file’.",
        "WebTrack missing: show Alert with action ‘Upload WebTrack report’."
      ],
      "data_testids": {
        "gps_upload_input": "gps-file-input",
        "webtrack_upload_input": "webtrack-file-input",
        "gps_preview_table": "gps-preview-table",
        "webtrack_preview_table": "webtrack-preview-table"
      }
    },

    "step_2_home_zone": {
      "components": [
        "Input",
        "Button",
        "Slider",
        "Badge",
        "Tooltip",
        "Popover (for help)"
      ],
      "address_search": {
        "rule": "Nominatim must run in browser only (no backend calls).",
        "ui": "Search input + results list (Command component) + ‘Use this address’ button.",
        "data_testids": {
          "address_search_input": "home-address-search-input",
          "address_search_results": "home-address-search-results",
          "address_use_button": "home-address-use-button"
        }
      },
      "map_interaction": [
        "Click map to set home zone center.",
        "Show a pinned marker at center + radius circle.",
        "Show ‘Last click coordinates’ in mono text (copyable)."
      ],
      "radius": {
        "default_m": 300,
        "range_m": [200, 500],
        "slider_marks": [200, 300, 400, 500],
        "data_testids": {
          "radius_slider": "home-zone-radius-slider",
          "radius_value": "home-zone-radius-value"
        }
      },
      "dwell": {
        "default_minutes": 10,
        "control": "Input (number) + helper text",
        "data_testids": {
          "dwell_input": "home-zone-dwell-minutes-input"
        }
      }
    },

    "step_3_parameters": {
      "components": [
        "Switch",
        "Input",
        "Select",
        "Tooltip",
        "Accordion"
      ],
      "parameters": [
        "Stable detection points (outside/inside): default 3",
        "Timezone display: CET/CEST (read-only label)",
        "Fallback end-time method toggles (show what will be used)"
      ],
      "data_testids": {
        "stable-points-input": "stable-points-input",
        "timezone-label": "timezone-label"
      }
    },

    "step_4_run_review": {
      "primary_actions": [
        "Run analysis",
        "Generate correction text",
        "Copy to clipboard"
      ],
      "components": [
        "Button",
        "Sonner (toast)",
        "Alert",
        "Tabs",
        "Table",
        "Textarea",
        "Badge",
        "Separator",
        "ScrollArea"
      ],
      "data_testids": {
        "run-analysis-button": "run-analysis-button",
        "generate-text-button": "generate-correction-text-button",
        "copy-text-button": "copy-correction-text-button",
        "correction-textarea": "correction-request-textarea"
      }
    }
  },

  "results_dashboard": {
    "kpi_cards": {
      "layout": "Bento row of 4 cards (wrap to 2x2 on tablet, 1x4 on mobile).",
      "kpis": [
        "Start time (first valid departure)",
        "End time (first valid return)",
        "Total working time",
        "Segments count"
      ],
      "component": "Card + Badge for confidence (Exact/Estimated)",
      "data_testids": {
        "kpi-start": "kpi-start-time",
        "kpi-end": "kpi-end-time",
        "kpi-total": "kpi-total-working-time",
        "kpi-segments": "kpi-segments-count"
      }
    },
    "segments_list": {
      "component": "Table with expandable rows (Collapsible) for segment details",
      "columns": [
        "Segment #",
        "Depart (time)",
        "Return (time)",
        "Duration",
        "Stops",
        "Run #",
        "Confidence"
      ],
      "row_actions": [
        "Highlight on map",
        "Copy segment summary"
      ],
      "data_testids": {
        "segments-table": "segments-table",
        "segment-highlight-button": "segment-highlight-button"
      }
    },
    "correction_text_panel": {
      "pattern": "Right-aligned utility panel with sticky copy button on desktop; full-width on mobile.",
      "must_be_danish": true,
      "formatting": [
        "Use clear headings and bullet points.",
        "Include explanation of logic and any estimates.",
        "Never output 'unknown: None' — replace with 'Ikke oplyst' or omit field."
      ]
    },
    "quality_debug_panel": {
      "pattern": "Tabs: Quality checks | Raw detections | Distances",
      "show": [
        "Closest distance to home zone",
        "Detected inside/outside streaks",
        "Why end time chosen (primary/secondary/fallback)",
        "Missing data warnings"
      ],
      "component": "Tabs + ScrollArea + Table",
      "data_testids": {
        "debug-tabs": "debug-tabs",
        "debug-closest-distance": "debug-closest-distance"
      }
    }
  },

  "map_design_leaflet": {
    "visual_rules": [
      "Map container must be a solid surface card (no transparency).",
      "Keep controls minimal; add a small legend overlay.",
      "Use distinct marker shapes/colors for depart vs return."
    ],
    "overlay_styles": {
      "route_polyline": {
        "color": "hsl(186 72% 28%)",
        "weight": 4,
        "opacity": 0.9
      },
      "segment_highlight": {
        "color": "hsl(43 74% 52%)",
        "weight": 6,
        "opacity": 0.95
      },
      "home_circle": {
        "stroke": "hsl(186 72% 28% / 0.9)",
        "fill": "hsl(186 45% 92% / 0.55)",
        "weight": 2
      },
      "markers": {
        "depart": "amber",
        "return": "teal",
        "estimated": "slate"
      }
    },
    "legend_overlay": {
      "tailwind": "absolute bottom-3 left-3 z-[500] rounded-lg border bg-card/100 p-3 shadow-sm",
      "content": [
        "Route",
        "Home zone",
        "Depart",
        "Return",
        "Estimated"
      ]
    },
    "data_testids": {
      "map": "gps-map",
      "map-set-home-hint": "map-set-home-hint"
    }
  },

  "components_and_paths": {
    "shadcn_primary": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "alert": "/app/frontend/src/components/ui/alert.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "slider": "/app/frontend/src/components/ui/slider.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "collapsible": "/app/frontend/src/components/ui/collapsible.jsx",
      "command": "/app/frontend/src/components/ui/command.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "sonner": "/app/frontend/src/components/ui/sonner.jsx"
    },
    "recommended_new_components_js": [
      {
        "name": "WorkflowStepper",
        "path": "/app/frontend/src/components/WorkflowStepper.js",
        "notes": "Wrap shadcn Tabs into a stepper with completion + disabled states."
      },
      {
        "name": "FileDropzoneCard",
        "path": "/app/frontend/src/components/FileDropzoneCard.js",
        "notes": "Use Input type=file + drag-over state; show preview table + validation."
      },
      {
        "name": "HomeZoneControls",
        "path": "/app/frontend/src/components/HomeZoneControls.js",
        "notes": "Address search (Command list) + radius slider + dwell input."
      },
      {
        "name": "ResultsKPIGrid",
        "path": "/app/frontend/src/components/ResultsKPIGrid.js",
        "notes": "4 KPI cards with confidence badges."
      },
      {
        "name": "CorrectionTextPanel",
        "path": "/app/frontend/src/components/CorrectionTextPanel.js",
        "notes": "Textarea + sticky copy button + ‘generated at’ timestamp."
      },
      {
        "name": "QualityDebugPanel",
        "path": "/app/frontend/src/components/QualityDebugPanel.js",
        "notes": "Tabs with tables; show closest distance + detection streaks."
      }
    ]
  },

  "buttons": {
    "style": "Professional / Corporate",
    "tokens": {
      "--btn-radius": "12px",
      "--btn-shadow": "0 1px 0 rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)",
      "--btn-press-scale": "0.98"
    },
    "variants": {
      "primary": "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary)/0.92)] focus-visible:ring-2 focus-visible:ring-ring",
      "secondary": "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary)/0.85)]",
      "ghost": "hover:bg-accent hover:text-accent-foreground"
    },
    "micro_interactions": [
      "Hover: subtle lift via shadow change (not transform on container).",
      "Active: scale down only on the button element (press feedback).",
      "Loading: show spinner + disable; toast on completion."
    ]
  },

  "motion_and_microinteractions": {
    "library": {
      "name": "framer-motion",
      "install": "npm i framer-motion",
      "usage": [
        "Step transitions (fade/slide 8–12px)",
        "KPI cards entrance (stagger 40ms)",
        "Alert appearance (height + opacity)"
      ]
    },
    "principles": [
      "Duration 160–220ms for UI transitions.",
      "Use `prefers-reduced-motion` to disable non-essential motion.",
      "Never use `transition: all`; target color/shadow/opacity only."
    ],
    "scroll_behavior": [
      "On Run analysis success: auto-scroll to Results anchor (smooth) and briefly highlight KPI grid with a 1.5s outline pulse."
    ]
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for all text.",
      "Keyboard navigation for stepper, tables, and map controls.",
      "Visible focus ring using `ring` token.",
      "Touch targets >= 44px for primary actions.",
      "Use icons + text for statuses; never color-only."
    ],
    "aria_and_labels": [
      "All file inputs must have associated Label.",
      "Map must have an accessible name and a text alternative summary of selected home zone coordinates/radius.",
      "Correction textarea must be labeled and selectable."
    ]
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
    "examples": [
      "data-testid=\"run-analysis-button\"",
      "data-testid=\"home-zone-radius-slider\"",
      "data-testid=\"segments-table\"",
      "data-testid=\"correction-request-textarea\""
    ]
  },

  "image_urls": {
    "optional_header_image": [
      {
        "url": "https://images.unsplash.com/photo-1632121484846-3d3e9069834d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBvcGVyYXRpb25zJTIwbWFwJTIwcGxhbm5pbmd8ZW58MHx8fHRlYWx8MTc3NTE1MDk4Nnww&ixlib=rb-4.1.0&q=85",
        "category": "header",
        "description": "Small, subtle header illustration (use as 48–72px tall thumbnail only)."
      }
    ],
    "empty_state_illustrations": [
      {
        "url": "https://images.unsplash.com/photo-1586448681913-2fc1b29c5cca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxsb2dpc3RpY3MlMjBkYXNoYm9hcmQlMjBtYXAlMjBzY3JlZW58ZW58MHx8fGJsdWV8MTc3NTE1MDk4OXww&ixlib=rb-4.1.0&q=85",
        "category": "empty-state",
        "description": "Use as blurred background in empty state card (very low opacity), not as a hero image."
      }
    ]
  },

  "instructions_to_main_agent": [
    "Replace CRA default App.css centering header styles; do not center the app container.",
    "Update /app/frontend/src/index.css :root HSL tokens to match the provided muted teal/sand/slate system.",
    "Implement single-page workflow with a stepper (Tabs) and clear prerequisites.",
    "Use Leaflet map inside a Card; add legend overlay and click-to-set-home behavior.",
    "Ensure correction request output is Danish; UI labels are English.",
    "Add Sonner toasts for: file parsed, address selected, analysis complete, copy success, errors.",
    "Every button/input/table/textarea and KPI value must include data-testid.",
    "Avoid gradients except subtle header decoration (<= 15% viewport height).",
    "No transparent backgrounds; use solid card surfaces."
  ],

  "component_path": {
    "shadcn_ui_dir": "/app/frontend/src/components/ui/",
    "note": "Use existing .jsx shadcn components; create new components as .js (not .tsx)."
  },

  "general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
