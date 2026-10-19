# squaregrid

Outil de visualisation pour la détermination de N = pq.

Le projet illustre la méthode de Fermat : on cherche deux entiers X et Y tels que N + X² = Y², ce qui donne N = (Y − X)(Y + X). Les nombres sont disposés sur une grille pour rendre visibles les carrés, les nombres premiers et les facteurs.

# Lien

https://nadfri.github.io/squaregrid/

# Pages

- **Grille** (`index.html`) : visualisation des nombres, pyramides et carrés. Le bouton « Factoriser → » ouvre la page de factorisation.
- **Factorisation** (`square.html`) : calcule p et q à partir de N avec plusieurs méthodes, exécutées dans des Web Workers.

# Grille

| Contrôle               | Rôle                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Init                   | Nombre de départ de la grille (± 1 avec les boutons ou les flèches)                                 |
| p × q                  | Calcule N = p × q                                                                                   |
| N                      | Valeur de référence, mise en évidence sur la grille                                                 |
| Modulo m               | Grise les cases qui ne peuvent pas être un carré modulo m (plusieurs m séparés par des virgules)    |
| Pyramide de Fermat (N) | N au sommet, puis des lignes de 1, 3, 5… nombres : la ligne X se termine sur N + X²                 |
| Pyramide (N)           | Pyramide de N nombres (max 1 000 000)                                                               |
| Carré (N)              | Carré de côté ⌊√N⌋ centré, avec les cases restantes sur les lignes en dessous (10×10 si N est vide) |
| Voir N                 | Centre la vue sur N                                                                                 |
| Reset                  | Vide la grille                                                                                      |

Outils (barre du bas) :

- **Dessin** (D) : clic ou glisser pour ajouter ou retirer des cases.
- **Déplacer** (H ou Espace maintenu) : déplacer la vue.
- **Sélection** (S) : glisser pour sélectionner un rectangle, puis Ajouter (Entrée), Supprimer (Suppr) ou Annuler (Échap).
- Zoom − / +, et **Ajuster** (F) pour cadrer la grille.

Légende des couleurs : premier, carré, N, p/q/pq, composé, et case grisée pour « pas un carré modulo m ».

# Factorisation

- Saisir p et q pour calculer N, ou saisir N directement, éventuellement multiplié par k.
- Méthodes : Fermat, Lehman, Pollard-Brent ρ. Pour N de base, les trois méthodes tournent en parallèle ; pour N modifié, seul Fermat est lancé.
- Le bouton « Chercher m automatiquement » lance Lehman seul, en essayant les multiplicateurs 4k.

# Stack

- [Vite](https://vite.dev) (`vite-plus`) et TypeScript
- Canvas 2D pour la grille
- Web Workers pour la classification des nombres et la factorisation
- Calculs en `BigInt` (`src/lib/`)

# Installation

```sh
npm install
npm run dev
```

Le serveur de développement est lancé sur http://localhost:5173/.

# Scripts

| Commande            | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Serveur de développement                        |
| `npm run build`     | Vérification des types puis build de production |
| `npm run preview`   | Prévisualisation du build                       |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`)        |
| `npm run lint`      | Lint                                            |
| `npm run fmt`       | Formatage                                       |
| `npm run check`     | Lint et formatage                               |
| `npm test`          | Tests de cohérence (`scripts/sanity.ts`)        |

# Outils en ligne de commande (`scripts/`)

- `scripts/sanity.ts` : vérifie la primalité, Fermat, Lehman, rho et la classification de la grille par rapport à des valeurs de référence.
- `scripts/multipliers.ts N` : itérations de Fermat pour N × m, pour de petits multiplicateurs m.
- `scripts/semiprime.ts [chiffres]` : génère un semi-premier aléatoire équilibré, utile pour tester des outils de factorisation externes.

# Structure

```
index.html              Page grille
square.html             Page factorisation
src/grid.ts             Rendu canvas, modèle et interactions de la grille
src/square.ts           Logique de la page factorisation
src/factor.worker.ts    Worker de factorisation
src/classify.worker.ts  Worker de classification des nombres
src/lib/                Algorithmes : Fermat, Lehman, rho, primalité, BigInt, modulo
src/styles/             Feuilles de style
scripts/                Outils en ligne de commande et tests
```
