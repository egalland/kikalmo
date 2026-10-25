# Comptes joueurs et clés privées

Le compte est facultatif. Il permet de reprendre le personnage, le portefeuille, les achats, le code ami, les relations, les blocages, les conversations privées, le défi quotidien et les statistiques autorisées sur plusieurs appareils. Il ne demande ni e-mail ni mot de passe : la clé privée est le moyen de récupération. Le choix de consentement statistique, le clavier et le son restent locaux à chaque appareil.

## Mode opératoire

1. Depuis l’appareil possédant la progression, ouvrir **Menu → Mon compte**.
2. Vérifier le personnage et les soldes, puis **Lier mon personnage et obtenir ma clé**. Si une ancienne clé de statistiques valide existe dans le navigateur, elle est conservée et devient la clé du compte. Une clé sauvegardée peut aussi être collée dans « Utiliser une ancienne clé de statistiques » avant cette association.
3. Télécharger ou copier la clé privée. Le serveur ne conserve que son empreinte ; il ne peut pas renvoyer une clé perdue à une adresse e-mail.
4. Sur un autre appareil, ouvrir **Mon compte**, coller la clé ou charger le fichier, puis **Récupérer mon compte**.
5. Les données proviennent du même compte : les soldes et les achats ne sont pas recopiés ni additionnés. Le code ami reste identique.
6. **Déconnecter cet appareil** ferme uniquement sa session. Si une identité invitée précédait la récupération et que son cookie temporaire existe encore, elle est rétablie.
7. **Renouveler ma clé privée** remplace l’ancienne clé et ferme les autres sessions, après confirmation dans l’interface. Télécharger la nouvelle clé.

Une ancienne clé non encore liée à un compte ne peut pas retrouver à elle seule un personnage stocké uniquement dans un autre navigateur. L’association initiale doit être faite sur cet appareil d’origine. Deux progressions ne sont jamais fusionnées automatiquement. Une clé de statistiques encore utilisée par une ancienne version reste compatible avec les fonctions historiques ; le nouveau parcours de création et récupération passe par Mon compte.

## Données et migration

`player_accounts` conserve l’identifiant fonctionnel existant, l’empreinte de la clé, le coffre statistique historique, le profil serveur et sa révision. `account_sessions` associe un jeton par appareil à cet identifiant, avec expiration après 395 jours. Migration ajoutée : `0011_damp_yellowjacket.sql`. Les migrations précédentes restent inchangées.

Les données de progression ne changent pas de propriétaire lors de l’association : conserver l’identifiant initial préserve les écritures de monnaie, remboursements, achats, contacts et participations quotidiennes. Chaque appareil récupéré reçoit son propre jeton opaque. Le serveur résout ce jeton vers l’identité commune dans les API de jeu, portefeuille, amis, messages, quotidien, statistiques, signalements et confidentialité.

Le cookie fonctionnel `kk_account_key` reste indépendant de `kk_stats` et du consentement statistique. `sv_player` porte la session, pas un identifiant fourni dans un formulaire. `kk_guest`, limité à 30 jours, peut conserver l’identité invitée précédente. Le cache local du profil accélère l’affichage ; pour un compte connecté, la copie serveur est la référence.

## Concurrence et contrôles

- Modification du profil avec comparaison de révision ; l’éditeur garde la révision de son ouverture pour détecter une modification concurrente.
- Cosmétiques payants filtrés selon les achats réels du compte.
- Un même compte apparaît une seule fois dans un salon ; ses réponses concurrentes passent par les contrôles de score et de crédit existants.
- Origine vérifiée pour les actions de compte ; clé aléatoire de 256 bits, empreinte SHA-256, aucun secret transmis dans une URL.
- Import conditionné atomiquement à la clé courante et à un maximum de 100 sessions actives.
- Une identité d’origine révoquée ne peut pas redevenir une identité invitée donnant accès au compte.
- Renouvellement : ancienne clé et ancien accès statistique révoqués, autres appareils déconnectés.
- Export de confidentialité incluant le profil et la progression, sans la clé ni les jetons. Effacement complet : données fonctionnelles du compte et sessions supprimées ; les autres joueurs restent préservés.

La clé donne accès au compte. Sans clé conservée ni appareil encore connecté, la récupération n’est pas possible. Un appareil encore connecté peut renouveler sa clé. Le compte ne remplace pas les sauvegardes d’exploitation de la base D1.

## Vérification

`tests/account.test.mjs` couvre une reprise de compte avec deux appareils et deux progressions distinctes : ancienne clé, portefeuille, achats, amis, blocages, messages, quotidien, statistiques, non-duplication des points, conflit de profil, renouvellement, révocation, consentement indépendant, retour à l’identité invitée, export et effacement. Les tests existants de ces API utilisent également le résolveur d’identité réel.
