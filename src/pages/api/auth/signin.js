import { getProviders, signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn({ providers }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h1>Sign In</h1>

      {/* ---------- Email/Password Form ---------- */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn("credentials", { email, password, callbackUrl: "/" });
        }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", marginBottom: "1rem", width: "100%" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", marginBottom: "1rem", width: "100%" }}
        />
        <button type="submit" style={{ width: "100%" }}>Sign in</button>
      </form>

      <hr style={{ margin: "2rem 0" }} />

      {/* ---------- Google Login Buttons ---------- */}
      {providers &&
        Object.values(providers)
          .filter((provider) => provider.name !== "Credentials")
          .map((provider) => (
            <div key={provider.name} style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                style={{ width: "100%" }}
              >
                Sign in with {provider.name}
              </button>
            </div>
          ))}
    </div>
  );
}

// Fetch available providers server-side
export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
