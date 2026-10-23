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
