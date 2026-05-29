import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Loader2, LayoutDashboard, Mail, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #dbeafe 0%, #dcfce7 50%, #dbeafe 100%)" }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5e5] p-10 w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#1a1c1c] rounded-xl w-14 h-14 flex items-center justify-center mb-4">
            <LayoutDashboard size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1c1c]">Metry CRM</h1>
          <p className="text-[#434655] text-sm mt-1">Gestão de clientes e oportunidades</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1c1c] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full h-12 pl-10 pr-4 border border-[#d4d4d4] rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm transition"
                placeholder="vendedor@empresa.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1c1c] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full h-12 pl-10 pr-4 border border-[#d4d4d4] rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#2563eb] h-12 w-full rounded-xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors hover:bg-blue-700 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Entrando...
              </>
            ) : (
              "Acessar CRM"
            )}
          </button>
        </form>

        <p className="text-center text-[#737686] text-xs mt-6">
          Use as credenciais do painel Metry
        </p>
      </div>
    </div>
  );
}
