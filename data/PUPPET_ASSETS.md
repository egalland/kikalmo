# Marionnettes en feutre

Le créateur compose six familles de choix : visage, coiffure, yeux, bouche, accessoires et vêtements, plus dix couleurs de feutre. Les profils `sv-profile-v1` existants sont conservés ; une tenue par défaut est ajoutée aux anciens avatars.

Les dessins ont été produits avec ImageGen pour ce jeu le 15 octobre 2026, à partir de la direction artistique en feutre choisie pendant la conversation. Les planches montrées avant l’intégration étaient des concepts. La version intégrée utilise les quatre atlas WebP sur fond transparent dans `public/puppets/` :

| Atlas | Grille | Usage |
| --- | --- | --- |
| body.webp | 3 colonnes × 6 lignes | Six silhouettes, trois poses dessinées par silhouette |
| eyes.webp | 4 × 6 | Six regards, quatre images pour le clignement et le regard de côté |
| mouth.webp | 4 × 6 | Six bouches, quatre degrés d’ouverture dessinés |
| parts.webp | 7 × 3 | Coiffures, accessoires, vêtements ; cellules transparentes pour les options absentes |

Chaque cellule mesure 256 × 256 px. Les éléments sont enregistrés sur le même repère. `lib/puppet.ts` sélectionne des indices d’images discrets ; `Avatar.tsx` assemble les couches dans un seul `viewBox` SVG carré de 256 × 256 ; chaque calque découpe exactement une cellule de l’atlas, sans redimensionnement indépendant. Le nez repasse au premier plan dans un masque SVG fixe. Le visage et les lèvres partagent une teinte de feutre. Aucune pose n’est créée en tournant, étirant ou déplaçant une image avec une animation CSS. Les émotes sélectionnent des yeux et des bouches adaptés (rire, réflexion, grimace, canard, chien…). Les trois expressions de réussite utilisent des dessins distincts : sourire pour un mot trouvé, grand rire et yeux émerveillés pour le premier, rire maximal et yeux rieurs pour le champion du match. Ces expressions restent distinctes en mouvement réduit. Un seul minuteur client est partagé entre les avatars animés ; il s’arrête lorsque l’onglet est caché ou lorsque le mouvement réduit est demandé. Les vignettes du créateur restent statiques.

Les images générées ont été découpées, enregistrées sur leur repère et compactées par `scripts/pack-puppets.cjs`, avec Sharp. Ce script attend les sorties ImageGen d’origine dans le dossier passé en argument ; leurs noms sont inscrits dans `SOURCES`. Les fichiers WebP sont les ressources distribuées et suffisent au fonctionnement du jeu. Les images originales ne sont pas nécessaires à l’exécution.

Contrôle des atlas : `node tests/puppet.test.mjs` vérifie les dimensions, la transparence, les images réellement distinctes et la sélection des poses. La sauvegarde et la migration des vêtements sont contrôlées dans les tests de profils et d’API.

Les illustrations de réponse occupent un cadre à hauteur bornée dans une grille ; l’image est positionnée au centre du cadre avec `object-fit: contain` et conserve intégralement ses proportions, y compris les affiches verticales. L’affiche et le texte disposent de zones indépendantes et le chat garde sa hauteur réservée.

## Recalage des pièces

Les zones source des trois rangées de pièces sont mesurées séparément : les dessins générés débordaient d’une division mathématique en tiers. Les petits fragments provenant d’un élément voisin sont retirés avant la mesure. Chaque silhouette et pose partage désormais un ancrage du nez à (128, 128) ; le cou est conservé intégralement au lieu de couper la tête à la ligne la plus étroite. Le buste d’origine conserve son cou et son ombre de menton. Les vêtements sont placés devant ce buste, avec le col à sa hauteur anatomique ; le nez repasse devant les yeux. Les rangées du créateur réservent toutes sept cases et les vignettes gardent un canevas carré. Un test vérifie l’ancrage des dix-huit poses.


## Reprise du 15 octobre — expressions et cadrage

Le rang de découverte `solveRank` est attribué côté serveur avec un compteur par manche, dans la même mise à jour atomique que les points. Les réponses simultanées ne produisent qu’un seul premier. Le départ d’un joueur ne change pas le rang des suivants. Le compteur est remis à zéro à la manche suivante. La couronne du match précédent ne déclenche pas l’expression de victoire pendant un nouveau match.

Les sons d’émotes utilisent des enveloppes courtes, glissandos élastiques, filtres de formants et percussions douces avec compression de sortie. Ils restent soumis au bouton haut-parleur. Les nœuds audio sont déconnectés après lecture.


## Correction du raccord du col

Le découpage conserve le cou dessiné dans les sprites d’origine et écarte les épaules nues pour laisser la place aux vêtements. Le vêtement passe au premier plan, 26 unités plus bas dans le canevas commun, afin de laisser visible le cou sous le menton. Les rangées source de silhouettes sont mesurées individuellement : leur hauteur réelle n’était pas uniforme, ce qui rognait le sommet du visage ovale. Le test d’atlas vérifie la présence du cou pour les 18 poses ; 36 combinaisons visage / vêtement sont contrôlées dans les rendus du composant. Les illustrations et les expressions de réussite de la version précédente sont conservées.


## Calibration image par image

Le recalage de la planche entière ne garantissait pas celui de chaque image : le centre des yeux se déplaçait jusqu’à 9 unités et celui de certaines bouches de 6 unités sur le canevas natif de 256. `scripts/calibrate-puppets.mjs` mesure désormais les pixels opaques de chaque cellule et enregistre les repères dans `lib/puppet-registration.json`. `lib/puppet-registration.ts` place chaque dessin sur un axe commun : nez (128,128), bas des yeux à 130, centre de bouche (128,169). Le front et le cou de chaque silhouette pilotent respectivement la coiffure et le col. Les fragments parasites sous les yeux endormis sont exclus du découpage de rendu. Les images et leurs textures sont conservées.

`PuppetArt` est le composant de dessin pur ; `Avatar` fournit son horloge et les poses. Le canevas carré inclut une marge au-dessus des cheveux. Les règles CSS des petites coches SVG excluent explicitement le SVG de l’avatar dans le créateur.

Commandes depuis la racine :

- `node scripts/calibrate-puppets.mjs` : recalculer les repères après modification d’un atlas.
- `node --test tests/puppet*.test.mjs` : contrôler le dessin, 1 080 assemblages géométriques et 96 rendus du composant en pixels (32, 54, 120 et 270 px).
- `node tests/puppet-alignment.test.mjs --baseline` : reproduire l’échec géométrique de l’ancien placement sans calibration.
- `node scripts/render-puppet-qa.mjs` : produire une planche de 36 poses et une séquence animée de 28 images dans `.sites-runtime/`.

Les tests vérifient que les repères enregistrés correspondent toujours aux pixels des atlas. Le contrôle des composants SVG ne remplace pas une vérification de la page complète en navigateur.
