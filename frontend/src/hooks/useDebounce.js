// frontend/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  // Estado para guardar o valor "atrasado" (debounced)
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Cria um temporizador que só vai atualizar o estado
    // após o tempo de 'delay' ter passado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Função de limpeza: se o usuário digitar de novo antes
    // do 'delay' acabar, o temporizador antigo é cancelado
    // e um novo é criado.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Roda de novo apenas se o valor ou o delay mudar

  return debouncedValue;
}

export default useDebounce;