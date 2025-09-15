# Backend (FastAPI) - Projeto-app-condominio

Instruções rápidas:

1. Copie `.env.example` para `.env` e atualize `DATABASE_URL` e `SECRET_KEY`.
2. Crie e ative venv:
   - Windows PowerShell:
     ```
     python -m venv venv
     venv\Scripts\Activate.ps1
     ```
3. Instale dependências:
   ```
   pip install -r requirements.txt
   ```
4. Crie tabelas:
   ```
   python -m app.create_tables
   ```
5. Rode:
   ```
   uvicorn app.main:app --reload
   ```

