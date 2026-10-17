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
