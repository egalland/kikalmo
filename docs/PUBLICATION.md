# Préparation à la publication — 19 octobre 2026

## Implémenté
- Choix statistiques par défaut désactivées, refus aussi accessible que l’accord, retrait permanent.
- Cookie nécessaire seulement au premier acte de jeu ; lecture du défi sans identifiant nouveau.
- Identifiants de jeu 30 jours, visite 90 jours, choix 180 jours, administration 12 heures.
- Statistiques détaillées uniquement avec accord individuel. Compteurs globaux de parties sans identifiant personnel ; classement du jour nécessaire au jeu.
- Export JSON et effacement associés au navigateur, nettoyage des salons avec contrôle de concurrence.
- Rétention : défi 30 jours, détail statistique 90 jours, agrégats 395 jours, salons inactifs 24 h. Purge au trafic, pas de cron garanti sans trafic.
- Migration : suppression des anciens identifiants et événements de statistiques collectés sans choix ; compteurs agrégés conservés.
- Mot de passe administrateur secret et robuste ; limite de 5 tentatives par adresse pseudonymisée / fenêtre de 15 min. Aucun mot de passe dans Git.

## Avant lancement officiel : à compléter par l’éditeur
1. `lib/publication.ts` : contact public, cadre juridique, coordonnées légales, mentions de l’hébergeur. Les pages indiquent explicitement les éléments encore manquants.
2. Vérifier les contrats Sites / Cloudflare, sous-traitants, lieux de stockage, transferts, journaux techniques et cookies de la plateforme. Aucune affirmation de stockage exclusivement européen n’est faite.
3. Valider les bases légales et tenir le registre des traitements ; procédure de droits hors navigateur et de gestion des incidents.
4. Vérifier les licences et crédits individuels des images de Wikimedia et les contenus/marques ; la fiche source ne remplace pas automatiquement toutes les obligations d’attribution.
5. Définir une procédure de signalement/modération et revoir le service s’il vise les enfants ; analyser les nouvelles fonctions avant ajout (publicité, comptes, paiement, applications mobiles).
6. Vérifier les mécanismes de sauvegarde prestataires et leurs délais d’effacement ; le bouton n’efface que la base applicative active et le stockage local concerné.

Cette passe technique n’est pas une certification juridique RGPD. Sources : https://www.cnil.fr/fr/mesurer-la-frequentation-de-vos-sites-web-et-de-vos-applications et https://www.cnil.fr/fr/rgpd-exemples-de-mentions-dinformation

## Statistiques personnelles sans compte
- `/statistiques` : données du navigateur et d’une clé privée explicitement créée/importée uniquement. Aucun compte ni identité de plateforme utilisé.
- Clé aléatoire de 256 bits, empreinte SHA-256 conservée en base. La valeur lisible n’apparaît ni dans les URL ni dans les journaux ni dans les exports JSON de statistiques ; cookie HttpOnly Secure SameSite=Strict. Export de clé sur demande explicite.
- Import de clé : association du navigateur courant, confirmation explicite dans le formulaire ; la clé est un secret donnant accès et effacement à l’historique associé. 100 navigateurs maximum par clé.
- Statistiques retenues 395 jours ; clé inactive expirée au même horizon. Purges au trafic. Le navigateur lié au jeu est identifié par son cookie ; la clé permet de retrouver l’historique partagé sur un autre appareil.
- Archive JSON versionnée sans cookie, e-mail ou clé de connexion. Import limité à 3 Mo / 20 000 entrées, validé côté serveur et idempotent ; ne modifie ni classements ni agrégats administrateur.
- Retrait de consentement : supprime les statistiques et l’association de ce navigateur. Effacement par clé : supprime les détails liés et invalide la clé. Les autres appareils conservent leur propre choix de consentement.
