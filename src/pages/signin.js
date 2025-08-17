// pages/signin.js
import { getProviders, signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn({ providers }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault();
    await signIn("credentials", {
      redirect: true, // Will redirect to callbackUrl
      email,
      password,
      callbackUrl: "/" // redirect after login
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Sign In</h1>

      {/* Credentials Sign-In Form */}
      <form onSubmit={handleCredentialsSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Sign in with Email</button>
      </form>

      <hr />

      {/* Google Sign-In Button */}
      {providers &&
        Object.values(providers)
          .filter((p) => p.name === "Google")
          .map((provider) => (
            <div key={provider.name}>
              <button onClick={() => signIn(provider.id, { callbackUrl: "/" })}>
                Sign in with {provider.name}
              </button>
            </div>
          ))}
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
