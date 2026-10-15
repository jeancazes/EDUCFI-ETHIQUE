# Déploiement sur le serveur perso (ex. laboratoirefabuleux.com)

Principe : un `git push` sur `main` lance GitHub Actions, qui vérifie le code puis envoie `public/` vers le serveur par FTP (FTPS).
Les données des élèves (`api/data/`) ne sont jamais écrasées ni supprimées.

## Prérequis serveur
- Hébergement avec **PHP ≥ 8.0** et un **compte FTP** (Hostinger : hPanel → Fichiers → **Comptes FTP**).
- Serveur **Apache/LiteSpeed** (les `.htaccess` protègent `config.php` et `api/data/`). Avec Nginx, ajouter les règles équivalentes (voir plus bas).
- HTTPS activé.

## 1. Compte FTP
Dans hPanel → Comptes FTP, relever : **hôte** (ex. `ftp.laboratoirefabuleux.com` ou une IP), **utilisateur**, **mot de passe** (le réinitialiser si besoin).
Idéal : créer un compte FTP **limité au dossier** `educfi` pour que GitHub n'ait pas accès au reste du site.

## 2. Secrets GitHub (Settings → Secrets and variables → Actions)
| Secret | Exemple | Rôle |
|---|---|---|
| `FTP_HOST` | `ftp.laboratoirefabuleux.com` | serveur FTP |
| `FTP_USER` | `u123456789.educfi` | utilisateur FTP |
| `FTP_PASSWORD` | (mot de passe du compte FTP) | connexion |
| `REMOTE_PATH` | `/public_html/educfi/` ou `./` | dossier cible, **avec `/` final** ; `./` si le compte FTP est déjà limité au dossier |
| `TEACHER_PASSWORD` | un mot de passe long, **différent** du FTP | accès à `/prof/` (seul son hash SHA-256 est envoyé au serveur) |

Le mot de passe FTP n'est jamais écrit dans le dépôt : il reste dans les secrets GitHub.

## 3. Premier déploiement
1. Pousser le dépôt sur GitHub (branche `main`).
2. Onglet **Actions** → « Déploiement (serveur perso) » → *Run workflow* (ou simple push).
3. Vérifier : `https://laboratoirefabuleux.com/educfi/` (catalogue), puis `/educfi/prof/`.

## 4. Vérifications après déploiement
- `https://…/educfi/api/config.php` doit renvoyer **403** (jamais le code).
- `https://…/educfi/api/data/` doit renvoyer **403/404**.
- Jouer à un jeu avec le code classe `TEST-1`, puis voir l'élève dans `/prof/`. Supprimer la classe `TEST-1` ensuite.

Si l'un des deux premiers points répond 200 : le serveur n'applique pas les `.htaccess`. Ajouter (Nginx) :
```nginx
location ~ ^/educfi/api/(data/|config\.php|lib\.php) { deny all; }
```

## Si le déploiement échoue
- *Timeout / connexion refusée* : vérifier l'hôte ; essayer `protocol: ftp` dans `.github/workflows/deploy.yml`.
- *Fichiers au mauvais endroit* : corriger `REMOTE_PATH` (chemin vu depuis la racine du compte FTP).
- Le fichier `.ftp-deploy-sync-state.json` est créé sur le serveur par l'action (il suit les fichiers envoyés) : ne pas le supprimer, il est protégé par `.htaccess`.
- Les données des élèves (`api/data/`) sont exclues de l'envoi : elles ne sont ni écrasées ni supprimées.

## Changer le mot de passe enseignant
Modifier le secret `TEACHER_PASSWORD`, puis relancer le workflow.

## Travailler en local
```bash
cp public/api/config.sample.php public/api/config.php   # puis mettre le hash : echo -n "mdp" | sha256sum
php -S 127.0.0.1:8080 -t public
```
Test complet : `python3 tools/e2e_test.py` (php, playwright et chromium requis ; le test refuse de s'exécuter si `config.php` existe).

## Partager avec d'autres enseignants
- **Utiliser ce serveur** : donner à chaque collègue un code de classe distinct (ex. `4B-DUPONT`). Le mot de passe `/prof/` donne accès à toutes les classes : pour une vraie séparation, chaque collègue déploie sa propre copie.
- **Sa propre copie** : *Fork* du dépôt, ses propres secrets, son propre hébergement PHP.
- Sans hébergement PHP, les jeux fonctionnent quand même : les élèves reçoivent un « code de bilan » à transmettre, importable dans `/prof/`.
