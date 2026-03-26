#!/bin/bash
cd /home/kavia/workspace/code-generation/manufacturing-maintenance-intelligence-4940/maintenance_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

