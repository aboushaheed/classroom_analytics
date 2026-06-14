# Déploiement & connexion Google (pour l'administrateur de l'app)

L'app est une SPA statique (Vite). Aucun backend. **Le Client ID est intégré
au déploiement** (variable `VITE_GOOGLE_CLIENT_ID`) : les professeurs n'ont
**rien à configurer**, ils se connectent simplement avec leur compte de
l'établissement.

> Le Client ID OAuth d'une app navigateur **n'est pas un secret** (ce flux n'a
> pas de client secret). Ce qui le protège : les **origines JavaScript
> autorisées** (ton URL Vercel) + l'écran de consentement **Internal**.

## 1. Google Cloud Console (une fois)

1. Crée un projet et active **Google Classroom API**.
2. **Écran de consentement OAuth → type « Internal »** (tous tes profs sont sur
   le même Google Workspace) : aucune vérification Google, aucune limite
   d'utilisateurs, seuls les comptes de ton domaine peuvent se connecter.
3. Crée un **ID client OAuth** (type *Application Web*).
4. **Origines JavaScript autorisées** :
   - `http://localhost:5173` et `http://localhost:5174` (dev),
   - l'URL de prod Vercel (ex. `https://classroom-analytics.vercel.app`).
   En production, ne garde que l'URL Vercel.
5. Copie le **Client ID**.

## 2. Configurer le Client ID

- **Local** : `cp .env.example .env.local` puis renseigne `VITE_GOOGLE_CLIENT_ID`.
- **Vercel** : Project → Settings → Environment Variables → ajoute
  `VITE_GOOGLE_CLIENT_ID` = ton Client ID (puis redeploy).

## 3. Lancer / déployer

```bash
npm install
npm run dev            # http://localhost:5173

npm i -g vercel
vercel --prod          # framework détecté = Vite (via vercel.json)
```
Après le 1er déploiement : ajoute l'URL de prod dans les origines autorisées (1.4).

## 4. Côté professeurs (rien à installer)

Ils ouvrent l'URL → **« Connexion avec Google »** → choisissent leur compte de
l'établissement → acceptent les autorisations Classroom → l'app charge **leurs**
cours/élèves/remises. Chaque prof ne voit que ses propres données.

Le **Mode Démo** et la page **Paramètres API** (override `localStorage` du
Client ID) restent disponibles pour le dev/les tests, mais ne sont pas
nécessaires en usage normal.

## Scopes utilisés (lecture seule, compte enseignant)

`classroom.courses.readonly`, `classroom.rosters.readonly`,
`classroom.coursework.students.readonly`, `classroom.student-submissions.students.readonly`
