# Kikalmo - Dossier de projet

Édition du 24 octobre 2026. La direction artistique du document reprend le logo en laine, les surfaces ivoire et les coutures du site.

- [Dossier complet en PDF](Kikalmo-dossier-projet.pdf) : 14 pages, prêt à lire et à partager.
- [Dossier éditable](dossier-projet.md) : cadrage, cahier des charges, parcours joueur, social, boutique, économie, quotidien, architecture, données, confidentialité, maintenance et recette.
- [Source structurée](dossier.json) : contenu de référence pour régénérer les documents.
- [Générateur PDF](../../scripts/build-project-dossier.py) : Python, ReportLab, polices DejaVu et assets du projet.

## Mode opératoire

Le dossier contient des procédures numérotées pour créer son personnage, rejoindre une partie, répondre, utiliser la discussion en bas d’écran, demander un joueur en ami depuis le classement, gérer les relations, acheter et équiper un skin, résoudre le mot du jour, exporter ses données et publier une mise à jour.

## Régénération

Depuis la racine du dépôt : `python scripts/build-project-dossier.py`.

Les illustrations sont rendues avec le véritable composant d’avatar du site ; elles ne sont pas des captures du navigateur. La recette visuelle du site reste distincte du contrôle de mise en page de ce document.
