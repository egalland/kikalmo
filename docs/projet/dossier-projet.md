# Kikalmo - Dossier de projet et mode opératoire

Édition : 24 octobre 2026
Site : https://kikalmo.emmanuel-galland117.chatgpt.site
Sources : https://github.com/egalland/kikalmo

## Un jeu de mots, un univers à soi.

Kikalmo transforme des mots privés de leurs voyelles en parties courtes, partagées et personnalisables. Le personnage en laine donne une identité au joueur ; les salons, les amis et la collection soutiennent le retour au jeu.

### Objectif du projet

Proposer un jeu accessible sans création de compte classique : choisir un pseudo, personnaliser son avatar, rejoindre un salon et retrouver les réponses avant les autres. Le mot du jour offre un défi indépendant, sans chronomètre.

| Public / contexte | Réponse du produit |
| --- | --- |
| Découverte en solo | Une partie démarre même sans autre joueur. |
| Partie entre proches | Codes amis, demandes réciproques et rejoindre un ami. |
| Petites sessions régulières | 10 manches, progression en pièces et collection de skins. |
| PC et mobile | Menu commun, clavier mobile et discussion réductible. |

### Périmètre disponible

13 salons : le généraliste regroupe 6 000 réponses ; les 12 salons thématiques proposent chacun 500 entrées. La boutique contient 49 articles, dont 11 articles Halloween. Le mot du jour dispose d’une banque distincte de 48 expressions et proverbes.

> Le profil, les achats et les amis sont liés au navigateur. La clé de statistiques personnelles ne transfère pas le personnage, le portefeuille ou les amitiés.

### État de cette édition

Ce dossier décrit les fonctionnalités présentes dans le code au 24 octobre 2026, y compris la discussion en bas d’écran et l’ajout d’ami depuis un salon. Les essais d’animation textile restent des démonstrations séparées ; ils ne sont pas intégrés au site.

## Le fonctionnement d’une partie.

Le serveur décide de la manche, du temps restant, des bonnes réponses, des points et des récompenses. Le navigateur affiche la partie et transmet les actions du joueur.

| Étape | Comportement attendu |
| --- | --- |
| Entrée dans le salon | 30 joueurs maximum ; arrivée en cours avec 0 point. |
| Compte à rebours | 10 secondes au démarrage d’une nouvelle partie. |
| Recherche | 10 manches de 20 secondes maximum chacune. |
| Indice | Un indice apparaît à 10 secondes restantes. |
| Révélation | 5 secondes ; immédiate si tous les joueurs ont trouvé. |
| Podium | Classement affiché pendant 60 secondes avant la suite. |

### Validation des réponses

La proposition doit retrouver le mot ou l’expression avec ses voyelles. La normalisation ignore la casse, les accents, les espaces, la ponctuation et les ligatures œ/æ. Une faute est tolérée à partir de 8 lettres. Une proposition voisine peut produire un retour « Proche ». Une autre réponse valide du même thème n’est pas acceptée comme une simple faute.

### Points et classement

Une bonne réponse rapporte de 1 000 à 100 points selon la rapidité. Les points de toutes les manches s’additionnent. Le premier à résoudre la manche est identifié distinctement. La couronne du vainqueur précédent reste visible tant que ce joueur est dans le salon.

### Présence et reprise

Après 12 secondes sans présence actualisée, un joueur quitte la liste active. Si le salon devient vide, la partie reste en pause pendant 10 secondes. Revenir pendant cette fenêtre permet de reprendre la partie ; après son expiration, le salon repart de zéro.

> Les points du classement, les pièces de boutique et les étoiles du mot du jour sont trois valeurs différentes. Dépenser des pièces ne modifie jamais le score d’une partie.

## Personnage, collection et navigation.

L’identité textile traverse le logo, les personnages, les monnaies, les contrôles et les surfaces. La boutique reste une interface d’achat lisible, sans slogans de mercerie.

### Personnalisation du personnage

Le joueur compose son visage, ses cheveux, ses yeux, sa bouche, son nez, ses vêtements, ses accessoires et sa couleur. Des variantes de collection ajoutent coiffures et regards. Les éléments verrouillés ouvrent la boutique ; un achat ne les équipe pas automatiquement.

| Emplacement de collection | Règle de composition |
| --- | --- |
| Chapeau ou casque | Conserve les cheveux compatibles et la forme du visage. |
| Broche ou effet | Se place au-dessus des vêtements et costumes. |
| Costume | Habille le personnage sans remplacer son identité. |
| Coiffure / regard premium | Remplace uniquement la partie correspondante. |
| Motif textile | Suit la surface du personnage et son contour. |

### Navigation commune

Le menu burger est proposé sur PC et mobile. Il donne accès aux salons, au personnage, à la boutique et aux statistiques. Les salons sont triés selon leur fréquentation ; celui qui rassemble le plus de monde est mis en avant. Les amis présents apparaissent avec leur avatar sur les cartes des salons.

### Direction artistique

Fond ivoire, feutre texturé, coutures discrètes, vert sauge et détails dorés. Les boutons restent contrastés et les textes fonctionnels. Les images d’avatar sont composées à partir de véritables assets transparents. Les zones de visage restent ajustées à la forme choisie, y compris dans un costume.

> Le logo Halloween reprend le mot-symbole Kikalmo en laine, avec un chapeau et une citrouille. Il est activé pendant la saison 2026 et revient au logo habituel à la fin de l’événement.

## Démarrer et jouer.

Parcours de première utilisation, depuis l’accueil jusqu’au classement de la partie.

1. Ouvrir Kikalmo, puis créer son personnage si aucun profil n’est enregistré sur ce navigateur.
2. Saisir un pseudo de 1 à 20 caractères. Choisir les éléments du personnage, puis enregistrer.
3. Choisir un salon depuis les cartes de l’accueil ou le menu. Le salon le plus fréquenté est mis en avant.
4. Attendre la manche, lire les consonnes et proposer le mot complet dans le champ de réponse.
5. Lire le retour : bonne réponse, proposition proche ou nouvelle tentative. Les essais sont gratuits.
6. Utiliser l’indice après 10 secondes si nécessaire. La révélation montre la réponse et peut présenter une illustration.
7. Rester jusqu’au classement pour terminer la partie et recevoir le bonus de participation si les conditions sont remplies.

### Raccourcis et confort

Entrée envoie la proposition. La flèche haut rappelle le dernier message lorsque le champ est vide. Sur mobile, le clavier du site propose une saisie adaptée et une option pour utiliser le clavier natif. Les sons peuvent être désactivés ; les réactions apparaissent sur les personnages.

### Changer de salon ou de personnage

Le menu permet de rejoindre un autre salon ; la nouvelle session devient active et l’ancienne est quittée. Modifier le personnage conserve le score de la partie en cours. L’enregistrement met à jour le pseudo et l’avatar visibles par les autres joueurs.

> En cas de connexion interrompue, attendre le retour du service puis rejoindre le salon. Une reprise complète dépend de la fenêtre de présence et du délai de pause de la partie.

## Discuter et retrouver ses amis.

La discussion réductible se trouve en bas de l’écran dans un salon. Le bouton d’ajout d’ami est disponible à côté des autres joueurs dans le classement.

### Utiliser la fenêtre de discussion

1. Cliquer sur Discussion en bas de l’écran pour ouvrir la fenêtre du salon.
2. Lire les messages ; les propositions de réponse restent dans le fil principal et ne sont pas recopiées dans cette fenêtre.
3. Pendant la recherche, trouver le mot pour pouvoir écrire. Les échanges sont alors visibles seulement aux joueurs qui ont trouvé.
4. À la révélation, les échanges deviennent visibles à tous. Écrire un message de 200 caractères maximum, puis envoyer.
5. Réduire la fenêtre pour retrouver toute la zone de jeu. Le compteur indique les nouvelles arrivées de messages lorsque la fenêtre est réduite.

### Ajouter un joueur du salon

1. Repérer le joueur dans le classement, puis cliquer sur le bouton Ajouter en ami à côté de son nom.
2. La demande est envoyée à ce joueur ; une icône d’attente remplace le bouton d’ajout.
3. Le destinataire ouvre Mes amis et accepte ou refuse. L’expéditeur ne peut pas accepter à sa place.
4. Une fois la demande acceptée, retrouver cet ami dans le panneau Amis et utiliser Rejoindre sa partie.

### Codes amis et contrôles

Le panneau Amis permet aussi de copier son code, d’ajouter un code reçu, d’annuler une demande, de retirer un ami ou de le bloquer. La présence peut être masquée. Le serveur vérifie le salon, la présence récente, les blocages et la capacité avant de permettre de rejoindre un ami.

> La fenêtre est une discussion de salon, pas une messagerie privée entre deux amis. Un ajout depuis un salon prépare un contact avec le pseudo et l’avatar publics, sans transformer la demande en amitié automatique.

## Acheter, puis équiper.

La boutique sert à acheter des skins. Mon personnage sert à les porter. Les deux écrans restent accessibles depuis la navigation.

1. Ouvrir Boutique. Tous les articles disponibles sont affichés par défaut.
2. Choisir éventuellement une catégorie : Halloween, costumes, chapeaux, broches, coiffures, regards ou motifs.
3. Cocher les monnaies souhaitées. Les deux cases peuvent rester cochées pour voir simultanément les achats en pièces et en étoiles.
4. Cliquer sur un article pour l’examiner. Les flèches de l’aperçu parcourent les articles qui correspondent aux filtres.
5. Vérifier le prix et le solde correspondant. Cliquer sur Acheter lorsque le solde est suffisant.
6. Ouvrir Mon personnage. Sélectionner l’article débloqué dans son emplacement, puis enregistrer.

### Collection Halloween 2026

La collection contient 11 articles. Les achats sont disponibles jusqu’au 9 novembre inclus, heure de Paris, et s’arrêtent le 10 novembre 2026 à 00 h. Le serveur applique cette limite, même si un ancien écran de boutique est resté ouvert. Les articles déjà achetés restent possédés et équipables après la fin de la vente.

### Comportements attendus

Un aperçu ne change pas le personnage. Un achat réussi ne débite qu’une fois, y compris après un nouvel envoi de la même demande. Un article déjà possédé n’est pas racheté. Les achats vérifient le tarif et le solde côté serveur ; modifier le prix dans le navigateur ne permet pas de contourner la boutique.

> Les pièces et les étoiles ne sont pas interchangeables. La possession est liée à l’identifiant de ce navigateur ; vider les cookies peut faire perdre l’accès à la collection.

## Une progression accessible, des objectifs durables.

Équilibrage des pièces au 24 octobre 2026. Les récompenses et les prix en étoiles restent inchangés.

| Condition | Gain en pièces |
| --- | --- |
| Terminer avec une proposition dans 5 manches distinctes | +3 en fin de partie |
| À plusieurs : trouver le mot en premier | +1 par manche |
| En solo : trouver 3 mots distincts | +1 aux seuils 3, 6 et 9 |
| Maximum à plusieurs / en solo | 13 / 6 par partie |

### Conditions et anti-doublons

Les propositions vides, les réactions et les simples présences ne comptent pas comme participation. Le bonus de fin exige de rester jusqu’au podium. Une reconnexion ne permet pas de recompter une manche ni de recevoir deux fois un bonus. Revenir après la fin ne donne pas rétroactivement le bonus de présence.

| Famille | Prix en pièces | Repère à 5 pièces / partie |
| --- | --- | --- |
| Accessoires | 8 à 40 | 2 à 8 parties |
| Coiffures et regards | 45 à 75 | 9 à 15 parties |
| Costumes Halloween | 60 à 80 | 12 à 16 parties |
| Costumes permanents | 180 à 550 | 36 à 110 parties |

### Exemples

Un joueur présent, avec au moins cinq manches tentées et aucune première place, gagne 3 pièces. Trois premières places dans une partie à plusieurs portent le total à 6 pièces. Un joueur solo qui trouve dix mots et termine la partie gagne 6 pièces. Les durées d’acquisition dépendent de la réussite ; le repère à cinq pièces est une hypothèse de comparaison.

> La hausse des prix ne retire aucun achat et ne débite aucun solde existant. Le remboursement historique de la première baisse Halloween est conservé ; les nouveaux achats en pièces n’y sont pas éligibles.

## Le mot du jour et les statistiques.

Le défi quotidien est indépendant des salons et comporte une difficulté plus élevée, centrée sur les expressions et les proverbes.

### Résoudre le défi du jour

1. Depuis l’accueil, ouvrir Le mot du jour. Le défi ne comporte pas de chronomètre.
2. Proposer l’expression complète. La progression est conservée pour ce navigateur.
3. Après 3 puis 6 erreurs, lire les indices supplémentaires. Après 9 erreurs, une voyelle est révélée.
4. Consulter le résultat et le classement. Le nombre d’essais prime, puis l’heure de la bonne réponse départage les joueurs.

| Classement quotidien | Étoiles après clôture |
| --- | --- |
| Premier | 5 |
| Deuxième | 3 |
| Troisième | 2 |
| Autre participant avec au moins une proposition | 1 |

### Clôture et renouvellement

Un nouveau défi commence à minuit, heure de Paris. Les récompenses sont calculées sur la journée clôturée et ne sont attribuées qu’une fois. Aucune récompense provisoire de podium n’est versée en journée. Si personne n’a trouvé, l’encart de tête affiche simplement « La place est libre. ».

### Lire et conserver ses statistiques

Le suivi statistique dépend du consentement facultatif. Mes statistiques permet de consulter son historique et d’utiliser une clé privée pour regrouper cet historique sur plusieurs appareils. La clé ou la sauvegarde JSON doit être conservée par le joueur. Elle ne fusionne pas les profils, les pièces, les achats ou les amis.

> Retirer le consentement aux statistiques ne désactive pas le jeu ni la progression fonctionnelle. Les règles d’export et d’effacement restent accessibles depuis le pied de page.

## Un serveur de jeu, un état de référence.

Application React et TypeScript avec Vinext, hébergée via Sites dans un Worker Cloudflare. La base D1 conserve l’état des salons et les données fonctionnelles.

| Couche | Rôle / fichiers principaux |
| --- | --- |
| Interface | app/page.tsx ; composants Avatar, DailyWord, CosmeticShop, FriendsPanel, RoomDiscussion. |
| Règles de jeu | lib/game.ts : cycle des manches, validation, scores et progression des pièces. |
| Économie | lib/economy.ts et lib/cosmetics.ts : livre des crédits, achats, catalogue et échéances. |
| Social | lib/friends.ts ; API friends : relations, présence et demandes depuis un salon. |
| Données | db/schema.ts ; migrations Drizzle ; base D1 liée sous DB. |
| Mesure / droits | lib/analytics.ts, lib/privacy.ts et API privacy. |

### Flux d’une action

1. Le navigateur envoie une action à l’API. 2. Le serveur reconnaît le joueur via son cookie et lit la révision du salon. 3. Il avance le temps, applique l’action et calcule les effets. 4. Une mise à jour conditionnelle valide la révision. 5. Les écritures liées, dont les récompenses, sont exécutées dans le même lot D1. 6. Le serveur renvoie une vue filtrée et sa nouvelle révision.

### Concurrence

Le contrôle compare-and-swap évite que deux réponses simultanées écrasent l’état. Une écriture perdante est recalculée à partir de la dernière révision. Les récompenses vérifient aussi une marque de validation propre au lot ; un essai perdant ne peut pas créditer le joueur. Les identifiants de récompense et d’achat empêchent les doublons.

> La synchronisation de partie repose sur des requêtes régulières, pas sur un WebSocket. Les réponses API ne mettent jamais le stock de réponses ni les cookies de session à disposition du navigateur.

## API, état et persistance.

Les opérations d’écriture utilisent les contrôles d’origine et l’identité côté serveur. Les identifiants courts visibles dans le classement ne sont pas les cookies des joueurs.

| Route | Opérations principales |
| --- | --- |
| /api/game | Lister ; join, sync, answer, leave, profile, chat, emote. |
| /api/daily | Lire le défi et le classement ; rejoindre et proposer une réponse. |
| /api/economy | Lire les soldes et possessions ; acheter un article. |
| /api/friends | Lire ; register, pulse, request, request-room, accept, decline, cancel, remove, block, unblock, visibility, locate. |
| /api/privacy | Choix statistiques ; export associé au navigateur ; effacement. |
| /api/admin/auth | Authentification et session privée d’administration. |

### Données fonctionnelles

rooms conserve le JSON de partie et sa révision. economy_ledger conserve les crédits et débits par monnaie, avec les identifiants uniques d’achat et de récompense. daily_challenges et daily_players conservent le défi, les essais et les résultats quotidiens. friend_profiles, friend_links et friend_blocks conservent les contacts publics, demandes, amitiés acceptées et blocages.

### État de partie non public

Le serveur conserve le paquet de questions, les identifiants complets et la progression de récompenses. La vue publique masque ces données. Elle ne transmet que la progression en pièces du joueur courant. La réponse n’est dévoilée qu’à la révélation ou au podium ; les discussions entre gagnants sont filtrées côté serveur.

### Statistiques

Les tables analytics_* conservent les mesures pseudonymisées et les agrégats. personal_events, personal_sessions et personal_daily portent l’historique personnel ; personal_stat_keys et player_stat_links permettent son association à une clé. site_visitor_days mesure les visites consenties. admin_login_limits protège l’entrée administration.

## Des fonctions séparées, des droits accessibles.

La progression et le social font fonctionner le service. La mesure d’audience reste facultative. Ce dossier décrit le comportement technique ; les textes publics doivent être complétés par l’éditeur avant un lancement officiel.

### Identité et accès

Le cookie sv_player est HttpOnly, Secure et SameSite=Lax, avec une durée de 30 jours lorsqu’il est renouvelé. Le profil visuel est aussi conservé localement. Aucun mot de passe joueur ni e-mail n’est requis. Le code ami public est différent de l’identifiant de session. Une amitié nécessite l’acceptation du destinataire.

| Données | Durée / comportement |
| --- | --- |
| Défi quotidien | 30 jours de détails. |
| Salons inactifs | Nettoyage après 24 h d’inactivité, lors d’une visite suivante. |
| Détails de mesure d’audience | 90 jours maximum. |
| Historique personnel / agrégats | 395 jours maximum. |
| Session administration | 12 heures ; fenêtre de limitation de connexion de 15 minutes. |
| Collection / amis | Liés au navigateur ; effacement via les commandes de confidentialité. |

### Mode opératoire : exporter ou effacer

1. Ouvrir Confidentialité et cookies depuis le pied de page.
2. Exporter les données associées au navigateur avant de supprimer ses cookies, si une copie est souhaitée.
3. Retirer le consentement pour supprimer les mesures facultatives de ce navigateur tout en conservant les fonctions de jeu.
4. Utiliser l’effacement complet pour supprimer les éléments fonctionnels associés : profil, participations, collection, relations et messages encore conservés.

> Les purges s’exécutent lors des visites et écritures suivantes. Sans trafic, les données expirées attendent une prochaine requête. Le contact public, les mentions d’éditeur et les informations d’hébergement sont encore à compléter dans lib/publication.ts.

## Modifier, vérifier et publier.

Les sources du Site et le dépôt GitHub main doivent rester synchronisés. Les secrets ne doivent jamais être écrits dans les sources ou dans ce dossier.

### Préparer une modification

1. Récupérer la version source courante du Site et vérifier les modifications locales avant de travailler.
2. Identifier le module concerné : interface, jeu, économie, social ou statistiques. Préserver les identifiants des articles et les monnaies des achats existants.
3. Si le schéma D1 change, modifier db/schema.ts puis générer une migration avec npm run db:generate. Conserver le SQL, le snapshot et le journal générés.
4. Appliquer les changements, puis exécuter le contrôle TypeScript et les tests du périmètre. Lancer la compilation de production avec le helper Sites.
5. Pousser l’état source vérifié, créer l’archive de cette révision, enregistrer la version puis la déployer. Vérifier le statut final de publication.
6. Synchroniser les mêmes modifications sur GitHub main, en conservant les références aux révisions sources et les particularités du README GitHub.

### Commandes de contrôle

TypeScript : npx tsc --noEmit. Jeu et API : node --test tests/game.test.mjs tests/api.test.mjs. Économie : node --test tests/economy.test.mjs. Social : node --test tests/friends.test.mjs tests/room-discussion.test.mjs. Confidentialité : node --test tests/privacy.test.mjs. Les vérifications visuelles du navigateur complètent ces contrôles lorsqu’un aperçu est disponible.

### Administration

La page /admin utilise une authentification protégée. Configurer KIKALMO_ADMIN_PASSWORD avec au moins 16 caractères et KIKALMO_ADMIN_SESSION_SECRET dans l’environnement d’hébergement. Ne pas réutiliser les anciennes valeurs de démonstration. Les rapports permettent d’analyser l’activité et d’exporter des résultats selon les fonctions présentes.

> Avant une opération de base de données, préparer un export et vérifier la restauration avec les outils de l’hébergeur. La synchronisation des sources ne constitue pas une sauvegarde des données D1.

## Vérifier les parcours, documenter les limites.

Les tests automatiques valident les règles et les écritures. Une recette PC et mobile reste nécessaire pour contrôler la lisibilité, les positions et les interactions visuelles.

| Parcours | Résultat attendu |
| --- | --- |
| Deux bonnes réponses simultanées | Une seule première place et un seul crédit associé. |
| Partie avec 5 manches tentées | +3 au podium ; aucun doublon après actualisation. |
| Solo, dix mots trouvés | 3 crédits de seuil + 3 de participation. |
| Demande d’ami dans un salon | Présence commune récente requise ; destinataire seul habilité à accepter. |
| Blocage / présence masquée | Les préférences restent appliquées après un ajout depuis le salon. |
| Discussion pendant une manche | Saisie verrouillée avant résolution ; messages filtrés selon le statut. |
| Achat concurrent / collection expirée | Pas de solde négatif ni de nouvel achat Halloween hors délai. |
| Effacement des données | Les données du joueur sont retirées sans supprimer celles des autres. |

### Recette visuelle à effectuer

PC : ouvrir et réduire la discussion, lire le classement, envoyer une demande, accepter dans un second navigateur, rejoindre un ami et changer de salon. Mobile : vérifier à 320 px et sur un écran courant, avec clavier natif et clavier du site ; contrôler que les champs, boutons et modales restent accessibles. Ouvrir l’atelier au-dessus de la navigation et contrôler le défilement unique.

### Limites connues et décisions différées

Le profil, la collection et les amitiés ne sont pas transférables entre appareils par un compte. La discussion n’est pas une messagerie privée persistante. Les illustrations externes de révélation peuvent être indisponibles. Le module d’administration dépend de ses variables d’environnement. Les animations de tricotage restent hors du site.

> Lors de cette édition, l’aperçu navigateur de l’environnement était indisponible. Les tests serveur, le contrôle TypeScript et la compilation peuvent être vérifiés ; ils ne remplacent pas une validation visuelle sur les appareils réels.

