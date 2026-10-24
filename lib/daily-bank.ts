import type {Question} from './game';
// A dedicated bank: familiar expressions with several words, curated and still solvable.
const entries=[
 ['Chercher une aiguille dans une botte de foin','Une recherche presque impossible.','Un objet de couture est perdu au milieu de la récolte.'],
 ['Mettre la charrue avant les bœufs','Faire les choses dans le mauvais ordre.','Un outil agricole précède les animaux qui devraient le tirer.'],
 ['Il ne faut pas vendre la peau de l’ours avant de l’avoir tué','Ne pas considérer une réussite comme acquise trop tôt.','Ce proverbe met en scène un grand animal et sa fourrure.'],
 ['Les chiens aboient et la caravane passe','Continuer son chemin malgré les critiques.','Un convoi poursuit sa route au milieu des aboiements.'],
 ['Il faut se méfier de l’eau qui dort','Le calme apparent peut cacher un danger.','Une étendue liquide semble parfaitement immobile.'],
 ['À quelque chose malheur est bon','Une difficulté peut aussi apporter un avantage.','Un événement malheureux peut finalement être bénéfique.'],
 ['Les petits ruisseaux font les grandes rivières','De petits efforts additionnés produisent beaucoup.','Deux tailles de cours d’eau se rencontrent.'],
 ['Qui sème le vent récolte la tempête','Provoquer des troubles finit par avoir des conséquences.','Un geste agricole entraîne une forte dégradation du temps.'],
 ['Quand le chat n’est pas là les souris dansent','L’absence de surveillance libère les comportements.','Un félin absent laisse des rongeurs faire la fête.'],
 ['Il ne faut pas mettre tous ses œufs dans le même panier','Mieux vaut répartir ses risques.','Des produits du poulailler doivent être répartis entre plusieurs contenants.'],
 ['On ne fait pas d’omelette sans casser des œufs','Un résultat demande parfois des sacrifices.','La préparation d’un plat nécessite de briser des coquilles.'],
 ['C’est au pied du mur qu’on voit le maçon','C’est dans l’action que l’on juge la compétence.','Un artisan doit montrer ce qu’il sait construire.'],
 ['Pierre qui roule n’amasse pas mousse','Les changements incessants empêchent parfois de se fixer.','Un minéral en mouvement ne se couvre pas de végétation.'],
 ['Chassez le naturel il revient au galop','Les habitudes profondes finissent par réapparaître.','Ce qui revient le fait à la vitesse d’un cheval.'],
 ['Il n’y a pas de fumée sans feu','Un indice suppose souvent une cause réelle.','Un phénomène visible est lié à une combustion.'],
 ['Mieux vaut prévenir que guérir','Anticiper les difficultés est préférable à les réparer.','La seconde action relève du soin.'],
 ['L’habit ne fait pas le moine','Il ne faut pas juger sur les apparences.','Un vêtement ne suffit pas à appartenir à un ordre religieux.'],
 ['Rien ne sert de courir il faut partir à point','La régularité compte davantage que la précipitation.','Une leçon du lièvre et de la tortue.'],
 ['Tout vient à point à qui sait attendre','La patience peut être récompensée.','Le dernier verbe évoque le contraire de se précipiter.'],
 ['Il faut tourner sept fois sa langue dans sa bouche','Il vaut mieux réfléchir avant de parler.','Un nombre porte-bonheur et un organe de la parole.'],
 ['Ne pas avoir les deux pieds dans le même sabot','Savoir être débrouillard et réactif.','Deux extrémités du corps risquent de partager une chaussure en bois.'],
 ['Prendre des vessies pour des lanternes','Confondre une chose avec une autre, se tromper lourdement.','Une confusion étonnante avec des objets qui éclairent.'],
 ['Tirer les marrons du feu','Prendre un risque dont un autre peut profiter.','Des fruits à coque sont retirés d’un foyer brûlant.'],
 ['Passer du coq à l’âne','Changer brusquement de sujet.','Deux animaux de la ferme encadrent ce changement.'],
 ['Donner sa langue au chat','Renoncer à trouver une réponse.','On abandonne un organe de la parole à un félin.'],
 ['Avoir plusieurs cordes à son arc','Disposer de plusieurs talents.','Un équipement d’archer devient une image des compétences.'],
 ['Couper les cheveux en quatre','Se perdre dans des détails excessivement subtils.','Une division capillaire en un nombre pair.'],
 ['Voir midi à sa porte','Juger les choses selon son seul point de vue.','Une heure de la journée se trouve devant une entrée.'],
 ['Se creuser la tête','Réfléchir intensément pour trouver une solution.','Une action de terrassement est appliquée au siège de la pensée.'],
 ['Avoir le cœur sur la main','Être particulièrement généreux.','Deux parties du corps forment cette image de la bonté.'],
 ['Jeter de l’huile sur le feu','Aggraver une dispute ou une situation tendue.','Une matière grasse attise une combustion.'],
 ['Mettre les pieds dans le plat','Aborder maladroitement un sujet délicat.','Une maladresse met des extrémités du corps dans la vaisselle.'],
 ['Faire d’une pierre deux coups','Atteindre deux objectifs avec une seule action.','Un seul projectile produit un double effet.'],
 ['Ne pas chercher midi à quatorze heures','Éviter de compliquer inutilement les choses.','Deux heures différentes, dont une après le déjeuner.'],
 ['Avoir un poil dans la main','Être très paresseux.','Une pilosité improbable au creux de la paume.'],
 ['Être le dindon de la farce','Être celui qui se fait duper.','Une volaille est la victime d’une plaisanterie.'],
 ['Décrocher la lune','Obtenir quelque chose qui semblait impossible.','Un satellite naturel devient un objectif à atteindre.'],
 ['La nuit porte conseil','Prendre le temps de dormir aide à décider.','La période sombre de la journée apporte de la sagesse.'],
 ['Qui va à la chasse perd sa place','S’absenter peut faire perdre ce que l’on occupait.','Une activité de traque coûte son siège à quelqu’un.'],
 ['Après la pluie le beau temps','Les moments difficiles finissent par passer.','Une amélioration de la météo exprime l’espoir.'],
 ['Il ne faut pas pousser mémé dans les orties','Il ne faut pas exagérer.','Une grand-mère et des plantes urticantes.'],
 ['Les cordonniers sont les plus mal chaussés','On néglige parfois pour soi son propre savoir-faire.','Des artisans du soulier manquent d’un bon équipement personnel.'],
 ['Loin des yeux loin du cœur','La distance peut affaiblir les liens.','La vue et les sentiments se retrouvent éloignés.'],
 ['Le mieux est l’ennemi du bien','Vouloir trop perfectionner peut gâcher un résultat satisfaisant.','Deux niveaux de qualité deviennent adversaires.'],
 ['Une hirondelle ne fait pas le printemps','Un seul signe ne permet pas de conclure.','Un oiseau migrateur ne suffit pas à annoncer une saison.'],
 ['Il ne faut pas réveiller le chat qui dort','Mieux vaut ne pas raviver un problème assoupi.','On laisse un félin poursuivre son sommeil.'],
 ['À cœur vaillant rien d’impossible','Le courage permet de surmonter les obstacles.','Un organe courageux rend les obstacles surmontables.'],
 ['Qui vole un œuf vole un bœuf','Une petite malhonnêteté peut en annoncer une grande.','Un petit produit du poulailler et un grand bovin.'],
];
export const DAILY_QUESTIONS:(Question&{dailyHint:string})[]=entries.map(([answer,hint,dailyHint])=>({answer,hint,dailyHint,theme:'daily',wiki:''}));

// Longer, reviewed additions with linked definition sources, reserved for the daily mode.
DAILY_QUESTIONS.push(...[
  {
    "answer": "Arriver comme un cheveu sur la soupe",
    "hint": "Arriver de façon soudaine, par hasard.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 7 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/arriver_comme_un_cheveu_sur_la_soupe"
  },
  {
    "answer": "Au royaume des aveugles, les borgnes sont rois",
    "hint": "Avec une aptitude ou un savoir médiocre, on brille au milieu des inaptes ou des ignorants.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/au_royaume_des_aveugles,_les_borgnes_sont_rois"
  },
  {
    "answer": "Avoir le rythme dans la peau",
    "hint": "Être naturellement doué pour la musique et pour la danse.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_rythme_dans_la_peau"
  },
  {
    "answer": "Avoir du sang dans les veines",
    "hint": "Être courageux voire téméraire.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_du_sang_dans_les_veines"
  },
  {
    "answer": "Avoir le fin mot de l’histoire",
    "hint": "Obtenir une explication, la clé d’un mystère, la révélation d’un secret.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_fin_mot_de_l’histoire"
  },
  {
    "answer": "Avoir du travail sur la planche",
    "hint": "Avoir du travail à faire encore.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_du_travail_sur_la_planche"
  },
  {
    "answer": "Avoir du plomb dans la cervelle",
    "hint": "Être réfléchi, avoir du bon sens.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_du_plomb_dans_la_cervelle"
  },
  {
    "answer": "Avoir les nerfs à fleur de peau",
    "hint": "Être irrité, énervé.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "aliases": [
      "Avoir les nerfs à vif"
    ],
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_les_nerfs_à_fleur_de_peau"
  },
  {
    "answer": "Avoir le cœur au bord des lèvres",
    "hint": "Avoir envie de vomir.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_cœur_au_bord_des_lèvres"
  },
  {
    "answer": "Avoir le couteau entre les dents",
    "hint": "Être sous tension, prêt à se venger.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_couteau_entre_les_dents"
  },
  {
    "answer": "Avoir le courage de ses opinions",
    "hint": "Soutenir ses opinions en public.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_courage_de_ses_opinions"
  },
  {
    "answer": "Avoir les yeux en face des trous",
    "hint": "Comprendre normalement.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_les_yeux_en_face_des_trous"
  },
  {
    "answer": "Avoir le sang qui monte à la tête",
    "hint": "Commencer à s'énerver.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_sang_qui_monte_à_la_tête"
  },
  {
    "answer": "Avoir le moral dans les chaussettes",
    "hint": "Ne plus avoir le moral.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_le_moral_dans_les_chaussettes"
  },
  {
    "answer": "Avoir les dents du fond qui baignent",
    "hint": "Avoir trop mangé et être pris de nausées, être sur le point de vomir.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_les_dents_du_fond_qui_baignent"
  },
  {
    "answer": "Avoir les dents qui rayent le parquet",
    "hint": "Afficher une ambition démesurée.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_les_dents_qui_rayent_le_parquet"
  },
  {
    "answer": "Avoir les yeux plus grands que le ventre",
    "hint": "Prendre plus qu’on ne peut manger, avoir plus de convoitise que d’appétit.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_les_yeux_plus_grands_que_le_ventre"
  },
  {
    "answer": "Avoir eu son permis dans une pochette-surprise",
    "hint": "Être un piètre conducteur, comme si on avait obtenu le permis de conduire sans passer d’examen.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/avoir_eu_son_permis_dans_une_pochette-surprise"
  },
  {
    "answer": "Bien mal acquis ne profite jamais",
    "hint": "Un bien mal acquis ne profite pas à celui qui le possède.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 4 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/bien_mal_acquis_ne_profite_jamais"
  },
  {
    "answer": "Boire la coupe jusqu’à la lie",
    "hint": "Assumer les conséquences désastreuses de ses actions.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/boire_la_coupe_jusqu’à_la_lie"
  },
  {
    "answer": "Brosser dans le sens du poil",
    "hint": "Flatter une personne dans le but d’obtenir sa confiance.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 7 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/brosser_dans_le_sens_du_poil"
  },
  {
    "answer": "Brûler la chandelle par les deux bouts",
    "hint": "User son corps par un mode de vie frénétique ; vivre de manière trop intense.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 6 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/brûler_la_chandelle_par_les_deux_bouts"
  },
  {
    "answer": "Cacher la poussière sous le tapis",
    "hint": "Dissimuler, remettre à plus tard quelque chose, généralement embarrassant.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 6 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/cacher_la_poussière_sous_le_tapis"
  },
  {
    "answer": "Ce n’est pas tous les jours dimanche",
    "hint": "En bonne part, souligne que l’on peut se permettre le dimanche ce qui ne l’est pas les autres jours de la semaine.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ce_n’est_pas_tous_les_jours_dimanche"
  },
  {
    "answer": "Ce n’est pas à un vieux singe qu’on apprend à faire des grimaces",
    "hint": "Ce n’est pas à un expert que l’on apprend sa spécialité.",
    "dailyHint": "Expression en 13 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ce_n’est_pas_à_un_vieux_singe_qu’on_apprend_à_faire_des_grimaces"
  },
  {
    "answer": "Chacun pour soi, Dieu pour tous",
    "hint": "L’individualisme est préférable à la solidarité.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 6 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/chacun_pour_soi,_Dieu_pour_tous"
  },
  {
    "answer": "Charité bien ordonnée commence par soi-même",
    "hint": "Il faut penser à soi avant de s’occuper des autres.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 7 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/charité_bien_ordonnée_commence_par_soi-même"
  },
  {
    "answer": "Chercher des poux sur la tête",
    "hint": "Importuner, harceler sur des points de détail ; quereller pour des choses oiseuses.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 8 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/chercher_des_poux_sur_la_tête"
  },
  {
    "answer": "Choisir entre la peste et le choléra",
    "hint": "Dilemme où on doit choisir l’une de deux mauvaises choses.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 7 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/choisir_entre_la_peste_et_le_choléra"
  },
  {
    "answer": "Faire de la prose sans le savoir",
    "hint": "Réussir par hasard et sans dessein.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/faire_de_la_prose_sans_le_savoir"
  },
  {
    "answer": "Fais ce que je dis, pas ce que je fais",
    "hint": "Se dit à une personne dont le comportement n’est pas conforme à ses conseils.",
    "dailyHint": "Expression en 10 mots. Le premier mot comporte 4 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/fais_ce_que_je_dis,_pas_ce_que_je_fais"
  },
  {
    "answer": "Il n’y a pas de petits profits",
    "hint": "Chaque gain est important.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/il_n’y_a_pas_de_petits_profits"
  },
  {
    "answer": "Il vaut mieux tenir que courir",
    "hint": "Ce proverbe signifie que posséder une chose de faible valeur vaut mieux qu'être à la poursuite d'un bien plus considérable.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/il_vaut_mieux_tenir_que_courir"
  },
  {
    "answer": "Il n’y a pas de temps à perdre",
    "hint": "Il faut agir ou commencer maintenant.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/il_n’y_a_pas_de_temps_à_perdre"
  },
  {
    "answer": "Il n’y a pas de quoi fouetter un chat",
    "hint": "Cela n’est pas si grave, il n'y a pas lieu de s’alarmer.",
    "dailyHint": "Expression en 9 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/il_n’y_a_pas_de_quoi_fouetter_un_chat"
  },
  {
    "answer": "Il vaut mieux s’adresser au Bon Dieu qu’à ses saints",
    "hint": "Il est plus utile de s'organiser avec le décisionnaire plutôt qu'avec son messager.",
    "dailyHint": "Expression en 10 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/il_vaut_mieux_s’adresser_au_Bon_Dieu_qu’à_ses_saints"
  },
  {
    "answer": "Il ne faut pas dire : fontaine, je ne boirai pas de ton eau",
    "hint": "Il ne faut jamais agir comme si l’on était certain de ne jamais avoir besoin d’une chose ou d’une personne.",
    "dailyHint": "Expression en 14 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/il_ne_faut_pas_dire_:_fontaine,_je_ne_boirai_pas_de_ton_eau"
  },
  {
    "answer": "Jeter le bébé avec l’eau du bain",
    "hint": "Ne pas prendre la peine de séparer le bon du mauvais et tout jeter.",
    "dailyHint": "Expression en 7 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/jeter_le_bébé_avec_l’eau_du_bain"
  },
  {
    "answer": "La vie n’est pas un long fleuve tranquille",
    "hint": "La vie n’est pas toujours une partie de plaisir.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/la_vie_n’est_pas_un_long_fleuve_tranquille"
  },
  {
    "answer": "La parole est d’argent et le silence est d’or",
    "hint": "Mieux vaut parfois se taire plutôt que parler.",
    "dailyHint": "Expression en 9 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/la_parole_est_d’argent_et_le_silence_est_d’or"
  },
  {
    "answer": "La raison du plus fort est toujours la meilleure",
    "hint": "Ce proverbe sous-entend une loi « naturelle » avec laquelle la justice n’a que peu à voir.",
    "dailyHint": "Expression en 9 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/la_raison_du_plus_fort_est_toujours_la_meilleure"
  },
  {
    "answer": "Le chemin de l’enfer est pavé de bonnes intentions",
    "hint": "En pensant bien agir, on peut néanmoins obtenir un effet contraire.",
    "dailyHint": "Expression en 9 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/le_chemin_de_l’enfer_est_pavé_de_bonnes_intentions"
  },
  {
    "answer": "Les loups ne se mangent pas entre eux",
    "hint": "Les méchants, les puissants, ne cherchent pas à se nuire l’un l’autre.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 3 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/les_loups_ne_se_mangent_pas_entre_eux"
  },
  {
    "answer": "Les paroles s’envolent, les écrits restent",
    "hint": "Proverbe qui invite à la prudence, en rappelant que, contrairement aux paroles, les écrits ne s’évanouissent pas dans l’air et laissent des traces qui peuvent être compromettantes.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 3 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/les_paroles_s’envolent,_les_écrits_restent"
  },
  {
    "answer": "L’argent ne tombe pas du ciel",
    "hint": "Il faut travailler dur pour gagner de l’argent.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 7 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/l’argent_ne_tombe_pas_du_ciel"
  },
  {
    "answer": "Mieux vaut un tu l’as que deux tu l’auras",
    "hint": "Mieux vaut opter pour quelque chose que l’on peut obtenir immédiatement plutôt que pour quelque chose de plus de valeur mais que l’on n'est pas sûr d’obtenir plus tard.",
    "dailyHint": "Expression en 9 mots. Le premier mot comporte 5 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/mieux_vaut_un_tu_l’as_que_deux_tu_l’auras"
  },
  {
    "answer": "Même une horloge arrêtée donne l’heure juste deux fois par jour",
    "hint": "Une personne ou un instrument normalement peu fiable peut occasionnellement fournir des informations correctes, même si ce n’est que par accident.",
    "dailyHint": "Expression en 11 mots. Le premier mot comporte 4 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/même_une_horloge_arrêtée_donne_l’heure_juste_deux_fois_par_jour"
  },
  {
    "answer": "Ne pas avoir voix au chapitre",
    "hint": "Ne pas avoir son mot à dire, ne pas être maître d’une situation.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ne_pas_avoir_voix_au_chapitre"
  },
  {
    "answer": "Ne pas avoir inventé la poudre",
    "hint": "Ne pas être très intelligent ; être simple d'esprit, simplet.",
    "dailyHint": "Expression en 6 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ne_pas_avoir_inventé_la_poudre"
  },
  {
    "answer": "Ne pas être à prendre avec des pincettes",
    "hint": "Être extrêmement sale.",
    "dailyHint": "Expression en 8 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ne_pas_être_à_prendre_avec_des_pincettes"
  },
  {
    "answer": "Ne pas être le couteau le plus affûté du tiroir",
    "hint": "Ne pas être très malin ; être un peu idiot.",
    "dailyHint": "Expression en 10 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ne_pas_être_le_couteau_le_plus_affûté_du_tiroir"
  },
  {
    "answer": "Ne fais pas à autrui ce que tu ne voudrais pas qu’on te fît",
    "hint": "On ne doit pas faire aux autres ce qu’on n’accepterait pas de vivre soi-même.",
    "dailyHint": "Expression en 14 mots. Le premier mot comporte 2 lettres.",
    "theme": "daily",
    "wiki": "https://fr.wiktionary.org/wiki/ne_fais_pas_à_autrui_ce_que_tu_ne_voudrais_pas_qu’on_te_fît"
  }
]);
