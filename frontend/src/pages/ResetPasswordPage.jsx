import { useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem!");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/auth/password/reset/confirm/", {
        uid,
        token,
        new_password1: password,
        new_password2: confirmPassword,
      });
      setMessage("Senha redefinida com sucesso!");
    } catch (error) {
      setMessage("Erro ao redefinir senha. Tente novamente.");
      console.error("Erro detalhado:", error);
    }
  };

  return (
    <div>
      <h1>Redefinir Senha</h1>
      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirme a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Redefinir</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
