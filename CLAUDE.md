# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Analyze historical FIFA World Cup data and predict match outcomes for the 2026 World Cup (Canada/Mexico/USA). Uses ML algorithms and statistical analysis on match history from 1930–2022.

Live standings reference: https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/standings

## Dataset (`./dataset/`)

- `matches_1930_2022.csv` — All match results 1930–2022 (~692 KB, 64+ columns). Includes scores, managers, captains, attendance, venue, goals, cards, substitutions, and penalty shootout data. Most recent row: Argentina vs France (2022 Final).
- `fifa_ranking_2022-10-06.csv` — FIFA team rankings just before Qatar 2022.
- `world_cup.csv` — Tournament-level summaries for all 22 World Cups (year, host, champion, runner-up, top scorer, attendance).

## Environment

No build system is configured yet. This is a Python data science project. When setting up:

```bash
pip install pandas numpy scikit-learn matplotlib seaborn
python <script>.py
```

Use the `data-analyst` and `data-scientist` skills for analysis and modeling tasks.

## Github

- Main branch: `main`
- Feature branches: `feature/<description>`
- Pull requests: Open PRs for code review before merging to main.
- Issues: Use Issues to track bugs, tasks, and feature requests.
- README.md: Include setup instructions, project overview, and usage guidelines.
- .gitignore: Ignore `__pycache__/`, `.env`, and any large data files.
