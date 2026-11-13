# Jetons de style

Tout ce qui se voit à l'écran sort de `src/styles/tokens.css`. Un écran ou un composant
ne pose jamais une couleur, un rayon ou un espacement en dur : il appelle un jeton. C'est
ce qui fait qu'une ambiance se change en une ligne et que les trois se ressemblent sans
être identiques.

Deux familles :

- **les couleurs**, redéfinies par chaque ambiance sur `[data-theme=...]` ;
- **le reste** — espace, rayons, tailles, typo —, déclaré une seule fois sur `:root` et
  commun aux trois ambiances.

## Couleurs

Huit jetons portent une ambiance complète. Chacun a un rôle, pas une teinte :

| Jeton | À quoi il sert |
| --- | --- |
| `--bg` | le fond de l'écran |
| `--surface` | le fond d'une carte, d'une modale, d'un champ |
| `--surface-active` | la même surface quand on appuie dessus ou qu'elle est sélectionnée |
| `--surface-ring` | le filet d'une carte — `transparent` par défaut, une ambiance l'allume si elle en a besoin |
| `--line` | les séparateurs et les bordures |
| `--text` | le texte courant |
| `--muted` | le texte secondaire, les unités, les écrans vides |
| `--accent` | l'action principale, le focus, la progression |
| `--on-accent` | ce qui s'écrit **sur** l'accent |

`--surface-ring` est la soupape : une ambiance qui ne remplit pas ses cartes les dessine
avec un filet au lieu d'une surcharge locale. Aucune des trois ne l'allume aujourd'hui —
il est transparent partout, et les cinq `box-shadow` qui le lisent ne peignent rien. S'il faut écrire une règle `[data-theme=...]`
dans un module, c'est presque toujours qu'une valeur est dans la mauvaise case.

### Les trois ambiances

| | `foret` (défaut) | `nuit` | `braise` |
| --- | --- | --- | --- |
| `--bg` | `#16231c` | `#12161f` | `#1c1714` |
| `--surface` | `#1f3328` | `#1b2130` | `#2a221d` |
| `--surface-active` | `#26402f` | `#232b3d` | `#342a23` |
| `--surface-ring` | transparent | transparent | transparent |
| `--line` | `#2c4536` | `#2a3245` | `#3b3029` |
| `--text` | `#f2eadf` | `#eef1f7` | `#f4ece3` |
| `--muted` | `#9fb0a4` | `#99a3b8` | `#b3a294` |
| `--accent` | `#ff2e88` | `#ff6a3d` | `#2bd9a0` |
| `--on-accent` | `#1a0210` | `#1a0a04` | `#04190f` |

Toutes sont sombres : l'app se regarde par terre à côté du rameur, souvent le soir. Chaque
ambiance pose un fond froid ou chaud et prend l'accent dans l'autre famille, pour que le
bouton d'action se détache sans éclairer l'écran.

Une ambiance de plus veut dire deux fichiers : la fiche dans `src/domain/theme.ts` — avec
ses trois pastilles `swatch`, qui reprennent `--bg`, `--text` et `--accent` — et le bloc
`[data-theme=...]` dans `tokens.css`. `useTheme` pose l'attribut sur `<html>` et met à jour
le `meta[name=theme-color]`, le seul que lise la barre d'état de l'app installée.

## Espace

```
--space-1  0.25rem     --space-5  1.5rem
--space-2  0.5rem      --space-6  2rem
--space-3  0.75rem     --space-7  3rem
--space-4  1rem
```

L'échelle est en `rem`, donc elle suit la taille de base du lecteur et la largeur de
l'écran : `html` est en `clamp(1rem, 0.9rem + 1.05vw, 1.2rem)`. Un seul levier fait grandir
tout l'ensemble, texte et gouttières compris.

## Rayons

```
--radius       1rem      cartes, modales, champs
--radius-sm    0.625rem  petits blocs
--radius-pill  999px     pastilles, tags, boutons ronds
```

## Cibles tactiles

```
--tap      48px   la plus petite zone cliquable admise
--control  56px   la hauteur d'un bouton d'action
```

Ces deux-là sont en pixels exprès : ce sont des tailles de doigt, pas de texte. Elles ne
doivent pas grossir quand le lecteur augmente sa police, sinon le pouce ne retrouve plus
ses repères.

## Hauteurs et bords

```
--app-height      la hauteur utile, écrite en JS par useAppHeight
--safe-top        env(safe-area-inset-top)
--safe-bottom     env(safe-area-inset-bottom)
--screen-gap      la bande laissée sous la vue, mesurée en JS par useAppHeight
--screen-bottom   --safe-bottom moins cette bande, avec un plancher à --space-4
```

Un écran se mesure en `var(--app-height, 100dvh)`, jamais en `100%` ni en `vh` : l'app
installée reçoit une hauteur périmée au premier affichage, `dvh` ne sert que de repli. Ce
qui se colle en bas se cale sur `--screen-bottom`, et le haut sur `--safe-top`. Les deux
`env()` ne sont lus qu'ici : un module ne les appelle jamais en direct, sinon la recette ne
peut plus les simuler.

L'app installée reçoit une vue qui s'arrête avant le bord bas de l'écran — 48 px sur un
iPhone 11, soit exactement la safe area du haut. Cette bande dégage déjà l'indicateur
d'accueil, donc `useAppHeight` la mesure dans `--screen-gap` et `--screen-bottom` la déduit
de la safe area pour ne pas la payer deux fois. La mesure n'est retenue que si elle égale
cette safe area du haut : un onglet et ses barres d'outils, un écran tourné ou une fenêtre
de bureau donnent un écart quelconque, et la bande retombe à zéro. Un plancher à
`--space-4` garde enfin la barre du bas à distance du bord quand il n'y a aucune safe
area à dépenser — le navigateur, essentiellement.

Le navigateur, lui, ne connaît aucune safe area : une recette à 414 × 896 étalerait donc la
page 82 px plus haut que le téléphone. `src/dev/safeAreaPreview.ts` pose les valeurs d'un
iPhone 11 — 48 en haut, 34 en bas — sur `--safe-top` et `--safe-bottom`, et seulement là où
`env()` répond zéro : un vrai appareil garde les siennes. Le module n'est importé que si
`import.meta.env.DEV`, donc le build publié ne le contient pas.

## Typographie

```
--font     la pile système iOS
--text-xs  0.8125rem   mentions, unités
--text-sm  0.9375rem   texte secondaire (.subtle)
--text-md  1.0625rem   texte courant, taille du body
--text-lg  1.375rem    sous-titres
--text-xl  2.125rem    titres d'écran (.title)
```

Les cinq tailles reprennent les styles de texte d'iOS — footnote, subheadline, body,
title 2, large title. Les chiffres qui défilent passent par `.digits`, qui fixe la chasse
pour que le chrono ne tremble pas entre deux secondes.

## Mouvement

```
--transition  150ms ease
```

Valeur unique, et `prefers-reduced-motion` coupe transitions et animations pour tout le
monde dans `global.css`.
