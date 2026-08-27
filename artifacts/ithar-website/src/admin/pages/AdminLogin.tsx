import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { adminApi } from "../lib/api";
import logoSrc from "@assets/logo.png";

export function AdminLogin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => adminApi.login(username, password),
    onSuccess: (user) => {
      queryClient.setQueryData(["admin-me"], user);
      navigate("/admin");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate();
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4 font-['Tajawal',sans-serif]"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 rounded-full p-3 mb-4">
            <img src={logoSrc} alt="شعار جمعية الإيثار" className="h-20 w-20" />
          </div>
          <h1 className="text-2xl font-black text-primary">جمعية الإيثار</h1>
          <p className="text-gray-500 text-sm mt-1">لوحة إدارة الموقع</p>
        </div>

        {/* Error */}
        {loginMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm font-bold text-center">
            {loginMutation.error?.message ?? "حدث خطأ، حاول مرة أخرى"}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-800 font-bold transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-800 font-bold transition-colors pl-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending || !username || !password}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-lg mt-2"
          >
            {loginMutation.isPending ? (
              "جارٍ الدخول..."
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                دخول
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          لوحة تحكم حصرية للمشرفين المعتمدين
        </p>
      </div>
    </div>
  );
}
