import { getProviders, signIn } from "next-auth/react";
<<<<<<< HEAD

export default function SignIn({ providers }) {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Sign In</h1>

      {/* Email & Password Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = e.target.email.value;
          const password = e.target.password.value;
          signIn("credentials", { email, password, callbackUrl: "/" });
        }}
      >
        <input name="email" type="email" placeholder="Email" required />
        <br />
        <input name="password" type="password" placeholder="Password" required />
        <br />
        <button type="submit">Sign In with Email</button>
      </form>

      <hr />

      {/* Google Sign In */}
      {providers &&
        Object.values(providers).map((provider) =>
          provider.name === "Google" ? (
            <div key={provider.name}>
              <button onClick={() => signIn(provider.id, { callbackUrl: "/" })}>
                Sign In with Google
              </button>
            </div>
          ) : null
        )}
=======
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
>>>>>>> 2b62ca8bc25e0499a27278a4014b344edbb57935
    </div>
  );
}

<<<<<<< HEAD
// Fetch providers server-side
=======
// Fetch available providers server-side
>>>>>>> 2b62ca8bc25e0499a27278a4014b344edbb57935
export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
