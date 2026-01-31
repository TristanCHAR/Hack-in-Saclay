# Hackaton API

API REST avec Express + SQLite pour le suivi de crises, traitements et tests cognitifs.

## Setup

```bash
pnpm install
pnpm rebuild better-sqlite3
```

## Scripts

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur avec hot reload (tsx watch) |
| `pnpm build` | Compilation TypeScript vers `dist/` |
| `pnpm start` | Lancement du build compilé |

Le serveur démarre sur `http://localhost:3000` (configurable via `PORT`).

La base SQLite (`data.db`) est créée automatiquement à la racine au premier lancement.

---

## Endpoints

Toutes les routes acceptent et retournent du JSON (`Content-Type: application/json`).

Chaque entité dispose de 4 opérations : **list**, **get by id**, **create**, **delete**.

---

### Crise History

**`GET /crise-history`** — Liste toutes les crises

```json
[
  { "id": 1, "duration": 45.5, "created_at": "2026-01-31 06:15:16" }
]
```

**`GET /crise-history/:id`** — Détail d'une crise

```json
{ "id": 1, "duration": 45.5, "created_at": "2026-01-31 06:15:16" }
```

**`POST /crise-history`** — Créer une crise

Body :

```json
{ "duration": 45.5 }
```

| Champ | Type | Requis |
|---|---|---|
| `duration` | `number` | oui |

Réponse `201` :

```json
{ "id": 1, "duration": 45.5, "created_at": "2026-01-31 06:15:16" }
```

**`DELETE /crise-history/:id`** — Supprimer une crise

Réponse `204` (pas de body).

---

### Drug History

**`GET /drug-history`** — Liste tous les traitements

```json
[
  { "id": 1, "name": "Keppra", "created_at": "2026-01-31 06:15:30" }
]
```

**`GET /drug-history/:id`** — Détail d'un traitement

```json
{ "id": 1, "name": "Keppra", "created_at": "2026-01-31 06:15:30" }
```

**`POST /drug-history`** — Créer un traitement

Body :

```json
{ "name": "Keppra" }
```

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | oui |

Réponse `201` :

```json
{ "id": 1, "name": "Keppra", "created_at": "2026-01-31 06:15:30" }
```

**`DELETE /drug-history/:id`** — Supprimer un traitement

Réponse `204` (pas de body).

---

### Flash Pop History

**`GET /flash-pop-history`** — Liste tous les résultats Flash Pop

```json
[
  { "id": 1, "mrt": 320.5, "inhibition_rate": 0.85, "iiv_score": 12.3, "created_at": "2026-01-31 06:15:40" }
]
```

**`GET /flash-pop-history/:id`** — Détail d'un résultat

```json
{ "id": 1, "mrt": 320.5, "inhibition_rate": 0.85, "iiv_score": 12.3, "created_at": "2026-01-31 06:15:40" }
```

**`POST /flash-pop-history`** — Créer un résultat

Body :

```json
{ "mrt": 320.5, "inhibition_rate": 0.85, "iiv_score": 12.3 }
```

| Champ | Type | Requis |
|---|---|---|
| `mrt` | `number` | oui |
| `inhibition_rate` | `number` | oui |
| `iiv_score` | `number` | oui |

Réponse `201` :

```json
{ "id": 1, "mrt": 320.5, "inhibition_rate": 0.85, "iiv_score": 12.3, "created_at": "2026-01-31 06:15:40" }
```

**`DELETE /flash-pop-history/:id`** — Supprimer un résultat

Réponse `204` (pas de body).

---

### Noise Game History

**`GET /noise-game-history`** — Liste tous les résultats Noise Game

```json
[
  { "id": 1, "vocal_initention_latence": 250.7, "motrice_planification": 180.2, "created_at": "2026-01-31 06:15:47" }
]
```

**`GET /noise-game-history/:id`** — Détail d'un résultat

```json
{ "id": 1, "vocal_initention_latence": 250.7, "motrice_planification": 180.2, "created_at": "2026-01-31 06:15:47" }
```

**`POST /noise-game-history`** — Créer un résultat

Body :

```json
{ "vocal_initention_latence": 250.7, "motrice_planification": 180.2 }
```

| Champ | Type | Requis |
|---|---|---|
| `vocal_initention_latence` | `number` | oui |
| `motrice_planification` | `number` | oui |

Réponse `201` :

```json
{ "id": 1, "vocal_initention_latence": 250.7, "motrice_planification": 180.2, "created_at": "2026-01-31 06:15:47" }
```

**`DELETE /noise-game-history/:id`** — Supprimer un résultat

Réponse `204` (pas de body).

---

## Codes d'erreur

| Code | Signification |
|---|---|
| `400` | Champ requis manquant ou type invalide |
| `404` | Ressource non trouvée |

Format d'erreur :

```json
{ "error": "description du probleme" }
```
