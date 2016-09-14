#! /bin/bash

echo "Backing up settings.json..."
mv settings.json settings.json.backup
echo "Updating server..."
git pull
echo "Replacing settings.json..."
mv settings.json.backup settings.json
rm settings.json.backup
