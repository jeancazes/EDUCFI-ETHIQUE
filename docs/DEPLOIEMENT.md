# Déploiement sur le serveur perso (ex. laboratoirefabuleux.com)

Principe : un `git push` sur `main` lance GitHub Actions, qui vérifie le code puis synchronise `public/` vers le serveur par SSH (rsync).
Les données des élèves (`api/data/`) ne sont jamais écrasées ni supprimées.

## Prérequis serveur
- Hébergement avec **PHP ≥ 8.0** et **accès SSH** (Hostinger : activer SSH dans hPanel ; le port est souvent 65002, à vérifier).
- Serveur **Apache/LiteSpeed** (les `.htaccess` protègent `config.php` et `api/data/`). Avec Nginx, ajouter les règles équivalentes (voir plus bas).
- HTTPS activé.

## 1. Clé SSH dédiée
```bash
ssh-keygen -t ed25519 -f deploy_educfi -C "github-actions-educfi" -N ""
```
- Ajouter `deploy_educfi.pub` aux clés autorisées du serveur (hPanel → SSH → clés, ou `~/.ssh/authorized_keys`).
- Le contenu de `deploy_educfi` (clé privée) ira dans un secret GitHub. Ne jamais le committer.

## 2. Secrets GitHub (Settings → Secrets and variables → Actions)
| Secret | Exemple | Rôle |
|---|---|---|
| `SSH_HOST` | `123.45.67.89` ou `ssh.exemple.com` | serveur |
| `SSH_PORT` | `65002` | port SSH |
| `SSH_USER` | `u123456789` | utilisateur SSH |
| `SSH_KEY` | contenu de `deploy_educfi` | clé privée |
| `REMOTE_PATH` | `domains/laboratoirefabuleux.com/public_html/educfi` | dossier cible (créé au besoin) |
| `TEACHER_PASSWORD` | un mot de passe long | accès à `/prof/` (seul son hash SHA-256 est envoyé au serveur) |

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
