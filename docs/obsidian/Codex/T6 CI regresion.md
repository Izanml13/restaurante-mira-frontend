# Prompt Codex — T6 Regresión en CI
```
Repo: restaurante-mira-frontend, rama test/e2e-selenium (después de T5).
Crea .github/workflows/tests.yml que en push y pull_request: instale Node 20, npm ci, npm run build, arranque `npx vite preview --port 4173` en segundo plano y espere a que responda, instale Python 3.12 + tests/e2e/requirements.txt y ejecute pytest tests/e2e (excepto el monkey, que va en un job aparte con continue-on-error: false). Si existen scripts "test" o "test:rules", ejecútalos también. Sube capturas de pantalla de tests fallidos como artifact.
Hecho cuando: el workflow es válido y pasa en un PR.
```
