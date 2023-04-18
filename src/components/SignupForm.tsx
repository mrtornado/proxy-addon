import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

declare const chrome: any;

const SignupForm = () => {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  //   const [apiKey, setApiKey] = useState("");
  //   const [memberKey, setMemberKey] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSuccessfulRegistration = async (
    username: string,
    apiKey: string,
    memberKey: number
  ) => {
    const user = { username, apiKey, memberKey };
    await chrome.storage.local.set({ user }, () => {
      console.log("User data is saved in local storage.");
    });
    alert(
      "Registration successful! Check your email for confirmation. Make sure you check your junk / spam folder."
    );
    navigate("proxy");
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    if (email.length > -1 || password.length > -1) {
      switch (true) {
        case e.target.password.value !== e.target.confirm.value:
          setError("Passwords do not match");
          return null;
        case email.length < 3:
          setError("Email / User must have minimum of 3 characters");
          return null;
        case email.length > 40:
          setError("Email / User must be maximum 40 characters");
          return null;
        case password.length < 6:
          setError("Password must have minimum 6 characters");
          return null;
        case password.length > 40:
          setError("Password must have maximum 40 characters");
          return null;
        default:
          handleSubmit();
      }
    }
    setError("");
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/members/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      if (typeof chrome !== "undefined") {
        chrome.storage.local.set({ user: data });
      }

      if (!data.error) {
        const apiKey = data.apiKey;
        // Handle successful login
        handleSuccessfulRegistration(
          data.username,
          data.apiKey,
          data.memberKey
        );
      } else {
        // Handle unsuccessful login
        setError(data.error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen pt-10 items-center bg-gradient-to-br from-gray-700 via-gray-900 to-black">
      {" "}
      {error && <p className="text-2xl text-red-600 text-center">{error}</p>}
      <form onSubmit={handleFormSubmit}>
        <div className="flex justify-center">
          <input
            className="m-2 text-4xl font-extrabold px-4 py-2 border-b rounded-full text-[#fffed8]  bg-transparent focus:outline-none"
            type="text"
            autoFocus
            value={username}
            placeholder="Username"
            onChange={(e) =>
              setUsername((e.target as unknown as HTMLSelectElement)?.value)
            }
          />
        </div>
        <div className="flex justify-center">
          <input
            className="m-2 text-4xl font-extrabold px-4 py-2 border-b rounded-full text-[#fffed8]  bg-transparent focus:outline-none"
            type="text"
            value={email}
            placeholder="Email"
            onChange={(e) =>
              setEmail((e.target as unknown as HTMLSelectElement)?.value)
            }
          />
        </div>
        <div className="flex justify-center">
          <input
            className="m-2 text-4xl font-extrabold px-4 py-2 border-b rounded-full text-[#fffed8] bg-transparent focus:outline-none"
            onChange={(e) =>
              setPassword((e.target as unknown as HTMLSelectElement)?.value)
            }
            name="password"
            type="password"
            ref={passwordInputRef}
            value={password}
            placeholder="Password"
          />
        </div>
        <div className="flex justify-center">
          <input
            className="m-2 text-4xl font-extrabold px-4 py-2 border-b rounded-full text-[#fffed8] bg-transparent focus:outline-none"
            required
            placeholder="re-type password"
            type="password"
            name="confirm"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <button className=" rounded-full text-2xl w-md hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
