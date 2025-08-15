import { getProviders, signIn } from "next-auth/react";

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
    </div>
  );
}

// Fetch providers server-side
export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
