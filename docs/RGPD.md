# Données personnelles : ce que le suivi enregistre

À valider avec le chef d'établissement et le délégué à la protection des données (DPD) de l'académie avant un usage en classe. Ce document décrit le fonctionnement, il ne remplace pas cette validation.

## Données enregistrées (par partie jouée)
- **Code de classe** (saisi par l'élève, ex. `4B-LAB`)
- **Pseudo** (choisi par l'élève ; consigne affichée : pas de vrai nom)
- **Actions de jeu** : choix, réponses au quiz, verdicts, durée
- Horodatage serveur

## Données non enregistrées
- Pas de nom, e-mail, adresse IP, identifiant d'appareil, cookie ou traceur publicitaire.
- Pas de service tiers (aucun script externe : tout est hébergé sur votre serveur).
- Le navigateur de l'élève mémorise localement (localStorage) son pseudo et son code de classe, ainsi que les événements non encore envoyés.

## Bonnes pratiques
- Annoncer aux élèves le fonctionnement ; le bouton « Jouer sans suivi » reste possible.
- Donner un pseudo « neutre » (consigne en début de séance) et éviter les pseudos révélant l'identité.
- **Supprimer les données** en fin de période : `/prof/` → « Supprimer la classe » (ou un élève). Aucune sauvegarde automatique n'est faite par l'application.
- Ne pas utiliser les résultats comme note brute : ce sont des indicateurs de progression (voir la grille d'évaluation).
- Les fichiers de données sont dans `api/data/` (protégés par `.htaccess`) ; limiter l'accès SSH/FTP à vous seul.
