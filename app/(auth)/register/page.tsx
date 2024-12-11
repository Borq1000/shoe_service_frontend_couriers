import React from "react";
import RegistrationForm from "@/components/RegistrationForm";

function RegisterPage() {
  return (
    <div className="w-1/3 m-auto p-9 rounded-md shadow-md mt-10">
      <div>
        <h1 className="text-3xl mb-3 font-bold text-center ">Register</h1>
        <RegistrationForm />

        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
