# EDUCFI critique – activités pour la 4e

Quatre activités de 40 min (jeu + débrief) pour aborder le programme EDUCFI / Passeport EDUCFI avec un regard **questionnant** : qui décide, qui gagne, qu'est-ce qui dépend de chacun ?

| Thème | Activité | Format |
|---|---|---|
| Budget | Mêmes aléas, pas les mêmes vies | Jeu de plateau (pions, cartes, billets) |
| Banque et paiement | La journée des frais | Fiction interactive (web) |
| Épargne et crédit | Le crédit qui gagne | Jeu de plateau à 3 rôles |
| Arnaques et consommation | Arnaque ou pas ? | Escape game (web) |

## Contenu
```
public/                  ← tout ce qui est déployé
  index.html             catalogue
  jeux/frais/            fiction interactive
  jeux/arnaque/          escape game
  prof/                  tableau de bord enseignant (mot de passe)
  api/                   collect.php, list.php (PHP, stockage JSONL)
  assets/suivi.js        suivi élève (code classe + pseudo)
  imprimables/           jeux PDF, fiches élève, corrigé, guide, grille d'évaluation
3d/pion_famille.scad     pions et jetons (OpenSCAD, makers club)
tools/e2e_test.py        test de bout en bout (php + Chromium)
docs/                    DEPLOIEMENT.md, RGPD.md
.github/workflows/       déploiement automatique
```

## Utilisation en classe
1. Donner un **code de classe** aux élèves (ex. `4B-LAB`) ; ils choisissent un **pseudo** (pas leur vrai nom).
2. Ils jouent (ou « Jouer sans suivi »). À la fin, le bilan part chez l'enseignant ; sans connexion, un **code de bilan** à copier s'affiche.
3. L'enseignant ouvre `/prof/` : avancement, quiz, erreurs par document, chronologie détaillée, export CSV, suppression des données.
4. Débrief avec les **fiches élève** (A4 recto-verso, questions de débrief + entraînement type quiz Passeport) ; évaluation avec la **grille**.

## Déploiement
`git push` sur `main` → GitHub Actions → rsync SSH vers le serveur. Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).
Données personnelles : [docs/RGPD.md](docs/RGPD.md).

## Points d'attention
- Montants, banques et personnages sont **fictifs**. Les plafonds (commissions d'intervention, offre clientèle fragile) et numéros (33700, Info Escroqueries) viennent de sources officielles : **à revérifier avant chaque rentrée**.
- Le Passeport EDUCFI est un quiz à l'issue de la phase de découverte (BO n° 10 du 5 mars 2026) ; son format exact n'est pas détaillé : les questions d'entraînement sont des QCM d'inspiration.
- `pion_famille.scad` n'a pas été testé sous OpenSCAD.

## Licence
CC BY-NC-SA 4.0 — voir [LICENSE.md](LICENSE.md).
