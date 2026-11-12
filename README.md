# Tikka

Chronos de séance — intervalles rameur, complexes haltéro, EMOM, AMRAP.

PWA installable sur l'écran d'accueil, qui marche sans réseau. Les chronos enregistrés et
l'historique des séances vivent dans le navigateur du téléphone : pas de compte, pas de
serveur.

## Développement

```sh
nvm use          # Node 22, cf. .nvmrc
npm install
npm run dev -- --host   # puis ouvrir l'URL réseau depuis le téléphone
```

- `npm run build` — vérification TypeScript et build de production
- `npm run lint` — oxlint

## Déploiement

Chaque push sur `main` publie sur GitHub Pages : https://cdrcbrnrd.github.io/tikka/
