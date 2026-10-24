# Kikalmo

![Logo Kikalmo cousu](public/branding/kikalmo-stitched.webp)

Jeu de mots et de culture générale multijoueur : retrouvez les voyelles manquantes avant les autres.

**[Jouer à Kikalmo](https://kikalmo.emmanuel-galland117.chatgpt.site)**

## La petite mercerie et Halloween 2026

Bouton **Boutique** visible dans l’en-tête, page dédiée `/boutique`, ambiance mercerie avec vitrine saisonnière, articles mis en avant et navigation précédent/suivant. L’atelier conserve l’équipement du personnage ; acheter ou examiner ne l’équipe jamais automatiquement.

11 pièces Halloween : trois costumes en feutre, chapeaux de sorcière, broches citrouille, nœud chauve-souris, lucioles et deux mailles à motifs. Fermeture des achats le **10 novembre 2026 à 00 h, heure de Paris** ; les pièces déjà achetées restent utilisables. Le compte à rebours est dynamique, avec contrôle d’expiration dans l’API et la requête d’achat. Les motifs suivent le masque du visage sélectionné. [Prompts ImageGen](docs/halloween-prompts.json) · [Intégration et règles](docs/costume-assets.md).

## Collection et superpositions

Six emplacements indépendants : couvre-chef, broche/effet, costume, coiffure de collection, regard de collection et maille à motifs. Les anciens profils migrent automatiquement leur unique cosmétique vers son emplacement. Les cheveux et accessoires du visage restent sous les casques ; broches et effets passent devant les tenues. Les chapeaux sont ajustés à la largeur du visage et conservent les mèches sous leur bord. Les cartes verrouillées ouvrent le bon article dans la boutique. Un achat ne modifie jamais le personnage équipé.

## Accessoires textiles et formes de visage

Les 24 accessoires de la boutique sont rendus en feutre texturé à partir de 12 assets ImageGen. Dans les costumes, la peau respecte le contour du visage choisi, avec une doublure sombre autour. [Prompts des accessoires](docs/accessory-prompts.json) · [Détails et contrôles](docs/costume-assets.md).

## Tenues fantaisie

Huit casques et combinaisons en laine et feutre : cosmonaute, scaphandrier, dragon, robot, chevalier, axolotl, champignon et pilote. Les visages gardent leurs expressions animées. [Assets, prompts et intégration](docs/costume-assets.md).

## Progression et boutique

- 49 articles, dont 11 pièces Halloween en série éphémère. **Boutique** sert aux achats et aux aperçus ; **Mon personnage** sert à équiper la collection. Les éléments de base restent gratuits.
- Premier à répondre correctement dans une manche : 1 pièce de salon. Accessoires à partir de 2 pièces ; costumes de 80 à 250 pièces de salon ou de 40 à 120 éclats. Les achats antérieurs restent acquis sans supplément.
- Monnaie quotidienne indépendante : 5 / 3 / 2 éclats au podium final ; 1 éclat aux autres participants ayant envoyé au moins une proposition, même sans résoudre le défi. Une simple ouverture ne rapporte rien.
- Classement quotidien : moins d’essais, puis heure de résolution, puis identifiant stable en cas d’égalité. Les gains sont calculés sur les journées closes, à la requête suivante après minuit à Paris, et chaque gain n’est crédité qu’une fois.
- Banque dédiée de 48 expressions/proverbes, indices après 3 et 6 erreurs et une voyelle après 9. Le défi déjà commencé le jour de la mise à jour reste identique.
- Pièces et achats conservés dans D1 et liés au cookie du navigateur, séparés des statistiques facultatives. Export et effacement depuis le panneau de confidentialité. Les deux monnaies ne sont pas convertibles ; les cosmétiques ne modifient pas les scores.
- Achats atomiques au tarif serveur ; contrôle de propriété côté serveur avant affichage en salon et au classement. Les crédits de manche font partie du même batch que la mise à jour du salon et sont protégés contre les nouvelles tentatives simultanées.

Validation : `node --test tests/*.test.mjs` et `node node_modules/typescript/bin/tsc --noEmit`. Migration ajoutée : `0007_boring_jack_murdock.sql` (table de progression uniquement ; les anciennes migrations restent inchangées).


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
