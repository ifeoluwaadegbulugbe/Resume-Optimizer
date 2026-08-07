import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-accent/40 to-background p-6">
      <AuthForm mode="login" />
    </div>
  );
}
