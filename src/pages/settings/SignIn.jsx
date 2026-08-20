import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useFirm } from "@/lib/firm/context";

/**
 * Where Sign Out lands. There is no auth layer yet, so any details are accepted
 * and the button simply returns to the dashboard - it exists so signing out is
 * a real journey rather than a button that does nothing.
 */
export default function SignIn() {
  const navigate = useNavigate();
  const { firmInfo } = useFirm();

  const [email, setEmail] = useState("mohammed@yands.om");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <p className="font-serif text-3xl font-bold tracking-[0.12em] text-primary">
              {firmInfo.nameEn}
            </p>
            <p className="mt-1 text-xs text-muted-foreground" dir="rtl">
              {firmInfo.nameAr}
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="signInEmail">Email</Label>
              <Input
                id="signInEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signInPassword">Password</Label>
              <div className="relative">
                <Input
                  id="signInPassword"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {visible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {visible ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Authentication is not connected yet. Any details sign you in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
