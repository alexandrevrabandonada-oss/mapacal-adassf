# T00c - Fix state and git

## DIAG
- Data/Hora: 2026-03-06 18:14:38
- PWD: C:\Projetos\Mapa Calçadas SF
- Arquivos-alvo encontrados:
  - tools/doctor.ps1: OK
  - tools/T00_state.ps1: OK

## PATCH
- Arquivos alterados:
  - tools/doctor.ps1
  - tools/T00_state.ps1
- Backups criados:
  - C:\Projetos\Mapa Calçadas SF\tools\_patch_backup\20260306-181434-doctor.ps1
  - C:\Projetos\Mapa Calçadas SF\tools\_patch_backup\20260306-181434-T00_state.ps1

## VERIFY
### `pwsh -NoProfile -ExecutionPolicy Bypass -File tools/doctor.ps1` (exit 0)
```text
# Doctor - Diagnostico do Ambiente

## Sistema
- Data/Hora: 2026-03-06 18:14:34
- OS: Microsoft Windows NT 10.0.26200.0

## Ferramentas
- git: git version 2.51.0.windows.1
- node: v22.19.0
- npm: 10.9.3
- pnpm: N/A
- vercel: 50.22.1
- supabase: N/A

## Repo
- git repo: OK
- branch: (sem commit inicial)
- status: 3 changes
```

### `pwsh -NoProfile -ExecutionPolicy Bypass -File tools/T00_state.ps1` (exit 0)
```text
Relatorio gerado: reports/2026-03-06-1814-T00-state.md
```

- Relatorio T00-state gerado: OK (C:\Projetos\Mapa Calçadas SF\reports\2026-03-06-1814-T00-state.md)

## NEXT
- T01 Scaffold Next PWA