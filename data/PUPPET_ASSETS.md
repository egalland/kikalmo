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

Les sons d’émotes ont été remplacés par la synthèse PCM décrite ci-dessous. Ils restent soumis au bouton haut-parleur. Les nœuds audio sont déconnectés après lecture.


## Correction du raccord du col

Le découpage conserve le cou dessiné dans les sprites d’origine et écarte les épaules nues pour laisser la place aux vêtements. La correction initiale du col a été remplacée par le placement derrière la tête et le raccord au cou décrits ci-dessous. Les rangées source de silhouettes sont mesurées individuellement : leur hauteur réelle n’était pas uniforme, ce qui rognait le sommet du visage ovale. Le test d’atlas vérifie la présence du cou pour les 18 poses ; 36 combinaisons visage / vêtement sont contrôlées dans les rendus du composant. Les illustrations et les expressions de réussite de la version précédente sont conservées.


## Calibration image par image

Le recalage de la planche entière ne garantissait pas celui de chaque image : le centre des yeux se déplaçait jusqu’à 9 unités et celui de certaines bouches de 6 unités sur le canevas natif de 256. `scripts/calibrate-puppets.mjs` mesure désormais les pixels opaques de chaque cellule et enregistre les repères dans `lib/puppet-registration.json`. `lib/puppet-registration.ts` place chaque dessin sur un axe commun : nez (128,128), bas des yeux à 130, centre de bouche (128,169). Le front et le cou de chaque silhouette pilotent respectivement la coiffure et le col. Les fragments parasites sous les yeux endormis sont exclus du découpage de rendu. Les images et leurs textures sont conservées.

`PuppetArt` est le composant de dessin pur ; `Avatar` fournit son horloge et les poses. Le canevas carré inclut une marge au-dessus des cheveux. Les règles CSS des petites coches SVG excluent explicitement le SVG de l’avatar dans le créateur.

Commandes depuis la racine :

- `node scripts/calibrate-puppets.mjs` : recalculer les repères après modification d’un atlas.
- `node --test tests/puppet*.test.mjs` : contrôler le dessin, 1 080 assemblages géométriques et 96 rendus du composant en pixels (32, 54, 120 et 270 px).
- `node tests/puppet-alignment.test.mjs --baseline` : reproduire l’échec géométrique de l’ancien placement sans calibration.
- `node scripts/render-puppet-qa.mjs` : produire une planche de 36 poses et une séquence animée de 28 images dans `.sites-runtime/`.

Les tests vérifient que les repères enregistrés correspondent toujours aux pixels des atlas. Le contrôle des composants SVG ne remplace pas une vérification de la page complète en navigateur.


## Superposition du vêtement — 16 octobre

Le vêtement est dessiné derrière la tête. La tête et le cou passent au premier plan, avec une limite de découpage au niveau du col pour empêcher le cou de recouvrir le vêtement jusqu’au bas du portrait. Le test `puppet-occlusion.test.mjs` élève volontairement le col d’un vêtement pour vérifier, dans les pixels du composant rendu, qu’un col trop haut ne peut pas masquer le menton.

La révélation utilise maintenant `AnswerReveal` et `answer-reveal.css`. Elle dispose d’une zone d’image indépendante de l’ancien bloc à hauteur fixe ; la photo ou l’affiche est contenue intégralement dans la hauteur disponible, sans grand fond rectangulaire ajouté. Un bouton d’image ouvre une boîte de dialogue native agrandie, fermable par Échap ou son bouton de fermeture. Le chargement et l’absence d’image ont des états distincts.


## Ajustement aux six contours — 16 octobre, seconde correction

La calibration version 2 mesure trois sections contiguës du visage (front, joues, mâchoire) sans les oreilles, ainsi que la largeur du cou, pour chacune des 18 silhouettes dessinées. `puppetFit` fournit ces dimensions. La largeur des coiffures suit le front ; les lunettes suivent le haut du visage ; la fleur se fixe à la tempe ; les joues roses suivent les joues ; la moustache suit la mâchoire ; le foulard commence sous le menton. Chaque pièce possède des échelles horizontale et verticale distinctes, appliquées dans le SVG avec `preserveAspectRatio="none"`.

Les épaules des vêtements suivent la largeur des joues. Le haut du col se place cinq unités au-dessus du repère de cou, derrière la tête, et le cou au premier plan s’arrête cinq unités sous le col. Cela ferme le raccord sans faire remonter le vêtement sur le menton.

`render-puppet-fit-qa.mjs` produit trois planches : les six coiffures, accessoires et vêtements avec les six têtes (108 portraits). `puppet-fit.test.mjs` rasterise les 324 assemblages sur les trois poses et vérifie leurs dimensions, leur visibilité et le dégagement du foulard. Les autres tests de calibration et de superposition restent actifs. Ces rendus isolés ne vérifient pas toute la page dans un navigateur.

La nouvelle banque audio est produite par `renderEmoteSamples` : dix effets PCM déterministes, avec voix à résonances, frottements bruités, pops, clochettes et rebonds élastiques. Le signal est normalisé puis doucement saturé, mis en cache dans chaque contexte audio et lu par un buffer. Trois réactions au maximum peuvent se superposer ; les sources et gains sont libérés après lecture. Le test contrôle les dix signaux à 8, 44,1 et 48 kHz (énergie, niveau maximal, silence aux extrémités, absence de biais continu), leur distinction, le cache et le nettoyage. Le caractère subjectif des sons reste à apprécier à l’écoute dans le jeu.

## Émotes du personnage et démo sonore approuvée — 16 octobre

Le sélecteur et les réactions reçues utilisent `AvatarEmote`, qui transmet l’avatar complet de l’émetteur au même composant `Avatar`. La forme de tête, la couleur, la coiffure, les vêtements et les accessoires sont conservés ; les poses d’yeux et de bouche viennent des sprites existants. Une petite pastille de sens (HA !, ?, COIN !, etc.) accompagne l’expression. Les aperçus du sélecteur sont fixes, les réactions utilisent l’animation dessinée existante et respectent le mouvement réduit. Le lecteur d’écran reçoit un libellé français avec le nom de l’émetteur. Les réactions expirent aussi dans l’affichage local, sans attendre une réponse serveur supplémentaire.

Les dix effets de `public/audio/slapstick-v1/` sont exactement les segments PCM de l’audition approuvée `04-cartoon-slapstick.mp3` (master WAV de la même audition). Le manifeste `data/slapstick-audio.json` conserve les empreintes SHA-256 des segments approuvés. Le test les compare aux fichiers servis. `scripts/generate-slapstick.py` contient la synthèse d’origine (sifflet glissant, ressort, percussions, trombone et klaxon) et régénère les fichiers sans dépendance audio externe.

Les buffers sont préchargés lors d’un geste utilisateur, décodés et réutilisés par contexte Web Audio. Trois sons maximum se superposent ; le bouton muet et un changement de session annulent les lectures encore en attente. Un chargement échoué peut être retenté. Le composant de réaction est testé avec trois identités et dix émotes, y compris l’utilisation de l’avatar distant plutôt que du profil local.

## Assemblage v2 — correction complète des morphologies

Cette section remplace les anciennes règles de découpage du menton, de cou intégré et de placement des coiffures.

Les sources dessinées `data/puppet-sources/v2/` fournissent désormais 18 têtes complètes sans nez ni cou intégrés (six formes × trois poses), six nouveaux vêtements avec un ourlet inférieur arrondi complet, six coiffures redessinées et six nez indépendants. Le nez classique est l’option par défaut ; les anciens profils version 1 restent valides. Le créateur propose aussi « Sans nez », Petit rond, Bouton large, Petite poire, Allongé et Retroussé. Le champ `nose` est nettoyé côté client et serveur, sauvegardé avec le profil et transmis aux autres joueurs.

`scripts/fit-puppet-morphologies.mjs` découpe les sources par cellules, retire les fragments d’alpha déconnectés et conserve l’antialiasing autour du composant principal. Les 18 têtes sont enregistrées sur l’axe du visage ; leur contour reste entier, sans aucune limite de découpage au niveau du col. Chaque coiffure est dimensionnée d’après la largeur réelle du front et sa frange centrale est posée sur ce front. Cela produit 108 cellules de cheveux distinctes par forme/pose/coiffure. Les premières variantes d’extension ou de déformation des tempes ont été écartées après inspection visuelle ; elles ne font pas partie des fichiers publiés.

Les costumes sont de véritables bustes complets, avec des épaules et une base arrondies à l’intérieur du sprite. Leur largeur suit les joues. La texture du cou est une pièce distincte derrière le costume ; la tête entière est au premier plan, par-dessus le col. Les yeux, bouches, nez puis cheveux et accessoires viennent ensuite. Il n’existe plus de masque horizontal coupant la tête. Le canevas a été agrandi verticalement pour afficher les coiffures et les ourlets entièrement. Le placement des accessoires utilise les repères du front, de la mâchoire et du bas du menton ; lunettes et expressions partagent l’axe des yeux, le foulard reste sous le menton.

Les mouvements de tête, yeux et bouche restent des changements de dessins dans leurs atlas, y compris pour les réactions et avec une pose statique appropriée en mouvement réduit. Les variantes morphologiques ne sont pas des animations CSS simulées.

`render-morphology-review.mjs` produit des planches du composant réel : 36 associations coiffure/tête, 36 vêtement/tête, 36 accessoire/tête, 42 nez/tête, puis une animation de 18 images sur les six formes. La séquence parcourt les trois poses du corps, les six ensembles de pièces et plusieurs expressions. Il s’agit du composant rendu, pas d’une maquette générée.

Les tests contrôlent les points de contact de 108 coiffures sur le front, les 18 mentons entiers, les six ourlets arrondis avec marge transparente, les six silhouettes de nez, l’absence de couche de nez quand « Sans nez » est choisi, la migration des profils et la propagation du nez aux joueurs distants. Le test de superposition remonte volontairement les cols pour confirmer que les pixels du menton restent au premier plan. Les tests géométriques historiques ne servent plus à valider les cheveux et vêtements v2 : les contrôles v2 et l’inspection des planches font foi. Le contrôle complet de la page dans un navigateur reste indisponible dans cet environnement.

## Mèche Titeuf — 17 octobre

L'option de coiffure 7 (« Mèche Titeuf ») ajoute la grande mèche blonde approuvée, sans modifier les indices des coiffures existantes. La source détourée est `data/puppet-sources/v2/tuft-blond.webp`. Le prompt de génération demandait d'isoler uniquement la mèche blonde de l'aperçu approuvé, en conservant sa texture de laine, sa pointe courbée et sa petite attache, sur fond alpha transparent, sans visage ni vêtement. Outil : génération d'image intégrée, puis conditionnement Sharp pour les sprites du jeu.

`node scripts/fit-tuft-hairstyle.mjs` produit `public/puppets/v2/tuft.webp` : six morphologies × trois poses, cellules de 256 × 384. Le centre de la racine est mesuré dans les pixels opaques de sa base puis posé dix unités sous le sommet du crâne. La taille suit le front de la morphologie. Les trois silhouettes sont enregistrées dans l'atlas, avec la racine fixe et une légère inflexion de la pointe selon la pose. Le composant réserve un cadre plus haut uniquement pour cette coiffure afin de garder la pointe entière. Les anciennes coiffures conservent leur cadrage.

Les profils, le tirage aléatoire, les salons, le mot du jour et les émotes utilisent le même indice 7. Le test `tuft.test.mjs` vérifie les 18 contacts au crâne, les marges transparentes des silhouettes et le rendu réel du composant. La planche de contrôle est rasterisée depuis ce composant ; elle ne remplace pas un contrôle complet de page dans le navigateur.
