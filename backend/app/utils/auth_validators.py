# backend/app/utils/auth_validators.py

import re

def validar_cpf(cpf: str) -> bool:
    """Valida um número de CPF."""
    cpf = re.sub(r'[^0-9]', '', cpf) # Remove caracteres não numéricos
    if len(cpf) != 11 or len(set(cpf)) == 1: # Verifica tamanho e dígitos repetidos
        return False
    
    # Valida o primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf[i]) * (10 - i)
    resto = soma % 11
    digito_verificador_1 = 0 if resto < 2 else 11 - resto
    if digito_verificador_1 != int(cpf[9]):
        return False

    # Valida o segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf[i]) * (11 - i)
    resto = soma % 11
    digito_verificador_2 = 0 if resto < 2 else 11 - resto
    if digito_verificador_2 != int(cpf[10]):
        return False

    return True

def validar_cnpj(cnpj: str) -> bool:
    """Valida um número de CNPJ."""
    cnpj = re.sub(r'[^0-9]', '', cnpj) # Remove caracteres não numéricos
    if len(cnpj) != 14 or len(set(cnpj)) == 1: # Verifica tamanho e dígitos repetidos
        return False

    # Valida o primeiro dígito verificador
    tamanho = len(cnpj) - 2
    numeros = cnpj[0:tamanho]
    digitos = cnpj[tamanho:tamanho+2]
    soma = 0
    pos = tamanho - 7
    for i in range(tamanho):
        soma += int(numeros[i]) * (pos - i if pos - i > 1 else pos - i + 8)
    dv1 = soma % 11
    dv1 = 0 if dv1 < 2 else 11 - dv1

    if dv1 != int(digitos[0]):
        return False

    # Valida o segundo dígito verificador
    tamanho = tamanho + 1
    numeros = cnpj[0:tamanho]
    soma = 0
    pos = tamanho - 7
    for i in range(tamanho):
        soma += int(numeros[i]) * (pos - i if pos - i > 1 else pos - i + 8)
    dv2 = soma % 11
    dv2 = 0 if dv2 < 2 else 11 - dv2

    if dv2 != int(digitos[1]):
        return False
    
    return True