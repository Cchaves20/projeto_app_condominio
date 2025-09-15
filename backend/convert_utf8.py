import os

def convert_to_utf8(file_path):
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        content = content.decode('latin-1')  # decodifica qualquer formato ISO/Windows
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Convertido: {file_path}")
    except Exception as e:
        print(f"❌ Erro ao converter {file_path}: {e}")

def convert_backend_files(base_path="app"):
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith(".py") or file.endswith(".env"):
                convert_to_utf8(os.path.join(root, file))

if __name__ == "__main__":
    print("🔄 Convertendo todos os arquivos do backend para UTF-8...")
    convert_backend_files()
    print("✅ Conversão concluída!")
