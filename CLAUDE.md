# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ce que c'est

Tikka, un chrono de séance (intervalles rameur, complexes haltéro, EMOM, AMRAP), PWA
installable sur l'écran d'accueil d'un iPhone et qui marche sans réseau. Pas de compte, pas
de back : les chronos et l'historique vivent dans le `localStorage` du téléphone.

La cible réelle est un iPhone en portrait, écran verrouillé en mode portrait, souvent posé
par terre à côté du rameur. Tout arbitrage d'ergonomie se tranche là, pas au bureau.

## Commandes

```sh
nvm use                 # Node 22.23.1, cf. .nvmrc
npm install
npm run dev -- --host   # l'URL réseau est celle à ouvrir depuis le téléphone
npm run build           # tsc -b puis vite build
npm run lint            # oxlint, pas ESLint
```

Il n'y a **aucun harnais de test** dans le dépôt : ni unitaire, ni e2e. La recette se fait à
la main dans le navigateur, en portrait 414 × 896. Ne pas en installer un sans accord.

## Déploiement

Un push sur `main` déclenche `.github/workflows/deploy.yml` : `npm ci`, `npm run lint`,
`npm run build`, puis publication sur GitHub Pages — https://cdrcbrnrd.github.io/tikka/.
Le lint casse le déploiement, donc il passe avant de pousser.

`base: '/tikka/'` dans `vite.config.ts` et un `HashRouter` : Pages ne sait pas réécrire les
URL vers `index.html`, les routes passent donc par le `#`.

## Architecture

Quatre couches, et la dépendance ne va que vers le bas :

- `src/domain/` — TypeScript pur, aucun React. Le modèle `Timer` et ses dérivés.
- `src/engine/` — les hooks à effets de bord : chrono, sons, veille de l'écran.
- `src/store/` — trois stores zustand `persist` (`tikka.timers`, `tikka.settings`, `tikka.history`).
- `src/screens/` + `src/components/` — les écrans câblés aux routes, et des composants sans état.

### Tout part des segments

`buildSegments(timer)` dans `src/domain/plan.ts` déplie un chrono en une liste plate de
`Segment` (`prepare`, `work`, `rest`, avec son label et son round). **C'est la seule source de
vérité sur le déroulé d'une séance** : le moteur, le compteur de rounds, le total affiché sur
la carte et les tops sonores en sortent tous.

Il passe par deux étages, et c'est ce qui empêche une règle d'être recopiée :

- `planOf(timer)` traduit les réglages saisis en un `Plan` — des blocs, des étapes, des
  drapeaux. Un bras par type de chrono, purement déclaratif : il rend une donnée et ne sait
  pas fabriquer un `Segment`.
- `expand(plan)` est **la seule boucle de l'application**. Les règles transverses y vivent et
  nulle part ailleurs : boucler les rounds, supprimer le dernier repos, insérer un repos
  entre deux séries, ne rien mettre après un segment ouvert, garder l'échauffement et le
  retour au calme hors des rounds.

Ajouter un type de chrono, c'est donc ajouter un bras de `planOf` et un formulaire. Changer
une règle de déroulé, c'est toucher `expand`.

`src/domain/timer.ts` garde le modèle saisi — ce que l'athlète a réglé — et importe
`buildSegments` pour le total de la carte. `plan.ts` n'importe de lui que le *type* `Timer`,
donc il n'y a pas de cycle à l'exécution.

Une `duration` à `null` veut dire « jusqu'à ce que l'athlète arrête » — seul le dernier
segment peut être ouvert, c'est ce qui distingue le chrono montant du reste.

### Le moteur

`useRunner` tient l'horloge sur `Date.now()` moins l'instant de départ, décalé en avant à la
reprise : le temps écoulé reste une soustraction, jamais une accumulation de ticks, donc
l'écran éteint ou l'onglet en arrière-plan ne font pas dériver la séance. La boucle est en
`requestAnimationFrame` mais ne pousse un état que tous les 100 ms. Machine à états :
`idle → running ⇄ paused → done`.

`cueScheduler` dédoublonne les tops : un seul par transition et par seconde décomptée, pour
qu'un retour de veille ne tire pas une rafale de bips.

### Les contraintes iOS, toutes dans `src/engine/`

- `unlockAudio()` doit être appelé **dans un geste utilisateur** (c'est fait au démarrage de la séance), sinon iOS ne laisse rien passer.
- `navigator.audioSession.type = 'playback'` pendant la séance : sans ça le petit bouton silencieux coupe les tops. Remis à `auto` en sortant, pour ne pas bloquer la musique.
- `releaseAudio()` ferme le contexte avec 1,2 s de retard, le top de fin durerait moins que ça.
- `useWakeLock` reprend la main sur `visibilitychange` : le verrou est perdu à chaque passage en arrière-plan.

### La mise à jour de l'app

`registerType: 'prompt'` dans `vite.config.ts`, volontairement : une mise à jour
automatique rechargerait la page et jetterait une séance en cours. Conséquence à connaître —
l'app installée continue de servir la version précédente jusqu'à un démarrage à froid, donc
une recette qui ne voit pas un changement poussé est d'abord un soupçon de cache, pas de code.
Il n'existe aucun bandeau « nouvelle version », c'est assumé.

Conséquence directe sur le stockage : **ajouter un type de chrono veut dire monter la `version`
de `tikka.timers`** (`src/store/timers.ts`). Sans ça, le bundle précédent relit un type qu'il ne
sait pas déplier, `planOf` ne rend rien et l'écran d'accueil plante jusqu'au démarrage à froid ;
avec, il repart d'une liste vide. La migration efface les chronos, c'est le prix assumé.

## Conventions

- **Styles** : un `*.module.css` par écran et par composant, plus des classes utilitaires globales dans `global.css` (`.screen`, `.screen-footer`, `.screen-head`, `.screen-intro`, `.title`, `.subtle`,
  `.group-label`, `.line`, `.field`, `.text-input`, `.digits`, `.grow`, `.empty`, `.one-line`). Toujours passer par les tokens de `tokens.css`, jamais une valeur en dur. Le détail des jetons — rôle de chacun, valeurs des trois ambiances, qui consomme quoi — est dans `docs/design-tokens.md` : à lire avant de toucher à `tokens.css` ou d'ajouter une ambiance.
- **Hauteurs d'écran** : `var(--app-height, 100dvh)`, jamais `100%` ni `vh`, et `env(safe-area-inset-*)` pour les bords. `--app-height` est mesuré en JS par `useAppHeight` parce que l'app installée reçoit une hauteur périmée au premier affichage ; `dvh` reste le repli. Un élément collé en bas se cale sur `--screen-bottom`.
- **Thèmes** : trois ambiances (`foret`, `nuit`, `braise`) déclarées dans `src/domain/theme.ts` et `tokens.css`, posées en `data-theme` sur `<html>`. En ajouter une veut dire toucher les deux fichiers, et `useTheme` met aussi à jour le `meta[name=theme-color]`, que la barre d'état de l'app installée est seule à lire.
- **Une ambiance se fait avec des jetons, pas des surcharges** : si une règle `[data-theme=...]` apparaît dans un module, c'est presque toujours que la valeur est dans la mauvaise case. `--surface-ring` (le filet d'une carte, transparent par défaut) et `--surface-active` existent pour ça.
- **Icônes** : uniquement via `src/components/Icon.tsx` (lucide), jamais un glyphe importé dans un écran.
- **Textes** : l'interface est en français, avec les apostrophes typographiques (`’`). Les durées passent par les helpers de `src/domain/format.ts` (`clock`, `clockShort`, `clockTenths`, `plural`), pas par un calcul sur place.
- **Suppression** : une modale `Confirm`, jamais un message en ligne.
- **Commentaires de code** : en anglais, une ligne, et seulement pour une raison qu'on ne devine pas en lisant (une contrainte iOS, un piège de rendu). Le dépôt suit ça de bout en bout, s'y tenir.
