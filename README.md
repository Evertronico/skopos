# Skopos

PWA de acompanhamento físico e de saúde: registra medidas antropométricas, planos de nutrição/hidratação/sono e treinos, tudo **local no dispositivo**, com backup opcional para o Google Drive. Sem backend — hospedado como site estático no GitHub Pages, com atualização automática a cada release.

## Funcionalidades

- **Perfil**: data de nascimento, sexo, tipo sanguíneo, objetivos.
- **Medidas antropométricas**: peso, % gordura, circunferências, IMC — histórico ao longo do tempo.
- **Planos personalizados**: metas de nutrição, hidratação e sono calculadas a partir do perfil e do objetivo.
- **Plano de treino**: exercícios com séries, repetições, carga e descanso planejados; registro diário do que foi executado de fato (permite medir aderência).
- **Dashboard**: gráfico de teia (radar) que cruza todas as dimensões (treino, hidratação, sono, nutrição, evolução de medidas) e mostra se o usuário está evoluindo em direção às metas.
- **Backup/restauração**: exporta o banco local para o Google Drive (`.sqlite` ou `.json`), sem enviar dados a nenhum outro servidor.
- **Atualização automática**: novas versões publicadas no GitHub são detectadas e aplicadas automaticamente pelo Service Worker.

## Arquitetura

| Camada | Escolha |
|---|---|
| Framework | Vite + React |
| PWA / Service Worker | `vite-plugin-pwa` |
| Armazenamento local | SQLite via WASM (`sql.js`) em memória, persistido como blob no IndexedDB (`idb-keyval`) |
| Gráficos | Chart.js (radar) |
| Backup | Google Drive API, escopo `drive.appdata`, autenticação via Google Identity Services (client-side, sem servidor) |
| Deploy | GitHub Actions → GitHub Pages |

Todos os dados vivem no navegador do usuário. O backup no Google Drive é opcional e só ocorre quando o usuário autoriza explicitamente o acesso à pasta oculta do app (`appDataFolder`) — nenhum outro dado do Drive é acessado.

## Modelo de dados (resumo)

- `perfil` — dados pessoais e objetivo
- `medidas_antropometricas` — histórico de medidas
- `planos_nutricionais`, `planos_hidratacao`, `planos_sono` — metas calculadas
- `planos_treino` → `exercicios_do_plano` — o que está planejado
- `registros_treino_diario` → `execucoes_exercicio` — o que foi executado de fato

## Rodando localmente

```bash
npm install
npm run dev
```

## Build e deploy

Push na branch `main` dispara o workflow do GitHub Actions, que builda o app e publica no GitHub Pages. O Service Worker detecta a nova versão e atualiza o app automaticamente no dispositivo do usuário.

## Status

🚧 Em desenvolvimento.
