// frontend/src/utils/formatters.js

// **AQUI ESTÁ A CORREÇÃO:** A palavra 'export' na frente da função.
export const formatarDuracao = (duracaoSegundos) => {
    if (!duracaoSegundos || duracaoSegundos < 0) {
        return 'N/A';
    }

    const totalMinutos = Math.floor(duracaoSegundos / 60);

    if (totalMinutos < 60) {
        return `${totalMinutos} min`;
    } else {
        const horas = Math.floor(totalMinutos / 60);
        const minutosRestantes = totalMinutos % 60;

        if (minutosRestantes === 0) {
            return `${horas} h`;
        }

        return `${horas} h ${minutosRestantes} min`;
    }
};