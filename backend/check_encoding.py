import os
import chardet

print("🔍 Verificando arquivos no backend...")

for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".py") or file.endswith(".env"):
            path = os.path.join(root, file)
            try:
                with open(path, "rb") as f:
                    raw = f.read()
                enc = chardet.detect(raw)["encoding"]
                if enc and enc.lower() != "utf-8":
                    print(f"⚠ Arquivo com problema: {path} -> {enc}")
            except Exception as e:
                print(f"Erro ao ler {path}: {e}")

print("✅ Verificação concluída!")
