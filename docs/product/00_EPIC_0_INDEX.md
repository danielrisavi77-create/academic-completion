# Epic 0 — Canonical Product Package

**Working product name:** Completion App  
**Status:** Canonical v0.1

## Purpose

Ovaj paket je source of truth prije stvaranja novog repoa i produkcijskog koda.

Tri proizvoda imaju odvojene odgovornosti:

- **Katedra:** hrvatski akademski content/writing intelligence.
- **Lekta:** deterministička provjera stvarnog dokumenta.
- **Completion App:** kontrola projekta, službena pravila, AI policy, blockeri, zadaci, mentor state i Next Best Action.

## Canonical documents

1. `01_PRODUCT_CONSTITUTION.md`
2. `02_MTK_SPEC.md`
3. `03_TECHNICAL_ARCHITECTURE.md`
4. `04_PROJECT_STATE_SCHEMA.md`
5. `05_AI_POLICY_SCHEMA.md`
6. `06_DATA_BOUNDARY.md`
7. `07_CLAUDE_CODE_CONTRACT.md`

## Rule of precedence

Ako dokumenti dođu u konflikt:

1. Product Constitution
2. Data Boundary
3. AI Policy Schema
4. MTK Spec
5. Project State Schema
6. Technical Architecture
7. Claude Code Contract

## Glavna hipoteza

> Student sa stvarnim završnim/diplomskim, stvarnim rokom i stvarnim blockerom platit će sustav koji drži projekt pod kontrolom i govori mu sljedeći najsigurniji potez, čak i ako već ima ChatGPT/Claude.

Sve što nije potrebno da testiramo ovu hipotezu ide kasnije.
