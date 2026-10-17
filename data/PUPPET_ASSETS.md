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

Les zones source des trois rangées de pièces sont mesurées séparément : les dessins générés débordaient d’une division mathématique en tiers. Les petits fragments provenant d’un élément voisin sont retirés avant la mesure. Chaque silhouette et pose partage désormais un ancrage du nez à (128, 128) ; la jonction du cou est repérée avant de séparer la tête du buste. Les vêtements sont placés derrière la tête et le nez repasse devant les yeux. Les rangées du créateur réservent toutes sept cases et les vignettes gardent un canevas carré. Un test vérifie l’ancrage des dix-huit poses.


## Reprise du 15 octobre — expressions et cadrage

Le rang de découverte `solveRank` est attribué côté serveur avec un compteur par manche, dans la même mise à jour atomique que les points. Les réponses simultanées ne produisent qu’un seul premier. Le départ d’un joueur ne change pas le rang des suivants. Le compteur est remis à zéro à la manche suivante. La couronne du match précédent ne déclenche pas l’expression de victoire pendant un nouveau match.

Les sons d’émotes utilisent des enveloppes courtes, glissandos élastiques, filtres de formants et percussions douces avec compression de sortie. Ils restent soumis au bouton haut-parleur. Les nœuds audio sont déconnectés après lecture.
