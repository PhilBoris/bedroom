#!/usr/bin/env bash

echo "🔧 Installation des dépendances..."
npm install

echo "🏗️ Lancement du build Vite..."
npx vite build

echo "✅ Build terminée avec succès !"
