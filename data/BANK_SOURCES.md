# Banque de réponses — Sans voyelles

## Objectif

La banque contient 4 382 réponses réparties dans douze salons thématiques, plus un salon généraliste qui les mélange. Cinéma, personnalités, lieux et animaux conservent leurs 500 réponses chacun. Les 2 000 entrées d’origine restent dans le même ordre pour préserver les parties déjà lancées.

## Sélection des quatre banques d’origine

Les candidats proviennent des articles francophones de Wikipédia : modèles d’infobox cinéma, biographie, sport, musique et géographie ; catégories de noms vernaculaires d’animaux ; complément éditorial de noms courants d’animaux. Les premières recherches sont ordonnées par nombre de liens entrants. La notoriété des nouvelles réponses combine leur rang de liens entrants (65 %) et les consultations disponibles de la fiche française sur les 60 derniers jours (35 %, échelle logarithmique), via `prop=pageviews` et `pvipdays=60` de l’API MediaWiki. Une revue éditoriale favorise les noms courants d’animaux et les lieux familiers et retire notamment les courts-métrages anecdotiques et les articles hors thème. Des seuils de consultations connues éliminent les fiches très peu lues (2 000 pour les films, 3 000 pour les personnes et lieux, 500 pour les animaux ; noms courants d’animaux exceptés). Les lieux sans chiffre ne sont retenus que parmi une sélection éditoriale de noms familiers. Les consultations non retournées par l’API restent explicitement inconnues dans l’audit ; elles ne sont pas comptées comme zéro. Pour la sélection seulement, elles prennent une valeur neutre.

Ce classement sert de **proxy de notoriété dans le vivier de candidats**, pas de classement exhaustif des 500 sujets les plus populaires au monde. Il dépend du public francophone, de l’actualité, des catégories et des modèles utilisés. Les termes sans consonne affichable, doublons, homonymies et noms inadaptés au thème sont écartés.

Les chiffres disponibles, les scores de sélection et la période effective sont enregistrés dans `bank-selection.json`. Les réponses, variantes acceptées et références d’illustrations sont dans `../lib/question-bank.json`.

## Sources et illustrations

- [API MediaWiki — consultations d’articles](https://www.mediawiki.org/wiki/Extension:PageViewInfo/API)
- [API MediaWiki — recherche](https://www.mediawiki.org/wiki/API:Search)
- [API MediaWiki — catégories](https://www.mediawiki.org/wiki/API:Categorymembers)
- [API MediaWiki — images des pages](https://www.mediawiki.org/wiki/Extension:PageImages/API)
- [Wikimedia — définition d’une consultation](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html)

Les descriptions courtes issues de Wikidata servent de légendes. Les images sont des références distantes vers les fichiers indiqués par les articles. Les droits et crédits de chaque image restent accessibles sur sa fiche source. Les affiches disponibles sur l’article anglais peuvent servir de secours aux fiches françaises sans image. Les fichiers image ne sont pas copiés dans le dépôt.

Les métadonnées d’image sont résolues lors de la préparation de la banque ; le jeu conserve une recherche de secours et un état sans image si les services distants sont indisponibles. Aucune collecte de popularité n’est exécutée pendant les parties.


## Ajout éditorial du 16 octobre 2026

| Salon | Réponses |
| --- | ---: |
| Jeux vidéo | 240 |
| Séries et dessins animés | 292 |
| Cuisine et gourmandises | 253 |
| Musique | 321 |
| Personnages cultes | 353 |
| Expressions françaises | 236 |
| Objets du quotidien | 292 |
| Mythes et légendes | 395 |

Ces réponses constituent une sélection éditoriale, sans classement de popularité. Les groupes et indices sont maintenus dans `additional-answers.txt` ; `scripts/expand-bank.mjs` les ajoute à la suite de la banque existante et met à jour les compteurs publics. Les graphies alternatives explicitement indiquées dans la sélection sont acceptées. Les termes sans consonne ou sans voyelle et les doublons normalisés par salon sont écartés. Le script est idempotent pour une banque déjà enrichie.

Références de consultation pour les familles de termes :

- [Séries de jeux vidéo](https://fr.wikipedia.org/wiki/Liste_de_s%C3%A9ries_de_jeux_vid%C3%A9o)
- [Expressions en français](https://fr.wiktionary.org/wiki/Annexe:Expressions_en_fran%C3%A7ais)
- [Créatures légendaires](https://fr.wikipedia.org/wiki/Liste_de_cr%C3%A9atures_l%C3%A9gendaires)
- [Divinités mythologiques](https://fr.wikipedia.org/wiki/Liste_des_divinit%C3%A9s_mythologiques)

Les nouveaux indices sont des formulations éditoriales courtes. Les références d’article des ajouts servent à rechercher une illustration disponible à la révélation ; elles ne constituent pas un audit exhaustif des illustrations. Une illustration absente affiche un état sans image. Les expressions restent volontairement sans illustration afin de ne pas leur associer une image générique trompeuse.

Les tests vérifient le minimum de 200 réponses distinctes par salon, les compteurs affichés, la compatibilité des 2 000 entrées initiales, la validité des chaînes du jeu et l’isolation des nouveaux salons en base de données.

## Refonte des indices — 16 octobre 2026

Les indices de manche sont désormais séparés de la banque des réponses : `lib/question-clues.json` contient une entrée pour chacune des 4 382 réponses, indexée par catégorie et réponse normalisée. La banque et l’ordre des questions restent identiques, y compris pour les parties en cours.

- `data/clue-overrides.txt` : rédaction éditoriale des sens figurés des 236 expressions, indices de personnages, recettes, usages d’objets, intrigues et corrections d’homonymes. Les sections désignent la catégorie ; la dernière correction d’une même clé prévaut.
- `data/clue-introductions.json` : instantané des introductions françaises obtenues auprès de l’API Wikipédia le 16 octobre 2026, avec normalisations et redirections. Les textes de Wikipédia relèvent de CC BY-SA 4.0 ; les historiques des articles identifient leurs auteurs.
- `scripts/build-clues.py` : construit les formulations courtes depuis la rédaction éditoriale et cet instantané ; rejette les homonymies, les extraits hors catégorie et les indices contenant la réponse ou un alias. Les formulations éditoriales priment sur les textes extraits. Aucun appel externe n’est nécessaire pendant une manche.
- `data/clue-sources.json` : provenance de chaque formulation, lien vers la page source et attribution. `lib/question-clue-sources.json` ne contient que les liens nécessaires à l’affichage des crédits.

Les détails de lieu, d’usage, d’ingrédients, d’intrigue ou d’apparence sont privilégiés. Les descriptions sont limitées à 190 caractères. Aucune formulation n’est répétée plus de deux fois au sein d’un même salon. Les joueurs voient toujours l’indice uniquement lorsqu’il reste dix secondes ; la réponse et le lien source, dont le titre pourrait trahir la solution, ne sont envoyés qu’à la révélation. Les crédits Wikipédia et CC BY-SA apparaissent alors sous le texte concerné.

Les tests parcourent toute la banque, vérifient la couverture, la longueur, les doublons, l’absence de réponse et d’alias, des exemples sémantiques représentatifs, ainsi que le seuil de dix secondes et la non-divulgation des liens sources. Les introductions externes ont été reformulées et filtrées automatiquement, avec des corrections éditoriales ; elles ne constituent pas une vérification humaine indépendante de chaque fait.
