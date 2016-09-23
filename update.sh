#! /bin/bash

echo "Backing up settings.json..."
mv settings.json settings.json.backup
echo "Backing up users.json..."
mv users.json users.json.backup
echo "Backing up index.html..."
mv index.html index.html.backup
echo "Updating server..."
git pull
echo "Replacing settings.json..."
mv settings.json.backup settings.json
echo "Replacing users.json..."
mv users.json.backup users.json
echo "Replacing index.html..."
mv index.html.backup index.html
