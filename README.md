# Kikalmo

![Logo Kikalmo cousu](public/branding/kikalmo-stitched.webp)

Jeu de mots et de culture générale multijoueur : retrouvez les voyelles manquantes avant les autres.

**[Jouer à Kikalmo](https://kikalmo.emmanuel-galland117.chatgpt.site)**

## Le jeu

- 12 salons thématiques et un salon général, avec 4 382 réponses.
- 10 manches de 20 secondes ; un indice apparaît à 10 secondes restantes.
- Lancement après un compte à rebours de 10 secondes dans un salon vide.
- Classement en direct, premier à trouver en doré et autres bonnes réponses en vert.
- Avatars en feutre personnalisables : morphologie, coiffure, yeux, nez, bouche, vêtements, accessoires et couleur.
- Expressions animées, émotes personnalisées et sons.
- Chat : Entrée pour envoyer, flèche ↑ dans le champ vide pour rappeler son dernier message.
- Interface adaptée au mobile et respect du mouvement réduit.

## Développement

Node.js **22.13 ou plus récent** est requis.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Le profil local par défaut est portable. Le multijoueur utilise le serveur et une base Cloudflare D1 ; la version publiée ci-dessus constitue le déploiement de référence.

```sh
node --test tests/*.test.mjs
pnpm exec tsc --noEmit --incremental false
pnpm build
```

## Organisation

| Dossier | Contenu |
| --- | --- |
| `app/` | Interface React et API du jeu |
| `lib/` | Règles, profils, questions, indices et assemblage des avatars |
| `public/` | Sprites, sons, logo et favicon |
| `data/` | Sources graphiques et documentation des assets |
| `tests/` | Vérifications du jeu, de l’API, des profils et des avatars |
| `scripts/` | Construction, préparation des sprites et rendus de contrôle |

Stack : TypeScript, React, Vinext/Vite, Cloudflare Workers et D1. Détails du runtime : [documentation Sites](docs/sites-runtime.md). Assemblage des personnages : [PUPPET_ASSETS.md](data/PUPPET_ASSETS.md).

## Historique importé

Les **28 étapes du dépôt source Sites**, jusqu’au commit `9a20512`, sont reprises dans l’historique GitHub. Les fichiers et arbres Git de chaque étape conservent leurs empreintes d’origine.

L’import via l’API GitHub recrée les commits avec de nouveaux identifiants et de nouvelles métadonnées de création. Les références originales, auteurs et dates sont conservés dans [SOURCE_HISTORY.json](SOURCE_HISTORY.json) et dans les messages des commits importés. Les commits de documentation ajoutés après l’import sont propres à ce dépôt GitHub.

Les données de jeu en production et les secrets d’exécution ne sont pas inclus.
