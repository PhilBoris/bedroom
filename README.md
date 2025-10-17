# Music Game v14.1-clean

## Installation
```bash
npm install
npm run dev
```
puis ouvre http://localhost:5173

## Audio
Remplace `public/audio/track1.wav`, `track2.wav`, `track3.wav` par tes vrais morceaux.  
Les `track4-6.wav` peuvent rester vides.

## Sprites
Remplace dans `public/sprites/` : `player.png`, `bed.png`, `heart.png`, `sun.png`.

## Contrôles
- Mini-jeu : flèches pour bouger. 3 vies → "insomnie". Atteins le lit → lecteur normal.
- Lecteur : clic sur un morceau → plein écran. Espace = pause/play. `b` ou tap = changer visuel. ⛶ = plein écran.
- Insomnie : sliders **vitesse**, **pitch (demi-tons)**, **bass boost**. Soleil (après 1 min) pour revenir au mode normal.


### Notes v14.2
- Le **soleil** ramène désormais directement **au mini‑jeu**.
- Le **pitch (demi‑tons)** est appliqué de manière simple via `playbackRate = vitesse × 2^(pitch/12)` (il influence donc aussi la vitesse, plus fiable partout).


### Notes v14.3
- Correction du **pitch** : suppression de `preservesPitch`, le slider de pitch modifie bien la hauteur (et la vitesse liée).
