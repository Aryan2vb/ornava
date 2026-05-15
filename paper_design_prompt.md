# Ornava Design Access Prompt for Codex

Use Paper MCP to get the Brilliant elm design details:

## Command
```
paper_get_basic_info
```

## Project Context (from AGENTS.md)

**Product**: AI-powered jewelry catalog image generator for Indian jewelers/wholesalers

**8 Screens**:
1. **Onboarding** - Welcome → Upload → Preview (90 sec to first generation)
2. **Home Dashboard** - Credits bar, image grid, FAB
3. **Upload Flow** - Drag-drop, file validation
4. **Mode Select** - On-Model / Studio / Close-Up
5. **Results** - Before/after slider, download, WhatsApp share
6. **Batch Processing** - Multi-select (up to 50), queue status
7. **Catalog Builder** - Layout templates (2x2, 3x3, story), export PDF/WhatsApp
8. **Profile & Billing** - Credits, plans, purchase

**Design Specs**:
- Base: Mobile 390×844px
- Colors: Gold #B8860B, Dark #1A1A1A, Cream #F5F5DC
- Font: System default (clean, luxury aesthetic)

**Notes**:
- Mobile-first UI (WhatsApp-native)
- All outputs optimized for immediate sharing
- Navigation bar on all screens except Onboarding

## Request

Please return:
1. File name and page count
2. List of all artboards with their dimensions
3. For each screen/artboard: node count and any relevant grouping
4. Any design system elements (colors, components, styles) defined in the file

This will help build the Phase 1 UI implementation matching the PRD specs in `phase1_prd_slice.md` and `prd.md`.