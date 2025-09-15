import React, { useState } from "react";
import axios from "axios";

const ForgotPasswordPage = () => {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validateCpfCnpj = (value) => {
    // Remove tudo que não for número
    const cleaned = value.replace(/\D/g, "");
    // CPF = 11 dígitos, CNPJ = 14 dígitos
    return cleaned.length === 11 || cleaned.length === 14;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateCpfCnpj(cpfCnpj)) {
      setError("Informe um CPF ou CNPJ válido.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/password/reset/",
        {
          cpf_cnpj: cpfCnpj,
          email: email,
        }
      );

      if (response.status === 200) {
        setMessage(
          "Se os dados estiverem corretos, um e-mail foi enviado com as instruções para redefinir sua senha."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Ocorreu um erro ao solicitar a redefinição de senha."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Esqueceu sua senha?
        </h1>
        <p className="text-gray-600 mb-4 text-center">
          Preencha seu CPF ou CNPJ e seu e-mail para receber o link de redefinição.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CPF / CNPJ */}
          <div>
            <label htmlFor="cpfCnpj" className="block text-gray-700">
              CPF / CNPJ
            </label>
            <input
              id="cpfCnpj"
              type="text"
              placeholder="Digite seu CPF ou CNPJ"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 mt-4 font-semibold rounded-lg text-white transition ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>

        {/* Mensagens de Sucesso ou Erro */}
        {message && (
          <p className="mt-4 text-green-600 font-medium text-center">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-red-600 font-medium text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
