# Tenues fantaisie en feutre

Huit nouvelles tenues complètes rejoignent les 24 accessoires existants. Les identifiants et les achats précédents sont conservés. Les tenues apparaissent en premier dans **Avatar & boutique → Boutique & collection → Tenues fantaisie** ; chaque tenue utilise la monnaie indiquée sur sa carte.

| ID | Tenue | Asset | Monnaie | Prix |
| --- | --- | --- | --- | --- |
| 25 | Cosmonaute rétro | `public/puppets/costumes/space.webp` | Salon | 8 |
| 26 | Scaphandrier des abysses | `public/puppets/costumes/diver.webp` | Salon | 12 |
| 27 | Dragon de mousse | `public/puppets/costumes/dragon.webp` | Salon | 15 |
| 28 | Robot de laine | `public/puppets/costumes/robot.webp` | Salon | 18 |
| 29 | Chevalier comète | `public/puppets/costumes/knight.webp` | Quotidienne | 8 |
| 30 | Axolotl des rêves | `public/puppets/costumes/axolotl.webp` | Quotidienne | 12 |
| 31 | Gardien champignon | `public/puppets/costumes/mushroom.webp` | Quotidienne | 15 |
| 32 | Pilote des tempêtes | `public/puppets/costumes/pilot.webp` | Quotidienne | 20 |

## Direction artistique et création

Images créées avec l’outil intégré ImageGen, avec un rendu de la marionnette existante comme référence de style. Chaque tenue a sa propre image, sans mannequin ni visage peint. Matières : laine et feutre duveteux, volumes rembourrés, coutures visibles et éclairage doux. La fenêtre du casque et l’extérieur gardent un vrai canal alpha.

### Prompt commun

> Production game costume sprite on a true transparent background. Match the reference puppet's dimensional handcrafted wool felt, fuzzy fibres, soft thick seams, rounded stuffed fabric and warm studio shadows. Empty clothing only, no wearer, skin, eyes, nose or mouth. Integral helmet or hood connected to a matching suit bust, rounded sewn waist hem, no legs. Very large unobstructed oval face aperture with genuine transparency, no glass across it. Fully frontal orthographic view, centered square composition with clear margins. No text, labels, logos or watermark; no flat vector graphics, plastic or real metal.

### Déclinaisons utilisées

- **Cosmonaute** : casque ivoire avec bourrelet orange, modules latéraux turquoise, deux petites antennes, combinaison rembourrée, bretelles et écusson planète cousus.
- **Scaphandrier** : casque de plongée en feutre cuivré, bourrelet doré, boutons turquoise, combinaison bleu pétrole, tuyaux rembourrés et écusson algues.
- **Dragon** : capuche vert mousse, petites cornes mauves, museau au-dessus de l’ouverture, ailes souples aux épaules, plastron crème côtelé.
- **Robot** : casque lavande arrondi, ouverture rectangulaire douce, disques ivoire, antenne éclair dorée, boutons turquoise et moutarde sur le plastron.
- **Chevalier** : casque indigo, bordure dorée, étoile de feutre, ailettes, épaulières souples, cape et comète brodée sur le torse.
- **Axolotl** : capuche rose, couronne de branchies corail en feutre, bordure crème, ventre ivoire et petit cœur cousu.
- **Champignon** : chapeau rouge à pois crème, capuche ivoire, épaulettes feuilles, petite besace cousue avec fermoir gland.
- **Pilote** : casque moutarde, écouteurs turquoise, lunettes posées au-dessus de l’ouverture, petite crête éclair, combinaison de vol, harnais, écharpe et écusson de vent.

## Intégration

- WebP 1 024 × 1 024 avec alpha conservé, 1,8 Mo environ pour les huit assets.
- `lib/costume-assets.json` contient les empreintes des sources, les ouvertures mesurées et le cadrage commun.
- `scripts/package-costumes.mjs <manifest.json>` optimise les sources PNG en WebP et mesure la composante transparente de l’ouverture. Le manifeste contient des objets `{id,key,path}`. Les images sources ne sont pas modifiées.
- Le costume est mis à l’échelle uniformément, sans étirer sa texture. Un masque dérivé de son alpha laisse apparaître la texture de peau, les yeux, le nez et la bouche du personnage existant. Les expressions restent animées. La coiffure et les vêtements de base sont masqués pendant le port de la tenue, puis reviennent quand elle est retirée.
- Les achats et la propriété utilisent les contrôles de progression existants. Aucun changement de schéma de base de données.

## Validation

`node --test tests/costumes.test.mjs` vérifie l’alpha réel, 48 combinaisons tenue/morphologie, les silhouettes complètes, le remplacement des cheveux/vêtements et le changement effectif des expressions. Les tests de profil et d’économie vérifient aussi les nouveaux identifiants et les achats. La planche de rendu des huit tenues portées a été inspectée visuellement.

## Correction des contours de visage

La peau conserve désormais exactement la silhouette du sprite de tête sélectionné (six formes, trois poses), à une échelle uniforme commune aux traits. Elle ne remplit plus toute l’ouverture du casque. Une doublure en feutre assombrie apparaît entre le contour de la tête et le casque ; le cou conserve aussi sa propre largeur. `tests/face-contours.test.mjs` vérifie sur les pixels rendus que la peau ne dépasse pas la silhouette choisie.

## Accessoires textiles

Les 24 accessoires de la boutique utilisent maintenant 12 assets raster en feutre : béret, bonnet tricoté, haut-de-forme, tricorne, serre-tête à antennes, casque audio, étoile, cœur, nœud papillon, couronne, halo et chapeau de mage. Les variantes de couleur sont appliquées au rendu ; les groupes d’étoiles réemploient l’étoile cousue. Les identifiants, prix, monnaies et achats sont conservés.

- Assets de production : `public/puppets/accessories-v2/` (WebP avec alpha).
- Prompts exacts et outil de création : [accessory-prompts.json](accessory-prompts.json).
- Optimisation et détourage de cadrage : `node scripts/package-accessories.mjs <manifest.json>` avec des entrées `{key,path}` vers les PNG générés. Les sources ne sont pas modifiées.
- Planche de contrôle des 24 apparences : `node scripts/render-accessory-review.mjs /tmp/accessories.png`.
- Les casques audio et serre-têtes passent derrière la tête pour laisser tous les yeux visibles ; les autres pièces sont placées sur les repères du front, du menton ou du vêtement.
- Tests : `tests/accessories.test.mjs` vérifie les matières non uniformes, l’alpha, les silhouettes complètes et l’absence d’occlusion des yeux sur les six formes de tête.

## Atelier et collection

Les cinq emplacements sont persistés séparément ; `cosmetic` est seulement une entrée de migration des anciens profils. La propriété de chaque article est contrôlée en salon et au quotidien. Le costume masque la même identité complète (cheveux, visage, accessoires et vêtements) derrière son ouverture alpha. Les broches se placent au col ou sur le torse du costume. Retirer le costume restitue les autres emplacements.

La boutique possède son aperçu local : examiner et acheter ne changent pas le personnage. Les coiffures afro chocolat, tresses violettes et afro argenté sont dérivées de deux créations ImageGen en laine/feutre sur fond transparent, assorties au personnage existant. Production : `public/puppets/hair-shop/` ; métadonnées : `lib/hair-assets.json` ; packaging : `scripts/package-hair.mjs`. L’afro argenté réutilise le même matériau avec une variation de couleur. Trois regards réutilisent les yeux textiles animés et des teintes lagon, améthyste et émeraude.

Tarifs costumes : 80 / 120 / 180 / 250 pièces de salon, 40 / 60 / 90 / 120 éclats quotidiens. Les lignes d’achat antérieures conservent leur validité. Les 48 énigmes quotidiennes restent dans une banque dédiée invisible dans les catégories des salons.

## Halloween 2026 — collection éphémère

La page `/boutique` est accessible directement depuis l’en-tête et possède un aperçu indépendant du personnage équipé. Une vitrine saisonnière et une navigation article précédent/suivant mettent les pièces Halloween en avant. Les rayons et les monnaies restent filtrables.

La collection comprend 11 articles : trois costumes (citrouille, fantôme et chauve-souris), deux chapeaux de sorcière, un nœud chauve-souris, deux broches citrouille, des lucioles et deux textures à motifs. Six nouveaux sprites ImageGen transparents sont utilisés ; les variantes réemploient les matières avec des filtres de couleur. Les motifs sont répétés dans un masque alpha de la tête choisie, sous les yeux, les cheveux et les accessoires. Le slot `fabric` est indépendant des cinq autres emplacements.

Fin exclusive : `2026-11-10T00:00:00+01:00` (9 novembre 23 h UTC). Le décompte en jours est recalculé côté boutique et synchronisé sur l’heure reçue du serveur. À l’échéance, les nouveaux achats sont bloqués dans la route API et dans la requête d’achat atomique. Les articles possédés restent équipables dans l’atelier après la fermeture. Les autres articles restent disponibles.

Les cheveux sous les chapeaux suivent désormais une ouverture courbe avec une échelle réduite autour du front. Les contours du visage et les accessoires d’origine restent sous les ouvertures des costumes ; les broches et nœuds s’alignent au col ou au torse par-dessus la tenue.

Reproduction : `node scripts/package-costumes.mjs <costumes.json> --append` et `node scripts/package-accessories.mjs <accessories.json> --append`. Prompts complets : `docs/halloween-prompts.json`. Méthode : outil ImageGen intégré, référence de style du personnage existant.
